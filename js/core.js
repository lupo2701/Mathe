/* x-Quest · Mathe-Kern: Brüche, Term-Parser, Polynome, Zufall, Formatierung */
(function (G) {
  "use strict";

  // ---------- Brüche ----------
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

  class Frac {
    constructor(n, d = 1) {
      if (d === 0) throw new MathError("Division durch 0 ist nicht erlaubt.");
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d);
      this.n = n / g; this.d = d / g;
      if (Object.is(this.n, -0)) this.n = 0;
    }
    static of(x) {
      if (x instanceof Frac) return x;
      if (Number.isInteger(x)) return new Frac(x, 1);
      return Frac.parseDec(String(x));
    }
    static parseDec(s) {
      s = String(s).trim().replace(",", ".");
      if (s.startsWith("-")) return Frac.parseDec(s.slice(1)).neg();
      if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) throw new MathError("Zahl nicht lesbar");
      const [i, f = ""] = s.split(".");
      return new Frac(parseInt((i || "0") + f, 10), 10 ** f.length);
    }
    add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { return this.add(Frac.of(o).neg()); }
    mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
    div(o) { o = Frac.of(o); if (o.n === 0) throw new MathError("Division durch 0 ist nicht erlaubt."); return new Frac(this.n * o.d, this.d * o.n); }
    neg() { return new Frac(-this.n, this.d); }
    abs() { return new Frac(Math.abs(this.n), this.d); }
    pow(k) { let r = new Frac(1); for (let i = 0; i < k; i++) r = r.mul(this); return r; }
    isZero() { return this.n === 0; }
    isInt() { return this.d === 1; }
    isOne() { return this.n === 1 && this.d === 1; }
    sign() { return Math.sign(this.n); }
    eq(o) { o = Frac.of(o); return this.n === o.n && this.d === o.d; }
    valueOf() { return this.n / this.d; }
    // Schreibweise für Schüler: ganze Zahl, Dezimalzahl (wenn kurz) oder Bruch
    toString() {
      if (this.d === 1) return String(this.n);
      let d = this.d, k = 0;
      while (d % 2 === 0) { d /= 2; k++; }
      while (d % 5 === 0) { d /= 5; k++; }
      if (d === 1 && k <= 2) return (this.n / this.d).toFixed(Math.max(1, decPlaces(this))).replace(".", ",");
      return `${this.n}/${this.d}`;
    }
    toFracString() { return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`; }
  }
  function decPlaces(f) { for (let k = 0; k < 6; k++) if ((f.n * 10 ** k) % f.d === 0) return k; return 6; }

  class MathError extends Error {}

  // ---------- Tokenizer ----------
  function normalize(s) {
    return String(s)
      .replace(/[−–—]/g, "-").replace(/[·×∙•*]/g, "*").replace(/:/g, "/")
      .replace(/²/g, "^2").replace(/³/g, "^3")
      .replace(/\s+/g, "").replace(/[A-Z]/g, c => c.toLowerCase())
      .replace(/\[/g, "(").replace(/\]/g, ")");
  }
  function tokenize(src) {
    const s = normalize(src), out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9.,]/.test(c)) {
        let j = i; while (j < s.length && /[0-9.,]/.test(s[j])) j++;
        const raw = s.slice(i, j);
        if ((raw.match(/[.,]/g) || []).length > 1) throw new MathError("Komma an falscher Stelle");
        out.push({ t: "num", v: Frac.parseDec(raw) }); i = j; continue;
      }
      if (/[a-z]/.test(c)) { out.push({ t: "var", v: c }); i++; continue; }
      if ("+-*/^".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
      if (c === "(") { out.push({ t: "lp" }); i++; continue; }
      if (c === ")") { out.push({ t: "rp" }); i++; continue; }
      throw new MathError(`Das Zeichen „${c}“ kenne ich nicht.`);
    }
    // implizites Malzeichen: 3x, 2(x+1), x(x+1), (a+b)(a-b), xy
    const res = [];
    out.forEach((tk, k) => {
      const p = out[k - 1];
      if (p && ((["num", "var", "rp"].includes(p.t) && ["var", "lp"].includes(tk.t)) || (["var", "rp"].includes(p.t) && tk.t === "num")))
        res.push({ t: "op", v: "*", implicit: true });
      res.push(tk);
    });
    return res;
  }

  // ---------- Parser -> Syntaxbaum ----------
  function parse(src) {
    const tk = tokenize(src);
    if (!tk.length) throw new MathError("Leere Eingabe");
    let i = 0;
    const peek = () => tk[i], next = () => tk[i++];
    const isOp = (v) => peek() && peek().t === "op" && peek().v === v;

    function expr() {
      const parts = [];
      let neg = false;
      if (isOp("+") || isOp("-")) { neg = next().v === "-"; }
      parts.push({ neg, node: term() });
      while (isOp("+") || isOp("-")) { const n = next().v === "-"; parts.push({ neg: n, node: term() }); }
      return parts.length === 1 && !parts[0].neg ? parts[0].node : { t: "add", parts };
    }
    function term() {
      const parts = [{ div: false, node: unary() }];
      while (isOp("*") || isOp("/")) { const d = next().v === "/"; parts.push({ div: d, node: unary() }); }
      return parts.length === 1 ? parts[0].node : { t: "mul", parts };
    }
    function unary() {
      if (isOp("-")) { next(); return { t: "neg", a: unary() }; }
      if (isOp("+")) { next(); return unary(); }
      return power();
    }
    function power() {
      const base = atom();
      if (isOp("^")) {
        next();
        const e = unary();
        const ep = toPoly(e);
        if (!ep.isConst() || !ep.constVal().isInt() || ep.constVal().n < 0 || ep.constVal().n > 12) throw new MathError("Als Hochzahl sind nur natürliche Zahlen erlaubt.");
        return { t: "pow", a: base, e: ep.constVal().n };
      }
      return base;
    }
    function atom() {
      const t = next();
      if (!t) throw new MathError("Da fehlt noch etwas am Ende.");
      if (t.t === "num") return { t: "num", v: t.v };
      if (t.t === "var") return { t: "var", v: t.v };
      if (t.t === "lp") {
        const e = expr();
        if (!peek() || peek().t !== "rp") throw new MathError("Eine Klammer wird nicht geschlossen.");
        next();
        return { t: "paren", a: e };
      }
      if (t.t === "rp") throw new MathError("Klammer zu ohne Klammer auf.");
      throw new MathError(`Rechenzeichen „${t.v}“ an falscher Stelle.`);
    }
    const ast = expr();
    if (i < tk.length) throw new MathError(tk[i].t === "rp" ? "Klammer zu ohne Klammer auf." : "Da passt etwas nicht zusammen.");
    return ast;
  }

  // ---------- Polynome ----------
  // Monom-Schlüssel: "x^2*y" ; "" = Konstante
  const keyOf = (m) => Object.keys(m).filter(v => m[v]).sort().map(v => m[v] === 1 ? v : `${v}^${m[v]}`).join("*");
  const monoOf = (key) => { const m = {}; if (key) key.split("*").forEach(p => { const [v, e] = p.split("^"); m[v] = e ? +e : 1; }); return m; };

  class Poly {
    constructor(map) { this.m = new Map(); if (map) for (const [k, c] of map) if (!c.isZero()) this.m.set(k, c); }
    static c(x) { return new Poly([["", Frac.of(x)]]); }
    static v(name) { return new Poly([[name, new Frac(1)]]); }
    add(o) { const r = new Map(this.m); for (const [k, c] of o.m) r.set(k, (r.get(k) || new Frac(0)).add(c)); return new Poly(r); }
    neg() { return new Poly([...this.m].map(([k, c]) => [k, c.neg()])); }
    sub(o) { return this.add(o.neg()); }
    mul(o) {
      let r = new Map();
      for (const [k1, c1] of this.m) for (const [k2, c2] of o.m) {
        const a = monoOf(k1), b = monoOf(k2);
        for (const v in b) a[v] = (a[v] || 0) + b[v];
        const k = keyOf(a);
        r.set(k, (r.get(k) || new Frac(0)).add(c1.mul(c2)));
      }
      return new Poly(r);
    }
    pow(e) { let r = Poly.c(1); for (let i = 0; i < e; i++) r = r.mul(this); return r; }
    scale(f) { return new Poly([...this.m].map(([k, c]) => [k, c.mul(f)])); }
    isConst() { return [...this.m.keys()].every(k => k === ""); }
    constVal() { return this.m.get("") || new Frac(0); }
    coef(k = "") { return this.m.get(k) || new Frac(0); }
    eq(o) { const d = this.sub(o); return d.m.size === 0; }
    size() { return this.m.size; }
    vars() { const s = new Set(); for (const k of this.m.keys()) Object.keys(monoOf(k)).forEach(v => s.add(v)); return s; }
    degree(v) { let d = 0; for (const k of this.m.keys()) { const m = monoOf(k); d = Math.max(d, v ? (m[v] || 0) : Object.values(m).reduce((a, b) => a + b, 0)); } return d; }
    sortedKeys() {
      const deg = k => Object.values(monoOf(k)).reduce((a, b) => a + b, 0);
      return [...this.m.keys()].sort((a, b) => deg(b) - deg(a) || (a < b ? -1 : a > b ? 1 : 0));
    }
    eval(env) { let s = 0; for (const [k, c] of this.m) { let t = c.valueOf(); const m = monoOf(k); for (const v in m) t *= env[v] ** m[v]; s += t; } return s; }
    evalFrac(env) { let s = new Frac(0); for (const [k, c] of this.m) { let t = c; const m = monoOf(k); for (const v in m) t = t.mul(Frac.of(env[v]).pow(m[v])); s = s.add(t); } return s; }
    // "3x^2 - 2xy + 5"
    toStr() {
      if (!this.m.size) return "0";
      return this.sortedKeys().map((k, i) => {
        const c = this.m.get(k), neg = c.sign() < 0, a = c.abs();
        let body = k === "" ? a.toString() : (a.isOne() ? "" : a.toString()) + k.split("*").join("");
        return i === 0 ? (neg ? "-" : "") + body : (neg ? " - " : " + ") + body;
      }).join("");
    }
  }

  function toPoly(n) {
    switch (n.t) {
      case "num": return Poly.c(n.v);
      case "var": return Poly.v(n.v);
      case "paren": return toPoly(n.a);
      case "neg": return toPoly(n.a).neg();
      case "pow": return toPoly(n.a).pow(n.e);
      case "add": return n.parts.reduce((acc, p) => { const q = toPoly(p.node); return acc.add(p.neg ? q.neg() : q); }, new Poly());
      case "mul": return n.parts.reduce((acc, p, i) => {
        const q = toPoly(p.node);
        if (!p.div) return i === 0 ? q : acc.mul(q);
        if (!q.isConst()) throw new MathError("Teilen durch Variablen kann ich hier nicht prüfen.");
        return acc.scale(new Frac(1).div(q.constVal()));
      }, Poly.c(1));
    }
    throw new MathError("Unbekannter Ausdruck");
  }

  // ---------- Form-Prüfungen ----------
  const unwrapParen = n => { while (n.t === "paren") n = n.a; return n; };
  const hasParen = n => {
    if (!n || typeof n !== "object") return false;
    if (n.t === "paren") return true;
    if (n.a && hasParen(n.a)) return true;
    if (n.parts) return n.parts.some(p => hasParen(p.node));
    return false;
  };
  // ist n ein "einfaches" Monom? höchstens eine Zahl, jede Variable nur einmal
  function isSimpleMonomial(n) {
    if (n.t === "neg") return isSimpleMonomial(n.a);
    const factors = n.t === "mul" ? n.parts : [{ div: false, node: n }];
    let nums = 0; const seen = new Set();
    for (const f of factors) {
      const x = f.node;
      if (f.div) { if (x.t !== "num") return false; nums++; continue; }
      if (x.t === "num") nums++;
      else if (x.t === "var") { if (seen.has(x.v)) return false; seen.add(x.v); }
      else if (x.t === "pow" && x.a.t === "var") { if (seen.has(x.a.v)) return false; seen.add(x.a.v); }
      else if (x.t === "neg") { if (!isSimpleMonomial(x)) return false; }
      else return false;
    }
    return nums <= 1 || (nums === 2 && factors.some(f => f.div));
  }
  function summands(ast) {
    ast = unwrapParen(ast);
    if (ast.t === "add") return ast.parts.map(p => p.node);
    return [ast];
  }
  // vollständig ausmultipliziert und zusammengefasst?
  function isExpandedForm(ast, poly) {
    if (hasParen(ast)) return { ok: false, why: "Es stehen noch Klammern im Ergebnis." };
    const s = summands(ast);
    if (!s.every(isSimpleMonomial)) return { ok: false, why: "Einzelne Produkte kannst du noch ausrechnen (z. B. 3·4x = 12x oder x·x = x²)." };
    const need = Math.max(1, poly.size());
    if (s.length > need) return { ok: false, why: "Du kannst noch gleichartige Glieder zusammenfassen." };
    return { ok: true };
  }
  // als Produkt geschrieben, Summen-Faktoren nicht weiter ausklammerbar?
  function isFactoredForm(ast) {
    let n = unwrapParen(ast);
    if (n.t === "add" && n.parts.length === 1) n = unwrapParen(n.parts[0].node);
    if (n.t === "neg") n = unwrapParen(n.a);
    let factors;
    if (n.t === "mul") factors = n.parts.map(p => p.node);
    else if (n.t === "pow") factors = [n];
    else return { ok: false, why: "Beim Ausklammern entsteht ein Produkt: Faktor · (Klammer)." };
    const sums = [];
    factors.forEach(f => { if (f.t === "pow") f = f.a; f = unwrapParen(f); if (f.t === "add") sums.push(toPoly(f)); });
    if (!sums.length) return { ok: false, why: "Beim Ausklammern entsteht eine Klammer mit einer Summe darin." };
    for (const p of sums) {
      const cs = [...p.m.values()];
      if (cs.every(c => c.isInt()) && cs.reduce((g, c) => gcd(g, c.n), 0) > 1) return { ok: false, why: "In der Klammer steckt noch ein gemeinsamer Zahlenfaktor." };
      const keys = [...p.m.keys()].map(monoOf);
      const common = Object.keys(keys[0]).filter(v => keys.every(m => m[v]));
      if (common.length) return { ok: false, why: `In der Klammer kannst du noch ${common[0]} ausklammern.` };
    }
    return { ok: true };
  }

  // ---------- Antworten prüfen ----------
  // Zahl-Antwort, erlaubt "x = 5", "L = {5}", "3/4", "-0,5"
  function readNumber(input) {
    let s = normalize(input).replace(/^l=/, "").replace(/[{}]/g, "");
    if (s.includes("=")) s = s.split("=").pop();
    if (/[a-z]/.test(s)) throw new MathError("Gib nur die Zahl ein.");
    const p = toPoly(parse(s));
    return p.constVal();
  }
  function readTerm(input) {
    if (/=/.test(input)) throw new MathError("Gib nur den Term ein, ohne Gleichheitszeichen.");
    const ast = parse(input);
    return { ast, poly: toPoly(ast) };
  }

  // ---------- Zufall (mit Startwert für Tages-Challenge) ----------
  const R = {
    _r: Math.random,
    seed(s) { if (s == null) { this._r = Math.random; return; } let a = s >>> 0; this._r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; },
    rand() { return this._r(); },
    int(a, b) { return a + Math.floor(this._r() * (b - a + 1)); },
    nz(a, b) { let x; do x = this.int(a, b); while (x === 0); return x; },
    pick(arr) { return arr[Math.floor(this._r() * arr.length)]; },
    chance(p) { return this._r() < p; },
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this._r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    sample(arr, k) { return this.shuffle(arr).slice(0, k); },
  };
  const hashStr = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---------- Formatierung für die Anzeige ----------
  const escHTML = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // M("3x^2 - 2(x+1)") -> schön gesetztes HTML
  function M(src) {
    let s = escHTML(String(src));
    s = s.replace(/([0-9a-z,]+)\/([0-9a-z,]+)/g, "\u0001$1\u0002$2\u0003");
    s = s.replace(/\^2/g, "²").replace(/\^3/g, "³").replace(/\^(\d+)/g, "\u0004$1\u0005");
    s = s.replace(/\*/g, "·").replace(/(^|[^&#\w;])-/g, "$1−").replace(/^-/, "−");
    s = s.replace(/\s*([=+·−])\s*/g, (m, op, off) => off === 0 && op === "−" ? "−" : ` ${op} `)
      .replace(/ {2,}/g, " ").replace(/([(\u0001{[]) ([−+]) /g, "$1$2").replace(/^ ([−+]) /, "$1").replace(/(=|·|\|) ([−+]) /g, "$1 $2");
    s = s.replace(/&[a-z]+;|&#\d+;|[a-z]/g, t => t.length > 1 ? t : `<i>${t}</i>`);
    s = s.replace(/\u0001/g, '<span class="fr"><span>').replace(/\u0002/g, "</span><span>").replace(/\u0003/g, "</span></span>")
      .replace(/\u0004/g, "<sup>").replace(/\u0005/g, "</sup>");
    return `<span class="m">${s.trim()}</span>`;
  }

  G.XQ = { Frac, MathError, Poly, parse, toPoly, normalize, isExpandedForm, isFactoredForm, readNumber, readTerm, R, hashStr, M, esc: escHTML, gcd };
})(window);
