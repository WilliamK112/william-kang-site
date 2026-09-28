# William Kang (Ching-Wei Kang) Portfolio

Personal portfolio site for William Kang, also known as Ching-Wei Kang.

Official site: [William Kang (Ching-Wei Kang) portfolio](https://williamkang.com/)
Focused identity page: [About William Kang / Ching-Wei Kang](https://williamkang.com/about-william-kang.html)
Exact-name William Kang page: [William Kang (Ching-Wei Kang)](https://williamkang.com/william-kang.html)
Exact-name identity page: [Ching-Wei Kang (William Kang)](https://williamkang.com/ching-wei-kang.html)
Resume page: [William Kang (Ching-Wei Kang) resume](https://williamkang.com/william-kang-resume.html)
Projects page: [William Kang (Ching-Wei Kang) projects](https://williamkang.com/william-kang-projects.html)

Live source captured from:

- https://williamkang.com/

## Run Locally

Node.js 20 or newer is recommended. Start the local server with:

```sh
npm run dev
```

Then open <http://localhost:8000>. The local server includes the GitHub stats API.

## Live GitHub data

The homepage reads public activity from `/api/github-stats`, a dependency-free
Vercel Function, on load and every 15 minutes while the page is visible. The
handler coalesces simultaneous requests and caches complete results for 15
minutes. Partial results retry after one minute. Only complete GitHub search
results are treated as verified PR counts.

Each data source carries its actual verification timestamp. If GitHub is
unavailable, the handler preserves dated public values from its runtime cache or
`data/github-stats.json`; the interface identifies saved/partial data. Unknown
values display as a dash. The timestamp never advances without a new successful
verification. The contribution index is a selected collection, separate from
the account-wide total.

Set `GITHUB_TOKEN` in the Vercel project for a higher GitHub API rate limit. Local
development uses `GITHUB_TOKEN` / `GH_TOKEN`, or the existing `gh auth` credential
when available. Credentials stay on the server and are never written into the
snapshot or returned to the browser.

To refresh the checked-in public fallback explicitly:

```sh
npm run sync:github
```

This validates and atomically saves a complete snapshot. On failure it preserves
the previous file. It does not commit, push, or deploy; include the updated public
JSON in the next normal deployment. The live API works independently of this
maintenance command and of whether the development computer is running.

The separate `WilliamK112/WilliamK112` profile repository has a scheduled
`update-approved-3d-banner.py` workflow. That workflow refreshes the GitHub
profile contribution-calendar artwork, not this website's PR statistics.

## Contents

- `index.html` - portfolio markup
- `styles.css` - responsive visual styles
- `script.js` - theme, language, card flip, pagination, and contact interactions
- `api/github-stats.js` - cached server-side GitHub activity endpoint
- `scripts/dev-server.mjs` - dependency-free local static and API server
- `assets/` - local resume and image assets

## Resume library

The repository maintains four application-specific resume tracks under `resumes/`:

- `resumes/masters/` — comprehensive two-page master's application CV
- `resumes/swe/` — one-page software engineering resume without GWU
- `resumes/ai/` — one-page AI engineering resume
- `resumes/data-science/` — one-page data science resume

Each directory contains an editable DOCX and its verified PDF export. The public selection page is `/resume-english.html`.
