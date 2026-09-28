import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGithubStats, collectGithubStats, createGithubStatsHandler } from '../api/github-stats.js';

const NOW = '2026-09-28T05:00:00.000Z';
const OLD = '2026-09-27T05:00:00.000Z';
const sourceKeys = ['profile', 'repositories', 'mergedPullRequests', 'externalMergedPullRequests'];

const profile = {
  html_url: 'https://github.com/WilliamK112',
  public_repos: 4,
  followers: 12,
};

const repositories = [
  {
    name: 'alpha',
    html_url: 'https://github.com/WilliamK112/alpha',
    description: 'Alpha project',
    language: 'JavaScript',
    stargazers_count: 3,
    forks_count: 1,
    pushed_at: '2026-08-11T00:00:00Z',
    homepage: null,
    fork: false,
  },
  {
    name: 'beta',
    html_url: 'https://github.com/WilliamK112/beta',
    description: null,
    language: 'Python',
    stargazers_count: 2,
    forks_count: 0,
    pushed_at: '2026-08-10T00:00:00Z',
    homepage: 'https://example.com',
    fork: false,
  },
  {
    name: 'forked-project',
    html_url: 'https://github.com/WilliamK112/forked-project',
    stargazers_count: 99,
    forks_count: 0,
    fork: true,
  },
  {
    name: 'private-project',
    html_url: 'https://github.com/WilliamK112/private-project',
    stargazers_count: 100,
    forks_count: 0,
    fork: false,
    private: true,
  },
];

test('buildGithubStats counts original repositories and their stars', () => {
  const result = buildGithubStats({
    profile,
    repositories,
    mergedPullRequests: 119,
    externalMergedPullRequests: 95,
  });

  assert.equal(result.publicRepositories, 4);
  assert.equal(result.originalRepositories, 2);
  assert.equal(result.totalStars, 5);
  assert.equal(result.mergedPullRequests, 119);
  assert.equal(result.externalMergedPullRequests, 95);
  assert.deepEqual(Object.keys(result.repositories), ['alpha', 'beta']);
});

test('handler returns cached data without exposing the GitHub token', async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer secret-token');
    const href = String(url);
    if (href.endsWith('/users/WilliamK112')) return jsonResponse(profile);
    if (href.includes('/users/WilliamK112/repos')) return jsonResponse(repositories);
    assert.match(decodeURIComponent(href), /is:public/);
    if (href.includes('-user%3AWilliamK112')) return jsonResponse({ total_count: 95, incomplete_results: false });
    return jsonResponse({ total_count: 119, incomplete_results: false });
  };

  const response = createMockResponse();
  await createGithubStatsHandler({ fetchImpl, token: 'secret-token', snapshot: null, now: () => new Date(NOW) })({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['Cache-Control'], /s-maxage=900/);
  assert.match(response.headers['Cache-Control'], /(?:^|, )max-age=0(?:,|$)/);
  assert.equal(response.body.mergedPullRequests, 119);
  assert.equal(response.body.generatedAt, NOW);
  assert.equal(response.body.updatedAt, NOW);
  assert.equal(response.body.partial, false);
  assert.ok(Object.values(response.body.sources).every((source) => source.status === 'live'));
  assert.equal(JSON.stringify(response.body).includes('secret-token'), false);
});

test('handler keeps profile data when search rate limits fail', async () => {
  const fetchImpl = async (url) => {
    const href = String(url);
    if (href.endsWith('/users/WilliamK112')) return jsonResponse(profile);
    if (href.includes('/users/WilliamK112/repos')) return jsonResponse(repositories);
    return jsonResponse({ message: 'rate limited' }, 403);
  };

  const response = createMockResponse();
  await createGithubStatsHandler({ fetchImpl, token: '', snapshot: null })({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.partial, true);
  assert.equal(response.body.mergedPullRequests, null);
  assert.equal(response.body.publicRepositories, 4);
  assert.equal(response.body.sources.mergedPullRequests.status, 'unavailable');
  assert.equal(response.body.sources.mergedPullRequests.updatedAt, null);
});

function jsonResponse(value, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    async json() {
      return value;
    },
  };
}

