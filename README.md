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

The homepage loads public activity from `/api/github-stats`, a dependency-free
Vercel Function. The response is cached at the CDN for 15 minutes and can serve
stale data while GitHub is temporarily unavailable. Static last-known values
remain in the HTML as a visual and reliability fallback.

Set `GITHUB_TOKEN` in the Vercel project for a higher GitHub API rate limit. The
token is optional during local development and is never returned to the browser.
No database is required for current public GitHub stats; persistent storage would
only be needed for historical trends or site-owned data.

## Contents

- `index.html` - portfolio markup
- `styles.css` - responsive visual styles
- `script.js` - theme, language, card flip, pagination, and contact interactions
- `api/github-stats.js` - cached server-side GitHub activity endpoint
- `scripts/dev-server.mjs` - dependency-free local static and API server
- `assets/` - local resume and image assets
