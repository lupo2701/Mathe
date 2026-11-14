/* x-Quest · App: Navigation, Quiz-Engine, Spiele, Gamification (ohne Server, Fortschritt in localStorage) */
(() => {
  "use strict";
  const { M, R, esc, Frac, hashStr, normalize, parse, toPoly } = XQ;
  const T = XQT;
  const { STATIONS, LEVELS, AVATARS, BADGES, GLOSSARY, CHEAT } = XQC;

  // ---------- Speicher ----------
  const KEY = "xquest-mathe8-v1";
  const DEFAULT = {
    name: "", avatar: "🦊", xp: 0, stars: {}, read: {}, badges: {}, streak: { last: null, count: 0 },
    daily: {}, dailyCount: 0, blitzBest: 0, waageSolved: 0, memoryBest: {}, bossWins: 0, rounds: 0, answered: 0, correct: 0,
    settings: { sound: false, fx: true, easy: false }, lastStation: null, readLevel: 1,
  };
  let S = load();
  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY)) || {}; const s = Object.assign(structuredClone(DEFAULT), d); s.settings = Object.assign({}, DEFAULT.settings, d.settings); return s; }
    catch { return structuredClone(DEFAULT); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* privater Modus */ } }

  // ---------- Hilfen ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const app = $("#app");
  const today = () => new Date().toLocaleDateString("sv-SE");
  const station = id => STATIONS.find(s => s.id === id);
  const LV = {
    1: { key: 1, name: "Basis", icon: "🌱", cls: "basis", desc: "leicht – zum Reinkommen", xp: 10 },
    2: { key: 2, name: "Standard", icon: "🚀", cls: "standard", desc: "mittel – sicher werden", xp: 15 },
    3: { key: 3, name: "Profi", icon: "🏆", cls: "profi", desc: "schwer – zum Knobeln", xp: 20 },
  };
  const lvChip = l => `<span class="lvchip ${LV[l].cls}">${LV[l].icon} ${LV[l].name}</span>`;
  const starsOf = (id, l) => S.stars[`${id}:${l}`] || 0;
  const stationStars = id => [1, 2, 3].reduce((a, l) => a + starsOf(id, l), 0);
  const totalStars = () => STATIONS.reduce((a, s) => a + stationStars(s.id), 0);
  const starStr = (n, max = 3) => `<span class="stars">${"★".repeat(n)}<span class="off">${"★".repeat(max - n)}</span></span>`;
  let cleanup = null;

  function levelInfo(xp = S.xp) {
    let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
    const cur = LEVELS[i], next = LEVELS[i + 1];
    const pct = next ? Math.round((xp - cur.xp) / (next.xp - cur.xp) * 100) : 100;
    return { idx: i, n: i + 1, name: cur.name, next, pct };
  }
  function recLevel(id) { if (starsOf(id, 1) < 2) return 1; if (starsOf(id, 2) < 2) return 2; return 3; }
  function nextStation() {
    return STATIONS.find(s => starsOf(s.id, 1) < 2 && starsOf(s.id, 2) < 2) || STATIONS.find(s => stationStars(s.id) < 9) || STATIONS[0];
  }

  // ---------- Klang ----------
  let AC = null;
  function beep(notes, type = "sine", dur = .12, vol = .08) {
    if (!S.settings.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      notes.forEach((f, i) => {
        const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + i * dur;
        o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur * 1.6);
        o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur * 1.7);
      });
    } catch { /* kein Ton */ }
  }
  const sfx = {
    ok: () => beep([660, 880]), bad: () => beep([220, 180], "triangle", .14), level: () => beep([523, 659, 784, 1047], "sine", .13),
    star: () => beep([988], "sine", .1, .06), click: () => beep([440], "sine", .05, .04), hit: () => beep([150, 110], "sawtooth", .08, .05),
  };
  const buzz = ms => { try { if (S.settings.fx && navigator.vibrate) navigator.vibrate(ms); } catch { /* egal */ } };

  // ---------- Effekte ----------
  function toast(html, kind = "") {
    const el = document.createElement("div"); el.className = `toast ${kind}`; el.innerHTML = html;
    $("#toasts").appendChild(el);
    setTimeout(() => el.classList.add("out"), 2800); setTimeout(() => el.remove(), 3300);
  }
  function confetti(n = 140) {
    if (!S.settings.fx) return;
    const c = $("#confetti"), ctx = c.getContext("2d");
    c.width = innerWidth; c.height = innerHeight;
    const cols = ["#5b5bd6", "#ff7a59", "#2e9e6a", "#f5b700", "#8a4fd8", "#2f7bd8"];
    const P = Array.from({ length: n }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .4, vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4, r: 5 + Math.random() * 6, a: Math.random() * 6, col: cols[Math.floor(Math.random() * cols.length)], s: Math.random() < .3 }));
    let f = 0;
    (function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      P.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += .05; p.a += .1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.col;
        if (p.s) { ctx.font = `${p.r * 2}px serif`; ctx.fillText("x", 0, 0); } else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      });
      if (++f < 160) requestAnimationFrame(tick); else ctx.clearRect(0, 0, c.width, c.height);
    })();
  }
  function floatText(text, el, cls = "") {
    if (!S.settings.fx) return;
    const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    const f = document.createElement("div"); f.className = `floater ${cls}`; f.textContent = text;
    f.style.left = `${r.left + r.width / 2}px`; f.style.top = `${r.top + scrollY}px`;
    document.body.appendChild(f); setTimeout(() => f.remove(), 1200);
  }
  function shake(el) { if (!el || !S.settings.fx) return; el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  function overlay(html, onClose) {
    const o = document.createElement("div"); o.className = "overlay"; o.innerHTML = `<div class="ov-card">${html}<button class="btn primary ov-close">Weiter</button></div>`;
    document.body.appendChild(o);
    const close = () => { o.remove(); onClose && onClose(); };
    $(".ov-close", o).onclick = close; o.onclick = e => { if (e.target === o) close(); };
    $(".ov-close", o).focus();
  }

  // ---------- Belohnungen ----------
  function addXP(n, el) {
    n = Math.round(n); if (n <= 0) return;
    const before = levelInfo().idx;
    S.xp += n; touchStreak(); save();
    if (el) floatText(`+${n} XP`, el, "xp");
    const after = levelInfo();
    renderTop();
    if (after.idx > before) {
      sfx.level(); confetti(); buzz([40, 60, 40]);
      const newAv = AVATARS.filter(a => a.lv === after.n).map(a => a.a).join(" ");
      setTimeout(() => overlay(`<div class="ov-big">🎉</div><p class="muted">Level up!</p><h2>Level ${after.n}: ${esc(after.name)}</h2>${newAv ? `<p>Neuer Avatar freigeschaltet: <span class="ov-av">${newAv}</span></p>` : ""}`), 350);
    }
  }
  function touchStreak() {
    const t = today(); if (S.streak.last === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    S.streak.count = S.streak.last === y.toLocaleDateString("sv-SE") ? S.streak.count + 1 : 1;
    S.streak.last = t;
    if (S.streak.count >= 3) award("streak3");
    if (S.streak.count >= 7) award("streak7");
  }
  function award(id) {
    if (S.badges[id]) return false;
    const b = BADGES.find(x => x.id === id); if (!b) return false;
    S.badges[id] = today(); save();
    setTimeout(() => { toast(`<span class="t-icon">${b.icon}</span><span>Abzeichen: <b>${esc(b.name)}</b></span>`, "badge"); sfx.star(); }, 600);
    return true;
  }
  function checkStarBadges() {
    const t = totalStars();
    if (t >= 10) award("stars10"); if (t >= 30) award("stars30"); if (t >= 72) award("stars72");
    if (STATIONS.every(s => starsOf(s.id, 1) >= 1)) award("allbasis");
  }

  // ---------- Kopfzeile & Navigation ----------
  function renderTop() {
    const L = levelInfo();
    $("#hud").innerHTML = `
      <span class="pill" title="Lernserie (Tage in Folge)">🔥 ${S.streak.count || 0}</span>
      <button class="pill easy ${S.settings.easy ? "on" : ""}" id="easyBtn" title="Einfache Sprache an/aus" aria-pressed="${S.settings.easy}">🗣️ Einfach</button>
      <a class="pill lvl" href="#/ich" title="${esc(L.name)}"><span class="pav">${S.avatar}</span> Lv ${L.n}<span class="pbar"><span style="width:${L.pct}%"></span></span></a>`;
  }
  document.addEventListener("click", e => {
    if (!e.target.closest("#easyBtn")) return;
    S.settings.easy = !S.settings.easy; save(); sfx.click();
    toast(S.settings.easy ? "🗣️ Einfache Sprache ist <b>an</b>" : "Einfache Sprache ist aus");
    if (/^#\/(quiz|blitz|waage|memory|boss|challenge)\/./.test(location.hash) ) { renderTop(); const b = $("#easyHelpBtn"); if (b && S.settings.easy) b.click(); return; }
    route();
  });
  function setNav(name) {
    $$("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === name));
  }

  const routes = {
    "": viewHome, lernen: viewLearn, station: viewStation, spick: viewCheat, lexikon: viewGlossary,
    ueben: viewPractice, quiz: viewQuiz, blitz: viewBlitz, challenge: viewChallenge, waage: viewWaage, memory: viewMemory, boss: viewBoss,
    ich: viewMe, info: viewInfo,
  };
  const navOf = { "": "home", lernen: "lernen", station: "lernen", spick: "lernen", lexikon: "lernen", ueben: "ueben", quiz: "ueben", blitz: "ueben", challenge: "ueben", waage: "ueben", memory: "ueben", boss: "ueben", ich: "ich", info: "ich" };
  function route() {
    if (cleanup) { try { cleanup(); } catch { /* egal */ } cleanup = null; }
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const name = parts[0] || "";
    document.body.classList.remove("focus");
    if (!S.name && name !== "info") { viewWelcome(); setNav("home"); renderTop(); return; }
    (routes[name] || viewHome)(...parts.slice(1));
    setNav(navOf[name] || "home");
    renderTop();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  addEventListener("hashchange", route);

  // ---------- Willkommen ----------
  function viewWelcome() {
    let av = S.avatar;
    app.innerHTML = `
      <section class="card welcome">
        <div class="logo-big">x</div>
        <h1>Willkommen bei x-Quest!</h1>
        <p>Trainiere <b>Terme und Gleichungen</b> für Klasse 8. Sammle XP und Sterne, steige Level auf und besiege am Ende den Term-Drachen.</p>
        <p class="muted small">Jede Aufgabe gibt es in drei Niveaus: ${lvChip(1)} ${lvChip(2)} ${lvChip(3)} – du entscheidest selbst.</p>
        <h3>Wähle deinen Avatar</h3>
        <div class="avpick">${AVATARS.filter(a => a.lv === 1).map(a => `<button type="button" class="av ${a.a === av ? "sel" : ""}" data-av="${a.a}">${a.a}</button>`).join("")}</div>
        <label class="sw center-sw"><input type="checkbox" id="easyIn" ${S.settings.easy ? "checked" : ""}><span>🗣️ Einfache Sprache (kürzere Sätze, mehr Hilfen)</span></label>
        <form id="nameForm" class="row">
          <input id="nameIn" maxlength="20" placeholder="Dein Spitzname" autocomplete="off" required>
          <button class="btn primary">Los geht’s</button>
        </form>
        <p class="muted small">Spitzname und Fortschritt bleiben nur auf diesem Gerät. <a class="link" href="#/info">Datenschutz</a></p>
      </section>`;
    $$(".av", app).forEach(b => b.onclick = () => { av = b.dataset.av; $$(".av", app).forEach(x => x.classList.toggle("sel", x === b)); sfx.click(); });
    $("#nameForm").onsubmit = e => { e.preventDefault(); S.name = $("#nameIn").value.trim().slice(0, 20) || "Mathe-Fan"; S.avatar = av; S.settings.easy = $("#easyIn").checked; save(); location.hash = "#/"; route(); };
  }

  // ---------- Start ----------
  function viewHome() {
    const L = levelInfo(), ns = nextStation(), rl = recLevel(ns.id);
    const d = S.daily[today()] || {};
    app.innerHTML = `
      <section class="hero card">
        <div class="hero-av">${S.avatar}</div>
        <div class="hero-main">
          <p class="muted">Hallo ${esc(S.name)}!</p>
          <h1>${esc(L.name)} <span class="lv">Level ${L.n}</span></h1>
          <div class="xpbar"><div style="width:${L.pct}%"></div></div>
          <p class="muted small">${L.next ? `Noch ${L.next.xp - S.xp} XP bis Level ${L.n + 1}` : "Höchstes Level erreicht!"}</p>
        </div>
      </section>

      <a class="card continue big-go" href="#/station/${ns.id}" style="--c:${ns.color}">
        <div class="m-icon xl">${ns.icon}</div>
        <div class="grow"><p class="eyebrow">Hier weitermachen</p><h2>${esc(ns.title)}</h2><p class="muted small">Für dich: ${lvChip(rl)}</p></div>
        <span class="go">▶</span>
      </a>

      <div class="grid grid-2 two-only">
        <a class="card tile daily ${Object.keys(d).length ? "done" : ""}" href="#/challenge">
          <div class="t-big">📅</div><h3>Aufgabe des Tages</h3>
          <p class="muted small">${Object.keys(d).length ? "Heute geschafft ✓" : "5 Aufgaben · Bonus"}</p></a>
        <a class="card tile" href="#/ueben"><div class="t-big">🎮</div><h3>Spiele</h3><p class="muted small">Blitz, Waage, Memory, Drache</p></a>
      </div>
      ${S.settings.easy ? "" : `<p class="muted small center-text">Tipp: Oben bei <b>🗣️ Einfach</b> kannst du einfache Sprache einschalten.</p>`}`;
  }
  function pathHTML() {
    return `<div class="path">${STATIONS.map((s, i) => {
      const st = stationStars(s.id);
      return `${i === 0 || STATIONS[i - 1].part !== s.part ? `<div class="path-part">${s.part === "Terme" ? "Teil A · Terme" : "Teil B · Gleichungen"}</div>` : ""}
        <a class="path-node ${st ? "has" : ""}" href="#/station/${s.id}" style="--c:${s.color}">
          <span class="pn-dot">${s.icon}</span>
          <span class="pn-body"><b>${s.nr}. ${esc(s.title)}</b><span class="muted small">${esc(s.short)}</span></span>
          <span class="pn-stars">${[1, 2, 3].map(l => `<span class="mini ${LV[l].cls}" title="${LV[l].name}">${starsOf(s.id, l) ? "★".repeat(starsOf(s.id, l)) : "·"}</span>`).join("")}</span>
        </a>`;
    }).join("")}</div>`;
  }

  // ---------- Lernen ----------
  function viewLearn() {
    app.innerHTML = `
      <h1>📖 Lernen</h1>
      <p class="muted">Jede Station: <b>Lesen</b> → <b>Beispiele</b> → <b>Üben</b> in drei Niveaus.</p>
      ${pathHTML()}
      <h2 class="section">Nachschlagen</h2>
      <div class="grid grid-2">
        <a class="card tile" href="#/spick"><div class="t-big">📝</div><h3>Spickzettel</h3><p class="muted small">Alle Regeln auf einen Blick</p></a>
        <a class="card tile" href="#/lexikon"><div class="t-big">🔎</div><h3>Lexikon</h3><p class="muted small">${GLOSSARY.length} Fachbegriffe</p></a>
      </div>`;
  }
  function viewCheat() {
    app.innerHTML = `<a class="back" href="#/lernen">← Lernen</a><section class="card prose"><h1>📝 Spickzettel</h1>${CHEAT}</section>`;
  }
  function viewGlossary() {
    app.innerHTML = `<a class="back" href="#/lernen">← Lernen</a><h1>🔎 Lexikon</h1>
      <input id="gq" class="search" placeholder="Begriff suchen …" autocomplete="off">
      <div id="gl" class="glossary">${GLOSSARY.map(([t, d]) => `<div class="card gl"><h3>${esc(t)}</h3><p>${d}</p></div>`).join("")}</div>`;
    $("#gq").oninput = e => { const q = e.target.value.toLowerCase(); $$(".gl", app).forEach((c, i) => c.hidden = !GLOSSARY[i][0].toLowerCase().includes(q) && !GLOSSARY[i][1].toLowerCase().includes(q)); };
  }

  // ---------- Station ----------
  function viewStation(id, tab = "lesen") {
    const s = station(id); if (!s) return viewLearn();
    S.lastStation = id; save();
    const tabs = [["lesen", "📖 Lesen"], ["beispiele", "💡 Beispiele"], ["ueben", "🎯 Üben"]];
    app.innerHTML = `
      <a class="back" href="#/lernen">← Alle Stationen</a>
      <section class="card shead" style="--c:${s.color}">
        <div class="m-icon xl">${s.icon}</div>
        <div><p class="eyebrow">Station ${s.nr} · ${s.part}</p><h1>${esc(s.title)}</h1><p class="muted">${esc(s.short)}</p></div>
      </section>
      <nav class="tabs" role="tablist">${tabs.map(([k, l]) => `<a role="tab" href="#/station/${id}/${k}" class="${k === tab ? "active" : ""}">${l}</a>`).join("")}</nav>
      <div id="tabbody"></div>`;
    const body = $("#tabbody");
    if (tab === "lesen") stationRead(s, body);
    else if (tab === "beispiele") stationExamples(s, body);
    else stationPractice(s, body);
  }
  function easyBlock(s, withText = true) {
    const e = s.easy;
    return `${withText ? `<div class="easy-text">${e.text.map(t => `<p>${t}</p>`).join("")}</div>` : ""}
      <h3>👣 So gehst du vor</h3><ol class="easy-steps">${e.steps.map(t => `<li>${t}</li>`).join("")}</ol>
      <h3>💬 Wörter-Hilfe</h3><div class="words">${e.words.map(([w, x]) => `<div><b>${esc(w)}</b><span>→ ${x}</span></div>`).join("")}</div>`;
  }
  function stationRead(s, body) {
    let lvl = S.readLevel; if (lvl == null || ![0, 1, 3].includes(lvl)) lvl = 1;
    if (S.settings.easy && S._readSet !== s.id) lvl = 0;
    const doneBtn = S.read[s.id] ? `<a class="btn primary" href="#/station/${s.id}/beispiele">Weiter zu den Beispielen →</a>` : `<button class="btn primary" id="readDone">✓ Verstanden! (+10 XP)</button>`;
    body.innerHTML = `
      <div class="seg" role="group" aria-label="Wie soll der Text sein?">
        <button class="${lvl === 0 ? "active" : ""}" data-r="0">🗣️ Einfach</button>
        <button class="${lvl === 1 ? "active" : ""}" data-r="1">📖 Normal</button>
        <button class="${lvl === 3 ? "active" : ""}" data-r="3">🏆 Mehr wissen</button>
      </div>
      ${lvl === 0 ? `<section class="card prose easy">${easyBlock(s)}</section>` : `
      <section class="card goals"><h3>🎯 Das lernst du hier</h3><ul class="checks">${s.goals.filter(g => lvl === 3 || !/^Profi/.test(g)).map(g => `<li>${esc(g.replace(/^Profi: /, ""))}</li>`).join("")}</ul></section>
      <section class="card prose">${s.basis}${lvl === 3 ? `<div class="deep"><h3>🏆 Mehr wissen</h3>${s.profi}</div>` : ""}</section>
      <section class="card"><h3>⚠️ Typische Fehler</h3>
        <div class="errs">${s.errors.map(([f, r, w]) => `<div class="err"><div class="err-f">✗ ${esc(f)}</div><div class="err-r">✓ ${esc(r)}</div><p class="muted small">${esc(w)}</p></div>`).join("")}</div></section>`}
      <section class="card merke"><h3>📌 Merke</h3><p>${s.merke}</p></section>
      <div class="actions center">${doneBtn}</div>`;
    $$(".seg button", body).forEach(b => b.onclick = () => { S.readLevel = +b.dataset.r; S._readSet = s.id; save(); sfx.click(); stationRead(s, body); });
    const rd = $("#readDone");
    if (rd) rd.onclick = () => {
      S.read[s.id] = true; save(); addXP(10, rd); sfx.ok();
      if (Object.keys(S.read).length >= 4) award("reader");
      setTimeout(() => location.hash = `#/station/${s.id}/beispiele`, 600);
    };
  }
  function stationExamples(s, body) {
    body.innerHTML = `<p class="muted">Tippe auf „Nächster Schritt“ und überlege vorher selbst, was als Nächstes kommt.</p>
      ${s.examples.map((ex, i) => `<section class="card example" data-i="${i}"><p class="eyebrow">Beispiel ${i + 1}</p><h3>${esc(ex.task)}</h3>
        <table class="exsteps">${ex.lines.map((l, k) => `<tr class="exl" ${k ? "hidden" : ""}><td>${M(l[0])}</td><td class="muted small">${esc(l[1])}</td></tr>`).join("")}</table>
        ${ex.lines.length > 1 ? `<button class="btn small nxt">Nächster Schritt ▾</button>` : ""}</section>`).join("")}
      <div class="actions center"><a class="btn primary" href="#/station/${s.id}/ueben">Jetzt selbst üben →</a></div>`;
    $$(".example", body).forEach(card => {
      const btn = $(".nxt", card); if (!btn) return;
      btn.onclick = () => { const h = $$(".exl[hidden]", card); if (h[0]) { h[0].hidden = false; h[0].classList.add("pop"); sfx.click(); } if (h.length <= 1) btn.remove(); };
    });
  }
  function stationPractice(s, body) {
    const rl = recLevel(s.id);
    body.innerHTML = `
      <p class="muted">Wie schwer soll es sein? Eine Runde = 8 Aufgaben.</p>
      <div class="levels">${[1, 2, 3].map(l => `
        <a class="card lvcard ${LV[l].cls} ${l === rl ? "rec" : ""}" href="#/quiz/${s.id}/${l}">
          ${l === rl ? `<span class="recflag">Empfohlen</span>` : ""}
          <div class="lv-ico">${LV[l].icon}</div>
          <div class="grow"><h3>${LV[l].name}</h3><p class="muted small">${LV[l].desc}</p></div>
          <div class="lv-stars">${starStr(starsOf(s.id, l))}</div>
        </a>`).join("")}</div>
      ${["gleichungen", "loesen"].includes(s.id) ? `<a class="card tile wide" href="#/waage"><div class="t-big">⚖️</div><div><h3>Waage-Trainer</h3><p class="muted small">Forme Gleichungen selbst um – Schritt für Schritt.</p></div></a>` : ""}`;
  }

  // ---------- Üben ----------
  function viewPractice() {
    const d = S.daily[today()] || {};
    app.innerHTML = `
      <h1>🎯 Üben & Spielen</h1>
      <div class="grid grid-2">
        <a class="card tile daily ${Object.keys(d).length ? "done" : ""}" href="#/challenge"><div class="t-big">📅</div><h3>Aufgabe des Tages</h3><p class="muted small">${Object.keys(d).length ? "Heute geschafft ✓" : "Jeden Tag neu"}</p></a>
        <a class="card tile" href="#/blitz"><div class="t-big">⚡</div><h3>Blitzrunde</h3><p class="muted small">60 Sekunden · Rekord ${S.blitzBest}</p></a>
        <a class="card tile" href="#/waage"><div class="t-big">⚖️</div><h3>Waage-Trainer</h3><p class="muted small">Gleichungen lösen</p></a>
        <a class="card tile" href="#/memory"><div class="t-big">🧩</div><h3>Term-Memory</h3><p class="muted small">Paare finden</p></a>
        <a class="card tile" href="#/quiz/mix/0"><div class="t-big">🎲</div><h3>Mix-Quiz</h3><p class="muted small">Von allem etwas</p></a>
        <a class="card tile ${bossUnlocked() ? "" : "locked"}" href="#/boss"><div class="t-big">${bossUnlocked() ? "🐉" : "🔒"}</div><h3>Term-Drache</h3><p class="muted small">${bossUnlocked() ? "Der Endgegner" : `Noch gesperrt (${unlockedCount()}/4)`}</p></a>
      </div>
      <h2 class="section">Themen üben</h2><p class="muted small">🌱 leicht · 🚀 mittel · 🏆 schwer</p>
      <div class="qlist">${STATIONS.map(s => `
        <div class="card qrow" style="--c:${s.color}"><span class="m-icon sm">${s.icon}</span><span class="grow"><b>${s.nr}. ${esc(s.title)}</b></span>
          ${[1, 2, 3].map(l => `<a class="qbtn ${LV[l].cls}" href="#/quiz/${s.id}/${l}" title="${LV[l].name}">${LV[l].icon}<small>${starsOf(s.id, l) ? "★".repeat(starsOf(s.id, l)) : "–"}</small></a>`).join("")}
        </div>`).join("")}</div>`;
  }

  // Niveau-Auswahl (für Spiele)
  function levelPicker(title, sub, base, extra = "") {
    app.innerHTML = `<a class="back" href="#/ueben">← Üben</a><section class="card center-card"><h1>${title}</h1><p class="muted">${sub}</p>${extra}
      <div class="levels">${[1, 2, 3].map(l => `<a class="card lvcard ${LV[l].cls}" href="${base}/${l}"><div class="lv-ico">${LV[l].icon}</div><div class="grow"><h3>${LV[l].name}</h3><p class="muted small">${LV[l].desc}</p></div></a>`).join("")}</div></section>`;
  }

  // =====================================================================
  // QUIZ-ENGINE
  // =====================================================================
  function viewQuiz(id, lvl) {
    lvl = +lvl;
    if (id === "mix") {
      if (![1, 2, 3].includes(lvl)) return levelPicker("🎲 Mix-Quiz", "8 Aufgaben aus allen Stationen. Welches Niveau?", "#/quiz/mix");
      const decks = {}; STATIONS.forEach(s => decks[s.id] = T.makeDeck(s.id, lvl));
      const order = R.shuffle(STATIONS.map(s => s.id)).slice(0, 8);
      return runQuiz({ title: "Mix-Quiz", level: lvl, questions: order.map(sid => decks[sid]()), back: "#/ueben", kind: "mix" });
    }
    const s = station(id); if (!s || ![1, 2, 3].includes(lvl)) return viewLearn();
    const deck = T.makeDeck(id, lvl);
    runQuiz({ title: s.title, station: s, level: lvl, questions: Array.from({ length: 8 }, deck), back: `#/station/${id}/ueben`, kind: "round" });
  }

  function runQuiz(cfg) {
    document.body.classList.add("focus");
    const st = { cfg, list: cfg.questions.slice(), i: 0, base: cfg.questions.length, first: 0, combo: 0, maxCombo: 0, xp: 0, extras: 0, hint: false, hearts: 3, hp: cfg.bossHP || 0, hpMax: cfg.bossHP || 0, dmg: 0 };
    const next = () => {
      if (cfg.kind === "boss") {
        if (st.hp <= 0 || st.hearts <= 0) return finishBoss(st);
        if (st.i >= st.list.length) st.list.push(cfg.gen());
      } else if (st.i >= st.list.length) return finishQuiz(st);
      showQuestion(st, () => { st.i++; next(); });
    };
    next();
  }

  function quizHeader(st) {
    const c = st.cfg;
    if (c.kind === "boss") {
      return `<div class="qhead"><a class="qx" href="#/ueben" aria-label="Beenden">✕</a>
        <div class="boss-bar"><div class="boss-name">🐉 Term-Drache ${lvChip(c.level)}</div><div class="hpbar"><div style="width:${Math.max(0, st.hp / st.hpMax * 100)}%"></div></div></div>
        <div class="hearts">${"❤️".repeat(st.hearts)}${"🖤".repeat(3 - st.hearts)}</div></div>`;
    }
    const done = Math.min(st.i, st.base), pct = done / st.base * 100;
    return `<div class="qhead"><a class="qx" href="${c.back}" aria-label="Beenden">✕</a>
      <div class="qprog"><div class="qbar"><div style="width:${pct}%"></div></div><span class="small muted">${st.i < st.base ? `Aufgabe ${st.i + 1} von ${st.base}` : `Extra-Runde: Nochmal üben`}</span></div>
      <div class="combo ${st.combo >= 3 ? "hot" : ""}">${st.combo >= 3 ? `🔥 ${st.combo}` : ""}</div></div>`;
  }

  function showQuestion(st, onNext) {
    const q = st.list[st.i], c = st.cfg;
    const sname = station(q.station);
    app.innerHTML = `
      ${quizHeader(st)}
      ${c.kind === "boss" ? `<div class="dragon" id="dragon">🐉</div>` : ""}
      <section class="card qcard ${LV[q.level].cls}" id="qcard">
        <div class="qmeta">${lvChip(q.level)} <span class="muted small">${sname ? `${sname.icon} ${esc(sname.title)}` : ""}${q.extra ? " · Nochmal-Aufgabe" : ""}</span></div>
        <div class="qtext">${q.prompt}</div>
        ${q.expr ? `<div class="task-expr">${M(q.expr)}</div>` : ""}
        <div id="answer"></div>
        <div id="easybox"></div>
        <div id="hintbox"></div>
        <div id="fb"></div>
        <div class="actions" id="qactions"></div>
      </section>`;
    const A = $("#answer"), FB = $("#fb"), ACT = $("#qactions");
    let finished = false;
    const hintBtn = () => `${sname ? `<button class="btn ghost help" id="easyHelpBtn">🗣️ Einfach erklärt</button>` : ""}${q.hint ? `<button class="btn ghost help" id="hintBtn">💡 Tipp</button>` : ""}`;

    function showHint() {
      q.usedHint = true; st.hint = true;
      $("#hintbox").innerHTML = `<div class="hint">💡 ${q.hint}</div>`;
      const hb = $("#hintBtn"); if (hb) hb.remove();
    }

    function resolve(ok, info = {}) {
      if (finished) return; finished = true;
      const counts = st.i < st.base && !q.extra;
      if (ok) {
        if (counts) st.first++;
        st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo);
        if (st.combo === 5) award("combo5"); if (st.combo === 10) award("combo10");
        let xp = LV[q.level].xp; if (q.extra) xp = Math.ceil(xp / 2);
        if (st.combo >= 3) xp += Math.min(10, (st.combo - 2) * 2);
        st.xp += xp; S.correct++;
        sfx.ok(); buzz(15);
        addXP(xp, $("#qcard .qtext"));
        if (c.kind === "boss") {
          const dmg = { 1: 12, 2: 14, 3: 16 }[c.level] + Math.min(8, st.combo * 2);
          st.hp -= dmg; st.dmg += dmg;
          const d = $("#dragon"); shake(d); floatText(`−${dmg}`, d, "dmg"); sfx.hit();
          $(".hpbar > div").style.width = `${Math.max(0, st.hp / st.hpMax * 100)}%`;
        }
      } else {
        st.combo = 0; sfx.bad(); buzz(80); shake($("#qcard"));
        if (c.kind === "boss") { st.hearts--; $(".hearts").innerHTML = `${"❤️".repeat(Math.max(0, st.hearts))}${"🖤".repeat(3 - Math.max(0, st.hearts))}`; }
        else if (st.extras < 3 && !q.extra) { const sim = T.similar(q); if (sim) { sim.extra = true; st.list.push(sim); st.extras++; info.pushed = true; } }
      }
      S.answered++; save();
      const comboEl = $(".combo"); if (comboEl) { comboEl.className = `combo ${st.combo >= 3 ? "hot" : ""}`; comboEl.textContent = st.combo >= 3 ? `🔥 ${st.combo}` : ""; }
      const head = ok ? R.pick(["Richtig!", "Super!", "Stark!", "Genau!", "Klasse!"]) : "Leider nicht richtig.";
      const sol = q.answerText != null && !ok ? `<p>Richtige Lösung: <b>${M(String(q.answerText))}</b></p>` : "";
      const steps = q.steps && q.steps.length ? `<details ${ok ? "" : "open"}><summary>So geht’s</summary><div class="steps">${q.steps.map(x => `<div>${x}</div>`).join("")}</div></details>` : "";
      const retry = info.pushed ? `<p class="small muted">🔁 Eine ähnliche Aufgabe kommt am Ende nochmal.</p>` : "";
      FB.innerHTML = `<div class="fb ${ok ? "ok" : "bad"}"><div class="fb-h">${ok ? "✓" : "✗"} ${head}</div>${info.why ? `<p>${info.why}</p>` : ""}${sol}${steps}${retry}</div>`;
      ACT.innerHTML = `<button class="btn primary" id="nextBtn">${(c.kind === "boss" && (st.hp <= 0 || st.hearts <= 0)) || (c.kind !== "boss" && st.i + 1 >= st.list.length) ? "Ergebnis ansehen" : "Weiter →"}</button>`;
      const nb = $("#nextBtn"); nb.onclick = onNext; setTimeout(() => nb.focus({ preventScroll: true }), 50);
      FB.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // ----- Eingabe -----
    if (q.kind === "input") {
      const isNum = q.mode === "num";
      const keys = isNum ? ["−", ",", "/"] : [...q.vars, "²", "(", ")", "+", "−", "·", "/"];
      A.innerHTML = `
        <div class="ansrow"><input id="ans" class="ans" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="${isNum ? "text" : "text"}" placeholder="${esc(q.placeholder || (isNum ? "Zahl" : "Term eingeben"))}" aria-label="Antwort"></div>
        <div class="keys">${keys.map(k => `<button type="button" class="key" data-k="${k}">${/^[a-z]$/.test(k) ? `<i>${k}</i>` : k}</button>`).join("")}<button type="button" class="key wide" data-k="⌫">⌫</button></div>
        <div class="preview" id="pv"></div><div class="imsg" id="im"></div>`;
      ACT.innerHTML = `${hintBtn()}<button class="btn primary" id="go">Prüfen</button>`;
      const inp = $("#ans"), pv = $("#pv"), im = $("#im");
      const upd = () => {
        im.textContent = "";
        const v = inp.value.trim();
        if (!v || isNum) { pv.innerHTML = ""; return; }
        try { parse(v); pv.innerHTML = `<span class="muted small">Du schreibst:</span> ${M(normalize(v).replace(/\//g, "/"))}`; }
        catch { pv.innerHTML = `<span class="muted small">Du schreibst:</span> …`; }
      };
      inp.oninput = upd;
      $$(".key", A).forEach(b => {
        b.onmousedown = e => e.preventDefault();
        b.onclick = () => {
          const k = b.dataset.k; sfx.click();
          if (k === "⌫") { const p = inp.selectionStart || inp.value.length; if (p > 0) inp.setRangeText("", p - 1, p, "end"); }
          else { const ins = k === "−" ? "-" : k === "·" ? "*" : k; inp.setRangeText(ins, inp.selectionStart ?? inp.value.length, inp.selectionEnd ?? inp.value.length, "end"); }
          upd(); if (!matchMedia("(pointer: coarse)").matches) inp.focus();
        };
      });
      let almost = 0;
      const go = () => {
        if (finished) return;
        const v = inp.value.trim();
        if (!v) { im.textContent = "Gib zuerst eine Antwort ein."; shake(inp); return; }
        const r = T.check(q, v);
        if (r.status === "invalid") { im.innerHTML = `⚠️ ${r.msg}`; shake(inp); return; }
        if (r.status === "almost") {
          almost++;
          if (almost === 1) { FB.innerHTML = `<div class="fb almost"><div class="fb-h">🤏 Fast!</div><p>Dein Term ist gleichwertig, aber noch nicht fertig. ${r.msg}</p><p class="small muted">Verbessere deine Antwort und prüfe nochmal.</p></div>`; inp.focus(); return; }
          return resolve(false, { why: `Gleichwertig, aber noch nicht fertig: ${r.msg}` });
        }
        inp.disabled = true; $$(".key", A).forEach(k => k.disabled = true);
        resolve(r.status === "ok");
      };
      $("#go").onclick = go;
      inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); go(); } };
      if (!matchMedia("(pointer: coarse)").matches) setTimeout(() => inp.focus(), 50);
    }
    else if (q.kind === "mc") {
      A.innerHTML = `<div class="opts ${q.options.length <= 3 && q.options.every(o => o.h.length < 60) ? "" : ""}">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="ol">${"ABCD"[i]}</span><span>${o.h}</span></button>`).join("")}</div>`;
      ACT.innerHTML = hintBtn();
      $$(".opt", A).forEach(b => b.onclick = () => {
        if (finished) return;
        const o = q.options[+b.dataset.i];
        $$(".opt", A).forEach((x, i) => { x.disabled = true; if (q.options[i].ok) x.classList.add("right"); });
        if (!o.ok) b.classList.add("wrong");
        resolve(o.ok, { why: !o.ok && o.why ? o.why : "" });
      });
    }
    else if (q.kind === "tf") {
      A.innerHTML = `<div class="opts two"><button class="opt tf" data-v="1">✓ Stimmt</button><button class="opt tf" data-v="0">✗ Stimmt nicht</button></div>`;
      ACT.innerHTML = hintBtn();
      $$(".opt", A).forEach(b => b.onclick = () => {
        if (finished) return;
        const v = b.dataset.v === "1", ok = v === q.ok;
        $$(".opt", A).forEach(x => { x.disabled = true; if ((x.dataset.v === "1") === q.ok) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        resolve(ok, { why: `Die Aussage ${q.ok ? "stimmt" : "stimmt nicht"}.` });
      });
    }
    else if (q.kind === "order") {
      const pool = R.shuffle(q.items.map((h, i) => ({ h, i })));
      const placed = [];
      const draw = () => {
        A.innerHTML = `
          <div class="order-target">${placed.length ? placed.map((p, k) => `<button class="ochip placed" data-k="${k}"><span class="onum">${k + 1}</span>${p.h}</button>`).join("") : `<p class="muted small">Tippe die Schritte unten in der richtigen Reihenfolge an.</p>`}</div>
          <div class="order-pool">${pool.filter(p => !placed.includes(p)).map(p => `<button class="ochip" data-i="${p.i}">${p.h}</button>`).join("")}</div>`;
        $$(".order-pool .ochip", A).forEach(b => b.onclick = () => { if (finished) return; placed.push(pool.find(p => p.i === +b.dataset.i)); sfx.click(); draw(); });
        $$(".order-target .placed", A).forEach(b => b.onclick = () => { if (finished) return; placed.splice(+b.dataset.k); draw(); });
        const g = $("#go"); if (g) g.disabled = placed.length !== q.items.length;
      };
      ACT.innerHTML = `${hintBtn()}<button class="btn primary" id="go" disabled>Prüfen</button>`;
      draw();
      $("#go").onclick = () => {
        if (finished || placed.length !== q.items.length) return;
        const ok = placed.every((p, k) => p.i === k);
        $$(".order-target .placed", A).forEach((b, k) => b.classList.add(placed[k].i === k ? "right" : "wrong"));
        resolve(ok);
      };
    }
    const hb = $("#hintBtn"); if (hb) hb.onclick = showHint;
    const eb = $("#easyHelpBtn");
    if (eb) {
      eb.onclick = () => {
        const box = $("#easybox");
        if (box.innerHTML) { box.innerHTML = ""; eb.classList.remove("on"); return; }
        eb.classList.add("on"); sfx.click();
        const typing = q.kind === "input" ? `<p class="small"><b>⌨️ Eintippen:</b> ${q.mode === "num" ? "Tippe nur die Zahl, z. B. <b>7</b> oder <b>-3</b>. Brüche so: <b>3/4</b>." : "Zum Beispiel <b>3x+4</b>. Für ² nimm die Taste ². Klammern: ( und )."}</p>` : q.kind === "order" ? `<p class="small"><b>👆 So geht’s:</b> Tippe die Zeilen nacheinander an – zuerst die oberste.</p>` : "";
        box.innerHTML = `<div class="easybox"><button class="eb-x" aria-label="Schließen">✕</button><p class="eyebrow">🗣️ Einfach erklärt · ${esc(sname.title)}</p>${easyBlock(sname, false)}${typing}</div>`;
        $(".eb-x", box).onclick = () => eb.click();
      };
      if (S.settings.easy) eb.click();
    }
  }

  function finishQuiz(st) {
    document.body.classList.remove("focus");
    const c = st.cfg, pct = st.first / st.base;
    const stars = pct >= .85 ? 3 : pct >= .6 ? 2 : pct >= .4 ? 1 : 0;
    S.rounds++;
    let bonus = 0, newStars = 0;
    if (c.kind === "round") {
      const key = `${c.station.id}:${c.level}`, old = S.stars[key] || 0;
      if (stars > old) { newStars = stars - old; S.stars[key] = stars; bonus += newStars * 10; }
    }
    if (c.kind === "challenge") {
      const d = S.daily[today()] = S.daily[today()] || {};
      if (!d[c.level]) { bonus += { 1: 30, 2: 40, 3: 50 }[c.level]; if (!Object.keys(d).length) S.dailyCount++; d[c.level] = st.first; }
      if (S.dailyCount >= 3) award("daily3");
    }
    save();
    award("first");
    if (st.first === st.base) award("perfect");
    if (c.level === 3) award("profi");
    if (c.level === 3 && stars === 3 && !st.hint && c.kind === "round") award("nohint");
    checkStarBadges();

    const s = c.station;
    const msg = stars === 3 ? "Hervorragend! 🎉" : stars === 2 ? "Richtig gut!" : stars === 1 ? "Geschafft – weiter so!" : "Dranbleiben lohnt sich!";
    let advice = "";
    if (c.kind === "round") {
      if (stars >= 2 && c.level < 3) advice = `<p>Du bist bereit für mehr: <a class="link" href="#/quiz/${s.id}/${c.level + 1}">${LV[c.level + 1].icon} ${LV[c.level + 1].name} ausprobieren</a></p>`;
      else if (stars <= 1 && c.level > 1) advice = `<p class="muted">Tipp: Auf <a class="link" href="#/quiz/${s.id}/${c.level - 1}">${LV[c.level - 1].icon} ${LV[c.level - 1].name}</a> kannst du die Grundlagen festigen – oder lies nochmal die <a class="link" href="#/station/${s.id}/lesen">Lernseite</a>.</p>`;
      else if (stars <= 1) advice = `<p class="muted">Schau dir die <a class="link" href="#/station/${s.id}/beispiele">Beispiele</a> nochmal an und versuch es dann erneut.</p>`;
    }
    app.innerHTML = `
      <section class="card result">
        <p class="eyebrow">${esc(c.title)} · ${lvChip(c.level)}</p>
        <div class="bigstars">${[1, 2, 3].map(k => `<span class="bs ${k <= stars ? "on" : ""}" style="animation-delay:${k * .25}s">★</span>`).join("")}</div>
        <h1>${msg}</h1>
        <p class="big2">${st.first} von ${st.base} beim ersten Versuch richtig</p>
        <div class="res-stats">
          <div><b>+${st.xp + bonus}</b><span>XP</span></div>
          <div><b>${st.maxCombo}</b><span>beste Serie</span></div>
          ${newStars ? `<div><b>+${newStars}</b><span>neue Sterne</span></div>` : ""}
        </div>
        ${bonus ? `<p class="small muted">inklusive ${bonus} Bonus-XP ${c.kind === "challenge" ? "für die Tages-Challenge" : "für neue Sterne"}</p>` : ""}
        ${advice}
        <div class="actions center">
          <a class="btn" href="${c.back}">Zurück</a>
          ${c.kind === "round" ? `<a class="btn primary" href="#/quiz/${s.id}/${c.level}" id="again">Nochmal spielen</a>` : c.kind === "mix" ? `<a class="btn primary" href="#/quiz/mix/${c.level}" id="again">Neue Runde</a>` : ""}
        </div>
      </section>`;
    const again = $("#again"); if (again) again.onclick = e => { e.preventDefault(); route(); };
    if (bonus) setTimeout(() => addXP(bonus, $(".bigstars")), 900);
    if (stars) { [1, 2, 3].slice(0, stars).forEach(k => setTimeout(sfx.star, k * 250 + 100)); }
    if (stars === 3) setTimeout(confetti, 700);
  }

  // ---------- Tages-Challenge ----------
  function viewChallenge(lvl) {
    lvl = +lvl;
    const d = S.daily[today()] || {};
    if (![1, 2, 3].includes(lvl)) {
      return levelPicker("📅 Tages-Challenge", `Heute für alle gleich: 5 Aufgaben aus verschiedenen Stationen. Bonus: 30 / 40 / 50 XP. ${Object.keys(d).length ? "<br><b>Heute schon geschafft:</b> " + Object.keys(d).map(l => LV[l].icon + " " + LV[l].name).join(", ") : ""}`, "#/challenge");
    }
    R.seed(hashStr(today() + ":" + lvl));
    const ids = R.shuffle(STATIONS.map(s => s.id)).slice(0, 5);
    const qs = ids.map(id => T.makeDeck(id, lvl)());
    R.seed(null);
    runQuiz({ title: "Tages-Challenge", level: lvl, questions: qs, back: "#/ueben", kind: "challenge" });
  }

  // ---------- Blitzrunde ----------
  function viewBlitz(go) {
    if (go !== "los") {
      app.innerHTML = `<a class="back" href="#/ueben">← Üben</a><section class="card center-card"><div class="t-big">⚡</div><h1>Blitzrunde</h1>
        <p>60 Sekunden – so viele Aufgaben wie möglich! Richtig: +1 Punkt und +1 Sekunde. Falsch: −3 Sekunden.</p><p class="muted">Dein Rekord: <b>${S.blitzBest}</b></p>
        <div class="actions center"><a class="btn primary big" href="#/blitz/los">Start!</a></div></section>`;
      return;
    }
    document.body.classList.add("focus");
    let time = 60, score = 0, wrong = 0, cur, combo = 0;
    app.innerHTML = `<div class="qhead"><a class="qx" href="#/blitz" aria-label="Beenden">✕</a><div class="qprog"><div class="qbar timer"><div id="tb" style="width:100%"></div></div><span class="small muted" id="tt">60 s</span></div><div class="combo hot" id="bs">0</div></div>
      <section class="card qcard blitz" id="bq"><div class="qtext big-q" id="bqq"></div><div class="opts three" id="bo"></div></section>`;
    const draw = () => {
      cur = T.blitz();
      const order = R.shuffle([0, 1, 2]);
      $("#bqq").innerHTML = cur.q;
      $("#bo").innerHTML = order.map(i => `<button class="opt" data-i="${i}">${cur.m ? M(cur.opts[i]) : M(String(cur.opts[i]))}</button>`).join("");
      $$("#bo .opt").forEach(b => b.onclick = () => {
        if (+b.dataset.i === cur.ok) { score++; combo++; time = Math.min(60, time + 1); sfx.ok(); floatText("+1", b, "xp"); b.classList.add("right"); }
        else { wrong++; combo = 0; time -= 3; sfx.bad(); shake($("#bq")); buzz(60); b.classList.add("wrong"); }
        $("#bs").textContent = score;
        setTimeout(() => time > 0 && draw(), 180);
      });
    };
    draw();
    const timer = setInterval(() => {
      time -= .1;
      const tb = $("#tb"); if (tb) { tb.style.width = `${Math.max(0, time / 60 * 100)}%`; tb.classList.toggle("low", time < 10); }
      const tt = $("#tt"); if (tt) tt.textContent = `${Math.max(0, Math.ceil(time))} s`;
      if (time <= 0) { clearInterval(timer); endBlitz(); }
    }, 100);
    cleanup = () => clearInterval(timer);
    function endBlitz() {
      cleanup = null; document.body.classList.remove("focus");
      const rec = score > S.blitzBest; if (rec) S.blitzBest = score; save();
      if (score >= 15) award("blitz15");
      app.innerHTML = `<section class="card result"><div class="t-big">⚡</div><h1>${rec ? "Neuer Rekord! 🎉" : "Zeit ist um!"}</h1><p class="big2">${score} Punkte</p>
        <div class="res-stats"><div><b>${score}</b><span>richtig</span></div><div><b>${wrong}</b><span>falsch</span></div><div><b>${S.blitzBest}</b><span>Rekord</span></div></div>
        <div class="actions center"><a class="btn" href="#/ueben">Zurück</a><a class="btn primary" href="#/blitz/los" id="again">Nochmal</a></div></section>`;
      $("#again").onclick = e => { e.preventDefault(); route(); };
      if (score) addXP(Math.min(60, score * 3), $(".big2"));
      if (rec && score > 0) confetti();
    }
  }

  // ---------- Waage-Trainer ----------
  function fmtLin(s) {
    const { a, b } = s;
    let xs = "";
    if (!a.isZero()) {
      const ab = a.abs(), sg = a.sign() < 0 ? "-" : "";
      xs = ab.isOne() ? `${sg}x` : ab.isInt() ? `${sg}${ab.n}x` : ab.n === 1 ? `${sg}x/${ab.d}` : `${sg}${ab.n}x/${ab.d}`;
    }
    const bs = b.isZero() ? "" : b.isInt() ? String(b.n) : b.toFracString();
    if (!xs) return bs || "0";
    if (!bs) return xs;
    return `${xs} ${b.sign() < 0 ? "-" : "+"} ${b.isInt() ? Math.abs(b.n) : b.abs().toFracString()}`;
  }
  function viewWaage(lvl) {
    lvl = +lvl;
    if (![1, 2, 3].includes(lvl)) return levelPicker("⚖️ Waage-Trainer", "Du entscheidest, wie umgeformt wird. Die App rechnet für dich auf beiden Seiten. Ziel: x = Zahl.", "#/waage",
      `<div class="mini-waage">${T.waageSVG(2, 3, 0, 9)}</div>`);
    document.body.classList.add("focus");
    let eq = T.trainerEq(lvl);
    const start = { l: { ...eq.l }, r: { ...eq.r } };
    const opt = T.solveLinear(eq.l, eq.r).lines.length - 1;
    const hist = [];
    let steps = 0, done = false, op = "-", hintUsed = false;
    const showStart = eq.show ? `${eq.show[0]} = ${eq.show[1]}` : null;
    const isSolved = () => (eq.l.a.isOne() && eq.l.b.isZero() && eq.r.a.isZero()) || (eq.r.a.isOne() && eq.r.b.isZero() && eq.l.a.isZero());
    const canWaage = () => [eq.l.a, eq.l.b, eq.r.a, eq.r.b].every(f => f.isInt() && f.n >= 0) && eq.l.a.n + eq.r.a.n <= 10;

    function draw(msg = "") {
      const lines = hist.map(h => `<tr><td class="l">${M(h.l)}</td><td>=</td><td class="r">${M(h.r)}</td><td class="op">${M(h.op)}</td></tr>`).join("");
      const curL = fmtLin(eq.l), curR = fmtLin(eq.r);
      app.innerHTML = `
        <div class="qhead"><a class="qx" href="#/waage" aria-label="Beenden">✕</a><div class="qprog"><b>⚖️ Waage-Trainer</b> ${lvChip(lvl)}<span class="small muted"> · Schritte: ${steps}</span></div><div></div></div>
        <section class="card wcard">
          ${showStart && !hist.length ? `<p class="muted small">Startgleichung: ${M(showStart)}</p>` : ""}
          ${canWaage() ? `<div class="wsvg">${T.waageSVG(eq.l.a.n, eq.l.b.n, eq.r.a.n, eq.r.b.n)}</div>` : ""}
          <table class="eqsteps big">${lines}<tr class="cur"><td class="l">${M(curL)}</td><td>=</td><td class="r">${M(curR)}</td><td class="op"></td></tr></table>
          ${done ? "" : `
          <p class="small muted">Wähle eine Umformung für <b>beide Seiten</b>:</p>
          <div class="opsel">${["+", "-", "*", ":"].map(o => `<button class="opb ${o === op ? "sel" : ""}" data-o="${o}">${o === "-" ? "−" : o === "*" ? "·" : o}</button>`).join("")}
            <input id="wv" class="ans small-in" placeholder="z. B. 3 / 2x" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Wert">
            <button class="key" data-k="x"><i>x</i></button><button class="key" data-k="-">−</button>
            <button class="btn primary" id="apply">Anwenden</button></div>
          <div class="imsg" id="wm">${msg}</div>
          <div class="actions"><button class="btn ghost" id="whint">💡 Tipp</button>${hist.length ? `<button class="btn ghost" id="wundo">↩︎ Zurück</button>` : ""}</div>`}
          <div id="wres"></div>
        </section>`;
      if (done) return;
      $$(".opb", app).forEach(b => b.onclick = () => { op = b.dataset.o; $$(".opb", app).forEach(x => x.classList.toggle("sel", x === b)); sfx.click(); $("#wv").focus(); });
      $$(".key", app).forEach(b => { b.onmousedown = e => e.preventDefault(); b.onclick = () => { const i = $("#wv"); i.setRangeText(b.dataset.k, i.selectionStart ?? i.value.length, i.selectionEnd ?? i.value.length, "end"); }; });
      $("#apply").onclick = apply;
      $("#wv").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); apply(); } };
      $("#whint").onclick = () => {
        hintUsed = true;
        const s = T.solveLinear(eq.l, eq.r).lines[0];
        $("#wm").innerHTML = s.op ? `💡 Versuch es mit ${M(s.op)}` : "💡 Du bist fast fertig!";
      };
      const u = $("#wundo"); if (u) u.onclick = () => { const h = hist.pop(); eq = h.prev; steps++; draw(); };
      if (!matchMedia("(pointer: coarse)").matches) $("#wv").focus();
    }
    function apply() {
      const raw = $("#wv").value.trim();
      if (!raw) { $("#wm").textContent = "Gib eine Zahl oder einen Term ein."; return; }
      let v;
      try { v = T.fromPoly(toPoly(parse(raw))); } catch { $("#wm").textContent = "Das kann ich nicht lesen. Beispiele: 5, -3, 2x, 1/2"; shake($("#wv")); return; }
      const prev = { l: { ...eq.l }, r: { ...eq.r } };
      const vs = fmtLin(v);
      if (op === "+" || op === "-") {
        const sgn = op === "+" ? 1 : -1;
        eq = { l: T.L(eq.l.a.add(v.a.mul(sgn)), eq.l.b.add(v.b.mul(sgn))), r: T.L(eq.r.a.add(v.a.mul(sgn)), eq.r.b.add(v.b.mul(sgn))) };
      } else {
        if (!v.a.isZero()) { $("#wm").textContent = "Multipliziere oder teile nur mit Zahlen – nicht mit x."; return; }
        if (v.b.isZero()) { $("#wm").textContent = op === ":" ? "Durch 0 darf man nicht teilen!" : "Mal 0 ist verboten – dann wäre alles 0."; shake($("#wv")); return; }
        const f = op === "*" ? v.b : new Frac(1).div(v.b);
        eq = { l: T.L(eq.l.a.mul(f), eq.l.b.mul(f)), r: T.L(eq.r.a.mul(f), eq.r.b.mul(f)) };
      }
      let sym = op, val = vs;
      if ((op === "+" || op === "-") && !vs.includes(" ") && vs.startsWith("-")) { sym = op === "+" ? "-" : "+"; val = vs.slice(1); }
      else if (vs.includes(" ") || vs.startsWith("-")) val = `(${vs})`;
      const opShow = `| ${sym === "*" ? "·" : sym}${val}`;
      hist.push({ l: fmtLin(prev.l), r: fmtLin(prev.r), op: opShow, prev });
      steps++; sfx.click();
      if (isSolved()) return win();
      if (eq.l.a.isZero() && eq.r.a.isZero()) return draw(eq.l.b.eq(eq.r.b) ? "Alle x sind weg und die Aussage ist wahr." : "Hoppla – alle x sind verschwunden. Geh einen Schritt zurück.");
      draw();
    }
    function win() {
      done = true;
      const sol = eq.r.a.isZero() ? eq.r.b : eq.l.b;
      draw();
      const perfect = steps <= opt && !hintUsed;
      S.waageSolved++; save(); if (S.waageSolved >= 5) award("waage5");
      const xp = { 1: 15, 2: 20, 3: 25 }[lvl] + (perfect ? 10 : 0);
      $("#wres").innerHTML = `<div class="fb ok"><div class="fb-h">✓ Gelöst! ${M(`L = {${sol.toString()}}`)}</div>
        <p>${perfect ? `Perfekt – mit nur ${steps} Schritten! (+10 Bonus-XP)` : `Du hast ${steps} Schritte gebraucht. Kürzester Weg: ${opt} Schritte.`}</p>
        <p class="small muted">Probe: ${M(`x = ${sol.toString()}`)} in ${M(showStart || `${fmtLin(start.l)} = ${fmtLin(start.r)}`)} einsetzen.</p></div>
        <div class="actions"><a class="btn" href="#/waage">Niveau wechseln</a><button class="btn primary" id="wnext">Nächste Gleichung →</button></div>`;
      $("#wnext").onclick = () => viewWaage(lvl);
      sfx.ok(); addXP(xp, $("#wres")); if (perfect) confetti(60);
    }
    draw();
  }

  // ---------- Term-Memory ----------
  function viewMemory(lvl) {
    lvl = +lvl;
    if (![1, 2, 3].includes(lvl)) return levelPicker("🧩 Term-Memory", "Finde die Paare: Zwei Karten gehören zusammen, wenn die Terme gleichwertig sind, z. B. 3(x + 2) und 3x + 6.", "#/memory");
    const pairs = T.memoryPairs(lvl, 6);
    const cards = R.shuffle(pairs.flatMap((p, i) => [{ t: p[0], id: i }, { t: p[1], id: i }]));
    let open = [], found = 0, moves = 0, lock = false;
    const t0 = Date.now();
    app.innerHTML = `<div class="qhead"><a class="qx" href="#/memory" aria-label="Beenden">✕</a><div class="qprog"><b>🧩 Term-Memory</b> ${lvChip(lvl)}<span class="small muted" id="mm"> · Züge: 0 · Paare: 0/6</span></div><div></div></div>
      <div class="memory">${cards.map((c, i) => `<button class="mcard" data-i="${i}" aria-label="Karte ${i + 1}"><span class="mback">x</span><span class="mface">${M(c.t)}</span></button>`).join("")}</div>`;
    document.body.classList.add("focus");
    $$(".mcard", app).forEach(b => b.onclick = () => {
      if (lock || b.classList.contains("flip") || b.classList.contains("done")) return;
      b.classList.add("flip"); sfx.click(); open.push(b);
      if (open.length < 2) return;
      moves++;
      const [x, y] = open.map(e => cards[+e.dataset.i]);
      if (x.id === y.id) {
        open.forEach(e => e.classList.add("done")); found++; sfx.ok(); floatText("Paar!", open[1], "xp"); open = [];
        if (found === pairs.length) setTimeout(end, 500);
      } else { lock = true; setTimeout(() => { open.forEach(e => { e.classList.remove("flip"); shake(e); }); open = []; lock = false; }, 1000); }
      $("#mm").textContent = ` · Züge: ${moves} · Paare: ${found}/6`;
    });
    function end() {
      document.body.classList.remove("focus");
      const sec = Math.round((Date.now() - t0) / 1000);
      const best = S.memoryBest[lvl]; const rec = !best || moves < best;
      if (rec) S.memoryBest[lvl] = moves; save(); award("memory");
      const xp = Math.max(10, 50 - (moves - 6) * 3) + (lvl - 1) * 10;
      app.innerHTML = `<section class="card result"><div class="t-big">🧩</div><h1>Alle Paare gefunden!</h1><p class="big2">${moves} Züge · ${sec} Sekunden</p>
        ${rec ? `<p>🎉 Neuer Bestwert für ${LV[lvl].name}!</p>` : `<p class="muted">Bestwert: ${best} Züge</p>`}
        <div class="pairs">${pairs.map(p => `<div>${M(p[0])} = ${M(p[1])}</div>`).join("")}</div>
        <div class="actions center"><a class="btn" href="#/memory">Zurück</a><a class="btn primary" href="#/memory/${lvl}" id="again">Nochmal</a></div></section>`;
      $("#again").onclick = e => { e.preventDefault(); route(); };
      addXP(xp, $(".big2")); confetti(80);
    }
  }

  // ---------- Boss ----------
  function unlockedCount() { return STATIONS.filter(s => stationStars(s.id) > 0).length; }
  function bossUnlocked() { return unlockedCount() >= 4; }
  function viewBoss(lvl) {
    lvl = +lvl;
    if (!bossUnlocked()) {
      app.innerHTML = `<a class="back" href="#/ueben">← Üben</a><section class="card center-card"><div class="t-big">🔒</div><h1>Der Term-Drache schläft noch</h1>
        <p>Sammle in mindestens <b>4 Stationen</b> einen Stern, dann wacht er auf. Bisher: ${unlockedCount()}/4.</p><div class="actions center"><a class="btn primary" href="#/lernen">Zu den Stationen</a></div></section>`;
      return;
    }
    if (![1, 2, 3].includes(lvl)) return levelPicker("🐉 Der Term-Drache", "Aufgaben aus allen Stationen. Jede richtige Antwort trifft den Drachen – Serien treffen härter. Bei 3 Fehlern ist der Kampf verloren.", "#/boss", `<div class="dragon idle">🐉</div>`);
    const decks = STATIONS.map(s => T.makeDeck(s.id, lvl));
    runQuiz({ title: "Term-Drache", level: lvl, questions: [], gen: () => R.pick(decks)(), bossHP: 100, kind: "boss", back: "#/boss" });
  }
  function finishBoss(st) {
    document.body.classList.remove("focus");
    const win = st.hp <= 0, lvl = st.cfg.level;
    if (win) { S.bossWins++; award("boss"); if (lvl === 3) award("bossprofi"); }
    S.rounds++; save();
    const xp = win ? { 1: 80, 2: 120, 3: 160 }[lvl] : Math.round(st.dmg / 2);
    app.innerHTML = `<section class="card result">
      <div class="dragon ${win ? "defeated" : "idle"}">🐉</div>
      <h1>${win ? "Sieg! Der Drache ist besiegt! 🏆" : "Der Drache hat diesmal gewonnen"}</h1>
      <p class="big2">${win ? `Mit ${st.hearts} ${st.hearts === 1 ? "Herz" : "Herzen"} übrig` : `Du hast ihm ${st.dmg} Schaden zugefügt`}</p>
      <p class="muted">${win ? (lvl < 3 ? `Traust du dich an ${LV[lvl + 1].icon} ${LV[lvl + 1].name}?` : "Du bist ein echter Drachen-König!") : "Übe noch ein paar Runden in den Stationen und komm zurück!"}</p>
      <div class="actions center"><a class="btn" href="#/ueben">Zurück</a><a class="btn primary" href="#/boss/${lvl}" id="again">Nochmal kämpfen</a></div></section>`;
    $("#again").onclick = e => { e.preventDefault(); route(); };
    if (xp) addXP(xp, $(".big2"));
    if (win) { confetti(200); sfx.level(); }
  }

  // ---------- Ich ----------
  function viewMe() {
    const L = levelInfo();
    const acc = S.answered ? Math.round(S.correct / S.answered * 100) : 0;
    app.innerHTML = `
      <section class="card hero">
        <div class="hero-av">${S.avatar}</div>
        <div class="hero-main"><h1>${esc(S.name)}</h1><p><b>${esc(L.name)}</b> · Level ${L.n}</p><div class="xpbar"><div style="width:${L.pct}%"></div></div><p class="muted small">${S.xp} XP${L.next ? ` · nächstes Level bei ${L.next.xp} XP` : ""}</p></div>
      </section>
      <div class="statgrid three">
        <div class="card stat"><b>⭐ ${totalStars()}</b><span>Sterne</span></div>
        <div class="card stat"><b>🎯 ${S.answered}</b><span>Aufgaben</span></div>
        <div class="card stat"><b>🔥 ${S.streak.count || 0}</b><span>Tage am Stück</span></div>
      </div>
      <h2 class="section">Avatar</h2>
      <div class="card"><div class="avpick">${AVATARS.map(a => `<button class="av ${a.a === S.avatar ? "sel" : ""} ${a.lv > L.n ? "lock" : ""}" data-av="${a.a}" ${a.lv > L.n ? `disabled title="ab Level ${a.lv}"` : ""}>${a.a}${a.lv > L.n ? `<small>Lv ${a.lv}</small>` : ""}</button>`).join("")}</div></div>
      <h2 class="section">Abzeichen (${Object.keys(S.badges).length}/${BADGES.length})</h2>
      <div class="badges">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? "on" : ""}" title="${esc(b.desc)}"><div class="b-icon">${S.badges[b.id] ? b.icon : "🔒"}</div><b>${esc(b.name)}</b><span>${esc(b.desc)}</span></div>`).join("")}</div>
      <h2 class="section">Einstellungen</h2>
      <div class="card settings">
        <label class="sw"><input type="checkbox" id="sEasy" ${S.settings.easy ? "checked" : ""}><span>🗣️ Einfache Sprache</span></label>
        <label class="sw"><input type="checkbox" id="sSound" ${S.settings.sound ? "checked" : ""}><span>🔊 Töne</span></label>
        <label class="sw"><input type="checkbox" id="sFx" ${S.settings.fx ? "checked" : ""}><span>✨ Effekte (Konfetti, Wackeln, Vibration)</span></label>
        <form id="renameF" class="row left"><input id="rn" maxlength="20" value="${esc(S.name)}" aria-label="Spitzname"><button class="btn">Namen ändern</button></form>
        <div class="row left"><button class="btn danger" id="reset">Fortschritt löschen</button><a class="btn ghost" href="#/info">Info & Datenschutz</a></div>
      </div>`;
    $$(".av:not(.lock)", app).forEach(b => b.onclick = () => { S.avatar = b.dataset.av; save(); sfx.click(); viewMe(); renderTop(); });
    $("#sSound").onchange = e => { S.settings.sound = e.target.checked; save(); sfx.ok(); };
    $("#sEasy").onchange = e => { S.settings.easy = e.target.checked; save(); renderTop(); };
    $("#sFx").onchange = e => { S.settings.fx = e.target.checked; save(); };
    $("#renameF").onsubmit = e => { e.preventDefault(); S.name = $("#rn").value.trim().slice(0, 20) || S.name; save(); toast("Name gespeichert"); viewMe(); };
    let armed = false;
    $("#reset").onclick = e => {
      if (!armed) { armed = true; e.target.textContent = "Wirklich alles löschen? Nochmal tippen"; setTimeout(() => { armed = false; if (e.target.isConnected) e.target.textContent = "Fortschritt löschen"; }, 4000); return; }
      try { localStorage.removeItem(KEY); } catch { /* egal */ }
      S = structuredClone(DEFAULT); location.hash = "#/"; route();
    };
  }
  function viewInfo() {
    app.innerHTML = `<a class="back" href="${S.name ? "#/ich" : "#/"}">← Zurück</a><section class="card prose"><h1>Info & Datenschutz</h1>
      <p><b>x-Quest</b> ist eine Lern-App zu Termen und Gleichungen für Klasse 8 (Berlin, Integrierte Sekundarschule).</p>
      <p>Alle Aufgaben werden zufällig erzeugt – es gibt also immer neue Zahlen. Jede Station hat drei Niveaus: ${lvChip(1)} Grundlagen, ${lvChip(2)} Anwendung, ${lvChip(3)} Vertiefung.</p>
      <h3>Datenschutz</h3>
      <p>Die App speichert deinen Spitznamen und deinen Fortschritt <b>nur im Browser dieses Geräts</b> (localStorage). Es gibt keinen Server, keine Anmeldung, keine Werbung und keine Datenübertragung. Wenn du die Browserdaten löschst, ist der Fortschritt weg.</p>
      <p>Tipp: Nutze einen Spitznamen, nicht deinen echten Namen.</p></section>`;
  }

  // ---------- Start ----------
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { const o = $(".overlay"); if (o) o.remove(); }
  });
  route();
})();
