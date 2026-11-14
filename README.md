# x-Quest · Terme & Gleichungen · Mathe Klasse 8

Lern-App für die 8. Klasse (Berlin, Integrierte Sekundarschule) zum Thema **Terme und Gleichungen**.
Alle Aufgaben gibt es in **drei Niveaus**, damit jede Schülerin und jeder Schüler passend üben kann:

| Niveau | Für wen | XP pro Aufgabe |
|---|---|---|
| 🌱 **Basis** | Grundlagen sichern, kleine Zahlen, viele Tipps | 10 |
| 🚀 **Standard** | sicher anwenden, negative Zahlen, x auf beiden Seiten | 15 |
| 🏆 **Profi** | Vertiefung: binomische Formeln, Brüche, knifflige Textaufgaben | 20 |

Die App empfiehlt nach jeder Runde ein passendes Niveau (hoch oder zurück), lässt aber immer frei wählen.

## Aufbau für Schüler: 4 Bereiche (unten im Register)

| Bereich | Was drin ist |
|---|---|
| 🏠 **Start** | Level & Serie, „Weiterlernen“ mit Niveau-Empfehlung, Tages-Challenge, Lernweg |
| 📖 **Lernen** | 8 Stationen, jeweils **Lesen** (Grundlagen / + Vertiefung, Merke, typische Fehler) → **Beispiele** (Schritt für Schritt aufdecken) → **Üben** (3 Niveaus). Dazu Spickzettel und Lexikon |
| 🎯 **Üben** | Stationen-Quiz, Mix-Quiz, Tages-Challenge, ⚡ Blitzrunde, ⚖️ Waage-Trainer, 🧩 Term-Memory, 🐉 Term-Drache (Endgegner) |
| 🙂 **Ich** | Avatar, Level, Statistik, 19 Abzeichen, Sterne pro Station, Einstellungen |

**Stationen:** Teil A – Terme: 1 Terme aufstellen · 2 Termwerte berechnen · 3 Terme zusammenfassen · 4 Klammern auflösen · 5 Ausklammern.
Teil B – Gleichungen: 6 Gleichungen verstehen · 7 Gleichungen lösen · 8 Textaufgaben.

## Besonderheiten

- **Unendlich viele Aufgaben:** Alle Aufgaben werden zufällig erzeugt (über 100 Aufgabentypen).
- **Echte Term-Eingabe:** Schüler tippen Terme selbst ein (Bildschirmtasten für x, ², Klammern …). Die App erkennt gleichwertige Terme (`3x+12` = `12+3x`) und gibt Rückmeldung, wenn ein Ergebnis gleichwertig, aber noch nicht fertig vereinfacht oder ausgeklammert ist.
- **Lösungsweg zu jeder Aufgabe**, falsch gelöste Aufgaben kommen in ähnlicher Form am Ende der Runde nochmal.
- **Waage-Trainer:** Schüler wählen die Umformung selbst (z. B. „−5“, „:3“), die App führt sie auf beiden Seiten aus. Auf Basis-Niveau wird eine Waage gezeichnet.
- **Tages-Challenge:** jeden Tag 5 neue Aufgaben, für alle in der Klasse gleich (gut zum Vergleichen im Unterricht).
- **Gamification:** XP, 10 Level, Sterne (72 insgesamt), Serien-Bonus, Lernserie in Tagen, Abzeichen, freischaltbare Avatare, Konfetti, Töne (abschaltbar).

## Online stellen (GitHub Pages)

1. Im Repository auf **Settings → Pages** gehen.
2. Bei *Source* „Deploy from a branch“, Branch **main**, Ordner **/ (root)**, **Save**.
3. Nach ca. 1–2 Minuten ist die App unter `https://lupo2701.github.io/Mathe/` erreichbar.

Hinweis: Dieses Repository ist **privat**. GitHub Pages funktioniert bei privaten Repositories nur mit einem kostenpflichtigen Konto. Mit einem kostenlosen Konto das Repository auf öffentlich stellen (Settings → General → Danger Zone → Change visibility).

Lokal: einfach `index.html` im Browser öffnen.

## Datenschutz

Spitzname und Fortschritt werden nur im Browser des Geräts gespeichert (localStorage). Kein Server, keine Anmeldung, keine Datenübertragung.

## Inhalte bearbeiten

```
index.html      Startseite
css/style.css   Gestaltung
js/core.js      Mathe-Kern: Brüche, Term-Parser, Gleichwertigkeit
js/tasks.js     Aufgabengeneratoren (pro Station und Niveau)
js/content.js   Lerntexte, Beispiele, Lexikon, Level, Abzeichen
js/app.js       App-Logik und Spiele
```
