import { readFile } from 'node:fs/promises';

const GITHUB_USER = 'WilliamK112';
const GITHUB_API = 'https://api.github.com';
const REPOSITORIES_PER_PAGE = 100;
const MAX_REPOSITORY_PAGES = 20;
const SOURCE_URLS = {
  profile: `${GITHUB_API}/users/${GITHUB_USER}`,
  repositories: `${GITHUB_API}/users/${GITHUB_USER}/repos?type=owner&sort=full_name&direction=asc&per_page=100`,
  mergedPullRequests: `${GITHUB_API}/search/issues?q=${encodeURIComponent(`author:${GITHUB_USER} is:pr is:merged is:public`)}&per_page=1`,
  externalMergedPullRequests: `${GITHUB_API}/search/issues?q=${encodeURIComponent(`author:${GITHUB_USER} is:pr is:merged is:public -user:${GITHUB_USER}`)}&per_page=1`,
};
const count = (value) => Number.isSafeInteger(value) && value >= 0;
const validDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const failure = (code, retryAt) => Object.assign(new Error(code), { code, retryAt });

function githubHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'williamkang.com',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function retryDate(response, now) {
  const retryAfter = response.headers?.get('retry-after');
  const reset = Number(response.headers?.get('x-ratelimit-reset'));
  const after = retryAfter && (/^\d+$/.test(retryAfter) ? now + Number(retryAfter) * 1000 : Date.parse(retryAfter));
  return new Date(Math.max(now + 60000, after || 0, reset ? reset * 1000 : 0)).toISOString();
}

async function fetchJson(fetchImpl, url, headers, now) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetchImpl(url, { headers, signal: controller.signal });
      if (response.ok) return { data: await response.json(), headers: response.headers };
      const limited = response.status === 429 || response.headers?.get('x-ratelimit-remaining') === '0' || response.headers?.get('retry-after');
      lastError = failure(limited ? 'rate_limited' : `http_${response.status}`, limited ? retryDate(response, now().getTime()) : undefined);
      // Retrying a rate limit immediately burns quota and can prolong the limit.
      if (limited || response.status < 500) throw lastError;
    } catch (error) {
      lastError = error?.code === 'rate_limited' || /^http_\d{3}$/.test(error?.code)
        ? error : failure(error?.name === 'AbortError' ? 'timeout' : 'network_error');
      if (lastError.code === 'rate_limited' || /^http_[34]/.test(lastError.code)) throw lastError;
    } finally {
      clearTimeout(timeout);
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw lastError;
}

async function fetchRepositories(fetchImpl, headers, now) {
  const repositories = new Map();
  for (let page = 1; page <= MAX_REPOSITORY_PAGES; page += 1) {
    const { data: batch, headers: responseHeaders } = await fetchJson(fetchImpl, `${SOURCE_URLS.repositories}&page=${page}`, headers, now);
    if (!Array.isArray(batch) || batch.some((repo) => !repo || typeof repo.name !== 'string' || !count(repo.stargazers_count))) throw failure('invalid_payload');
    for (const repository of batch) repositories.set(repository.id ?? repository.name, repository);
    const link = responseHeaders?.get('link');
    const next = link && /rel="next"/.test(link);
    if (!next && (link || batch.length < REPOSITORIES_PER_PAGE)) return [...repositories.values()];
  }
  // A safety cap must never turn an unfinished traversal into a fresh total.
  throw failure('pagination_incomplete');
}

async function fetchSearchCount(fetchImpl, headers, url, now) {
  const { data } = await fetchJson(fetchImpl, url, headers, now);
  if (data?.incomplete_results !== false) throw failure(data?.incomplete_results === true ? 'incomplete_results' : 'invalid_payload');
  if (!count(data?.total_count)) throw failure('invalid_payload');
  return data.total_count;
}

function normalizeRepository(repository) {
  return {
    name: repository.name,
    url: repository.html_url,
    description: repository.description || null,
    language: repository.language || null,
    stars: repository.stargazers_count || 0,
    forks: repository.forks_count || 0,
    pushedAt: repository.pushed_at || null,
    homepage: repository.homepage || null,
  };
}

