import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGithubStats, createGithubStatsHandler } from '../api/github-stats.js';

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
    if (href.includes('-user%3AWilliamK112')) return jsonResponse({ total_count: 95 });
    return jsonResponse({ total_count: 119 });
  };

  const response = createMockResponse();
  await createGithubStatsHandler({ fetchImpl, token: 'secret-token' })({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['Cache-Control'], /s-maxage=900/);
  assert.equal(response.body.mergedPullRequests, 119);
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
  await createGithubStatsHandler({ fetchImpl, token: '' })({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.partial, true);
  assert.equal(response.body.mergedPullRequests, null);
  assert.equal(response.body.publicRepositories, 4);
});

function jsonResponse(value, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
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
