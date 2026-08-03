# williamkang.com live backup

This branch records a verified snapshot of the production site at
<https://williamkang.com/>.

- Captured: 2026-08-03 03:43:51 UTC (2026-08-03 11:43:51 Asia/Shanghai)
- Source branch at capture: `main`
- Source commit: `948074542a9e5bd6427f4346e5d7129dc2c42457`
- Unique production files verified: 22
- Failed downloads: 0
- Comparison result: every production file was byte-for-byte identical to the
  corresponding file at the source commit

`LIVE_BACKUP_MANIFEST.json` records each production URL, response metadata,
file size, and SHA-256 checksum. Some files appear more than once in the
manifest because the live pages reference the same bytes through both plain
and cache-busted URLs.

## Restore

To restore this snapshot in a new checkout:

```sh
git switch --detach live-backup-2026-08-03
```

The website files can then be redeployed to Vercel from that checkout. The
backup branch and tag are intentionally separate from `main`, so creating this
snapshot does not trigger or alter the production branch.
