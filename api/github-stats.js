const GITHUB_USER = 'WilliamK112';
const GITHUB_API = 'https://api.github.com';
const REPOSITORIES_PER_PAGE = 100;
const MAX_REPOSITORY_PAGES = 3;

function githubHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'williamkang.com',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchJson(fetchImpl, url, headers) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchImpl(url, { headers });
      if (response.ok) return response.json();

      const error = new Error(`GitHub request failed with ${response.status}`);
      error.status = response.status;
      lastError = error;
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error;
    }

    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw lastError;
}

async function fetchRepositories(fetchImpl, headers) {
  const repositories = [];

  for (let page = 1; page <= MAX_REPOSITORY_PAGES; page += 1) {
    const url = new URL(`${GITHUB_API}/users/${GITHUB_USER}/repos`);
    url.searchParams.set('type', 'owner');
    url.searchParams.set('sort', 'updated');
    url.searchParams.set('per_page', String(REPOSITORIES_PER_PAGE));
    url.searchParams.set('page', String(page));

    const batch = await fetchJson(fetchImpl, url, headers);
    repositories.push(...batch);
    if (batch.length < REPOSITORIES_PER_PAGE) break;
  }

  return repositories;
}

async function fetchSearchCount(fetchImpl, headers, query) {
  const url = new URL(`${GITHUB_API}/search/issues`);
  url.searchParams.set('q', query);
  url.searchParams.set('per_page', '1');
  const result = await fetchJson(fetchImpl, url, headers);
  return Number.isFinite(result.total_count) ? result.total_count : null;
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
  const repositoryIndex = Object.fromEntries(
    originalRepositories.map((repository) => [repository.name, normalizeRepository(repository)]),
  );

  return {
    user: GITHUB_USER,
    profileUrl: profile.html_url || `https://github.com/${GITHUB_USER}`,
    publicRepositories: Number.isFinite(profile.public_repos) ? profile.public_repos : publicRepositories.length,
    originalRepositories: originalRepositories.length,
    followers: Number.isFinite(profile.followers) ? profile.followers : null,
    totalStars: originalRepositories.reduce(
      (total, repository) => total + (repository.stargazers_count || 0),
      0,
    ),
    mergedPullRequests,
    externalMergedPullRequests,
    repositories: repositoryIndex,
  };
}

export function createGithubStatsHandler({ fetchImpl = fetch, token = process.env.GITHUB_TOKEN } = {}) {
  return async function githubStatsHandler(request, response) {
    if (request.method && request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      return response.status(405).json({ error: 'Method not allowed' });
    }

    const headers = githubHeaders(token);
    const requests = await Promise.allSettled([
      fetchJson(fetchImpl, `${GITHUB_API}/users/${GITHUB_USER}`, headers),
      fetchRepositories(fetchImpl, headers),
      fetchSearchCount(fetchImpl, headers, `author:${GITHUB_USER} is:pr is:merged is:public`),
      fetchSearchCount(fetchImpl, headers, `author:${GITHUB_USER} is:pr is:merged is:public -user:${GITHUB_USER}`),
    ]);

    const [profileResult, repositoriesResult, mergedResult, externalMergedResult] = requests;
    if (profileResult.status === 'rejected' || repositoriesResult.status === 'rejected') {
      response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return response.status(502).json({ error: 'GitHub data is temporarily unavailable' });
    }

    const payload = buildGithubStats({
      profile: profileResult.value,
      repositories: repositoriesResult.value,
      mergedPullRequests: mergedResult.status === 'fulfilled' ? mergedResult.value : null,
      externalMergedPullRequests: externalMergedResult.status === 'fulfilled'
        ? externalMergedResult.value
        : null,
    });

    response.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return response.status(200).json({
      ...payload,
      generatedAt: new Date().toISOString(),
      partial: mergedResult.status === 'rejected' || externalMergedResult.status === 'rejected',
    });
  };
}

export default createGithubStatsHandler();
