import { execFileSync } from 'node:child_process';

// Local tools may reuse the signed-in GitHub CLI credential. Never write it to
// a file, send it to the browser, or include it in a diagnostic message.
export function localGithubToken() {
  if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token', '--hostname', 'github.com'], {
      encoding: 'utf8', windowsHide: true, timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}
