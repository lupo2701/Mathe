/* x-Quest · Lerninhalte, Level, Abzeichen */
(function (G) {
  "use strict";
  const m = s => G.XQ.M(s);

  const STATIONS = [
    {
      id: "terme", nr: 1, part: "Terme", icon: "🔤", color: "#4f6bed", title: "Terme aufstellen", short: "Aus Sätzen werden Terme",
      goals: ["Ich weiß, was eine Variable und ein Term ist.", "Ich kann Sätze wie „das Doppelte einer Zahl plus 3“ als Term schreiben.", "Ich kann Terme für Umfang und Muster aufstellen."],
      basis: `<p>In der Mathematik nutzt man <b>Variablen</b> (Platzhalter) für Zahlen, die man noch nicht kennt oder die sich ändern können. Meistens heißen sie ${m("x")}, ${m("y")}, ${m("a")} oder ${m("n")}.</p>
        <p>Ein <b>Term</b> ist ein Rechenausdruck aus Zahlen, Variablen und Rechenzeichen, zum Beispiel ${m("3x + 5")} oder ${m("2(a - 1)")}. Ein Term hat <b>kein Gleichheitszeichen</b>.</p>
        <p>Zwischen Zahl und Variable lässt man den Malpunkt meistens weg: ${m("3x")} bedeutet ${m("3*x")}.</p>
        <h4>Signalwörter</h4>
        <table class="tbl"><tr><th>Wort im Text</th><th>Rechenzeichen</th><th>Beispiel</th></tr>
        <tr><td>Summe, vermehrt um, plus, mehr als</td><td>+</td><td>„eine Zahl vermehrt um 4“ → ${m("x + 4")}</td></tr>
        <tr><td>Differenz, vermindert um, weniger als</td><td>−</td><td>„eine Zahl vermindert um 4“ → ${m("x - 4")}</td></tr>
        <tr><td>Produkt, das …-Fache, mal</td><td>·</td><td>„das Dreifache einer Zahl“ → ${m("3x")}</td></tr>
        <tr><td>Quotient, Hälfte, Drittel, geteilt</td><td>:</td><td>„die Hälfte einer Zahl“ → ${m("x/2")}</td></tr></table>`,
      profi: `<p>Wird eine <b>ganze Summe oder Differenz</b> vervielfacht, braucht man Klammern: „das Dreifache der Summe aus einer Zahl und 4“ → ${m("3(x + 4)")}. Ohne Klammer würde nur das ${m("x")} verdreifacht.</p>
        <p><b>Muster:</b> Wächst eine Figur bei jedem Schritt um dieselbe Anzahl, steht diese Anzahl vor dem ${m("n")}. Beispiel: 4, 7, 10, 13 … wächst um 3. Für ${m("n = 1")} gilt ${m("3*1 = 3")}, es sind aber 4 – also ${m("3n + 1")}.</p>
        <p><b>Kosten:</b> fester Betrag + Preis pro Einheit · Anzahl, z. B. ${m("5 + 0,2x")}.</p>`,
      merke: `Variable = Platzhalter für eine Zahl. Term = Rechenausdruck ohne „=“. Wenn eine ganze Summe vervielfacht wird: Klammer setzen!`,
      examples: [
        { task: "„Das Doppelte einer Zahl, vermindert um 7“", lines: [["x", "die Zahl"], ["2x", "das Doppelte"], ["2x - 7", "vermindert um 7"]] },
        { task: "„Das Doppelte der Differenz aus einer Zahl und 7“", lines: [["x - 7", "erst die Differenz"], ["2(x - 7)", "dann die ganze Differenz verdoppeln"]] },
        { task: "Umfang eines Rechtecks mit den Seiten x und x + 3", lines: [["2x + 2(x + 3)", "2 · Breite + 2 · Länge"], ["= 4x + 6", "vereinfacht"]] },
      ],
      errors: [["Differenz aus 5 und x: x − 5", "5 − x", "Bei „Differenz aus A und B“ steht A vorne."], ["Das Dreifache der Summe aus x und 4: 3x + 4", "3(x + 4)", "Die ganze Summe wird verdreifacht – Klammer!"]],
    },
    {
      id: "einsetzen", nr: 2, part: "Terme", icon: "🔢", color: "#0f9d8a", title: "Termwerte berechnen", short: "Zahlen für Variablen einsetzen",
      goals: ["Ich kann eine Zahl für eine Variable einsetzen und den Wert ausrechnen.", "Ich beachte „Punkt vor Strich“ und Klammern.", "Ich setze negative Zahlen richtig in Klammern ein."],
      basis: `<p>Setzt man für die Variable eine Zahl ein, kann man den <b>Wert des Terms</b> ausrechnen.</p>
        <p>Beispiel: ${m("3x + 5")} für ${m("x = 4")}: Ersetze ${m("x")} durch 4 → ${m("3*4 + 5 = 12 + 5 = 17")}.</p>
        <p>Achtung: ${m("3x")} heißt ${m("3*x")}. Für ${m("x = 4")} ist ${m("3x")} also 12 – nicht 34!</p>
        <h4>Reihenfolge beim Rechnen</h4><ol><li>Klammern zuerst</li><li>Potenzen (hoch 2)</li><li>Punktrechnung (· und :)</li><li>Strichrechnung (+ und −)</li></ol>`,
      profi: `<p>Negative Zahlen setzt man <b>in Klammern</b> ein: ${m("x^2")} für ${m("x = -3")} ist ${m("(-3)^2 = 9")}. Ohne Klammer stünde da ${m("-3^2 = -9")} – das ist etwas anderes!</p>
        <p><b>Wertetabelle:</b> Man setzt nacheinander mehrere Zahlen ein und schreibt die Ergebnisse in eine Tabelle. So sieht man, wie sich der Term verhält.</p>
        <p><b>Gleichwertige Terme</b> haben für <i>jede</i> Zahl denselben Wert. Ein einziges Gegenbeispiel zeigt: Die Terme sind <i>nicht</i> gleichwertig.</p>`,
      merke: `Variable durch die Zahl ersetzen, negative Zahlen in Klammern, dann: Klammer → Potenz → Punkt → Strich.`,
      examples: [
        { task: "Berechne 2x − 7 für x = 5", lines: [["2*5 - 7", "einsetzen"], ["= 10 - 7", "Punkt vor Strich"], ["= 3", ""]] },
        { task: "Berechne x² − 4x für x = −2", lines: [["(-2)^2 - 4*(-2)", "in Klammern einsetzen"], ["= 4 + 8", "Minus mal Minus = Plus"], ["= 12", ""]] },
      ],
      errors: [["3x für x = 4 → 34", "3 · 4 = 12", "3x bedeutet 3 mal x."], ["x² für x = −3 → −9", "(−3)² = 9", "Negative Zahlen in Klammern einsetzen."]],
    },
    {
      id: "zusammenfassen", nr: 3, part: "Terme", icon: "🧺", color: "#e0892b", title: "Terme zusammenfassen", short: "Gleichartiges sammeln",
      goals: ["Ich erkenne gleichartige Glieder.", "Ich kann Summen wie 3x + 5x + 2 zusammenfassen.", "Ich kann Produkte wie 3 · 4x vereinfachen."],
      basis: `<p>Man darf nur <b>gleichartige Glieder</b> zusammenfassen. Gleichartig heißt: gleiche Variable (und gleiche Hochzahl).</p>
        <p>Stell dir Obst vor: 3 Äpfel + 5 Äpfel = 8 Äpfel. Aber 3 Äpfel + 2 Birnen bleiben 3 Äpfel + 2 Birnen.</p>
        <p>${m("3x + 5x = 8x")} &nbsp;✓ &nbsp;&nbsp; ${m("4x + 2")} bleibt ${m("4x + 2")} &nbsp;✓ &nbsp;&nbsp; ${m("4x + 2 = 6x")} &nbsp;✗</p>
        <h4>So gehst du vor</h4><ol><li>Ordnen: Gleichartige Glieder nebeneinander schreiben. Das Rechenzeichen wandert mit!</li><li>Die Zahlen vor den Variablen addieren oder subtrahieren.</li></ol>
        <p><b>Produkte:</b> Zahlen mit Zahlen multiplizieren, Variablen dahinter schreiben: ${m("3*4x = 12x")}, ${m("2a*5b = 10ab")}.</p>`,
      profi: `<p>${m("x^2")} und ${m("x")} sind <b>nicht</b> gleichartig: ${m("3x^2 + 2x")} bleibt so stehen.</p>
        <p>Beim Multiplizieren gleicher Variablen addiert man die Hochzahlen: ${m("x*x = x^2")}, ${m("x^2*x = x^3")}, ${m("2x*3x = 6x^2")}.</p>
        <p>Die Reihenfolge der Variablen ist egal: ${m("xy")} und ${m("yx")} sind gleichartig (Kommutativgesetz).</p>`,
      merke: `Nur Gleichartiges zusammenfassen. Das Rechenzeichen gehört immer zum Glied dahinter.`,
      examples: [
        { task: "4x + 3 − x + 5", lines: [["4x - x + 3 + 5", "ordnen (Zeichen wandern mit)"], ["= 3x + 8", "zusammenfassen"]] },
        { task: "5a − 2b − 3a + 6b", lines: [["5a - 3a - 2b + 6b", "ordnen"], ["= 2a + 4b", ""]] },
        { task: "2x · 4x − x²", lines: [["8x^2 - x^2", "Produkt zuerst"], ["= 7x^2", ""]] },
      ],
      errors: [["3x + 2 = 5x", "3x + 2", "x-Glieder und Zahlen sind nicht gleichartig."], ["x + x = x²", "2x", "x² wäre x · x."], ["2x² + 3x² = 5x⁴", "5x²", "Beim Addieren bleibt die Hochzahl."]],
    },
    {
      id: "klammern", nr: 4, part: "Terme", icon: "🔓", color: "#d94f70", title: "Klammern auflösen", short: "Ausmultiplizieren & Minusklammer",
      goals: ["Ich kann einen Faktor mit einer Klammer ausmultiplizieren.", "Ich kann Plus- und Minusklammern auflösen.", "Profi: Ich kann zwei Klammern multiplizieren und kenne die binomischen Formeln."],
      basis: `<p><b>Distributivgesetz:</b> Der Faktor vor der Klammer wird mit <b>jedem</b> Glied in der Klammer multipliziert.</p>
        <div class="formula">${m("a(b + c) = ab + ac")}</div>
        <p>Beispiel: ${m("3(x + 4) = 3*x + 3*4 = 3x + 12")}</p>
        <p><b>Plusklammer:</b> Steht nur ein Plus vor der Klammer, lässt man sie einfach weg: ${m("5 + (2x - 3) = 5 + 2x - 3")}</p>
        <p><b>Minusklammer:</b> Steht ein Minus vor der Klammer, drehen sich beim Weglassen <b>alle</b> Vorzeichen in der Klammer um: ${m("7x - (2x - 3) = 7x - 2x + 3")}</p>`,
      profi: `<p><b>Klammer mal Klammer:</b> Jedes Glied der ersten Klammer mit jedem Glied der zweiten Klammer multiplizieren.</p>
        <div class="formula">${m("(a + b)(c + d) = ac + ad + bc + bd")}</div>
        <p><b>Binomische Formeln</b> sind Abkürzungen dafür:</p>
        <div class="formula">${m("(a + b)^2 = a^2 + 2ab + b^2")}<br>${m("(a - b)^2 = a^2 - 2ab + b^2")}<br>${m("(a + b)(a - b) = a^2 - b^2")}</div>
        <p>Achtung: ${m("(x + 3)^2")} ist <b>nicht</b> ${m("x^2 + 9")}! Das gemischte Glied ${m("2*x*3 = 6x")} fehlt sonst.</p>`,
      merke: `Faktor · jedes Glied. Minus vor der Klammer: alle Vorzeichen in der Klammer umdrehen.`,
      examples: [
        { task: "−2(x − 5)", lines: [["(-2)*x + (-2)*(-5)", "jedes Glied mal −2"], ["= -2x + 10", "Minus mal Minus = Plus"]] },
        { task: "4x − (x − 6)", lines: [["4x - x + 6", "Minusklammer: Vorzeichen umdrehen"], ["= 3x + 6", ""]] },
        { task: "(x + 2)(x + 5)", lines: [["x*x + 5x + 2x + 10", "jedes mit jedem"], ["= x^2 + 7x + 10", ""]] },
      ],
      errors: [["3(x + 4) = 3x + 4", "3x + 12", "Auch die 4 wird mit 3 multipliziert."], ["5 − (x − 2) = 5 − x − 2", "5 − x + 2", "Minusklammer: alle Vorzeichen umdrehen."], ["(x + 3)² = x² + 9", "x² + 6x + 9", "Das gemischte Glied 2ab nicht vergessen."]],
    },
    {
      id: "ausklammern", nr: 5, part: "Terme", icon: "📦", color: "#8a56d6", title: "Ausklammern", short: "Faktorisieren – rückwärts denken",
      goals: ["Ich finde gemeinsame Faktoren.", "Ich kann einen Faktor ausklammern, z. B. 4x + 8 = 4(x + 2).", "Profi: Ich nutze binomische Formeln rückwärts."],
      basis: `<p>Ausklammern ist das <b>Gegenteil</b> von Ausmultiplizieren. Man sucht einen Faktor, der in <b>allen</b> Gliedern steckt, und schreibt ihn vor die Klammer.</p>
        <div class="formula">${m("ab + ac = a(b + c)")}</div>
        <p>Beispiel: ${m("4x + 8")}: In ${m("4x")} und in ${m("8 = 4*2")} steckt die 4. Also ${m("4x + 8 = 4(x + 2)")}.</p>
        <h4>So gehst du vor</h4><ol><li>Gemeinsamen Faktor suchen (größte Zahl, die alle Zahlen teilt).</li><li>Faktor vor die Klammer schreiben.</li><li>In die Klammer: jedes Glied geteilt durch den Faktor.</li><li>Probe: wieder ausmultiplizieren!</li></ol>`,
      profi: `<p>Man kann auch <b>Variablen</b> ausklammern: ${m("x^2 + 5x = x(x + 5)")}, ${m("6x^2y - 9xy = 3xy(2x - 3)")}.</p>
        <p>Wenn ein ganzes Glied ausgeklammert wird, bleibt eine <b>1</b> stehen: ${m("3a + 3 = 3(a + 1)")} – nicht ${m("3(a + 0)")}!</p>
        <p><b>Binomische Formeln rückwärts:</b> ${m("x^2 + 6x + 9 = (x + 3)^2")}, ${m("x^2 - 25 = (x + 5)(x - 5)")}. Tipp: Suche zuerst Quadratzahlen.</p>`,
      merke: `Ausklammern = gemeinsamen Faktor vor die Klammer ziehen. Probe durch Ausmultiplizieren.`,
      examples: [
        { task: "6x − 9", lines: [["3*2x - 3*3", "gemeinsamer Faktor 3"], ["= 3(2x - 3)", ""]] },
        { task: "x² − 7x", lines: [["x*x - 7*x", "x steckt in beiden Gliedern"], ["= x(x - 7)", ""]] },
        { task: "x² − 16", lines: [["x^2 - 4^2", "3. binomische Formel"], ["= (x + 4)(x - 4)", ""]] },
      ],
      errors: [["4x + 8 = 4(x + 8)", "4(x + 2)", "Jedes Glied durch den Faktor teilen."], ["3a + 3 = 3a", "3(a + 1)", "Es bleibt eine 1 in der Klammer."]],
    },
    {
      id: "gleichungen", nr: 6, part: "Gleichungen", icon: "⚖️", color: "#1f8fd6", title: "Gleichungen verstehen", short: "Waage, Lösung, Probe",
      goals: ["Ich weiß, was eine Gleichung und eine Lösung ist.", "Ich kann mit der Probe prüfen, ob eine Zahl eine Lösung ist.", "Ich kenne erlaubte Umformungen (Äquivalenzumformungen)."],
      basis: `<p>Eine <b>Gleichung</b> besteht aus zwei Termen mit einem Gleichheitszeichen dazwischen, z. B. ${m("2x + 3 = 11")}.</p>
        <p>Eine <b>Lösung</b> ist eine Zahl, die die Gleichung wahr macht. Für ${m("x = 4")} gilt ${m("2*4 + 3 = 11")} ✓. Also ist 4 die Lösung. Man schreibt ${m("L = {4}")}.</p>
        <p><b>Die Waage:</b> Eine Gleichung ist wie eine Waage im Gleichgewicht. Wenn du auf <b>beiden Seiten dasselbe</b> wegnimmst oder dazulegst, bleibt sie im Gleichgewicht.</p>
        <p><b>Probe:</b> Setze deine Lösung in die Ausgangsgleichung ein. Kommt links und rechts dasselbe heraus, stimmt sie.</p>`,
      profi: `<p><b>Äquivalenzumformungen</b> verändern die Lösung nicht:</p>
        <ul><li>auf beiden Seiten dieselbe Zahl oder denselben Term addieren/subtrahieren</li><li>beide Seiten mit derselben Zahl ≠ 0 multiplizieren oder dividieren</li></ul>
        <p>Niemals mit 0 multiplizieren oder durch 0 teilen!</p>
        <p><b>Sonderfälle:</b> Fallen alle ${m("x")} weg, gibt es entweder <b>keine Lösung</b> (z. B. ${m("3 = 5")} – falsch, ${m("L = { }")}) oder <b>unendlich viele</b> (z. B. ${m("3 = 3")} – immer wahr).</p>
        <p>Man schreibt die Umformung rechts hinter einen Strich: ${m("2x + 3 = 11   | -3")}</p>`,
      merke: `Was du auf der einen Seite machst, musst du auch auf der anderen Seite machen. Zum Schluss: Probe!`,
      examples: [
        { task: "Ist x = 3 Lösung von 4x − 5 = 7?", lines: [["4*3 - 5 = 7", "einsetzen"], ["7 = 7", "✓ wahr – ja, Lösung"]] },
        { task: "Ist x = −1 Lösung von 2x + 6 = 3?", lines: [["2*(-1) + 6 = 4", "einsetzen"], ["4 ≠ 3", "✗ keine Lösung"]] },
      ],
      errors: [["Nur links −3 rechnen", "Beide Seiten −3", "Sonst kippt die Waage."], ["Beide Seiten · 0", "nicht erlaubt", "Dann steht 0 = 0 da – die Information ist weg."]],
    },
    {
      id: "loesen", nr: 7, part: "Gleichungen", icon: "🎯", color: "#2e9e6a", title: "Gleichungen lösen", short: "Umformen bis x = …",
      goals: ["Ich kann einfache Gleichungen wie 3x + 4 = 19 lösen.", "Ich kann Gleichungen mit x auf beiden Seiten lösen.", "Profi: Ich löse Gleichungen mit Klammern und Brüchen."],
      basis: `<p>Ziel: ${m("x")} soll <b>allein</b> auf einer Seite stehen. Dazu machst du die Rechnungen „rückgängig“ – mit der <b>Gegenoperation</b>:</p>
        <table class="tbl"><tr><th>steht da</th><th>Gegenoperation</th></tr><tr><td>+ 5</td><td>| −5</td></tr><tr><td>− 5</td><td>| +5</td></tr><tr><td>· 3 (also 3x)</td><td>| :3</td></tr><tr><td>: 3</td><td>| ·3</td></tr></table>
        <h4>Reihenfolge</h4><ol><li>Erst die Zahl ohne x wegbringen (Plus/Minus).</li><li>Dann die Zahl vor dem x wegbringen (Teilen).</li><li>Probe machen.</li></ol>`,
      profi: `<p><b>x auf beiden Seiten:</b> Bringe zuerst alle x auf eine Seite (z. B. ${m("| -2x")}), dann wie gewohnt weiter.</p>
        <h4>Fahrplan für schwierige Gleichungen</h4><ol><li>Klammern auflösen</li><li>Jede Seite zusammenfassen</li><li>x-Glieder auf eine Seite</li><li>Zahlen auf die andere Seite</li><li>Durch die Zahl vor x teilen</li><li>Probe</li></ol>
        <p>Die Lösung muss keine ganze Zahl sein: ${m("4x = 3")} → ${m("x = 3/4")}.</p>
        <p>Bei Brüchen hilft Multiplizieren: ${m("x/3 = 5   | *3")} → ${m("x = 15")}.</p>`,
      merke: `Gegenoperation auf beiden Seiten: erst Plus/Minus, dann Mal/Geteilt. Ziel: x = Zahl.`,
      examples: [
        { task: "3x + 4 = 19", lines: [["3x + 4 = 19", "| −4"], ["3x = 15", "| :3"], ["x = 5", "Probe: 3 · 5 + 4 = 19 ✓"]] },
        { task: "5x − 3 = 2x + 9", lines: [["5x - 3 = 2x + 9", "| −2x"], ["3x - 3 = 9", "| +3"], ["3x = 12", "| :3"], ["x = 4", ""]] },
        { task: "2(x + 3) = 4x − 2", lines: [["2x + 6 = 4x - 2", "Klammer auflösen | −4x"], ["-2x + 6 = -2", "| −6"], ["-2x = -8", "| :(−2)"], ["x = 4", ""]] },
      ],
      errors: [["3x = 15 → x = 12 (−3 gerechnet)", "x = 5", "3x heißt 3 · x, also teilen."], ["−2x = −8 → x = −4", "x = 4", "Minus durch Minus = Plus."]],
    },
    {
      id: "sachaufgaben", nr: 8, part: "Gleichungen", icon: "🧩", color: "#c2410c", title: "Textaufgaben", short: "Vom Text zur Gleichung",
      goals: ["Ich kann eine Variable sinnvoll festlegen.", "Ich kann aus einem Text eine Gleichung aufstellen.", "Ich löse die Gleichung und schreibe einen Antwortsatz."],
      basis: `<h4>In 5 Schritten zur Lösung</h4><ol>
        <li><b>Lesen:</b> Was ist gesucht? Unterstreiche wichtige Zahlen.</li>
        <li><b>Variable festlegen:</b> „x = …“ (meist das Gesuchte oder das Kleinste).</li>
        <li><b>Gleichung aufstellen:</b> Den Text Stück für Stück übersetzen.</li>
        <li><b>Lösen</b> wie gewohnt.</li>
        <li><b>Antwortsatz</b> und Probe am Text.</li></ol>
        <p>Beispiel: „Ich denke mir eine Zahl, multipliziere sie mit 3 und addiere 5. Ich erhalte 26.“ → ${m("3x + 5 = 26")} → ${m("x = 7")}.</p>`,
      profi: `<p>Oft hängen mehrere Größen von ${m("x")} ab. Schreibe alle mit ${m("x")} auf:</p>
        <ul><li>„Lisa ist 3 Jahre älter als Ben“ → Ben: ${m("x")}, Lisa: ${m("x + 3")}</li><li>„doppelt so viel wie“ → ${m("2x")}</li><li>Aufeinanderfolgende Zahlen: ${m("x")}, ${m("x + 1")}, ${m("x + 2")}</li></ul>
        <p>Nützliches Wissen: Umfang Rechteck ${m("u = 2a + 2b")}, Winkelsumme im Dreieck 180°, Weg = Geschwindigkeit · Zeit.</p>
        <p><b>Tarifvergleich:</b> Zwei Kostenterme gleichsetzen – die Lösung ist der Punkt, an dem beide gleich viel kosten.</p>`,
      merke: `Gesucht → Variable → Gleichung → Lösung → Antwortsatz.`,
      examples: [
        { task: "Tom und seine Mutter sind zusammen 48 Jahre alt. Die Mutter ist 3-mal so alt wie Tom.", lines: [["x", "Toms Alter, Mutter: 3x"], ["x + 3x = 48", "Gleichung"], ["4x = 48", "| :4"], ["x = 12", "Tom ist 12, die Mutter 36."]] },
      ],
      errors: [["Antwort: x = 12", "Tom ist 12 Jahre alt.", "Immer mit Antwortsatz und Einheit."]],
    },
  ];

  // ---------- Einfache Sprache: kurze Sätze, ein Gedanke pro Zeile ----------
  const EASY = {
    terme: {
      text: [`Manchmal kennst du eine Zahl noch nicht.`, `Dann schreibst du einen Buchstaben, zum Beispiel ${m("x")}.`, `${m("x")} ist ein <b>Platzhalter</b> für eine Zahl.`, `Ein <b>Term</b> ist eine Rechnung mit Zahlen und Buchstaben. Zum Beispiel: ${m("3x + 5")}.`, `${m("3x")} heißt: 3 mal ${m("x")}.`],
      steps: ["Lies den Satz langsam.", "Suche die Signalwörter: <b>plus</b> (Summe, mehr), <b>minus</b> (Differenz, weniger), <b>mal</b> (-fache, Produkt), <b>geteilt</b> (Hälfte, Quotient).", `Schreibe für „eine Zahl“ ein ${m("x")}.`, "Schreibe die Rechnung in der richtigen Reihenfolge auf."],
      words: [["das Doppelte", "mal 2"], ["das Dreifache", "mal 3"], ["vermehrt um", "plus"], ["vermindert um", "minus"], ["die Hälfte", "geteilt durch 2"]],
    },
    einsetzen: {
      text: [`Du bekommst eine Zahl für ${m("x")}.`, `Du schreibst diese Zahl statt ${m("x")} hin.`, `Dann rechnest du aus.`, `Wichtig: <b>Punkt vor Strich</b>. Erst mal und geteilt, dann plus und minus.`],
      steps: [`Streiche das ${m("x")} durch.`, "Schreibe die Zahl hin. Ist die Zahl negativ? Dann setze Klammern: (−3).", "Rechne erst Klammern, dann mal und geteilt, dann plus und minus."],
      words: [["einsetzen", "die Zahl statt x hinschreiben"], ["Wert", "das Ergebnis"], ["Punkt vor Strich", "erst · und :, dann + und −"]],
    },
    zusammenfassen: {
      text: [`Gleiche Dinge darfst du zusammenzählen.`, `3 Äpfel + 5 Äpfel = 8 Äpfel.`, `Genauso: ${m("3x + 5x = 8x")}.`, `Aber: Äpfel und Birnen kannst du nicht zusammenzählen.`, `Genauso: ${m("3x + 2")} bleibt ${m("3x + 2")}.`],
      steps: [`Suche alle Teile mit ${m("x")}. Zähle sie zusammen.`, "Suche alle Zahlen ohne x. Zähle sie zusammen.", "Achtung: Das Minus gehört immer zu der Zahl dahinter."],
      words: [["gleichartig", "gleicher Buchstabe"], ["zusammenfassen", "Gleiches zusammenzählen"]],
    },
    klammern: {
      text: [`Vor der Klammer steht eine Zahl.`, `Diese Zahl rechnest du mal <b>jedes</b> Teil in der Klammer.`, `Beispiel: ${m("3(x + 4) = 3x + 12")}.`, `Steht ein Minus vor der Klammer? Dann drehst du alle Zeichen in der Klammer um: aus + wird −, aus − wird +.`],
      steps: ["Male einen Pfeil von der Zahl vor der Klammer zu jedem Teil in der Klammer.", "Rechne jeden Pfeil aus: Zahl mal Teil.", "Achte auf die Zeichen: Minus mal Minus ist Plus."],
      words: [["ausmultiplizieren", "Klammer wegmachen, alles mal nehmen"], ["Minusklammer", "Minus vor der Klammer: Zeichen umdrehen"]],
    },
    ausklammern: {
      text: [`Ausklammern ist das <b>Rückwärts-Rechnen</b> vom Ausmultiplizieren.`, `Du suchst eine Zahl, die in allen Teilen steckt.`, `Beispiel: In ${m("4x")} und in ${m("8")} steckt die 4.`, `Also: ${m("4x + 8 = 4(x + 2)")}.`],
      steps: ["Welche Zahl teilt alle Zahlen? Nimm die größte.", "Schreibe diese Zahl vor die Klammer.", "Teile jedes Teil durch die Zahl. Schreibe das Ergebnis in die Klammer.", "Probe: Rechne die Klammer wieder aus."],
      words: [["Faktor", "Zahl beim Malnehmen"], ["gemeinsam", "steckt in allen Teilen"]],
    },
    gleichungen: {
      text: [`Eine <b>Gleichung</b> hat ein Gleich-Zeichen =.`, `Links und rechts ist gleich viel. Wie bei einer Waage.`, `Die <b>Lösung</b> ist die Zahl für ${m("x")}, bei der beide Seiten gleich sind.`, `Bei der <b>Probe</b> setzt du die Zahl ein und prüfst: Ist links gleich rechts?`],
      steps: ["Setze die Zahl für x ein.", "Rechne die linke Seite aus.", "Rechne die rechte Seite aus.", "Gleich? Dann ist es die Lösung."],
      words: [["Lösung", "die passende Zahl für x"], ["Probe", "einsetzen und prüfen"], ["Umformung", "auf beiden Seiten das Gleiche rechnen"]],
    },
    loesen: {
      text: [`Du willst wissen: Welche Zahl ist ${m("x")}?`, `Dazu muss ${m("x")} am Ende allein stehen.`, `Du rechnest auf <b>beiden Seiten das Gleiche</b>.`, `Du machst alles rückwärts: Aus plus wird minus. Aus mal wird geteilt.`],
      steps: ["Zuerst: Die Zahl ohne x wegmachen. Steht da +5? Rechne auf beiden Seiten −5.", "Dann: Die Zahl vor dem x wegmachen. Steht da 3x? Teile beide Seiten durch 3.", "Am Ende steht da: x = Zahl."],
      words: [["Gegenrechnung", "+ ↔ −, · ↔ :"], ["beide Seiten", "links und rechts vom ="]],
    },
    sachaufgaben: {
      text: [`In einer Textaufgabe steckt eine Gleichung.`, `Du suchst eine Zahl. Diese Zahl nennst du ${m("x")}.`, `Dann schreibst du den Text als Rechnung auf.`, `Am Ende schreibst du einen Antwortsatz.`],
      steps: ["Was wird gesucht? Das ist x.", "Übersetze den Text Stück für Stück in eine Rechnung.", "Löse die Gleichung.", "Antworte in einem Satz."],
      words: [["Ich denke mir eine Zahl", "x"], ["Ich erhalte …", "= …"], ["zusammen", "plus"]],
    },
  };
  STATIONS.forEach(s => s.easy = EASY[s.id]);

  const LEVELS_INFO = [
    { n: 1, name: "Zahlen-Neuling" }, { n: 2, name: "Variablen-Entdecker" }, { n: 3, name: "Term-Bastler" }, { n: 4, name: "Klammer-Knacker" },
    { n: 5, name: "Waage-Meister" }, { n: 6, name: "Gleichungs-Löser" }, { n: 7, name: "Algebra-Ass" }, { n: 8, name: "x-Flüsterer" },
    { n: 9, name: "Mathe-Magier" }, { n: 10, name: "Gleichungs-Guru" },
  ];
  const LEVEL_XP = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
  const LEVELS = LEVELS_INFO.map((l, i) => ({ ...l, xp: LEVEL_XP[i] }));

  const AVATARS = [
    { a: "🦊", lv: 1 }, { a: "🐼", lv: 1 }, { a: "🐸", lv: 1 }, { a: "🐱", lv: 1 }, { a: "🦉", lv: 2 }, { a: "🐙", lv: 3 }, { a: "🦄", lv: 4 },
    { a: "🐲", lv: 5 }, { a: "🤖", lv: 6 }, { a: "🧙", lv: 7 }, { a: "👽", lv: 8 }, { a: "🦁", lv: 9 }, { a: "👑", lv: 10 },
  ];

  const BADGES = [
    { id: "first", icon: "👣", name: "Erster Schritt", desc: "Die erste Übungsrunde geschafft" },
    { id: "perfect", icon: "💯", name: "Fehlerfrei", desc: "Eine Runde ohne Fehler" },
    { id: "combo5", icon: "🔥", name: "Heiße Serie", desc: "5 richtige Antworten hintereinander" },
    { id: "combo10", icon: "☄️", name: "Unaufhaltsam", desc: "10 richtige Antworten hintereinander" },
    { id: "profi", icon: "🏆", name: "Profi-Mut", desc: "Eine Profi-Runde gespielt" },
    { id: "nohint", icon: "🧠", name: "Ohne Spickzettel", desc: "Profi-Runde mit 3 Sternen ohne Tipp" },
    { id: "reader", icon: "📖", name: "Leseratte", desc: "4 Lernseiten gelesen" },
    { id: "allbasis", icon: "🧱", name: "Fundament", desc: "Alle 8 Stationen auf Basis mit mindestens 1 Stern" },
    { id: "stars10", icon: "⭐", name: "Sternensammler", desc: "10 Sterne gesammelt" },
    { id: "stars30", icon: "🌟", name: "Sternenfänger", desc: "30 Sterne gesammelt" },
    { id: "stars72", icon: "🌌", name: "Sternenhimmel", desc: "Alle 72 Sterne gesammelt" },
    { id: "waage5", icon: "⚖️", name: "Waage-Profi", desc: "5 Gleichungen im Waage-Trainer gelöst" },
    { id: "blitz15", icon: "⚡", name: "Blitzschnell", desc: "15 Punkte in einer Blitzrunde" },
    { id: "memory", icon: "🧩", name: "Paar-Profi", desc: "Ein Term-Memory gelöst" },
    { id: "daily3", icon: "📅", name: "Dranbleiber", desc: "3 Tages-Challenges geschafft" },
    { id: "streak3", icon: "📆", name: "3 Tage am Stück", desc: "An 3 Tagen hintereinander geübt" },
    { id: "streak7", icon: "🗓️", name: "Wochen-Held", desc: "An 7 Tagen hintereinander geübt" },
    { id: "boss", icon: "🐉", name: "Drachenbezwinger", desc: "Den Term-Drachen besiegt" },
    { id: "bossprofi", icon: "👑", name: "Drachen-König", desc: "Den Term-Drachen auf Profi besiegt" },
  ];

  const GLOSSARY = [
    ["Variable", `Platzhalter für eine Zahl, z. B. ${m("x")}.`],
    ["Term", `Rechenausdruck aus Zahlen, Variablen und Rechenzeichen, ohne „=“, z. B. ${m("3x + 5")}.`],
    ["Koeffizient", `Die Zahl vor der Variablen: In ${m("7x")} ist 7 der Koeffizient.`],
    ["Glied (Summand)", `Ein Teil einer Summe: ${m("3x + 5")} hat die Glieder ${m("3x")} und ${m("5")}.`],
    ["gleichartige Glieder", `Glieder mit gleicher Variable und Hochzahl: ${m("3x")} und ${m("-5x")}.`],
    ["gleichwertige Terme", `Terme, die für jede Zahl denselben Wert haben: ${m("2(x + 1)")} und ${m("2x + 2")}.`],
    ["Distributivgesetz", `${m("a(b + c) = ab + ac")} – Grundlage für Ausmultiplizieren und Ausklammern.`],
    ["Ausmultiplizieren", `Klammer auflösen: ${m("3(x + 2) = 3x + 6")}.`],
    ["Ausklammern (Faktorisieren)", `Gemeinsamen Faktor vor die Klammer ziehen: ${m("3x + 6 = 3(x + 2)")}.`],
    ["binomische Formeln", `${m("(a + b)^2 = a^2 + 2ab + b^2")}, ${m("(a - b)^2 = a^2 - 2ab + b^2")}, ${m("(a + b)(a - b) = a^2 - b^2")}`],
    ["Gleichung", `Zwei Terme mit „=“ verbunden: ${m("2x + 3 = 11")}.`],
    ["Lösung", `Zahl, die die Gleichung wahr macht.`],
    ["Lösungsmenge L", `Menge aller Lösungen, z. B. ${m("L = {4}")}. Keine Lösung: ${m("L = { }")}.`],
    ["Äquivalenzumformung", "Umformung, die die Lösung nicht verändert (auf beiden Seiten dasselbe tun, nicht · 0)."],
    ["Gegenoperation", "Macht eine Rechnung rückgängig: + ↔ −, · ↔ :."],
    ["Probe", "Lösung in die Ausgangsgleichung einsetzen und prüfen, ob beide Seiten gleich sind."],
  ];

  const CHEAT = `
    <h3>Terme</h3>
    <ul><li>${m("3x")} bedeutet ${m("3*x")}; ${m("x")} bedeutet ${m("1x")}</li>
    <li>Zusammenfassen nur bei gleichartigen Gliedern: ${m("3x + 5x = 8x")}</li>
    <li>${m("x*x = x^2")}, ${m("2a*3b = 6ab")}</li>
    <li>Ausmultiplizieren: ${m("a(b + c) = ab + ac")}</li>
    <li>Minusklammer: ${m("-(b - c) = -b + c")}</li>
    <li>Ausklammern: ${m("ab + ac = a(b + c)")}</li></ul>
    <h3>Binomische Formeln</h3>
    <div class="formula">${m("(a + b)^2 = a^2 + 2ab + b^2")}<br>${m("(a - b)^2 = a^2 - 2ab + b^2")}<br>${m("(a + b)(a - b) = a^2 - b^2")}</div>
    <h3>Gleichungen lösen</h3>
    <ol><li>Klammern auflösen, zusammenfassen</li><li>x auf eine Seite</li><li>Zahlen auf die andere Seite</li><li>durch die Zahl vor x teilen</li><li>Probe!</li></ol>
    <p>Vorzeichenregeln: ${m("+ * + = +")}, ${m("- * - = +")}, ${m("+ * - = -")}</p>`;

  G.XQC = { STATIONS, LEVELS, AVATARS, BADGES, GLOSSARY, CHEAT };
})(window);