function createMockResponse() {
  return {
    body: null,
    headers: {},
    statusCode: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function snapshot(at = OLD) {
  return {
    ...buildGithubStats({ profile, repositories, mergedPullRequests: 119, externalMergedPullRequests: 95 }),
    generatedAt: at, updatedAt: at, partial: false, stale: false,
    sources: Object.fromEntries(sourceKeys.map((key) => [key, { status: 'live', updatedAt: at, sourceUrl: 'https://api.github.com/' }])),
  };
}

function healthyFetch(url) {
  const href = String(url);
  if (href.endsWith('/users/WilliamK112')) return jsonResponse(profile);
  if (href.includes('/users/WilliamK112/repos')) return jsonResponse(repositories);
  return jsonResponse({ total_count: href.includes('-user%3A') ? 95 : 119, incomplete_results: false });
}

for (const [label, result] of [
  ['missing total', { incomplete_results: false }],
  ['null total', { total_count: null, incomplete_results: false }],
  ['negative total', { total_count: -1, incomplete_results: false }],
  ['string total', { total_count: '119', incomplete_results: false }],
  ['fractional total', { total_count: 1.5, incomplete_results: false }],
  ['missing completeness flag', { total_count: 119 }],
  ['incomplete search', { total_count: 12, incomplete_results: true }],
]) {
  test(`${label} never replaces a verified merged count or gets a fresh timestamp`, async () => {
    const data = await collectGithubStats({
      token: '', snapshot: snapshot(), now: () => new Date(NOW),
      fetchImpl: (url) => String(url).includes('/search/issues') && !String(url).includes('-user%3A')
        ? jsonResponse(result) : healthyFetch(url),
    });
    assert.equal(data.mergedPullRequests, 119);
    assert.equal(data.sources.mergedPullRequests.status, 'stale');
    assert.equal(data.sources.mergedPullRequests.updatedAt, OLD);
    assert.equal(data.sources.externalMergedPullRequests.status, 'live');
    assert.equal(data.sources.externalMergedPullRequests.updatedAt, NOW);
    assert.equal(data.generatedAt, NOW);
    assert.equal(data.updatedAt, OLD);
    assert.equal(data.partial, true);
    assert.equal(data.stale, true);
  });
}

test('a complete zero count is valid live data', async () => {
  const data = await collectGithubStats({ token: '', snapshot: snapshot(), now: () => new Date(NOW),
    fetchImpl: (url) => String(url).includes('/search/issues') ? jsonResponse({ total_count: 0, incomplete_results: false }) : healthyFetch(url),
  });
  assert.equal(data.mergedPullRequests, 0);
  assert.equal(data.externalMergedPullRequests, 0);
  assert.equal(data.partial, false);
});

test('profile/repository failure retains dated metadata while independent search data refreshes', async () => {
  const data = await collectGithubStats({ token: '', snapshot: snapshot(), now: () => new Date(NOW),
    fetchImpl: (url) => String(url).includes('/search/issues') ? healthyFetch(url) : jsonResponse({}, 403),
  });
  assert.equal(data.publicRepositories, 4);
  assert.equal(data.totalStars, 5);
  assert.equal(data.repositories.alpha.pushedAt, repositories[0].pushed_at);
  assert.equal(data.sources.repositories.status, 'stale');
  assert.equal(data.sources.repositories.updatedAt, OLD);
  assert.equal(data.sources.profile.status, 'stale');
  assert.equal(data.sources.mergedPullRequests.status, 'live');
  assert.equal(data.updatedAt, OLD);
});

test('unavailable sources have null counts and no fabricated verified time', async () => {
  const data = await collectGithubStats({ token: '', snapshot: null, now: () => new Date(NOW), fetchImpl: () => jsonResponse({}, 403) });
  for (const field of ['publicRepositories', 'followers', 'originalRepositories', 'totalStars', 'mergedPullRequests', 'externalMergedPullRequests']) assert.equal(data[field], null);
  assert.deepEqual(data.repositories, {});
  assert.equal(data.updatedAt, null);
  assert.equal(data.generatedAt, NOW);
  assert.equal(data.stale, false);
  assert.ok(Object.values(data.sources).every((source) => source.status === 'unavailable' && source.updatedAt === null));
});

test('undated snapshot data is not presented as verified fallback', async () => {
  const undated = { ...snapshot(), updatedAt: null, sources: {} };
  const data = await collectGithubStats({ token: '', snapshot: undated, fetchImpl: () => jsonResponse({}, 403) });
  assert.equal(data.mergedPullRequests, null);
  assert.equal(data.updatedAt, null);
});

test('an explicit missing source timestamp cannot borrow the overall snapshot date', async () => {
  const invalid = snapshot();
  invalid.sources.mergedPullRequests.updatedAt = null;
  invalid.sources.externalMergedPullRequests.status = 'unavailable';
  const data = await collectGithubStats({ token: '', snapshot: invalid, fetchImpl: () => jsonResponse({}, 403) });
  assert.equal(data.mergedPullRequests, null);
  assert.equal(data.externalMergedPullRequests, null);
  assert.equal(data.sources.mergedPullRequests.updatedAt, null);
});

test('repository traversal continues beyond three pages and deduplicates a shifted page boundary', async () => {
  const pages = [];
  const repo = (id) => ({ ...repositories[0], id, name: `repo-${id}`, stargazers_count: 1 });
  const data = await collectGithubStats({ token: '', snapshot: null, now: () => new Date(NOW), fetchImpl: (url) => {
    if (!String(url).includes('/repos?')) return healthyFetch(url);
    const page = Number(new URL(url).searchParams.get('page')); pages.push(page);
    return jsonResponse(page <= 3 ? Array.from({ length: 100 }, (_, index) => repo((page - 1) * 100 + index)) : [repo(0), repo(300)]);
  } });
  assert.deepEqual(pages, [1, 2, 3, 4]);
  assert.equal(data.originalRepositories, 301);
  assert.equal(data.totalStars, 301);
  assert.equal(data.sources.repositories.status, 'live');
});

test('repository Link pagination is followed even for a short page', async () => {
  const pages = [];
  const data = await collectGithubStats({ token: '', snapshot: null, fetchImpl: (url) => {
    if (!String(url).includes('/repos?')) return healthyFetch(url);
    const page = Number(new URL(url).searchParams.get('page')); pages.push(page);
    return page === 1 ? jsonResponse([repositories[0]], 200, { link: '<https://api.github.com/users/WilliamK112/repos?page=2>; rel="next"' }) : jsonResponse([repositories[1]]);
  } });
  assert.deepEqual(pages, [1, 2]);
  assert.equal(data.totalStars, 5);
});

test('a failed later repository page never publishes its partial total', async () => {
  const data = await collectGithubStats({ token: '', snapshot: snapshot(), now: () => new Date(NOW), fetchImpl: (url) => {
    if (!String(url).includes('/repos?')) return healthyFetch(url);
    return new URL(url).searchParams.get('page') === '1'
      ? jsonResponse(Array.from({ length: 100 }, (_, index) => ({ ...repositories[0], name: `new-${index}`, stargazers_count: 10 })))
      : jsonResponse({}, 403);
  } });
  assert.equal(data.totalStars, 5);
  assert.equal(data.originalRepositories, 2);
  assert.equal(data.sources.repositories.status, 'stale');
  assert.equal(data.sources.repositories.updatedAt, OLD);
});

test('pagination safety cap reports an incomplete source instead of silently truncating', async () => {
  let pages = 0;
  const data = await collectGithubStats({ token: '', snapshot: null, fetchImpl: (url) => {
    if (!String(url).includes('/repos?')) return healthyFetch(url);
    pages += 1;
    return jsonResponse(Array.from({ length: 100 }, (_, index) => ({ ...repositories[0], name: `${pages}-${index}` })));
  } });
  assert.equal(pages, 20);
  assert.equal(data.originalRepositories, null);
  assert.equal(data.sources.repositories.error, 'pagination_incomplete');
});

test('handler coalesces concurrent callers and caches complete data for fifteen minutes', async () => {
  let time = Date.parse(NOW), requests = 0;
  const handler = createGithubStatsHandler({ token: '', snapshot: null, now: () => new Date(time), fetchImpl: async (url) => {
    requests += 1; await Promise.resolve(); return healthyFetch(url);
  } });
  const responses = Array.from({ length: 12 }, () => createMockResponse());
  await Promise.all(responses.map((response) => handler({ method: 'GET' }, response)));
  assert.equal(requests, 4);
  time += 899999;
  const cached = createMockResponse(); await handler({ method: 'GET' }, cached);
  assert.equal(requests, 4);
  assert.equal(cached.body.generatedAt, NOW);
  time += 1;
  const refreshed = createMockResponse(); await handler({ method: 'GET' }, refreshed);
  assert.equal(requests, 8);
  assert.equal(refreshed.body.updatedAt, new Date(time).toISOString());
});

test('partial cache expires after sixty seconds but honors search rate-limit reset', async () => {
  let time = Date.parse(NOW), requests = 0, limited = true;
  const retryAt = time + 300000;
  const handler = createGithubStatsHandler({ token: '', snapshot: snapshot(), now: () => new Date(time), fetchImpl: (url) => {
    requests += 1;
    if (limited && String(url).includes('/search/issues')) return jsonResponse({}, 403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(retryAt / 1000) });
    return healthyFetch(url);
  } });
  const first = createMockResponse(); await handler({ method: 'GET' }, first);
  assert.equal(requests, 4);
  assert.match(first.headers['Cache-Control'], /s-maxage=60/);
  assert.match(first.headers['Cache-Control'], /(?:^|, )max-age=0(?:,|$)/);
  assert.equal(first.body.sources.mergedPullRequests.retryAt, new Date(retryAt).toISOString());
  time += 59999;
  await handler({ method: 'GET' }, createMockResponse()); assert.equal(requests, 4);
  time += 1;
  const retry = createMockResponse(); await handler({ method: 'GET' }, retry);
  assert.equal(requests, 6, 'only non-rate-limited sources retry before search reset');
  assert.equal(retry.body.sources.mergedPullRequests.updatedAt, OLD);
  limited = false; time = retryAt;
  const recovered = createMockResponse(); await handler({ method: 'GET' }, recovered);
  assert.equal(requests, 10);
  assert.equal(recovered.body.partial, false);
});

test('warm last-known data wins over an older file snapshot after a failed refresh', async () => {
  let time = Date.parse(NOW), failed = false;
  const handler = createGithubStatsHandler({ token: '', snapshot: snapshot(), now: () => new Date(time), fetchImpl: (url) => {
    if (String(url).includes('/search/issues')) return failed ? jsonResponse({}, 429) : jsonResponse({ total_count: 213, incomplete_results: false });
    return healthyFetch(url);
  } });
  await handler({ method: 'GET' }, createMockResponse()); failed = true; time += 900000;
  const response = createMockResponse(); await handler({ method: 'GET' }, response);
  assert.equal(response.body.mergedPullRequests, 213);
  assert.equal(response.body.sources.mergedPullRequests.updatedAt, NOW);
  assert.equal(response.body.sources.mergedPullRequests.status, 'stale');
  assert.equal(response.body.generatedAt, new Date(time).toISOString());
  assert.equal(response.body.updatedAt, NOW);
});

test('newer public snapshot wins over warm fallback independently per source', async () => {
  const newer = snapshot(NOW); newer.mergedPullRequests = 213;
  const data = await collectGithubStats({ token: '', snapshot: newer, previous: snapshot(), fetchImpl: () => jsonResponse({}, 403) });
  assert.equal(data.mergedPullRequests, 213);
  assert.equal(data.sources.mergedPullRequests.updatedAt, NOW);
  assert.equal(data.sources.mergedPullRequests.status, 'stale');
});

test('non-GET methods do not fetch GitHub', async () => {
  const response = createMockResponse();
  const handler = createGithubStatsHandler({ fetchImpl: () => { throw new Error('must not fetch'); } });
  await handler({ method: 'POST' }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'GET');
});

test('fresh external count exceeding a stale total restores a coherent dated PR pair', async () => {
  const data = await collectGithubStats({ token: '', snapshot: snapshot(), now: () => new Date(NOW), fetchImpl: (url) => {
    if (!String(url).includes('/search/issues')) return healthyFetch(url);
    return String(url).includes('-user%3A') ? jsonResponse({ total_count: 201, incomplete_results: false }) : jsonResponse({}, 403);
  } });
  assert.equal(data.mergedPullRequests, 119);
  assert.equal(data.externalMergedPullRequests, 95);
  for (const key of ['mergedPullRequests', 'externalMergedPullRequests']) {
    assert.equal(data.sources[key].status, 'stale');
    assert.equal(data.sources[key].updatedAt, OLD);
    assert.equal(data.sources[key].error, 'inconsistent_pair');
  }
});

test('a smaller fresh total cannot coexist with a larger stale external count', async () => {
  const data = await collectGithubStats({ token: '', snapshot: snapshot(), fetchImpl: (url) => {
    if (!String(url).includes('/search/issues')) return healthyFetch(url);
    return String(url).includes('-user%3A') ? jsonResponse({}, 429) : jsonResponse({ total_count: 90, incomplete_results: false });
  } });
  assert.equal(data.mergedPullRequests, 119);
  assert.equal(data.externalMergedPullRequests, 95);
  assert.equal(data.sources.mergedPullRequests.status, 'stale');
  assert.equal(data.sources.externalMergedPullRequests.updatedAt, OLD);
  assert.ok(data.sources.externalMergedPullRequests.retryAt);
});

test('contradictory live PR results without a coherent fallback are unavailable', async () => {
  const data = await collectGithubStats({ token: '', snapshot: null, fetchImpl: (url) => {
    if (!String(url).includes('/search/issues')) return healthyFetch(url);
    return jsonResponse({ total_count: String(url).includes('-user%3A') ? 100 : 99, incomplete_results: false });
  } });
  assert.equal(data.mergedPullRequests, null);
  assert.equal(data.externalMergedPullRequests, null);
  assert.equal(data.sources.mergedPullRequests.status, 'unavailable');
  assert.equal(data.sources.externalMergedPullRequests.updatedAt, null);
  assert.equal(data.partial, true);
});
