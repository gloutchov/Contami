# ContaMì landing page

Static, bilingual GitHub Pages site for ContaMì. It uses only relative paths and local assets, with no CDN, remote fonts, analytics, cookies or third-party runtime services.

## Media

- PNG screenshots are the static and reduced-motion fallback.
- MP4 demonstrations are generated from the local GIF capture sources, use H.264 at 1280 px and are loaded with `preload="none"`.
- Source GIF files remain local and are ignored by Git because they are large production sources rather than deployable assets.
- Every capture must use synthetic data and must be reviewed for financial values, names and workbook paths before commit.

To refresh an MP4 from its GIF source:

```powershell
ffmpeg -hide_banner -loglevel error -y -i docs\assets\example.gif -vf "fps=20,scale=1280:-2:flags=lanczos" -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p -movflags +faststart -an docs\assets\example.mp4
```

## Local preview

Start the dependency-free static server, which exposes only `docs/`:

```powershell
npm run preview:landing
```

Then open `http://127.0.0.1:4174/`. Do not open `index.html` directly with `file://`, because browser media and CSP behavior should be checked over HTTP.

Run `npm run test:landing` for the static contract and `npm run test:landing:e2e` for language detection, theme/media selection, video controls, keyboard focus and mobile overflow.

## GitHub Pages

The public site lives entirely under `docs/`. In the repository settings, select **Pages → Deploy from a branch → main → /docs**. The `.nojekyll` marker keeps the deployment static; no repository-managed Pages workflow is required. Treat every file under `docs/` as public. Technical specifications and maintenance notes belong under `documents/` instead.
