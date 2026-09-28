import { mkdir, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { collectGithubStats } from '../api/github-stats.js';
import { localGithubToken } from './github-auth.mjs';

try {
  // A failed collection must never replace a complete, dated public snapshot.
  const data = await collectGithubStats({ token: localGithubToken(), snapshot: null });
  if (data.partial || !data.updatedAt) throw new Error('GitHub did not return a complete verified result; the existing snapshot was kept.');
  const directory = new URL('../data/', import.meta.url);
  const destination = new URL('github-stats.json', directory);
  const temporary = `${fileURLToPath(destination)}.${process.pid}.tmp`;
  await mkdir(directory, { recursive: true });
  await writeFile(temporary, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await rename(temporary, destination);
  console.log(`Verified ${data.mergedPullRequests} merged PRs (${data.externalMergedPullRequests} external), ${data.originalRepositories} original repos, ${data.totalStars} stars.`);
  console.log(`Public snapshot saved at ${data.updatedAt}. No files were committed or deployed.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
