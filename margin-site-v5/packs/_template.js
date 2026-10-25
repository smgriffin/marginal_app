// Template for a Margin topic pack. Copy to packs/<id>.js, fill in, and add the file name to packs/index.json.
// Not listed in index.json, so the app ignores it. The test suite validates it as an example.
const {R, pick, f, NQ, CQ, TP, argmaxH, bisect, integrate} = H;

const PACK = {
  id: 'example-week',              // letters, numbers, - or _; never change once shipped
  name: 'Example week',
  version: 1,                      // bump when you update; same id replaces the old pack
  skills: [{
    id: 'X1',                      // permanent; progress is keyed on it
    name: 'Example skill', short: 'Example',
    week: 'Oct 26',                // matches a week in the app's course plan, so the plan shows it as arrived
    prereq: ['S5'],                // must be learned first
    encompass: { S5: 0.4, S0: 0.2 }, // sub-skills actually exercised, with weights in (0, 1]; implicit review credit flows only here
    class: 'Class 9',
    intro: 'Two or three sentences shown at the start of the lesson.',
    micros: [                      // 3–4 knowledge points, simplest first
      { id: 'X1a', name: 'Profit at a price', explain: 'Profit = pq − C(q).',
        gen: () => { const p = R(5, 20), q = R(2, 10), c = R(1, p - 1);
          return NQ(`A firm sells ${q} units at price ${p} with constant marginal cost ${c} and no fixed cost. What is its profit?`,
            (p - c) * q, `(${p} − ${c}) × ${q} = <b>${(p - c) * q}</b>`, [p * q, c * q, (p - c), (p + c) * q]); } },
      { id: 'X1b', name: 'Key ideas', explain: 'True/false checks.',
        pool: [["profit is revenue minus cost.", "profit is revenue minus marginal cost.", "Π = R − C."]] }
    ],
    integ: [ () => { const p = R(5, 20), c = R(1, p - 1), F = R(5, 40);
      return NQ(`Price ${p}, constant marginal cost ${c}, avoidable fixed cost ${F}. How many units must the firm sell to break even?`,
        F / (p - c), `(${p} − ${c})q = ${F} → q = <b>${f(F / (p - c))}</b>`, [F / p, F / c, F * (p - c), F / (p + c)]); } ],
    // Independent answer checks: each re-solves from the question's plain text. The app refuses the pack if any disagree.
    solve: {
      X1a: t => { const m = t.match(/sells (\d+) units at price (\d+) with constant marginal cost (\d+)/); return (+m[2] - +m[3]) * +m[1]; },
      'X1.i1': t => { const m = t.match(/Price (\d+), constant marginal cost (\d+), avoidable fixed cost (\d+)/); return bisect(q => (+m[1] - +m[2]) * q - +m[3], 0, 1e6); }
    }
  }]
};
