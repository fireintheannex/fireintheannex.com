FITA automatic upcoming-shows updates (GitHub Pages, branch deployment)

1. Keep your existing styles.css, script.js, images/ and other files.
2. Upload index.template.html, shows.json, scripts/build-shows.mjs and .github/workflows/update-shows.yml to the same repository, preserving folders.
3. Set repository Settings > Actions > General > Workflow permissions to Read and write permissions (if available). Ensure GitHub Pages deploys from the main branch (Settings > Pages).
4. Open Actions > Update upcoming shows HTML > Run workflow once. This creates/updates index.html and publishes the crawlable shows through your existing Pages branch deployment.
5. Going forward, ONLY edit shows.json. Each commit triggers automatic generation. Allow GitHub Actions and Pages time to finish.

IMPORTANT: If your Pages source uses a different branch or /docs folder, change the workflow branch and output path accordingly. Do not manually edit generated show cards in index.html. Edit index.template.html for non-calendar homepage changes.

Current show times like 7:30-10:30 do not say AM or PM. To enable complete event structured data, supply explicit time zones and AM/PM or 24-hour start/end times. This package intentionally does not guess.

The existing script.js will still fetch shows.json and redraw the visible calendar; the generated HTML is for initial crawler access. If JavaScript fails, static shows remain visible.