export function buildGithubStats({ profile, repositories, mergedPullRequests, externalMergedPullRequests }) {
  const publicRepositories = repositories.filter((repository) => repository.private !== true);
  const originalRepositories = publicRepositories.filter((repository) => !repository.fork);
  return {
    user: GITHUB_USER,
    profileUrl: profile.html_url || `https://github.com/${GITHUB_USER}`,
    publicRepositories: count(profile.public_repos) ? profile.public_repos : publicRepositories.length,
    originalRepositories: originalRepositories.length,
    followers: count(profile.followers) ? profile.followers : null,
    totalStars: originalRepositories.reduce((total, repository) => total + (repository.stargazers_count || 0), 0),
    mergedPullRequests,
    externalMergedPullRequests,
    repositories: Object.fromEntries(originalRepositories.map((repository) => [repository.name, normalizeRepository(repository)])),
  };
}

async function readPublicSnapshot() {
  try { return JSON.parse(await readFile(new URL('../data/github-stats.json', import.meta.url), 'utf8')); }
  catch { return null; }
}

function snapshotSource(snapshot, key) {
  if (!snapshot || snapshot.user !== GITHUB_USER) return null;
  const source = snapshot.sources?.[key];
  if (source?.status === 'unavailable') return null;
  const updatedAt = source ? source.updatedAt : snapshot.updatedAt;
  if (!validDate(updatedAt)) return null;
  let value;
  if (key === 'profile') {
    if (!count(snapshot.publicRepositories) || !count(snapshot.followers)) return null;
    value = { profileUrl: snapshot.profileUrl || `https://github.com/${GITHUB_USER}`, publicRepositories: snapshot.publicRepositories, followers: snapshot.followers };
  } else if (key === 'repositories') {
    if (!count(snapshot.originalRepositories) || !count(snapshot.totalStars) || !snapshot.repositories || Array.isArray(snapshot.repositories)) return null;
    const entries = Object.entries(snapshot.repositories);
    if (entries.length !== snapshot.originalRepositories || entries.some(([, repo]) => !repo || repo.private === true || !count(repo.stars))) return null;
    value = {
      originalRepositories: snapshot.originalRepositories,
      totalStars: snapshot.totalStars,
      repositories: Object.fromEntries(entries.map(([name, repo]) => [name, {
        name, url: repo.url, description: repo.description || null, language: repo.language || null,
        stars: repo.stars, forks: count(repo.forks) ? repo.forks : 0, pushedAt: repo.pushedAt || null, homepage: repo.homepage || null,
      }])),
    };
  } else {
    if (!count(snapshot[key])) return null;
    value = snapshot[key];
  }
  return { value, updatedAt };
}

