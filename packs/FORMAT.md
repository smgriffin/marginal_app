# Margin topic packs: format notes (v5)

New weeks of the course arrive as topic packs. After a class, give Claude: this file, `margin_app_v5.html` (or the newest app), `margin_checker.js`, `margin_item_ids.json`, and the new class notes, problem set, and solutions. Ask for "the pack for the week of Oct 26" (or whichever week). Claude writes `packs/<id>.js`.

To install, either:
- **On the site:** put the file in `packs/` and add its name to `packs/index.json`, e.g. `{"packs":["perfect-competition-2.js"]}`. Every copy of the app picks it up on next open, and the tests check it on push.
- **In the app:** Settings → Add a topic pack, and choose or paste the file.

The pack's skills appear on the skill map. They also appear in the Course plan under the week they name.

## What a pack is

A JavaScript file that defines `const PACK = {...}`. It runs with the helpers object `H`. `packs/_template.js` is a complete, tested example.

```js
const {R, pick, f, NQ, CQ, TP, argmaxH, bisect, integrate} = H;
const PACK = {
  id: 'perfect-competition-2', name: 'Perfect competition, part 2', version: 1,
  skills: [{
    id: 'S25',                         // permanent; next free core-style id, or any unused id
    name: '…', short: '…', class: 'Class 9',
    week: 'Oct 26',                    // must match a course-plan week: Oct 26, Nov 2, Nov 9, Nov 16, Nov 30
    prereq: ['S5', 'S18'],             // learned first
    encompass: { S5: 0.4, S18: 0.3 },  // sub-skills exercised inside this one, weights in (0, 1]
    intro: '…',
    micros: [ /* 3–4 knowledge points, simplest first, each {id, name, explain, gen, gen3?} or {id, name, explain, pool} */ ],
    integ: [ () => NQ(...) ],          // at least one combined problem
    solve: { 'S25a': t => …, 'S25.i1': t => … }   // independent answer checks
  }]
};
```

## Question builders

- `NQ(q, ans, sol, dist, opts)`: numeric. `dist` lists answers from specific mistakes. `opts`: `{dp: 3}`, `{pct: true}`, `{absOK: true}`, `{allowNeg: true}`, `{check: x => …}`.
- `CQ(q, right, wrongs, sol)`: multiple choice with fixed options.
- `pool`: `[trueStatement, falseStatement, why]` triples, used for key-ideas items.
- `gen3`: optional harder twist used once an item is well learned (typed and timed).
- Shared setups are available on `H`: `compLin`, `compPop`, `taxOut`, `shiftCase`, `levelCase`, `foreign`, `linMono`, `diag`, `letters`, and others.

## Answer checks (`solve`)

Every numeric item should have a solver. It takes the question's plain text (tags stripped, − as -) and re-solves it by brute force: `argmaxH`, `bisect`, `integrate`. A solver may not reuse the generator's formula. If any combined problem has a solver, all must. The app and the tests run each generator 200 times and reject the pack if a solver disagrees.

## Built-in skill ids

S0 Math toolkit (incl. expected value, variance) · S1 Gains from trade · S2 Market clearing · S3 Demand and CS · S4 Marginal reasoning · S5 Supply and shutdown · S6 Opportunity cost · S7 Monopoly optimum · S8 Elasticity · S9 Lerner index · S10 Pass-through · S11 Price ceilings · S12 Surplus and DWL · S13 Fixed costs · S14 Price discrimination · S15 Pareto & Kaldor–Hicks · S16 Welfare weights · S17 Foreign monopoly · S18 Competitive equilibrium · S19 Supply shifts and elasticities · S20 Productivity and employment (Jevons) · S21 Competition and surplus maximization · S22 Price floors · S23 Specific tax · S24 Shortages and queues

## Checks before a pack is accepted

Each generator runs 200 times. The pack is rejected for any of these: errors; NaN or undefined; a missing solution; fewer than 4 distinct choices; a solver disagreeing; colliding ids; or an unknown prerequisite or encompassed skill.

## Rules for new versions of the app

- Never remove or rename a skill or item id. `margin_item_ids.json` lists every id shipped; `tests/run_all.js` fails if one disappears.
- Before release, run `node tests/run_all.js` (ids, packs, fuzz, and `margin_checker.js`), then the browser click-through.
- Version files (margin_app_v6.html), and keep backup export/restore working, including older backups.
