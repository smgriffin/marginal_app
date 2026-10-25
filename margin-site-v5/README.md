# Margin

Spaced practice for PPHA 32310 (Advanced Microeconomics for Public Policy I, Fall 2026). Open `index.html`, or host this folder.

## Put it on GitHub Pages (one time, about 5 minutes)

1. Create a new GitHub repository (it can be private if your plan allows Pages on private repos; otherwise public).
2. Upload everything in this folder, including the hidden `.github` folder.
3. In the repository, go to Settings → Pages, set Source to "Deploy from a branch", choose `main` and `/ (root)`, and save.
4. After a minute the site is at `https://<your-username>.github.io/<repo>/`. On an iPhone, open it in Safari, tap Share → Add to Home Screen. It works offline after the first visit.

Progress is stored in that browser. Before switching devices or browsers, export a backup (Settings → Export backup), then restore it on the new one. If you used Margin inside Claude, export a backup there and restore it on the site.

## After each new class

1. Wait until the class notes, problem set, and solutions for that week are posted.
2. Start a chat in the Margin project with those files and ask Claude for that week's topic pack.
3. Put the pack file in `packs/` and add its name to `packs/index.json`.
4. Push. The test workflow runs automatically (Actions tab); a red X means the pack has a problem and it won't be trusted until fixed.
5. Open the app; the new week's skills appear on the map and in the Course plan.

No GitHub yet? In the app, Settings → Add a topic pack does the same thing for that browser.

## Tests

`node tests/run_all.js` checks that no shipped id is missing. It validates every pack in `packs/`, including its answer checks. It fuzzes every generator and re-solves each numeric answer from the question text with `tests/margin_checker.js`. `FUZZ_N=300` runs more samples.