// The same uncached collector powers the endpoint and the public
// snapshot refresh. A snapshot supplies dated fallback values, never live ones.
export async function collectGithubStats({
  fetchImpl = fetch, token = process.env.GITHUB_TOKEN, snapshot, previous = null, now = () => new Date(),
} = {}) {
  const generatedAt = now().toISOString();
  const publicSnapshot = snapshot === undefined ? await readPublicSnapshot() : snapshot;
  const headers = githubHeaders(token);
  const tasks = {
    async profile() {
      const { data } = await fetchJson(fetchImpl, SOURCE_URLS.profile, headers, now);
      if (!count(data?.public_repos) || !count(data?.followers)) throw failure('invalid_payload');
      return { profileUrl: data.html_url || `https://github.com/${GITHUB_USER}`, publicRepositories: data.public_repos, followers: data.followers };
    },
    async repositories() {
      const data = buildGithubStats({ profile: {}, repositories: await fetchRepositories(fetchImpl, headers, now) });
      return { originalRepositories: data.originalRepositories, totalStars: data.totalStars, repositories: data.repositories };
    },
    mergedPullRequests: () => fetchSearchCount(fetchImpl, headers, SOURCE_URLS.mergedPullRequests, now),
    externalMergedPullRequests: () => fetchSearchCount(fetchImpl, headers, SOURCE_URLS.externalMergedPullRequests, now),
  };
  const keys = Object.keys(tasks);
  const results = await Promise.allSettled(keys.map(async (key) => {
    const retryAt = previous?.sources?.[key]?.retryAt;
    if (validDate(retryAt) && Date.parse(retryAt) > now().getTime()) throw failure('rate_limited', retryAt);
    return { value: await tasks[key](), updatedAt: now().toISOString() };
  }));
  const payload = {
    user: GITHUB_USER, profileUrl: `https://github.com/${GITHUB_USER}`,
    publicRepositories: null, originalRepositories: null, followers: null, totalStars: null,
    mergedPullRequests: null, externalMergedPullRequests: null, repositories: {},
    sources: {}, generatedAt,
  };
  results.forEach((result, index) => {
    const key = keys[index];
    const fallback = [snapshotSource(previous, key), snapshotSource(publicSnapshot, key)]
      .filter(Boolean).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
    const source = result.status === 'fulfilled' ? result.value : fallback;
    payload.sources[key] = {
      status: result.status === 'fulfilled' ? 'live' : source ? 'stale' : 'unavailable',
      updatedAt: source?.updatedAt || null,
      sourceUrl: SOURCE_URLS[key],
      ...(result.status === 'rejected' ? { error: result.reason?.code || 'unavailable', ...(result.reason?.retryAt ? { retryAt: result.reason.retryAt } : {}) } : {}),
    };
    if (!source) return;
    if (key === 'profile' || key === 'repositories') Object.assign(payload, source.value);
    else payload[key] = source.value;
  });
  // Independently refreshed search indexes can contradict a cached counterpart.
  // Recover both PR counts from one coherent dated payload, never clamp a count.
  if (count(payload.mergedPullRequests) && count(payload.externalMergedPullRequests) &&
      payload.externalMergedPullRequests > payload.mergedPullRequests) {
    const pairKeys = ['mergedPullRequests', 'externalMergedPullRequests'];
    const pair = [previous, publicSnapshot].map((data) => pairKeys.map((key) => snapshotSource(data, key)))
      .filter(([total, external]) => total && external && external.value <= total.value)
      .sort((a, b) => Math.min(...b.map((source) => Date.parse(source.updatedAt))) - Math.min(...a.map((source) => Date.parse(source.updatedAt))))[0];
    pairKeys.forEach((key, index) => {
      payload[key] = pair?.[index].value ?? null;
      payload.sources[key] = {
        ...payload.sources[key], status: pair ? 'stale' : 'unavailable',
        updatedAt: pair?.[index].updatedAt || null, error: 'inconsistent_pair',
      };
    });
  }
  const sources = Object.values(payload.sources);
  payload.partial = sources.some((source) => source.status !== 'live');
  payload.stale = sources.some((source) => source.status === 'stale');
  payload.updatedAt = sources.map((source) => source.updatedAt).filter(Boolean).sort((a, b) => Date.parse(a) - Date.parse(b))[0] || null;
  return payload;
}

export function createGithubStatsHandler({ fetchImpl = fetch, token = process.env.GITHUB_TOKEN, snapshot, now = () => new Date() } = {}) {
  let cached = null, expiresAt = 0, inFlight = null;
  return async function githubStatsHandler(request, response) {
    if (request.method && request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      return response.status(405).json({ error: 'Method not allowed' });
    }
    if (!cached || now().getTime() >= expiresAt) {
      if (!inFlight) inFlight = collectGithubStats({ fetchImpl, token, snapshot, previous: cached, now }).then((payload) => {
        cached = payload;
        expiresAt = now().getTime() + (payload.partial ? 60000 : 900000);
      }).finally(() => { inFlight = null; });
      await inFlight;
    }
    response.setHeader('Cache-Control', `public, max-age=0, s-maxage=${cached.partial ? 60 : 900}, stale-while-revalidate=60`);
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return response.status(200).json(cached);
  };
}

export default createGithubStatsHandler();
