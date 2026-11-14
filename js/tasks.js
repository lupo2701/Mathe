/* x-Quest · Aufgabengeneratoren: 8 Stationen × 3 Niveaus (1 Basis, 2 Standard, 3 Profi) */
(function (G) {
  "use strict";
  const { Frac, Poly, parse, toPoly, M, R, gcd, MathError } = G.XQ;
  const P = s => toPoly(parse(s));
  const F = x => Frac.of(x);

  // ---------- Bausteine ----------
  // raw([[4,"x"],[2,""],[-3,"x"]]) -> "4x + 2 - 3x"  (Reihenfolge bleibt, nichts wird zusammengefasst)
  function raw(terms) {
    return terms.filter(([c]) => !F(c).isZero()).map(([c, v], i) => {
      c = F(c); const neg = c.sign() < 0, a = c.abs();
      const body = v ? (a.isOne() ? "" : a.toString()) + v : a.toString();
      return i === 0 ? (neg ? "-" : "") + body : (neg ? " - " : " + ") + body;
    }).join("") || "0";
  }
  const lin = (a, b, v = "x") => raw([[a, v], [b, ""]]);
  const pn = x => F(x).sign() < 0 ? `(${F(x)})` : `${F(x)}`; // Zahl ggf. in Klammern
  const sgnOp = (x) => F(x).sign() < 0 ? `- ${F(x).abs()}` : `+ ${F(x)}`;          // "+ 3" / "- 3"
  const num = x => M(F(x).toString());
  const st = (c, v = "") => { c = F(c); const a = c.abs(); return `${c.sign() < 0 ? "-" : "+"} ${v && a.isOne() ? "" : a}${v}`; }; // "+ 3x" / "- x"
  const money = v => F(String(v)).valueOf().toFixed(2).replace(".", ",");
  const KW = { 2: "Doppelte", 3: "Dreifache", 4: "Vierfache", 5: "Fünffache", 6: "Sechsfache", 7: "Siebenfache", 8: "Achtfache", 9: "Neunfache", 10: "Zehnfache" };
  const ex = (s) => `<div class="task-expr">${M(s)}</div>`;

  // Variablen durch Werte ersetzen: subst("3x^2 - 2x", {x:-2}) -> "3*(-2)^2 - 2*(-2)"
  function subst(expr, env) {
    let out = "";
    for (const ch of expr) {
      if (/[a-z]/.test(ch) && env[ch] !== undefined) {
        const last = out.trimEnd().slice(-1);
        if (out.length && /[0-9)]/.test(last) && out.slice(-1) !== " ") out += "*";
        out += pn(env[ch]);
      } else out += ch;
    }
    return out;
  }
  // oberste Ebene in Summanden zerlegen (an " + " / " - ")
  function splitTop(s) {
    const parts = []; let depth = 0, cur = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "(") depth++; if (c === ")") depth--;
      if (depth === 0 && (s.startsWith(" + ", i) || s.startsWith(" - ", i))) { parts.push(cur); cur = s[i + 1]; i += 2; continue; }
      cur += c;
    }
    parts.push(cur);
    return parts;
  }
  function evalSteps(expr, env) {
    const sub = subst(expr, env);
    const val = P(sub).constVal();
    const steps = [`${M(expr)} &nbsp;→&nbsp; ${M(sub)}`];
    const parts = splitTop(sub);
    if (parts.length > 1) {
      const vals = parts.map(p => P(p).constVal());
      const mid = vals.map((v, i) => i === 0 ? v.toString() : (v.sign() < 0 ? ` - ${v.abs()}` : ` + ${v}`)).join("");
      if (mid !== sub) steps.push(`= ${M(mid)}`);
    }
    steps.push(`= <b>${num(val)}</b>`);
    return { sub, val, steps };
  }

  // ---------- Fragetypen ----------
  const qInput = o => Object.assign({ kind: "input", vars: ["x"] }, o);
  const qTF = o => Object.assign({ kind: "tf" }, o);
  const qOrder = o => Object.assign({ kind: "order" }, o);
  function qMC(o) {
    // o.correct: html, o.wrong: [[html, why]]
    const seen = new Set([o.correct]);
    const opts = [{ h: o.correct, ok: true }];
    for (const [h, why] of o.wrong) { if (!seen.has(h)) { seen.add(h); opts.push({ h, ok: false, why }); } }
    return Object.assign({ kind: "mc", options: R.shuffle(opts.slice(0, o.max || 4)) }, o);
  }
  // Multiple Choice aus Termen: doppelte/gleichwertige Ablenker werden aussortiert und aufgefüllt
  function mcTerms(o) {
    const cp = P(o.correct);
    const used = [cp];
    const wrong = [];
    for (const [s, why] of o.wrong) {
      let p; try { p = P(s); } catch { continue; }
      if (!o.keepEquivalent && used.some(u => u.eq(p))) continue;
      if (wrong.some(w => w[0] === M(s))) continue;
      used.push(p); wrong.push([M(s), why]);
    }
    let guard = 0;
    while (wrong.length < 3 && guard++ < 30) {
      const p = cp.add(Poly.c(R.nz(-4, 4)));
      if (used.some(u => u.eq(p))) continue;
      used.push(p); wrong.push([M(p.toStr()), null]);
    }
    return qMC(Object.assign({}, o, { correct: M(o.correct), wrong }));
  }
  function mcNums(o) {
    const c = F(o.correct), wrong = [];
    const seen = new Set([c.toString()]);
    for (const [v, why] of o.wrong) { const f = F(v); if (!seen.has(f.toString())) { seen.add(f.toString()); wrong.push([num(f), why]); } }
    let guard = 0;
    while (wrong.length < 3 && guard++ < 30) { const f = c.add(R.nz(-5, 5)); if (!seen.has(f.toString())) { seen.add(f.toString()); wrong.push([num(f), null]); } }
    return qMC(Object.assign({}, o, { correct: num(c), wrong }));
  }

  // ---------- Lineare Gleichungen: Lösungsweg ----------
  // Seite = {a, b} für a·x + b
  const L = (a, b) => ({ a: F(a), b: F(b) });
  const linS = s => lin(s.a, s.b);
  const fromPoly = p => { if (p.degree("x") > 1 || [...p.vars()].some(v => v !== "x")) throw new MathError("nicht linear"); return L(p.coef("x"), p.coef("")); };
  function opStr(kind, v, isX) {
    v = F(v);
    const t = isX ? (v.abs().isOne() ? "x" : `${v.abs()}x`) : `${v.abs()}`;
    if (kind === "add") return v.sign() < 0 ? `| −${t}` : `| +${t}`;
    if (kind === "div") return v.sign() < 0 ? `| :(${v})` : `| :${v}`;
    if (kind === "mul") return v.sign() < 0 ? `| ·(${v})` : `| ·${v}`;
  }
  function solveLinear(l, r, startDisplay) {
    const lines = [];
    const push = (ls, rs, op) => lines.push({ eq: `${ls} = ${rs}`, op: op || "" });
    if (startDisplay) push(startDisplay[0], startDisplay[1], /[()]/.test(startDisplay.join("")) ? "Klammern auflösen" : "ordnen");
    let A = { ...l }, B = { ...r };
    push(linS(A), linS(B));
    if (!B.a.isZero()) {
      lines[lines.length - 1].op = opStr("add", B.a.neg(), true);
      A = L(A.a.sub(B.a), A.b); B = L(0, B.b); push(linS(A), linS(B));
    }
    if (A.a.isZero()) return { lines, sol: A.b.eq(B.b) ? "all" : "none" };
    if (!A.b.isZero()) {
      lines[lines.length - 1].op = opStr("add", A.b.neg(), false);
      B = L(0, B.b.sub(A.b)); A = L(A.a, 0); push(linS(A), linS(B));
    }
    if (!A.a.isOne()) {
      const a = A.a;
      lines[lines.length - 1].op = a.isInt() ? opStr("div", a) : opStr("mul", new Frac(a.d, a.n));
      B = L(0, B.b.div(a)); A = L(1, 0); push(linS(A), linS(B));
    }
    return { lines, sol: B.b };
  }
  function linesHTML(lines) {
    return `<table class="eqsteps">${lines.map(l => {
      const [ls, rs] = l.eq.split(" = ");
      return `<tr><td class="l">${M(ls)}</td><td>=</td><td class="r">${M(rs)}</td><td class="op">${l.op ? (l.op.startsWith("|") ? M(l.op) : `<span class="muted small">${l.op}</span>`) : ""}</td></tr>`;
    }).join("")}</table>`;
  }
  function eqQuestion(o) {
    // o.lhs, o.rhs: Strings (dürfen Klammern enthalten)
    const pl = P(o.lhs), pr = P(o.rhs);
    let s;
    if (pl.degree("x") > 1) { // x² hebt sich weg
      const sq = Poly.v("x").pow(2).scale(pr.coef("x^2"));
      s = solveLinear(fromPoly(pl.sub(sq)), fromPoly(pr.sub(sq)));
      s.lines.unshift({ eq: `${o.lhs} = ${o.rhs}`, op: "Klammern auflösen" }, { eq: `${pl.toStr()} = ${pr.toStr()}`, op: `| −${pr.coef("x^2").isOne() ? "" : pr.coef("x^2")}x²` });
    } else {
      const needsExpand = /[()/]/.test(o.lhs + o.rhs) || pl.toStr() !== o.lhs || pr.toStr() !== o.rhs;
      s = solveLinear(fromPoly(pl), fromPoly(pr), needsExpand ? [o.lhs, o.rhs] : null);
    }
    return qInput(Object.assign({
      mode: "num", answer: s.sol, answerText: `x = ${s.sol}`,
      prompt: o.prompt || `Löse die Gleichung.`, expr: `${o.lhs} = ${o.rhs}`,
      steps: [linesHTML(s.lines), `Lösung: ${M(`L = {${s.sol}}`)}`],
      hint: o.hint || "Bringe alle x auf eine Seite und alle Zahlen auf die andere. Was du links machst, musst du auch rechts machen!",
      placeholder: "x = ",
    }, o));
  }

  // ---------- Waage als Bild ----------
  function waageSVG(lx, ln, rx, rn) {
    const pan = (cx, xs, ns) => {
      let out = "", items = [];
      for (let i = 0; i < xs; i++) items.push("x");
      if (ns > 10) items.push("N"); else for (let i = 0; i < ns; i++) items.push("1");
      items.forEach((it, i) => {
        const row = Math.floor(i / 5), col = i % 5, perRow = Math.min(5, items.length - row * 5);
        const x = cx - perRow * 12 + col * 24 + 12, y = 112 - row * 24;
        if (it === "x") out += `<rect x="${x - 10}" y="${y - 20}" width="20" height="20" rx="4" class="wx"/><text x="${x}" y="${y - 6}" class="wxt">x</text>`;
        else if (it === "1") out += `<circle cx="${x}" cy="${y - 9}" r="9" class="w1"/><text x="${x}" y="${y - 5}" class="w1t">1</text>`;
        else out += `<rect x="${x - 16}" y="${y - 22}" width="32" height="22" rx="5" class="wn"/><text x="${x}" y="${y - 7}" class="w1t">${ns}</text>`;
      });
      return out;
    };
    return `<svg class="waage" viewBox="0 0 340 170" role="img" aria-label="Waage im Gleichgewicht">
      <polygon points="170,58 152,150 188,150" class="wstand"/><rect x="120" y="150" width="100" height="8" rx="4" class="wstand"/>
      <rect x="30" y="52" width="280" height="8" rx="4" class="wbeam"/><circle cx="170" cy="56" r="7" class="wpiv"/>
      <line x1="85" y1="60" x2="85" y2="112" class="wstr"/><line x1="255" y1="60" x2="255" y2="112" class="wstr"/>
      <path d="M20 112 h130 l-12 14 h-106 z" class="wpan"/><path d="M190 112 h130 l-12 14 h-106 z" class="wpan"/>
      ${pan(85, lx, ln)}${pan(255, rx, rn)}</svg>`;
  }

  // =====================================================================
  // STATION 1: Terme aufstellen
  // =====================================================================
  function phraseBasis() {
    const k = R.int(2, 9), K = KW[R.pick([2, 3, 4, 5])];
    const kk = Object.keys(KW).find(n => KW[n] === K);
    return R.pick([
      { t: `das ${K} einer Zahl x`, a: `${kk}x`, w: [[`x + ${kk}`, "„-fache“ bedeutet malnehmen, nicht addieren."], [`x^${kk}`, "Das wäre x mehrmals mit sich selbst multipliziert."]] },
      { t: `eine Zahl x, vermehrt um ${k}`, a: `x + ${k}`, w: [[`${k}x`, "„vermehrt um“ heißt plus, nicht mal."], [`x - ${k}`, "„vermehrt“ heißt mehr werden, also plus."]] },
      { t: `eine Zahl x, vermindert um ${k}`, a: `x - ${k}`, w: [[`${k} - x`, "Von der Zahl x wird abgezogen, also steht x vorne."], [`x + ${k}`, "„vermindert“ heißt weniger werden, also minus."]] },
      { t: `die Differenz aus ${k} und einer Zahl x`, a: `${k} - x`, w: [[`x - ${k}`, "Die Differenz aus A und B ist A − B. Hier steht die ${k} zuerst."], [`${k}x`, "Differenz heißt minus."]] },
      { t: `die Hälfte einer Zahl x`, a: `x/2`, w: [[`2x`, "Die Hälfte heißt geteilt durch 2."], [`x - 2`, "Die Hälfte heißt geteilt durch 2, nicht minus 2."]] },
      { t: `das Produkt aus ${k} und einer Zahl x`, a: `${k}x`, w: [[`${k} + x`, "Produkt heißt mal."], [`x/${k}`, "Produkt heißt mal, nicht geteilt."]] },
      { t: `der Quotient aus einer Zahl x und ${k}`, a: `x/${k}`, w: [[`${k}x`, "Quotient heißt geteilt."], [`${k}/x`, "Beim Quotienten aus A und B rechnet man A : B."]] },
    ]);
  }
  const S1 = {
    1: [
      () => { const p = phraseBasis(); return mcTerms({ prompt: `Welcher Term passt zu: <b>„${p.t}“</b>?`, correct: p.a, wrong: p.w, hint: "Achte auf die Signalwörter: Summe/vermehrt → +, Differenz/vermindert → −, Produkt/-fache → ·, Quotient/Teil → :", steps: [`Richtig ist ${M(p.a)}.`] }); },
      () => { const p = phraseBasis(); return qInput({ mode: "term", prompt: `Schreibe als Term: <b>„${p.t}“</b>`, answer: P(p.a), answerText: p.a, hint: "Signalwörter: Summe/vermehrt → +, Differenz/vermindert → −, Produkt/-fache → ·, Quotient/Hälfte → :", steps: [`${M(p.a)}`] }); },
      () => {
        const k = R.pick([2, 3, 4, 5]), m = R.int(1, 9), K = KW[k];
        return mcTerms({ prompt: `Welcher Term passt zu: <b>„das ${K} einer Zahl x, vermehrt um ${m}“</b>?`, correct: `${k}x + ${m}`,
          wrong: [[`${k}(x + ${m})`, "Hier wird nur x vervielfacht und danach addiert. Eine Klammer würde die ganze Summe vervielfachen."], [`${k} + x + ${m}`, "„-fache“ heißt mal."], [`${m}x + ${k}`, "Zahlen vertauscht: Die ${k} gehört zum x."]],
          hint: "Erst wird x vervielfacht, danach wird etwas addiert.", steps: [`${M(`${k}x + ${m}`)}`] });
      },
      () => {
        const fig = R.pick([["Quadrat", "a", "4a", "Ein Quadrat hat 4 gleich lange Seiten: a + a + a + a = 4a."], ["gleichseitiges Dreieck", "a", "3a", "Drei gleich lange Seiten: a + a + a = 3a."]]);
        return qInput({ mode: "term", vars: ["a"], prompt: `Ein ${fig[0]} hat die Seitenlänge ${M("a")}. Gib einen Term für den <b>Umfang</b> an.`, answer: P(fig[2]), answerText: fig[2], hint: "Der Umfang ist die Summe aller Seitenlängen.", steps: [fig[3]], placeholder: "Term mit a" });
      },
    ],
    2: [
      () => {
        const k = R.pick([2, 3, 4, 5]), m = R.int(2, 9), K = KW[k];
        return mcTerms({ prompt: `Welcher Term passt zu: <b>„das ${K} der Summe aus einer Zahl x und ${m}“</b>?`, correct: `${k}(x + ${m})`, keepEquivalent: false,
          wrong: [[`${k}x + ${m}`, "„Das ${K} der Summe“: Die ganze Summe wird vervielfacht. Dafür brauchst du eine Klammer."], [`x + ${k * m}`, "Auch das x muss vervielfacht werden."], [`${k} + x + ${m}`, "„-fache“ heißt mal."]],
          hint: "Wenn eine ganze Summe vervielfacht wird, setzt du die Summe in Klammern.", steps: [`${M(`${k}(x + ${m})`)} &nbsp;(ausmultipliziert: ${M(`${k}x + ${k * m}`)})`] });
      },
      () => {
        const k = R.pick([2, 3, 4]), m = R.int(2, 9), K = KW[k];
        const v = R.pick([
          [`die Differenz aus dem ${K} einer Zahl x und ${m}`, `${k}x - ${m}`],
          [`das ${K} der Differenz aus einer Zahl x und ${m}`, `${k}(x - ${m})`],
          [`die Summe aus einer Zahl x und ihrem ${K}`, `x + ${k}x`],
          [`die Hälfte der Summe aus einer Zahl x und ${m}`, `(x + ${m})/2`],
        ]);
        return qInput({ mode: "term", prompt: `Schreibe als Term: <b>„${v[0]}“</b>`, answer: P(v[1]), answerText: v[1], hint: "Lies genau: Wird nur x verändert oder eine ganze Summe/Differenz? Dann brauchst du Klammern.", steps: [M(v[1])] });
      },
      () => {
        const d = R.int(2, 9);
        return qInput({ mode: "term", prompt: `Ein Rechteck ist ${M("x")} cm breit und ${d} cm länger als breit. Gib einen Term für den <b>Umfang</b> an (vereinfacht oder nicht).`, answer: P(`2x + 2(x + ${d})`), answerText: `4x + ${2 * d}`,
          hint: `Länge = ${M(`x + ${d}`)}. Umfang = 2 · Länge + 2 · Breite.`, steps: [`Länge: ${M(`x + ${d}`)}, Breite: ${M("x")}`, `${M(`u = 2(x + ${d}) + 2x`)}`, `${M(`= 2x + ${2 * d} + 2x = 4x + ${2 * d}`)}`] });
      },
      () => {
        const k = R.pick([2, 3, 4]), m = R.int(2, 8), K = KW[k], tr = R.chance(.5);
        const term = tr ? `${k}(x + ${m})` : `${k}x + ${m}`;
        return qTF({ prompt: `Stimmt das? Der Term ${M(term)} beschreibt <b>„das ${K} der Summe aus x und ${m}“</b>.`, ok: tr,
          hint: "Wird die ganze Summe vervielfacht, braucht man eine Klammer.", steps: [`Richtig wäre ${M(`${k}(x + ${m})`)}. ${tr ? "" : `${M(term)} bedeutet: „das ${K} von x, vermehrt um ${m}“.`}`] });
      },
    ],
    3: [
      () => {
        const a = R.int(2, 5), b = R.int(1, 4);
        const vals = [1, 2, 3, 4].map(n => a * n + b);
        return qInput({ mode: "term", vars: ["n"], placeholder: "Term mit n",
          prompt: `Ein Muster aus Streichhölzern wächst so:<table class="vt"><tr><th>Figur ${M("n")}</th><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><th>Hölzer</th>${vals.map(v => `<td>${v}</td>`).join("")}</tr></table>Gib einen Term für die Anzahl der Hölzer in Figur ${M("n")} an.`,
          answer: P(`${a}n + ${b}`), answerText: `${a}n + ${b}`,
          hint: `Um wie viel wächst die Anzahl pro Figur? Das ist die Zahl vor dem n. Dann prüfe, was bei n = 1 noch fehlt.`,
          steps: [`Pro Figur kommen ${a} Hölzer dazu → ${M(`${a}n`)}.`, `Für n = 1: ${M(`${a}*1 = ${a}`)}, es sind aber ${a + b} → ${M(`+ ${b}`)}.`, `Term: ${M(`${a}n + ${b}`)}`] });
      },
      () => {
        const g = R.pick([5, 6, 8, 10, 12]), p = R.pick(["0,10", "0,20", "0,15", "0,25", "0,05"]);
        const ctx = R.pick([["Ein Taxi", "Grundgebühr", "pro gefahrenem Kilometer", "km"], ["Ein Fahrradverleih", "Grundgebühr", "pro Minute", "Minuten"], ["Ein Handytarif", "monatliche Grundgebühr", "pro Gesprächsminute", "Minuten"]]);
        return qInput({ mode: "term", prompt: `${ctx[0]} kostet ${g} € ${ctx[1]} und ${p} € ${ctx[2]}. Gib einen Term für die Kosten in € bei ${M("x")} ${ctx[3]} an.`,
          answer: P(`${g} + ${p}x`), answerText: `${g} + ${p}x`, hint: "Kosten = feste Gebühr + Preis pro Einheit · Anzahl der Einheiten", steps: [`${M(`k = ${g} + ${p}x`)}`, `Der feste Betrag kommt immer dazu, der Rest hängt von ${M("x")} ab.`] });
      },
      () => {
        const a = R.int(1, 6);
        const v = R.pick([
          [`Ein Rechteck ist ${M("x")} cm lang und ${a} cm breiter als lang. Gib einen Term für den <b>Flächeninhalt</b> an.`, `x(x + ${a})`, `x^2 + ${a}x`],
          [`Ein Quadrat hat die Seitenlänge ${M(`x + ${a}`)} cm. Gib einen Term für den <b>Flächeninhalt</b> an.`, `(x + ${a})^2`, P(`(x + ${a})^2`).toStr()],
        ]);
        return qInput({ mode: "term", prompt: v[0], answer: P(v[1]), answerText: v[2], hint: "Flächeninhalt Rechteck = Länge · Breite. Setze Summen in Klammern!", steps: [`${M(`A = ${v[1]}`)}`, `${M(`= ${v[2]}`)}`] });
      },
      () => mcTerms({ prompt: "Welcher Term beschreibt <b>„das Quadrat der Summe aus a und b“</b>?", correct: "(a + b)^2", keepEquivalent: true,
        wrong: [["a^2 + b^2", "Das ist die Summe der Quadrate – nicht dasselbe! (a + b)² = a² + 2ab + b²."], ["a + b^2", "Hier wird nur b quadriert."], ["2(a + b)", "Quadrat heißt mit sich selbst malnehmen, nicht verdoppeln."]],
        hint: "Erst wird die Summe gebildet, dann wird quadriert.", steps: [`${M("(a + b)^2")}. Achtung: ${M("(a + b)^2")} ist nicht ${M("a^2 + b^2")}!`] }),
      () => {
        const n = R.int(3, 6);
        return qInput({ mode: "term", prompt: `Drei aufeinanderfolgende natürliche Zahlen: Die kleinste ist ${M("n")}. Gib einen vereinfachten Term für ihre <b>Summe</b> an.`, vars: ["n"], placeholder: "Term mit n",
          answer: P("3n + 3"), answerText: "3n + 3", hint: "Die nächsten Zahlen sind n + 1 und n + 2.", steps: [`${M("n + (n + 1) + (n + 2) = 3n + 3")}`, `Beispiel n = ${n}: ${n} + ${n + 1} + ${n + 2} = ${3 * n + 3}`] });
      },
    ],
  };

  // =====================================================================
  // STATION 2: Termwerte berechnen (Einsetzen)
  // =====================================================================
  const S2 = {
    1: [
      () => { const a = R.int(2, 9), b = R.int(1, 15), x = R.int(1, 10), e = `${a}x + ${b}`, s = evalSteps(e, { x });
        return qInput({ mode: "num", prompt: `Berechne den Wert des Terms für ${M(`x = ${x}`)}.`, expr: e, answer: s.val, answerText: s.val, steps: s.steps, hint: `Setze ${x} für x ein. ${M(`${a}x`)} bedeutet ${M(`${a}*x`)}. Punkt vor Strich!` }); },
      () => { const a = R.int(2, 9), x = R.int(2, 10), b = R.int(1, a * x - 1), e = `${a}x - ${b}`, s = evalSteps(e, { x });
        return qInput({ mode: "num", prompt: `Berechne den Wert des Terms für ${M(`x = ${x}`)}.`, expr: e, answer: s.val, answerText: s.val, steps: s.steps, hint: "Erst malnehmen, dann subtrahieren." }); },
      () => { const a = R.int(2, 5), b = R.int(1, 9), x = R.int(2, 9), e = `${a}x + ${b}`, s = evalSteps(e, { x });
        return mcNums({ prompt: `Welchen Wert hat ${M(e)} für ${M(`x = ${x}`)}?`, correct: s.val,
          wrong: [[a + x + b, `${M(`${a}x`)} heißt ${M(`${a}*x`)}, nicht ${M(`${a} + x`)}.`], [a * 10 + x + b, `${M(`${a}x`)} ist nicht die Zahl „${a}${x}“, sondern ${M(`${a}*${x}`)}.`], [a * (x + b), "Punkt vor Strich: Erst malnehmen, dann addieren."]],
          hint: "Ersetze x durch die Zahl und rechne Punkt vor Strich.", steps: s.steps }); },
      () => { const a = R.int(2, 6), b = R.int(1, 6), x = R.int(1, 6), e = `${a}(x + ${b})`, s = evalSteps(e, { x });
        return qInput({ mode: "num", prompt: `Berechne den Wert des Terms für ${M(`x = ${x}`)}.`, expr: e, answer: s.val, answerText: s.val, steps: [`${M(subst(e, { x }))} = ${M(`${a}*${x + b}`)} = <b>${s.val}</b>`], hint: "Klammer zuerst!" }); },
    ],
    2: [
      () => { const a = R.int(2, 9), b = R.int(1, 12), x = R.int(-7, -1), e = R.chance(.5) ? `${a}x + ${b}` : `${a}x - ${b}`, s = evalSteps(e, { x });
        return qInput({ mode: "num", prompt: `Berechne den Wert des Terms für ${M(`x = ${x}`)}.`, expr: e, answer: s.val, answerText: s.val, steps: s.steps, hint: "Setze die negative Zahl in Klammern ein. Plus mal Minus ergibt Minus." }); },
      () => { const b = R.int(1, 9), x = R.int(-5, -2), e = R.chance(.5) ? `x^2 + ${b}x` : `x^2 - ${b}`, s = evalSteps(e, { x });
        return mcNums({ prompt: `Welchen Wert hat ${M(e)} für ${M(`x = ${x}`)}?`, correct: s.val,
          wrong: [[P(subst(e, { x }).replace(`(${x})^2`, `-(${-x})^2`)).constVal(), `${M(`(${x})^2`)} ist positiv: ${M(`(${x})*(${x}) = ${x * x}`)}.`], [P(subst(e, { x }).replace(`(${x})^2`, `2*(${x})`)).constVal(), "Hoch 2 heißt mit sich selbst malnehmen, nicht mal 2."]],
          hint: "Minus mal Minus ergibt Plus. Also ist (−3)² = 9.", steps: s.steps }); },
      () => { const a = R.int(2, 6), b = R.int(2, 6), va = R.nz(-5, 5), vb = R.nz(-5, 5), e = `${a}a - ${b}b`, s = evalSteps(e, { a: va, b: vb });
        return qInput({ mode: "num", prompt: `Berechne den Wert des Terms für ${M(`a = ${va}`)} und ${M(`b = ${vb}`)}.`, expr: e, answer: s.val, answerText: s.val, steps: s.steps, hint: "Setze jede Zahl für ihre Variable ein, negative Zahlen in Klammern." }); },
      () => { const a = R.int(2, 7), b = R.int(1, 9), x = R.nz(-6, 6), e = `${a}x - ${b}`, real = P(subst(e, { x })).constVal(), tr = R.chance(.5);
        const sh = tr ? real : real.add(R.pick([2, -2, 2 * b, -2 * a * x]) || 2);
        return qTF({ prompt: `Stimmt das? Für ${M(`x = ${x}`)} hat ${M(e)} den Wert ${num(sh)}.`, ok: sh.eq(real), hint: "Rechne selbst nach: einsetzen, dann Punkt vor Strich.", steps: evalSteps(e, { x }).steps }); },
    ],
    3: [
      () => { const a = R.int(2, 4), b = R.int(1, 6), c = R.int(1, 9), x = R.int(-4, -1), e = `${a}x^2 - ${b}x + ${c}`, s = evalSteps(e, { x });
        return qInput({ mode: "num", prompt: `Berechne den Wert des Terms für ${M(`x = ${x}`)}.`, expr: e, answer: s.val, answerText: s.val, steps: s.steps, hint: "Erst Potenzen, dann Punkt, dann Strich. (−2)² = 4!" }); },
      () => { const a = R.pick([2, 4, 6, 8]), b = R.int(1, 9), x = R.pick(["1/2", "-1/2", "0,5", "1,5"]), e = `${a}x - ${b}`;
        const xv = x.includes("/") ? new Frac(+x.split("/")[0], +x.split("/")[1]) : Frac.parseDec(x);
        const s2 = evalSteps(e, { x: xv });
        return qInput({ mode: "num", prompt: `Berechne den Wert des Terms für ${M(`x = ${x}`)}.`, expr: e, answer: s2.val, answerText: s2.val, steps: s2.steps, hint: "Ein Halb mal eine gerade Zahl – das geht glatt auf." }); },
      () => { const a = R.int(2, 7), b = R.nz(-9, 9), x = R.nz(-8, 10), v = a * x + b, e = lin(a, b);
        return qInput({ mode: "num", prompt: `Für welche Zahl ${M("x")} hat der Term ${M(e)} den Wert ${num(v)}?`, answer: F(x), answerText: `x = ${x}`, placeholder: "x = ",
          steps: [`Gleichung: ${M(`${e} = ${v}`)}`, linesHTML(solveLinear(L(a, b), L(0, v)).lines)], hint: "Stelle eine Gleichung auf: Term = Wert. Oder probiere geschickt aus." }); },
      () => {
        const x = R.pick([-3, -2, 2, 3]);
        let terms, vals, guard = 0;
        do {
          terms = R.shuffle([`x^2`, `-x^2 + ${R.int(5, 12)}`, `${R.int(2, 4)}x - ${R.int(1, 5)}`, `${R.int(2, 3)}(${R.int(1, 3)} - x)`, `x^3`]).slice(0, 4);
          vals = terms.map(t => P(subst(t, { x })).constVal().valueOf());
        } while (new Set(vals).size < 4 && guard++ < 20);
        const best = vals.indexOf(Math.max(...vals));
        return qMC({ prompt: `Welcher Term hat für ${M(`x = ${x}`)} den <b>größten</b> Wert?`, correct: M(terms[best]),
          wrong: terms.filter((_, i) => i !== best).map((t, i) => [M(t), null]),
          hint: "Berechne alle vier Werte und vergleiche.", steps: terms.map((t, i) => `${M(t)} → ${M(subst(t, { x }))} = ${num(vals[i])}`) });
      },
      () => {
        const a = R.int(2, 5), b = R.int(2, 6), x = 0, pair = R.pick([[`${a}(x + ${b})`, `${a}x + ${b}`, false], [`${a}(x + ${b})`, `${a}x + ${a * b}`, true], [`(x + ${b})^2`, `x^2 + ${b * b}`, false]]);
        return qTF({ prompt: `Sind die Terme ${M(pair[0])} und ${M(pair[1])} gleichwertig (für jede Zahl gleich)?`, ok: pair[2],
          hint: "Setze verschiedene Zahlen ein, z. B. x = 0 und x = 1. Ein einziges Gegenbeispiel reicht für „nein“.",
          steps: [0, 1, 2].map(x => `x = ${x}: ${M(pair[0])} = ${P(subst(pair[0], { x })).constVal()}, ${M(pair[1])} = ${P(subst(pair[1], { x })).constVal()}`) });
      },
    ],
  };

  // =====================================================================
  // STATION 3: Terme zusammenfassen
  // =====================================================================
  function groupSteps(terms) {
    const keyOf = v => v || "~";
    const sorted = terms.slice().sort((p, q) => keyOf(p[1]) < keyOf(q[1]) ? -1 : keyOf(p[1]) > keyOf(q[1]) ? 1 : 0);
    const res = P(raw(terms)).toStr();
    const steps = [];
    if (raw(sorted) !== raw(terms)) steps.push(`Ordnen: ${M(raw(sorted))}`);
    else steps.push(`Gleichartige Glieder: Zahlen vor den Variablen addieren.`);
    steps.push(`Zusammenfassen: <b>${M(res)}</b>`);
    return { res, steps };
  }
  const S3 = {
    1: [
      () => { const t = [[R.int(2, 9), "x"], [R.int(2, 9), "x"]]; if (R.chance(.4)) t.push([R.int(1, 5), "x"]); const g = groupSteps(t);
        return qInput({ mode: "expand", prompt: "Fasse zusammen.", expr: raw(t), answer: P(g.res), answerText: g.res, steps: g.steps, hint: "Gleichartige Glieder (alle mit x) zählst du zusammen: 3x + 5x = 8x." }); },
      () => { const t = R.shuffle([[R.int(2, 9), "x"], [R.int(1, 9), ""], [R.int(1, 9), "x"], [R.int(1, 9), ""]]); const g = groupSteps(t);
        return qInput({ mode: "expand", prompt: "Fasse zusammen.", expr: raw(t), answer: P(g.res), answerText: g.res, steps: g.steps, hint: "Sortiere: erst alle x, dann alle Zahlen. x-Glieder und Zahlen kann man nicht zusammenfassen." }); },
      () => { const a = R.int(2, 7), b = R.int(2, 7), v = R.pick([
          [`${a}x + ${b} = ${a + b}x`, false, `${M("x")} und Zahlen sind nicht gleichartig. ${M(`${a}x + ${b}`)} bleibt so stehen.`],
          [`${a}x + ${b}x = ${a + b}x`, true, `Gleichartige Glieder: ${a} + ${b} = ${a + b}.`],
          [`${a}x + ${b}y = ${a + b}xy`, false, `${M("x")} und ${M("y")} sind verschieden. ${M(`${a}x + ${b}y`)} lässt sich nicht zusammenfassen.`],
          [`${a}x - x = ${a - 1}x`, true, `${M("x")} ist ${M("1x")}. Also ${a} − 1 = ${a - 1}.`],
          [`x + x = x^2`, false, `${M("x + x = 2x")}. ${M("x^2")} wäre ${M("x*x")}.`]]);
        return qTF({ prompt: `Stimmt das? ${M(v[0])}`, ok: v[1], steps: [v[2]], hint: "Nur gleichartige Glieder (gleiche Variable, gleiche Hochzahl) darf man zusammenfassen." }); },
      () => { const a = R.int(2, 6), b = R.int(2, 6), c = R.int(1, 5), e = `${a}a + ${b}b + ${c}a`, res = `${a + c}a + ${b}b`;
        return mcTerms({ prompt: `Fasse zusammen: ${M(e)}`, correct: res, wrong: [[`${a + b + c}ab`, "a und b sind nicht gleichartig."], [`${a + b + c}a`, "Die b-Glieder darfst du nicht zu den a-Gliedern zählen."], [`${a + c}a + ${b}`, "Die Variable b darf nicht verschwinden."]],
          hint: "Zähle nur die a-Glieder zusammen. Das b-Glied bleibt.", steps: [`${M(`${a}a + ${c}a + ${b}b = ${res}`)}`] }); },
    ],
    2: [
      () => { const t = R.shuffle([[R.nz(-9, 9), "x"], [R.nz(-9, 9), ""], [R.nz(-9, 9), "x"], [R.nz(-9, 9), ""]]); const g = groupSteps(t);
        return qInput({ mode: "expand", prompt: "Fasse zusammen.", expr: raw(t), answer: P(g.res), answerText: g.res, steps: g.steps, hint: "Das Rechenzeichen gehört immer zum Glied dahinter. Ordne mit Vorzeichen." }); },
      () => { const t = R.shuffle([[R.int(2, 9), "a"], [R.nz(-9, 9), "b"], [-R.int(1, 9), "a"], [R.nz(-9, 9), "b"]]); const g = groupSteps(t);
        return qInput({ mode: "expand", vars: ["a", "b"], prompt: "Fasse zusammen.", expr: raw(t), answer: P(g.res), answerText: g.res, steps: g.steps, hint: "a-Glieder zusammen, b-Glieder zusammen." }); },
      () => { const a = R.nz(-6, 7), b = R.int(2, 7), v = R.pick([[`${a} * ${b}x`, ["x"]], [`${a}x * ${b}y`, ["x", "y"]], [`${a}a * ${b}a`, ["a"]], [`${b}x * ${a}`, ["x"]]]);
        const res = P(v[0]).toStr();
        return qInput({ mode: "expand", vars: v[1], prompt: "Vereinfache das Produkt.", expr: v[0], answer: P(res), answerText: res, steps: [`Zahlen mal Zahlen, Variablen mal Variablen: <b>${M(res)}</b>`], hint: "Multipliziere die Zahlen miteinander und schreibe die Variablen dahinter. a · a = a²." }); },
      () => { const a = R.int(3, 9), b = R.int(1, 8), c = R.int(1, 9), d = R.int(1, 9), e = `${a}x - ${b} - ${c}x + ${d}`, res = P(e).toStr();
        return mcTerms({ prompt: `Fasse zusammen: ${M(e)}`, correct: res, wrong: [[P(`${a}x + ${c}x - ${b} + ${d}`).toStr(), `Das Minus vor ${M(`${c}x`)} gehört zu ${M(`${c}x`)}: ${M(`${a}x - ${c}x`)}.`], [P(`${a}x - ${c}x - ${b} - ${d}`).toStr(), `Vor der ${d} steht ein Plus.`], [`${a - c + d - b}x`, "x-Glieder und Zahlen darf man nicht zusammenfassen."]],
          hint: "Das Rechenzeichen gehört zum Glied dahinter.", steps: [`Ordnen: ${M(`${a}x - ${c}x - ${b} + ${d}`)}`, `= <b>${M(res)}</b>`] }); },
    ],
    3: [
      () => { const t = R.shuffle([[R.int(2, 7), "x^2"], [R.nz(-8, 8), "x"], [-R.int(1, 6), "x^2"], [R.nz(-8, 8), "x"], [R.nz(-9, 9), ""]]); const g = groupSteps(t);
        return qInput({ mode: "expand", prompt: "Fasse zusammen.", expr: raw(t), answer: P(g.res), answerText: g.res, steps: g.steps, hint: "x² und x sind NICHT gleichartig. Sortiere nach x², x und Zahlen." }); },
      () => { const a = R.int(2, 5), b = R.int(2, 5), c = R.int(1, 9), d = R.nz(-7, 7), e = `${a}x * ${b}x - ${c}x^2 ${sgnOp(d)}x`, res = P(e).toStr();
        return qInput({ mode: "expand", prompt: "Vereinfache so weit wie möglich.", expr: e, answer: P(res), answerText: res, steps: [`${M(`${a}x * ${b}x = ${a * b}x^2`)}`, `${M(`${a * b}x^2 - ${c}x^2 ${sgnOp(d)}x`)} = <b>${M(res)}</b>`], hint: "Erst das Produkt ausrechnen (x · x = x²), dann zusammenfassen." }); },
      () => { const t = R.shuffle([[R.pick(["0,5", "1,5", "2,5"]), "a"], [R.pick(["0,5", "1,5", "-2,5"]), "b"], [R.pick(["-2", "-0,5", "3"]), "a"], [R.pick(["0,5", "-1", "1,5"]), "b"]]); const g = groupSteps(t);
        return qInput({ mode: "expand", vars: ["a", "b"], prompt: "Fasse zusammen.", expr: raw(t), answer: P(g.res), answerText: g.res, steps: g.steps, hint: "Mit Dezimalzahlen rechnest du genauso. 0,5a + 1,5a = 2a." }); },
      () => { const v = R.pick([
          ["3xy + 2yx = 5xy", true, "xy und yx sind gleich (Kommutativgesetz), also gleichartig."],
          ["x * x * x = 3x", false, "x · x · x = x³. 3x wäre x + x + x."],
          ["2x^2 + 3x^2 = 5x^4", false, "Beim Addieren bleibt die Hochzahl gleich: 2x² + 3x² = 5x²."],
          ["2x^2 * 3x = 6x^3", true, "2 · 3 = 6 und x² · x = x³."],
          ["4a^2 - a^2 = 4", false, "4a² − 1a² = 3a²."],
          ["-x^2 = (-x)^2", false, "−x² ist negativ (für x ≠ 0), (−x)² ist positiv."]]);
        return qTF({ prompt: `Stimmt das? ${M(v[0])}`, ok: v[1], steps: [v[2]], hint: "Unterscheide Addieren (Hochzahl bleibt) und Multiplizieren (Hochzahlen werden addiert)." }); },
    ],
  };

  // =====================================================================
  // STATION 4: Klammern auflösen
  // =====================================================================
  const S4 = {
    1: [
      () => { const a = R.int(2, 9), b = R.int(1, 9), e = `${a}(x + ${b})`, res = P(e).toStr();
        return qInput({ mode: "expand", prompt: "Multipliziere die Klammer aus.", expr: e, answer: P(res), answerText: res, steps: [`${M(`${a}*x + ${a}*${b}`)}`, `= <b>${M(res)}</b>`], hint: `Jedes Glied in der Klammer wird mit ${a} multipliziert: ${a} · x und ${a} · ${b}.` }); },
      () => { const a = R.int(2, 9), b = R.int(1, 9), op = R.pick(["+", "-"]), e = `${a}(x ${op} ${b})`, res = P(e).toStr();
        return mcTerms({ prompt: `Multipliziere aus: ${M(e)}`, correct: res, wrong: [[`${a}x ${op} ${b}`, `Auch die ${b} muss mit ${a} multipliziert werden!`], [`x ${op} ${a * b}`, `Auch das x muss mit ${a} multipliziert werden.`], [`${a}x ${op} ${a + b}`, `${a} · ${b} ist ${a * b}, nicht ${a + b}.`]],
          hint: "Der Faktor vor der Klammer wird mit JEDEM Glied in der Klammer multipliziert.", steps: [`${M(`${a}*x ${op} ${a}*${b} = ${res}`)}`] }); },
      () => { const c = R.int(1, 9), a = R.int(1, 9), b = R.int(1, 9), e = `${c}x + (${a}x - ${b})`, res = P(e).toStr();
        return qInput({ mode: "expand", prompt: "Löse die Klammer auf und fasse zusammen.", expr: e, answer: P(res), answerText: res, steps: [`Plus vor der Klammer: Klammer einfach weglassen.`, `${M(`${c}x + ${a}x - ${b}`)} = <b>${M(res)}</b>`], hint: "Steht ein Plus vor der Klammer, darfst du die Klammer einfach weglassen." }); },
      () => { const a = R.int(2, 7), b = R.int(2, 7), tr = R.chance(.5), right = `${a}x + ${a * b}`, shown = tr ? right : `${a}x + ${b}`;
        return qTF({ prompt: `Stimmt das? ${M(`${a}(x + ${b}) = ${shown}`)}`, ok: tr, steps: [`${M(`${a}(x + ${b}) = ${a}*x + ${a}*${b} = ${right}`)}`], hint: "Jedes Glied in der Klammer mit dem Faktor malnehmen." }); },
    ],
    2: [
      () => { const a = R.int(2, 9), b = R.int(1, 9), op = R.pick(["+", "-"]), e = `-${a}(x ${op} ${b})`, res = P(e).toStr();
        return qInput({ mode: "expand", prompt: "Multipliziere die Klammer aus.", expr: e, answer: P(res), answerText: res, steps: [`${M(`(-${a})*x + (-${a})*(${op}${b})`)}`, `= <b>${M(res)}</b>`], hint: "Minus mal Plus = Minus, Minus mal Minus = Plus." }); },
      () => { const c = R.int(2, 9), a = R.int(1, 9), b = R.nz(-9, 9), e = `${c}x - (${lin(a, b)})`, res = P(e).toStr();
        return qInput({ mode: "expand", prompt: "Löse die Minusklammer auf und fasse zusammen.", expr: e, answer: P(res), answerText: res, steps: [`Minus vor der Klammer: Alle Vorzeichen in der Klammer umdrehen.`, `${M(`${c}x ${st(-a, "x")} ${st(-b)}`)}`, `= <b>${M(res)}</b>`], hint: "Steht ein Minus vor der Klammer, drehst du beim Weglassen alle Vorzeichen in der Klammer um." }); },
      () => { const a = R.int(2, 6), b = R.int(1, 7), c = R.int(2, 6), d = R.int(1, 7), e = `${a}(x + ${b}) - ${c}(x - ${d})`, res = P(e).toStr();
        return qInput({ mode: "expand", prompt: "Multipliziere aus und fasse zusammen.", expr: e, answer: P(res), answerText: res, steps: [`${M(`${a}x + ${a * b} - ${c}x + ${c * d}`)}`, `= <b>${M(res)}</b>`], hint: `Achtung beim zweiten Teil: ${M(`-${c}*(-${d}) = +${c * d}`)}` }); },
      () => { const a = R.int(1, 4), b = R.int(2, 6), c = R.nz(-9, 9), e = a === 1 ? `x(${lin(b, c)})` : `${a}x(${lin(b, c)})`, res = P(e).toStr();
        return qInput({ mode: "expand", prompt: "Multipliziere die Klammer aus.", expr: e, answer: P(res), answerText: res, steps: [`<b>${M(res)}</b>`, `Denk dran: ${M("x*x = x^2")}`], hint: "x · x = x². Jedes Glied in der Klammer malnehmen." }); },
      () => { const c = R.int(3, 9), a = R.int(1, 6), b = R.int(1, 9), e = `${c}x - (${a}x - ${b})`, res = P(e).toStr();
        return mcTerms({ prompt: `Löse die Klammer auf: ${M(e)}`, correct: res, wrong: [[P(`${c}x - ${a}x - ${b}`).toStr(), `Bei einer Minusklammer wird auch aus ${M(`-${b}`)} ein ${M(`+${b}`)}.`], [P(`${c}x + ${a}x - ${b}`).toStr(), "Vor der Klammer steht ein Minus: Alle Vorzeichen umdrehen."], [P(`${c}x + ${a}x + ${b}`).toStr(), "Das erste Glied in der Klammer wird auch umgedreht: aus +ax wird −ax."]],
          hint: "Minus vor der Klammer: Jedes Vorzeichen in der Klammer umdrehen.", steps: [`${M(`${c}x - ${a}x + ${b} = ${res}`)}`] }); },
    ],
    3: [
      () => { const a = R.nz(-7, 7), b = R.nz(-7, 7), e = `(${lin(1, a)})(${lin(1, b)})`, res = P(e).toStr();
        return qInput({ mode: "expand", prompt: "Multipliziere die Klammern aus und fasse zusammen.", expr: e, answer: P(res), answerText: res, steps: [`Jedes Glied mit jedem: ${M(`x*x ${st(b, "x")} ${st(a, "x")} ${st(a * b)}`)}`, `= <b>${M(res)}</b>`], hint: "Jedes Glied der ersten Klammer mit jedem Glied der zweiten Klammer multiplizieren (4 Produkte)." }); },
      () => { const a = R.int(1, 9), k = R.pick([1, 1, 2, 3]), kind = R.int(1, 3);
        const xx = k === 1 ? "x" : `${k}x`;
        const e = kind === 1 ? `(${xx} + ${a})^2` : kind === 2 ? `(${xx} - ${a})^2` : `(${xx} + ${a})(${xx} - ${a})`, res = P(e).toStr();
        const names = ["", "1. binomische Formel: (a + b)² = a² + 2ab + b²", "2. binomische Formel: (a − b)² = a² − 2ab + b²", "3. binomische Formel: (a + b)(a − b) = a² − b²"];
        return qInput({ mode: "expand", prompt: "Wende eine binomische Formel an.", expr: e, answer: P(res), answerText: res, steps: [names[kind], `Hier: a = ${M(xx)}, b = ${a}`, `<b>${M(res)}</b>`], hint: names[kind] }); },
      () => { const a = R.int(2, 9), e = `(x + ${a})^2`, res = P(e).toStr();
        return mcTerms({ prompt: `Was ergibt ${M(e)}?`, correct: res, wrong: [[`x^2 + ${a * a}`, "Das gemischte Glied 2ab fehlt! (a + b)² ist nicht a² + b²."], [`x^2 + ${a}x + ${a * a}`, `Das gemischte Glied ist ${M(`2*x*${a} = ${2 * a}x`)}.`], [`x^2 + ${2 * a}x + ${2 * a}`, `${a}² ist ${a * a}, nicht ${2 * a}.`]],
          hint: "1. binomische Formel: (a + b)² = a² + 2ab + b²", steps: [`${M(`x^2 + 2*x*${a} + ${a}^2 = ${res}`)}`] }); },
      () => { const a = R.nz(-5, 5), b = R.int(1, 5), c = R.nz(-6, 6), e = `(${lin(1, a)})(x - ${b}) - x(${lin(1, c)})`, res = P(e).toStr();
        return qInput({ mode: "expand", prompt: "Vereinfache so weit wie möglich.", expr: e, answer: P(res), answerText: res, steps: [`Erster Teil: ${M(P(`(${lin(1, a)})(x - ${b})`).toStr())}`, `Zweiter Teil: ${M(`-x(${lin(1, c)}) = ${P(`-x(${lin(1, c)})`).toStr()}`)}`, `Zusammen: <b>${M(res)}</b>`], hint: "Erst beide Produkte ausmultiplizieren, dann zusammenfassen. Die x² heben sich auf!" }); },
    ],
  };

  // =====================================================================
  // STATION 5: Ausklammern
  // =====================================================================
  const S5 = {
    1: [
      () => { const k = R.int(2, 9), m = R.int(1, 9), e = `${k}x + ${k * m}`, res = `${k}(x + ${m})`;
        return qInput({ mode: "factor", prompt: "Klammere den gemeinsamen Faktor aus.", expr: e, answer: P(e), answerText: res, steps: [`Gemeinsamer Faktor: ${k}, denn ${M(`${k}x = ${k}*x`)} und ${M(`${k * m} = ${k}*${m}`)}.`, `<b>${M(res)}</b>`, `Probe: ${M(`${k}(x + ${m}) = ${e}`)} ✓`], hint: `Welche Zahl steckt in ${M(`${k}x`)} und in ${k * m}? Die schreibst du vor die Klammer.` }); },
      () => { const k = R.pick([4, 6, 8, 9, 10, 12]), m = R.int(1, 5) * 2 + 1, e = `${k}x + ${k * m}`;
        const half = k % 2 === 0 ? `2(${k / 2}x + ${k * m / 2})` : `3(${k / 3}x + ${k * m / 3})`;
        return mcTerms({ prompt: `Klammere <b>vollständig</b> aus: ${M(e)}`, correct: `${k}(x + ${m})`, keepEquivalent: true,
          wrong: [[`${k}(x + ${k * m})`, `Auch ${k * m} muss durch ${k} geteilt werden.`], [half, `Das stimmt, aber in der Klammer steckt noch ein gemeinsamer Faktor. Klammere den größten Faktor ${k} aus.`], [`${k}x(1 + ${m})`, "Das x steckt nicht in beiden Gliedern."]],
          hint: "Suche den größten gemeinsamen Faktor (ggT).", steps: [`ggT von ${k} und ${k * m} ist ${k}.`, `${M(`${e} = ${k}(x + ${m})`)}`] }); },
      () => { const v = R.pick(["a", "x"]), w = v === "a" ? ["b", "c"] : ["y", "z"], e = `${v}${w[0]} + ${v}${w[1]}`, res = `${v}(${w[0]} + ${w[1]})`;
        return qInput({ mode: "factor", vars: [v, ...w], prompt: "Klammere den gemeinsamen Faktor aus.", expr: e, answer: P(e), answerText: res, steps: [`${M(v)} steckt in beiden Gliedern.`, `<b>${M(res)}</b>`], hint: "Welche Variable kommt in beiden Gliedern vor?" }); },
      () => { const k = R.int(2, 9), m = R.int(2, 9), e = `${k}a + ${k}b`, res = `${k}(a + b)`;
        return qInput({ mode: "factor", vars: ["a", "b"], prompt: "Klammere aus.", expr: e, answer: P(e), answerText: res, steps: [`<b>${M(res)}</b>`], hint: `Beide Glieder haben den Faktor ${k}.` }); },
    ],
    2: [
      () => { let p, q; do { p = R.int(2, 7); q = R.int(1, 9); } while (gcd(p, q) !== 1); const g = R.int(2, 6), e = `${g * p}x - ${g * q}`, res = `${g}(${p}x - ${q})`;
        return qInput({ mode: "factor", prompt: "Klammere den größten gemeinsamen Faktor aus.", expr: e, answer: P(e), answerText: res, steps: [`ggT von ${g * p} und ${g * q} ist ${g}.`, `<b>${M(res)}</b>`], hint: `Welche größte Zahl teilt ${g * p} und ${g * q}?` }); },
      () => { const b = R.nz(-9, 9), e = `x^2 ${sgnOp(b)}x`, res = `x(${lin(1, b)})`;
        return qInput({ mode: "factor", prompt: "Klammere aus.", expr: e, answer: P(e), answerText: res, steps: [`${M("x^2 = x*x")}, also steckt ${M("x")} in beiden Gliedern.`, `<b>${M(res)}</b>`], hint: "x² = x · x. Was steckt in beiden Gliedern?" }); },
      () => { let p, q; do { p = R.int(2, 5); q = R.int(1, 5); } while (gcd(gcd(p, q), 1) !== 1 || gcd(p, q) !== 1); const g = R.int(2, 5), e = `${g * p}a + ${g * q}b - ${g}`, res = `${g}(${p}a + ${q}b - 1)`;
        return qInput({ mode: "factor", vars: ["a", "b"], prompt: "Klammere den größten gemeinsamen Faktor aus.", expr: e, answer: P(e), answerText: res, steps: [`Gemeinsamer Faktor: ${g}`, `<b>${M(res)}</b>`, `Achtung: Aus ${M(`-${g}`)} wird ${M("-1")} in der Klammer – nicht 0!`], hint: `Wenn du ${g} aus ${g} ausklammerst, bleibt 1 übrig.` }); },
      () => { let p, q; do { p = R.int(2, 5); q = R.int(1, 7); } while (gcd(p, q) !== 1); const g = R.int(2, 4), e = `${g * p}x^2 - ${g * q}x`, res = `${g}x(${p}x - ${q})`;
        return qInput({ mode: "factor", prompt: "Klammere so viel wie möglich aus (Zahl und Variable).", expr: e, answer: P(e), answerText: res, steps: [`Zahl: ${g}, Variable: ${M("x")} → ${M(`${g}x`)}`, `<b>${M(res)}</b>`], hint: "Klammere die Zahl UND das x aus." }); },
    ],
    3: [
      () => { let p, q; do { p = R.int(2, 5); q = R.int(1, 7); } while (gcd(p, q) !== 1); const g = R.int(2, 5), e = `${g * p}x^2y - ${g * q}xy`, res = `${g}xy(${p}x - ${q})`;
        return qInput({ mode: "factor", vars: ["x", "y"], prompt: "Klammere so viel wie möglich aus.", expr: e, answer: P(e), answerText: res, steps: [`Gemeinsam: ${g}, ${M("x")} und ${M("y")} → ${M(`${g}xy`)}`, `<b>${M(res)}</b>`], hint: "Schau einzeln: gemeinsame Zahl? gemeinsames x? gemeinsames y?" }); },
      () => { const a = R.int(2, 9), kind = R.int(1, 3);
        const e = kind === 1 ? `x^2 + ${2 * a}x + ${a * a}` : kind === 2 ? `x^2 - ${2 * a}x + ${a * a}` : `x^2 - ${a * a}`;
        const res = kind === 1 ? `(x + ${a})^2` : kind === 2 ? `(x - ${a})^2` : `(x + ${a})(x - ${a})`;
        return qInput({ mode: "factor", prompt: "Schreibe als Produkt (binomische Formel rückwärts).", expr: e, answer: P(e), answerText: res, steps: [kind === 3 ? "3. binomische Formel: a² − b² = (a + b)(a − b)" : `${kind}. binomische Formel rückwärts`, `${M(`${a * a} = ${a}^2`)}${kind < 3 ? `, ${M(`${2 * a}x = 2*x*${a}`)}` : ""}`, `<b>${M(res)}</b>`], hint: `Ist ${a * a} eine Quadratzahl? Dann prüfe, ob eine binomische Formel passt.` }); },
      () => { const a = R.int(2, 9);
        return qInput({ mode: "num", prompt: `Welche Zahl muss für ▢ eingesetzt werden, damit ${M(`x^2 + `)}▢${M("x")}${M(` + ${a * a}`)} ein Quadrat ${M(`(x + ${a})^2`)} ist?`, answer: F(2 * a), answerText: 2 * a, placeholder: "Zahl", steps: [`${M(`(x + ${a})^2 = x^2 + 2*${a}*x + ${a * a}`)}`, `▢ = ${2 * a}`], hint: "Das gemischte Glied ist 2 · a · b." }); },
      () => { const g = R.int(2, 4), a = R.int(2, 6), e = `${g}x^2 - ${g * a * a}`, res = `${g}(x + ${a})(x - ${a})`;
        return qInput({ mode: "factor", prompt: "Klammere erst aus, dann wende eine binomische Formel an.", expr: e, answer: P(e), answerText: res, steps: [`${M(`${g}(x^2 - ${a * a})`)}`, `${M(`= ${res}`)}`], hint: `Erst ${g} ausklammern. In der Klammer steht dann ${M(`x^2 - ${a * a}`)}.` }); },
    ],
  };

  // =====================================================================
  // STATION 6: Gleichungen verstehen
  // =====================================================================
  const S6 = {
    1: [
      () => { const a = R.int(2, 6), x = R.int(1, 8), b = R.int(1, 10), c = a * x + b, test = R.chance(.5) ? x : x + R.pick([-1, 1, 2]);
        const v = a * test + b;
        return qTF({ prompt: `Ist ${M(`x = ${test}`)} eine Lösung der Gleichung ${M(`${a}x + ${b} = ${c}`)}?`, ok: test === x,
          hint: "Mach die Probe: Setze die Zahl ein und prüfe, ob links und rechts dasselbe herauskommt.", steps: [`Probe: ${M(`${a}*${test} + ${b} = ${v}`)}`, v === c ? `${v} = ${c} ✓ – das ist eine Lösung.` : `${v} ≠ ${c} ✗ – keine Lösung. Richtig wäre ${M(`x = ${x}`)}.`] }); },
      () => { const x = R.int(2, 15), a = R.int(2, 15), kind = R.int(1, 2);
        const e = kind === 1 ? `x + ${a} = ${x + a}` : `${a}x = ${a * x}`;
        return qInput({ mode: "num", prompt: "Welche Zahl musst du für x einsetzen, damit die Gleichung stimmt?", expr: e, answer: F(x), answerText: `x = ${x}`, placeholder: "x = ",
          steps: [kind === 1 ? `Welche Zahl plus ${a} ergibt ${x + a}? → ${x + a} − ${a} = ${x}` : `${a} mal welche Zahl ergibt ${a * x}? → ${a * x} : ${a} = ${x}`], hint: kind === 1 ? "Rechne rückwärts: Minus statt Plus." : "Rechne rückwärts: Geteilt statt Mal." }); },
      null, // Waage, siehe unten
      () => qMC({ prompt: "Welcher Ausdruck ist eine <b>Gleichung</b>?", correct: M(`3x + 5 = 20`), wrong: [[M("3x + 5"), "Das ist ein Term – es fehlt das Gleichheitszeichen."], [M("3x + 5x"), "Das ist ein Term."], [M("3(x + 5)"), "Das ist ein Term."]], hint: "Eine Gleichung hat immer ein Gleichheitszeichen mit zwei Seiten.", steps: ["Eine Gleichung besteht aus zwei Termen, die durch „=“ verbunden sind."] }),
    ],
    2: [
      () => { const v = R.pick([
          () => { const a = R.int(2, 7), b = R.int(2, 9), x = R.int(1, 9); return [`${a}x + ${b} = ${a * x + b}`, `${a}x = ${a * x}`, `| −${b}`, [`| +${b}`, `| :${b}`, `| −${a * x + b}`]]; },
          () => { const a = R.int(2, 9), x = R.int(2, 9); return [`${a}x = ${a * x}`, `x = ${x}`, `| :${a}`, [`| −${a}`, `| ·${a}`, `| :${x}`]]; },
          () => { const a = R.int(2, 7), b = R.int(2, 9), x = R.int(1, 9); return [`${a}x - ${b} = ${a * x - b}`, `${a}x = ${a * x}`, `| +${b}`, [`| −${b}`, `| :${b}`, `| ·${b}`]]; },
          () => { const a = R.int(3, 7), c = R.int(1, a - 1), b = R.int(1, 9); return [`${a}x + ${b} = ${c}x + ${b + 2 * (a - c)}`, `${a - c}x + ${b} = ${b + 2 * (a - c)}`, `| −${c === 1 ? "" : c}x`, [`| +${c === 1 ? "" : c}x`, `| −${b}`, `| :${c}`]]; },
        ])();
        return qMC({ prompt: `Welche Umformung führt von ${M(v[0])} zu ${M(v[1])}?`, correct: M(v[2]), wrong: v[3].map(w => [M(w), null]), hint: "Überlege: Was ist auf der linken Seite verschwunden? Mache das Gegenteil.", steps: [`${M(v[0])} &nbsp; ${M(v[2])}`, `${M(v[1])}`] }); },
      () => { const a = R.int(2, 6), x = R.int(-6, -1), b = R.int(1, 15), c = a * x + b, test = R.chance(.5) ? x : -x;
        return qTF({ prompt: `Ist ${M(`x = ${test}`)} eine Lösung von ${M(`${a}x + ${b} = ${c}`)}?`, ok: test === x, hint: "Setze ein – negative Zahlen in Klammern!", steps: [`Probe: ${M(`${a}*${pn(test)} + ${b} = ${a * test + b}`)}`, a * test + b === c ? "Stimmt ✓" : `${a * test + b} ≠ ${c} ✗`] }); },
      () => qMC({ prompt: "Welche Umformung ist <b>keine</b> Äquivalenzumformung (verändert die Lösung)?", correct: "Beide Seiten mit 0 multiplizieren", wrong: [["Auf beiden Seiten 5 addieren", "Das ist erlaubt."], ["Beide Seiten durch 3 dividieren", "Das ist erlaubt."], ["Auf beiden Seiten 2x subtrahieren", "Das ist erlaubt."]], hint: "Was passiert, wenn alles 0 wird?", steps: ["Mal 0 ergibt auf beiden Seiten 0 = 0 – dann stimmt die Gleichung für jede Zahl. Die Information ist weg. Deshalb: niemals mit 0 multiplizieren oder durch 0 teilen."] }),
      () => { const a = R.int(2, 8), b = R.int(2, 9), x = R.nz(-5, 9), c = a * x + b;
        return qInput({ mode: "num", prompt: `Wende die Umformung ${M(`| −${b}`)} an. Welche Zahl steht danach rechts?<div class="task-expr">${M(`${a}x + ${b} = ${c}`)} &nbsp; ${M(`| −${b}`)}<br>${M(`${a}x = `)} ?</div>`, answer: F(c - b), answerText: c - b, placeholder: "Zahl", steps: [`${M(`${c} - ${b} = ${c - b}`)}`], hint: `Rechne auf der rechten Seite ${c} − ${b}.` }); },
    ],
    3: [
      () => { const a = R.int(3, 7), c = R.int(1, a - 1), x = R.nz(-5, 8), b = R.nz(-9, 9), d = (a - c) * x + b;
        const s = solveLinear(L(a, b), L(c, d)).lines;
        if (s.length < 3) return S6[3][1]();
        const k = R.int(1, s.length - 1);
        const [ls, rs] = s[k].eq.split(" = ");
        const lw = fromPoly(P(ls)), rw = fromPoly(P(rs).add(Poly.c(R.pick([2, -2, 1, -1, 4]))));
        const rest = solveLinear(lw, rw).lines;
        const shown = s.slice(0, k).concat(rest);
        const opts = shown.map((_, i) => i).filter(i => i > 0 && i !== k);
        return qMC({ prompt: `In welcher Zeile steckt der erste Fehler?<table class="eqsteps">${shown.map((l, i) => { const [p, q] = l.eq.split(" = "); return `<tr><td class="ln">${i + 1}</td><td class="l">${M(p)}</td><td>=</td><td class="r">${M(q)}</td><td class="op">${l.op ? M(l.op) : ""}</td></tr>`; }).join("")}</table>`,
          correct: `Zeile ${k + 1}`, wrong: R.shuffle(opts).slice(0, 3).sort((p, q) => p - q).map(i => [`Zeile ${i + 1}`, null]),
          hint: "Prüfe jede Umformung einzeln: Wurde sie auf beiden Seiten richtig ausgeführt?", steps: ["So wäre es richtig:", linesHTML(s)] }); },
      () => { const a = R.int(2, 5), b = R.int(1, 6), v = R.pick([
          [`${a}x + ${b} = ${a}x + ${b + R.int(1, 4)}`, "keine Lösung", `Nach ${M(`| -${a}x`)} bleibt ${M(`${b} = ${b}`)}+… – eine falsche Aussage. ${M("L = { }")}`],
          [`${a}(x + ${b}) = ${a}x + ${a * b}`, "unendlich viele Lösungen", `Ausmultipliziert steht links und rechts dasselbe. Jede Zahl ist Lösung: ${M("L = Q")}`],
          [`${a}x + ${b} = x + ${b + (a - 1) * 2}`, "genau eine Lösung", "Die x heben sich nicht auf, also gibt es genau eine Lösung (x = 2)."]]);
        return qMC({ prompt: `Wie viele Lösungen hat die Gleichung ${M(v[0])}?`, correct: v[1], wrong: ["keine Lösung", "genau eine Lösung", "unendlich viele Lösungen"].filter(s => s !== v[1]).map(s => [s, null]), max: 3,
          hint: "Forme um. Was bleibt übrig, wenn die x verschwinden?", steps: [v[2]] }); },
      () => { const a = R.int(2, 5), b = R.int(1, 6), x = R.int(1, 7), c = a * (x + b);
        const lines = [`${a}(x + ${b}) = ${c}`, `${a}x + ${a * b} = ${c}`, `${a}x = ${c - a * b}`, `x = ${x}`];
        return qOrder({ prompt: "Bringe die Schritte in die richtige Reihenfolge. Tippe sie nacheinander an.", items: lines.map(l => M(l)), hint: "Zuerst die Klammer auflösen, dann die Zahl rüberbringen, dann teilen.", steps: [lines.map(l => M(l)).join("<br>")] }); },
      () => { const a = R.int(2, 9), v = R.pick([
          [`Die Gleichung ${M(`x^2 = ${a * a}`)} hat zwei Lösungen.`, true, `${M(`x = ${a}`)} und ${M(`x = -${a}`)}, denn ${M(`(-${a})^2 = ${a * a}`)}.`],
          [`Die Gleichung ${M(`x^2 = -${a * a}`)} hat eine Lösung.`, false, "Ein Quadrat ist nie negativ – keine Lösung."],
          [`Aus ${M(`${a}x = 0`)} folgt ${M(`x = 0`)}.`, true, `${M(`0 : ${a} = 0`)}.`],
          [`Aus ${M(`0*x = ${a}`)} folgt ${M(`x = 0`)}.`, false, `0 · x ist immer 0, nie ${a}. Es gibt keine Lösung.`]]);
        return qTF({ prompt: `Stimmt das? ${v[0]}`, ok: v[1], steps: [v[2]], hint: "Probiere Zahlen aus – auch negative!" }); },
    ],
  };
  // Waage-MC: Gleichung (nicht Term) als Antwort
  function fixWaageMC(a, b, c) {
    const eq = s => M(s);
    return qMC({ prompt: `Die Waage ist im Gleichgewicht. Jedes Paket wiegt ${M("x")} kg, jede Kugel 1 kg.${waageSVG(a, b, 0, c)}Welche Gleichung beschreibt die Waage?`,
      correct: eq(`${a}x + ${b} = ${c}`),
      wrong: [[eq(`${a} + x + ${b} = ${c}`), `Es liegen ${a} Pakete links. ${a} Pakete wiegen ${a} · x.`], [eq(`${a + b}x = ${c}`), "Kugeln und Pakete sind nicht dasselbe."], [eq(`${a}x = ${b + c}`), "Die Kugeln links musst du auf der linken Seite aufschreiben."]],
      hint: "Links: Pakete und Kugeln. Rechts: nur Kugeln.", steps: [`Links: ${a} Pakete (${M(`${a}x`)}) und ${b} Kugeln. Rechts: ${c} Kugeln.`, `${M(`${a}x + ${b} = ${c}`)}`, `Lösung: ${M(`x = ${(c - b) / a}`)}`] });
  }
  S6[1][2] = () => { const a = R.int(2, 3), b = R.int(1, 4), x = R.int(1, 4); return fixWaageMC(a, b, a * x + b); };

  // =====================================================================
  // STATION 7: Gleichungen lösen
  // =====================================================================
  const S7 = {
    1: [
      () => { const x = R.int(1, 20), a = R.int(2, 20); return eqQuestion({ lhs: `x + ${a}`, rhs: `${x + a}`, hint: `Rechne auf beiden Seiten −${a}.` }); },
      () => { const x = R.int(1, 12), a = R.int(2, 9); return eqQuestion({ lhs: `${a}x`, rhs: `${a * x}`, hint: `Teile beide Seiten durch ${a}.` }); },
      () => { const x = R.int(1, 10), a = R.int(2, 6), b = R.int(1, 15); return eqQuestion({ lhs: `${a}x + ${b}`, rhs: `${a * x + b}`, hint: `Erst −${b} auf beiden Seiten, dann durch ${a} teilen.` }); },
      () => { const x = R.int(1, 10), a = R.int(2, 6), b = R.int(1, 9); return eqQuestion({ lhs: `${a}x - ${b}`, rhs: `${a * x - b}`, hint: `Erst +${b} auf beiden Seiten, dann durch ${a} teilen.` }); },
    ],
    2: [
      () => { const c = R.int(1, 5), a = c + R.int(1, 5), x = R.nz(-9, 9), b = R.nz(-12, 12), d = (a - c) * x + b; return eqQuestion({ lhs: lin(a, b), rhs: lin(c, d) }); },
      () => { const bx = R.int(2, 6), x = R.nz(-8, 8), a = R.int(1, 20); return eqQuestion({ lhs: raw([[a, ""], [-bx, "x"]]), rhs: `${a - bx * x}`, hint: `Bring ${M(`-${bx}x`)} oder die ${a} auf die andere Seite. Achte auf das Minus!` }); },
      () => { const a = R.int(1, 4), c = a + R.int(1, 5), x = R.nz(-8, 8), b = R.nz(-12, 12), d = b - (c - a) * x; return eqQuestion({ lhs: lin(a, b), rhs: lin(c, d), hint: "Tipp: Bringe die x auf die Seite, wo mehr x stehen – dann wird es nicht negativ. Oder rechne mit Minus weiter." }); },
      () => { const a = R.int(2, 6), c = R.int(1, a - 1), x = R.int(1, 8), b = R.int(1, 9), d = (a - c) * x + b;
        const s = solveLinear(L(a, b), L(c, d)).lines.map(l => l.eq);
        return qOrder({ prompt: "Bringe die Lösungsschritte in die richtige Reihenfolge.", items: s.map(l => M(l)), hint: "Die Startgleichung steht ganz oben, die Lösung ganz unten.", steps: [s.map(l => M(l)).join("<br>")] }); },
    ],
    3: [
      () => { const a = R.int(2, 5), b = R.nz(-6, 6), c = R.int(2, 4), d = R.nz(-6, 6), x = R.nz(-8, 8);
        if (a === c) return S7[3][1]();
        const e = a * (x + b) - c * (x - d);
        return eqQuestion({ lhs: `${a}(${lin(1, b)})`, rhs: `${c}(${lin(1, -d)}) ${sgnOp(e)}`.replace(/ \+ 0$/, ""), hint: "Erst Klammern ausmultiplizieren, dann wie gewohnt lösen." }); },
      () => { const a = R.pick([2, 3, 4, 5]), b = R.int(1, 9), x = a * R.nz(-6, 8); const c = x / a + b; return eqQuestion({ lhs: `x/${a} + ${b}`, rhs: `${c}`, hint: `Erst −${b}, dann mit ${a} multiplizieren.`,
        steps: [linesHTML([{ eq: `x/${a} + ${b} = ${c}`, op: `| −${b}` }, { eq: `x/${a} = ${c - b}`, op: `| ·${a}` }, { eq: `x = ${x}`, op: "" }]), `Lösung: ${M(`L = {${x}}`)}`] }); },
      () => { const a = R.pick([2, 3, 4, 5, 6]), b = R.nz(-9, 9); let n; do n = R.nz(-9, 9); while (n % a === 0); return eqQuestion({ lhs: lin(a, b), rhs: `${n + b}`, hint: "Die Lösung ist hier keine ganze Zahl. Gib sie als Bruch (z. B. 3/4) oder Dezimalzahl an." }); },
      () => { const a = R.int(1, 6), x = R.nz(-6, 6), bb = 2 * a * x + a * a; return eqQuestion({ lhs: `(x + ${a})^2`, rhs: `x^2 ${sgnOp(bb)}`, hint: "Wende die 1. binomische Formel an. Dann fällt x² auf beiden Seiten weg." }); },
      () => { const a = R.int(5, 15), b = R.int(1, 6), c = R.int(1, 4), x = R.nz(-6, 6), d = a + b - x - c * x; return eqQuestion({ lhs: `${a} - (x - ${b})`, rhs: lin(c, d), hint: "Minusklammer: Vorzeichen in der Klammer umdrehen." }); },
    ],
  };

  // =====================================================================
  // STATION 8: Textaufgaben
  // =====================================================================
  function wordEq(o) {
    // o: text, eq: [lhs, rhs], varText, answerText(x), unit
    const l = fromPoly(P(o.eq[0])), r = fromPoly(P(o.eq[1]));
    const s = solveLinear(l, r, P(o.eq[0]).toStr() !== o.eq[0] || P(o.eq[1]).toStr() !== o.eq[1] ? o.eq : null);
    return qInput({ mode: "num", prompt: o.text, answer: o.ans ? F(o.ans(s.sol)) : s.sol, answerText: `${o.ans ? F(o.ans(s.sol)) : s.sol}${o.unit ? " " + o.unit : ""}`, placeholder: o.unit ? `Zahl (in ${o.unit})` : "Zahl",
      hint: o.hint || `Lege fest: ${o.varText}. Stelle dann eine Gleichung auf.`,
      steps: [`Variable: ${o.varText}`, `Gleichung: ${M(`${o.eq[0]} = ${o.eq[1]}`)}`, linesHTML(s.lines), o.answer(s.sol)] });
  }
  const S8 = {
    1: [
      () => { const a = R.int(2, 6), b = R.int(1, 20), x = R.int(2, 15), c = a * x + b;
        return wordEq({ text: `Ich denke mir eine Zahl. Ich multipliziere sie mit ${a} und addiere ${b}. Ich erhalte ${c}. Welche Zahl habe ich mir gedacht?`, eq: [`${a}x + ${b}`, `${c}`], varText: "x = gedachte Zahl", answer: v => `Die gedachte Zahl ist <b>${v}</b>. Probe: ${a} · ${v} + ${b} = ${c} ✓` }); },
      () => { const a = R.int(2, 6), b = R.int(1, 20), x = R.int(2, 15), c = a * x + b;
        return qMC({ prompt: `„Ich denke mir eine Zahl. Ich multipliziere sie mit ${a} und addiere ${b}. Ich erhalte ${c}.“ Welche Gleichung passt?`, correct: M(`${a}x + ${b} = ${c}`),
          wrong: [[M(`${a}(x + ${b}) = ${c}`), "Erst wird multipliziert, dann addiert – keine Klammer."], [M(`${a} + x + ${b} = ${c}`), "„multiplizieren“ heißt mal."], [M(`${b}x + ${a} = ${c}`), "Die Zahlen sind vertauscht."]], hint: "Schreibe Satz für Satz mit: Zahl → x, mit … multiplizieren → …", steps: [`${M(`${a}x + ${b} = ${c}`)} → ${M(`x = ${x}`)}`] }); },
      () => { const n = R.int(3, 6), p = R.pick([0.5, 1, 1.5, 2, 2.5]), b = R.pick([2, 3, 4, 5]), c = n * p + b;
        return wordEq({ text: `Mia kauft ${n} Hefte und einen Block für ${b},00 €. Sie bezahlt insgesamt ${money(c)} €. Wie viel kostet ein Heft?`, eq: [`${n}x + ${b}`, money(c)], varText: "x = Preis eines Heftes in €", unit: "€", answer: v => `Ein Heft kostet <b>${money(v.valueOf())} €</b>.` }); },
      () => { const x = R.int(5, 14), a = R.int(2, 6), s = 2 * x + a;
        return wordEq({ text: `Lisa ist ${a} Jahre älter als ihr Bruder Ben. Zusammen sind sie ${s} Jahre alt. Wie alt ist Ben?`, eq: [`x + x + ${a}`, `${s}`], varText: `x = Bens Alter, Lisa: x + ${a}`, unit: "Jahre", answer: v => `Ben ist <b>${v}</b> Jahre alt, Lisa ${+v + a}.` }); },
    ],
    2: [
      () => { const x = R.int(8, 14), k = R.int(3, 4), s = x * (k + 1);
        return wordEq({ text: `Eine Mutter ist ${k}-mal so alt wie ihr Sohn Tom. Zusammen sind sie ${s} Jahre alt. Wie alt ist Tom?`, eq: [`x + ${k}x`, `${s}`], varText: `x = Toms Alter, Mutter: ${k}x`, unit: "Jahre", answer: v => `Tom ist <b>${v}</b> Jahre alt, die Mutter ${k * v}.` }); },
      () => { const x = R.int(3, 12), d = R.int(2, 8), u = 2 * x + 2 * (x + d);
        return wordEq({ text: `Ein Rechteck ist ${d} cm länger als breit. Sein Umfang beträgt ${u} cm. Wie breit ist das Rechteck?`, eq: [`2x + 2(x + ${d})`, `${u}`], varText: `x = Breite in cm, Länge: x + ${d}`, unit: "cm", answer: v => `Breite <b>${v} cm</b>, Länge ${+v + d} cm.` }); },
      () => { const x = R.int(10, 40), s = 3 * x + 3;
        return wordEq({ text: `Die Summe von drei aufeinanderfolgenden natürlichen Zahlen ist ${s}. Wie heißt die <b>kleinste</b> der drei Zahlen?`, eq: [`x + (x + 1) + (x + 2)`, `${s}`], varText: "x = kleinste Zahl, dann x + 1 und x + 2", answer: v => `Die Zahlen sind <b>${v}</b>, ${+v + 1} und ${+v + 2}.` }); },
      () => { const g = R.pick([5, 8, 10]), p = R.pick(["0,5", "0,25"]), q = p === "0,5" ? "1" : "0,5", x = g / (F(q).sub(F(p)).valueOf());
        return wordEq({ text: `Fahrradverleih A verlangt ${g} € Grundgebühr und ${p} € pro Stunde. Verleih B verlangt keine Grundgebühr, aber ${q} € pro Stunde. Nach wie vielen Stunden kosten beide gleich viel?`, eq: [`${g} + ${p}x`, q === "1" ? "x" : `${q}x`], varText: "x = Anzahl der Stunden", unit: "Stunden", answer: v => `Nach <b>${v} Stunden</b> kosten beide gleich viel.` }); },
      () => { const x = R.int(3, 12), d = R.int(2, 8), u = 4 * x + 2 * d;
        return qMC({ prompt: `Ein Rechteck ist ${d} cm länger als breit. Sein Umfang beträgt ${u} cm. Welche Gleichung passt? (x = Breite)`, correct: M(`2x + 2(x + ${d}) = ${u}`),
          wrong: [[M(`x + (x + ${d}) = ${u}`), "Der Umfang besteht aus 4 Seiten: zweimal Länge und zweimal Breite."], [M(`x(x + ${d}) = ${u}`), "Länge mal Breite ist der Flächeninhalt, nicht der Umfang."], [M(`2x + ${d} = ${u}`), "Es fehlen zwei Seiten."]], hint: "Umfang Rechteck: u = 2 · Länge + 2 · Breite", steps: [`${M(`2x + 2(x + ${d}) = ${u}`)} → ${M(`x = ${x}`)}`] }); },
    ],
    3: [
      () => { const rest = R.pick([8, 12, 16, 20, 24, 28, 32, 40]);
        return wordEq({ text: `In einem Dreieck ist der Winkel β doppelt so groß wie α. Der Winkel γ ist ${rest}° größer als α. Wie groß ist α?`, eq: [`x + 2x + (x + ${rest})`, "180"], varText: `x = α in Grad, β = 2x, γ = x + ${rest}`, unit: "Grad", hint: "Die Winkelsumme im Dreieck beträgt 180°.", answer: v => `α = <b>${v}°</b>, β = ${2 * v}°, γ = ${+v + rest}°. Probe: ${v} + ${2 * v} + ${+v + rest} = 180 ✓` }); },
      () => { const x = R.int(8, 30), a = R.int(2, 6), b = R.int(2, 6); if (a === 2 && b === 2) return S8[3][1]();
        const s = x + 2 * x + 2 * x + a * 5;
        return wordEq({ text: `Drei Geschwister teilen sich ${s} €. Jana bekommt doppelt so viel wie Ole. Paul bekommt ${a * 5} € mehr als Jana. Wie viel bekommt Ole?`, eq: [`x + 2x + (2x + ${a * 5})`, `${s}`], varText: `x = Oles Anteil, Jana: 2x, Paul: 2x + ${a * 5}`, unit: "€", answer: v => `Ole bekommt <b>${v} €</b>, Jana ${2 * v} €, Paul ${2 * v + a * 5} €.` }); },
      () => { const a = R.int(3, 5), m = R.int(2, 6), b = a - 1, n = R.int(2, 8), x = (a * m + b * n) / (a - b);
        return wordEq({ text: `Das ${KW[a]} einer um ${m} verminderten Zahl ist genauso groß wie das ${KW[b] || b + "-Fache"} der um ${n} vermehrten Zahl. Wie heißt die Zahl?`, eq: [`${a}(x - ${m})`, `${b}(x + ${n})`], varText: "x = gesuchte Zahl", hint: "„Das Dreifache einer um 4 verminderten Zahl“ = 3(x − 4).", answer: v => `Die Zahl ist <b>${v}</b>.` }); },
      () => { const x = R.int(10, 40) * 2, s = 3 * x + 6;
        return wordEq({ text: `Die Summe von drei aufeinanderfolgenden <b>geraden</b> Zahlen ist ${s}. Wie heißt die größte der drei Zahlen?`, eq: [`x + (x + 2) + (x + 4)`, `${s}`], ans: v => F(v).add(4), varText: "x = kleinste gerade Zahl, dann x + 2 und x + 4", hint: "Aufeinanderfolgende gerade Zahlen unterscheiden sich um 2.", answer: v => `Die Zahlen sind ${v}, ${+v + 2} und <b>${+v + 4}</b>.` }); },
      () => { const v1 = R.pick([40, 50, 60]), v2 = v1 + R.pick([10, 20, 30]), t = R.pick([1, 2]), x = v1 * t / (v2 - v1);
        if (!Number.isInteger(x * 60) || x <= 0) return S8[3][2]();
        return wordEq({ text: `Ein Bus fährt mit ${v1} km/h los. ${t} Stunde${t > 1 ? "n" : ""} später fährt ein Auto auf derselben Strecke mit ${v2} km/h hinterher. Nach wie vielen Stunden Fahrzeit holt das Auto den Bus ein?`, eq: [`${v2}x`, `${v1}(x + ${t})`], varText: `x = Fahrzeit des Autos in Stunden, Bus: x + ${t}`, unit: "Stunden", hint: "Beim Einholen haben beide denselben Weg zurückgelegt. Weg = Geschwindigkeit · Zeit.", answer: v => `Nach <b>${v} Stunden</b> (Weg: ${F(v).mul(v2)} km).` }); },
    ],
  };

  // ---------- Stationen-Register ----------
  const GEN = { terme: S1, einsetzen: S2, zusammenfassen: S3, klammern: S4, ausklammern: S5, gleichungen: S6, loesen: S7, sachaufgaben: S8 };

  // Stapel ohne direkte Wiederholung desselben Aufgabentyps
  function makeDeck(station, level) {
    let bag = [];
    return () => {
      if (!bag.length) bag = R.shuffle(GEN[station][level].map((f, i) => i));
      const i = bag.pop();
      for (let t = 0; t < 8; t++) {
        try { const q = GEN[station][level][i](); q.station = station; q.level = level; q.tpl = i; return q; }
        catch (e) { if (!(e instanceof MathError) && t === 7) throw e; }
      }
      return GEN[station][level][0]();
    };
  }
  function similar(q) { // neue Aufgabe vom gleichen Typ
    for (let t = 0; t < 8; t++) { try { const n = GEN[q.station][q.level][q.tpl](); Object.assign(n, { station: q.station, level: q.level, tpl: q.tpl }); return n; } catch (e) { /* nochmal */ } }
    return null;
  }

  // ---------- Antwort prüfen ----------
  function check(q, input) {
    const { readNumber, readTerm, isExpandedForm, isFactoredForm } = G.XQ;
    try {
      if (q.mode === "num") {
        const v = readNumber(stripUnits(input));
        return v.eq(q.answer) ? { status: "ok" } : { status: "wrong" };
      }
      const { ast, poly } = readTerm(input);
      const bad = [...poly.vars()].filter(v => !q.vars.includes(v));
      if (bad.length) return { status: "invalid", msg: `Verwende nur ${q.vars.length > 1 ? "die Variablen" : "die Variable"} ${q.vars.map(v => M(v)).join(", ")}.` };
      if (!poly.eq(q.answer)) return { status: "wrong" };
      if (q.mode === "expand") { const r = isExpandedForm(ast, poly); if (!r.ok) return { status: "almost", msg: r.why }; }
      if (q.mode === "factor") { const r = isFactoredForm(ast); if (!r.ok) return { status: "almost", msg: r.why }; }
      return { status: "ok" };
    } catch (e) {
      if (e instanceof MathError) return { status: "invalid", msg: e.message };
      return { status: "invalid", msg: "Das kann ich nicht lesen. Prüfe Klammern und Rechenzeichen." };
    }
  }
  function stripUnits(s) {
    return String(s).replace(/€|°/g, "").replace(/\s*(euro|cent|ct|cm|km|min|minuten|stunden|std|jahre|jahr|grad|stück|h|m)\.?\s*$/i, "").trim();
  }

  // ---------- Blitzrunde: schnelle 3er-Auswahl ----------
  function blitz() {
    for (let g = 0; g < 20; g++) { const b = blitz1(); if (new Set(b.opts.map(String)).size === 3) return b; }
    return blitz1();
  }
  function blitz1() {
    const t = R.int(1, 5);
    if (t === 1) { const a = R.int(2, 9), b = R.int(1, 9), x = R.int(1, 9); const v = a * x + b; return { q: `${M(`${a}x + ${b}`)} für ${M(`x = ${x}`)}`, opts: [v, a + x + b, a * (x + b)], ok: 0 }; }
    if (t === 2) { const a = R.int(2, 9), b = R.int(2, 9); return { q: `${M(`${a}x + ${b}x`)} =`, opts: [`${a + b}x`, `${a * b}x`, `${a + b}x^2`].map(s => s), ok: 0, m: true }; }
    if (t === 3) { const x = R.int(1, 15), a = R.int(2, 15); return { q: `${M(`x + ${a} = ${x + a}`)} → x =`, opts: [x, x + 2 * a, x + 1], ok: 0 }; }
    if (t === 4) { const a = R.int(2, 9), x = R.int(2, 9); return { q: `${M(`${a}x = ${a * x}`)} → x =`, opts: [x, a * x - a, x + 1], ok: 0 }; }
    const a = R.int(2, 9), b = R.int(1, 9); return { q: `${M(`${a}(x + ${b})`)} =`, opts: [`${a}x + ${a * b}`, `${a}x + ${b}`, `x + ${a * b}`], ok: 0, m: true };
  }

  // ---------- Term-Memory: Paare gleichwertiger Terme ----------
  function memoryPairs(level, n = 6) {
    const makers = {
      1: [() => { const a = R.int(2, 9), b = R.int(1, 9); return [`${a}(x + ${b})`, `${a}x + ${a * b}`]; }, () => { const a = R.int(2, 6), b = R.int(2, 6); return [`${a}x + ${b}x`, `${a + b}x`]; }, () => [`x + x + x`, `3x`], () => [`x * x`, `x^2`], () => { const a = R.int(2, 5), b = R.int(2, 5); return [`${a} * ${b}x`, `${a * b}x`]; }],
      2: [() => { const a = R.int(2, 9), b = R.int(1, 9); return [`-${a}(x - ${b})`, P(`-${a}(x - ${b})`).toStr()]; }, () => { const a = R.int(2, 6), b = R.int(1, 6); return [`${a}x - (x - ${b})`, P(`${a}x - (x - ${b})`).toStr()]; }, () => { const b = R.int(2, 9); return [`x(x + ${b})`, `x^2 + ${b}x`]; }, () => { const g = R.int(2, 6), p = R.int(1, 5); return [`${g}(x - ${p})`, `${g}x - ${g * p}`]; }],
      3: [() => { const a = R.int(1, 7); return [`(x + ${a})^2`, P(`(x + ${a})^2`).toStr()]; }, () => { const a = R.int(1, 7); return [`(x - ${a})^2`, P(`(x - ${a})^2`).toStr()]; }, () => { const a = R.int(2, 9); return [`(x + ${a})(x - ${a})`, `x^2 - ${a * a}`]; }, () => { const a = R.nz(-5, 5), b = R.nz(-5, 5); return [`(${lin(1, a)})(${lin(1, b)})`, P(`(${lin(1, a)})(${lin(1, b)})`).toStr()]; }],
    };
    const pool = level === 1 ? makers[1] : level === 2 ? makers[1].concat(makers[2], makers[2]) : makers[2].concat(makers[3], makers[3]);
    const pairs = [], polys = [];
    let guard = 0;
    while (pairs.length < n && guard++ < 200) {
      const p = R.pick(pool)(); const poly = P(p[0]);
      if (polys.some(q => q.eq(poly)) || p[0] === p[1]) continue;
      polys.push(poly); pairs.push(p);
    }
    return pairs;
  }

  // ---------- Waage-Trainer: Startgleichung ----------
  function trainerEq(level) {
    if (level === 1) {
      const t = R.int(1, 3), x = R.int(1, 8);
      if (t === 1) { const b = R.int(1, 9); return { l: L(1, b), r: L(0, x + b) }; }
      if (t === 2) { const a = R.int(2, 5); return { l: L(a, 0), r: L(0, a * x) }; }
      const a = R.int(2, 4), b = R.int(1, 8); return { l: L(a, b), r: L(0, a * x + b) };
    }
    if (level === 2) {
      const c = R.int(1, 4), a = c + R.int(1, 4), x = R.nz(-6, 8), b = R.nz(-10, 10), d = (a - c) * x + b;
      return R.chance(.5) ? { l: L(a, b), r: L(c, d) } : { l: L(c, d), r: L(a, b) };
    }
    const t = R.int(1, 3);
    if (t === 1) { const a = R.int(2, 4), b = R.nz(-5, 5), c = R.int(1, 3), x = R.nz(-6, 6); if (a === c) return trainerEq(3); const d = a * (x + b) - c * x; return { l: L(a, a * b), r: L(c, d), show: [`${a}(${lin(1, b)})`, lin(c, d)] }; }
    if (t === 2) { const a = R.pick([2, 3, 4]), b = R.int(1, 9), x = a * R.nz(-5, 6); return { l: L(new Frac(1, a), b), r: L(0, x / a + b), show: [`x/${a} ${sgnOp(b)}`, `${x / a + b}`] }; }
    const a = R.int(2, 6), b = R.nz(-9, 9); let n; do n = R.nz(-9, 9); while (n % a === 0); return { l: L(a, b), r: L(0, n + b) };
  }

  G.XQT = { GEN, makeDeck, similar, check, blitz, memoryPairs, trainerEq, solveLinear, linesHTML, linS, L, waageSVG, fromPoly, opStr, M, P };
})(window);
