# Konzept: WI-MB im Modulplaner (allein und kombiniert mit ESE)

Stand: 14.10.2026, Konzeptphase. Noch nichts davon ist umgesetzt.

Abkürzungen: WI-MB = M.Sc. Wirtschaftsingenieurwesen, technische Fachrichtung Maschinenbau (Prüfungsordnung, PO, 2020). ESE = M.Sc. Energy Science and Engineering (PO 2023). CP = Credit Points. RuW = Rechts- und Wirtschaftswissenschaften. APB = Allgemeine Prüfungsbestimmungen der TU Darmstadt.

Quellen: Studien- und Prüfungsplan WI-MB PO 2020 (Studienordnung, Anhang I) und Modulhandbuch WI-MB, Stand 01.10.2025.

## 1. Was WI-MB schwieriger macht als ESE

ESE hat eine flache Struktur: fünf Bereiche mit CP-Grenzen und eine Zusatzregel (Vertiefung). WI-MB ist verschachtelt, und die Regeln zählen nicht nur CP, sondern auch Module.

```
WI-MB, 120 CP
├─ RuW, 42 CP
│  ├─ Wahlbereich            36 CP, 6 bis 8 Module, Katalog (ca. 45 Module)
│  └─ Masterseminar           6 CP, genau 1 Modul (Pflicht)
├─ Maschinenbau, 42 CP
│  ├─ Kernbereich            32 bis 42 CP
│  │  ├─ Grundlagen           6 bis 18 CP, mind. 1 Modul (3 Module im Handbuch)
│  │  └─ Weiterführende      14 bis 32 CP, 2 bis 10 Module (58 Module)
│  ├─ Praxisbereich           4 bis 6 CP, 1 bis 2 Module (Tutorium, Advanced Design/Research Project)
│  └─ Wahlbereich (freiwillig) 0 bis 10 CP
│     ├─ Natur- und Ingenieurwissenschaften   max. 2 Module (ca. 95 Module)
│     └─ Ergänzungsbereich                    max. 2 Module (ca. 30 Module)
├─ Studium Generale           6 CP, Gesamtkatalog der TU Darmstadt
│  (Externe Projektarbeit 6 CP steht im selben Block, vermutlich als Alternative)
└─ Masterthesis              30 CP, Variante: interdisziplinär, am FB RuW oder am FB Maschinenbau
```

Daraus folgen vier Regelarten, die ESE heute nicht kennt:

| Regelart | Beispiel |
|---|---|
| Grenzen auf jeder Ebene, Summe muss oben passen | Kern + Praxis + Wahl müssen zusammen 42 ergeben. Weil Praxis mind. 4 CP hat, ist der Kern praktisch auf 38 CP begrenzt, obwohl 42 dasteht. |
| Anzahl Module statt CP | Ergänzungsbereich max. 2 Module, RuW-Wahlbereich 6 bis 8 Module |
| Freiwillige Bereiche | MB-Wahlbereich darf leer bleiben |
| Alternativen | Studium Generale oder Externe Projektarbeit; Thesis in einer von drei Varianten |

## 2. Grundidee: Regeln als Daten statt als Code

Heute stehen die ESE-Regeln fest in `src/regeln.js` (z. B. Grundlagen max. 31 CP). Für WI-MB würde das eine zweite, noch längere Sonderlogik ergeben. Stattdessen:

1. **Jeder Studiengang beschreibt seine Struktur als Baum** in einer Datendatei. Jeder Knoten hat optional `cp: {min, max}`, `module: {min, max}`, `freiwillig`, `alternativeZu`.
2. **Eine allgemeine Rechenfunktion** läuft den Baum ab: Sie summiert CP und Module je Knoten von unten nach oben und meldet je Knoten „erfüllt“, „offen“ oder „zu viel“.
3. **Sonderregeln** (z. B. ESE-Vertiefung ≥ 20 CP in einem Themenbereich) bleiben kleine benannte Zusatzfunktionen, die die Struktur per Namen anfordert.

Beispiel WI-MB, Teil Maschinenbau:

```js
{ id: 'mb', name: 'Maschinenbau', cp: { min: 42, max: 42 }, kinder: [
  { id: 'mb-kern', name: 'Kernbereich', cp: { min: 32, max: 42 }, kinder: [
    { id: 'mb-gl', name: 'Grundlagen', cp: { min: 6, max: 18 }, module: { min: 1 } },
    { id: 'mb-wf', name: 'Weiterführende Module', cp: { min: 14, max: 32 }, module: { min: 2, max: 10 } }
  ]},
  { id: 'mb-praxis', name: 'Praxisbereich', cp: { min: 4, max: 6 }, module: { min: 1, max: 2 } },
  { id: 'mb-wahl', name: 'Wahlbereich', cp: { max: 10 }, freiwillig: true, kinder: [
    { id: 'mb-nat', name: 'Natur- und Ingenieurwissenschaften', module: { max: 2 } },
    { id: 'mb-erg', name: 'Ergänzungsbereich', module: { max: 2 } }
  ]}
]}
```

ESE wird auf dasselbe Format umgestellt. Das ist der Prüfstein: Die bestehenden 28 Tests müssen danach dieselben Ergebnisse liefern. Dann gibt es eine Rechenlogik für beide Studiengänge.

**Module** stehen im Katalog einmal und nennen die Blätter des Baums, in denen sie zählen dürfen (`darf: ['mb-wf', 'mb-nat']`). Steht ein Modul in mehreren Blättern, wählt man an der Karte „zählt für“. Das gibt es für die ESE-Themenbereiche schon und wird hier verallgemeinert.

## 3. Variante A: WI-MB allein

Bedienung wie beim ESE-Planer: Semesterspalten, Katalog, Häkchen, Note. Unterschiede:

| Teil | Lösung |
|---|---|
| Fortschritt | **Aufklappbarer Baum** statt flacher Balken. Oben die vier Hauptbereiche mit Balken, darunter auf Antippen die Unterbereiche. Je Zeile CP *und* Modulanzahl, z. B. „Praxisbereich 4 / 4–6 CP · 1 / 1–2 Module ✓“. |
| Spielraum | Je Bereich wird angezeigt, wie viel noch frei verteilbar ist. Beispiel Maschinenbau: Mindestwerte zusammen 32 + 4 = 36 CP, also 6 CP Spielraum für mehr Kern oder für den Wahlbereich. |
| Katalog | Kapitel = Blätter des Baums (Grundlagen, Weiterführende, Praxis, Natur-/Ingenieurwiss., Ergänzung, RuW-Wahlbereich). Das Akkordeon der Handyansicht gibt es schon. Ein voller Bereich (z. B. Ergänzung mit 2 Modulen) wird im Katalog ausgegraut. |
| Hinweise | Kurz und konkret: „Ergänzungsbereich: max. 2 Module, du hast 3“, „Maschinenbau: 44 von 42 CP, 2 CP zu viel“. |
| Alternativen | Studium Generale vs. Externe Projektarbeit und die Thesis-Variante als Auswahlfeld an der Karte bzw. im Bereich. |
| Eigene Module | Wie bei ESE, mit Auswahl des Bereichs; für Studium Generale und Advanced Design Project vorbelegt. |

## 4. Variante B: ESE und WI-MB kombiniert (Doppelstudium)

Kernprinzip: **ein Zeitplan, ein Modul, zwei Anrechnungen.** Eine Lehrveranstaltung besucht man einmal, auch wenn sie in beiden Studiengängen zählen kann.

| Teil | Lösung |
|---|---|
| Semesterspalten | Gemeinsam für beide Studiengänge. Semesterlast zeigt die echte Gesamtlast (jedes Modul einmal gezählt). |
| Karte | Kleine Kennzeichen „ESE“ und/oder „WI“. Antippen zeigt je Studiengang „zählt für: …“ oder „nicht angerechnet“. |
| Fortschritt | Zwei Bäume nebeneinander (Desktop) bzw. Umschalter ESE / WI-MB (Handy). |
| Katalog | Vereinigung beider Kataloge, Filter „ESE“, „WI-MB“, „beide“. Gleiche Modulnummer = ein Eintrag. Ein vorläufiger Abgleich über die Modulnummer ergibt rund 20 Module, die in beiden Handbüchern stehen (meist Energie, Strömung, Verbrennung). |
| Doppelanrechnung | Einstellbar, weil ungeklärt: „nicht erlaubt“ (Standard, Modul zählt nur in einem Studiengang), „erlaubt“, „erlaubt bis X CP“. Bei Verstoß Warnung, keine Sperre. |
| Thesis und Notenschnitt | Getrennt je Studiengang. |

Der kombinierte Modus ist kein eigener Studiengang, sondern dieselbe Oberfläche mit zwei aktiven Strukturen. Allein-Modus = kombinierter Modus mit nur einem aktiven Studiengang. So gibt es nur einen Codepfad.

## 5. Gespeicherter Plan (Version 3)

```js
{ version: 3,
  studiengaenge: ['ese', 'wimb'],
  doppelanrechnung: 'nein',
  start: 'W2025', anzahl: 6,
  belegung: { '16_20_5020': { sem: 'S2026', ok: true, note: 1.7,
                              zaehlt: { ese: 'ern', wimb: 'mb-wf' } } },
  eigene: [ ... ] }
```

Pläne der Version 2 (nur ESE) werden beim Laden automatisch übernommen: `thema` wird zu `zaehlt.ese`.

## 6. Ordnerstruktur

Der Ordner `ese-modulplaner/` passt dann nicht mehr. Vorschlag:

```
ese/                          Repository (Umbenennung z. B. in „modulplaner“ möglich, GitHub leitet alte Links weiter)
├─ index.html                 Start: Auswahl ESE, WI-MB oder beide
├─ app/                       Programm, für alle Studiengänge gleich
│  ├─ src/                    semester.js, regeln.js (allgemeiner Baum), zustand.js, app.js, styles.css
│  └─ tests/                  Tests der Rechenlogik, mit kleinen Beispielstrukturen
├─ studiengaenge/             reine Daten, ein Unterordner pro Studiengang
│  ├─ ese/                    struktur.js, module.js, quellen.md
│  └─ wi-mb/                  struktur.js, module.js, quellen.md
└─ docs/                      Konzepte und Entscheidungen
```

Faustregel bleibt: Studieninhalt unter `studiengaenge/`, Programm unter `app/`. Ein dritter Studiengang ist dann nur ein weiterer Datenordner.

## 7. Daten für WI-MB

Das Modulhandbuch WI-MB (514 Seiten, ca. 235 Modulbeschreibungen) wird wie bei ESE per Skript ausgelesen. Der Teil Maschinenbau hat ein eigenes Inhaltsverzeichnis mit der Zuordnung zu den Bereichen, das erleichtert die Zuordnung.

Zu beachten:

- Die Kataloge sind laut Handbuch „nicht dauerhaft“ und werden regelmäßig aktualisiert. Jede Datendatei bekommt deshalb ein Feld „Stand“.
- Der Studien- und Prüfungsplan nennt teils andere Grundlagenmodule (z. B. Höhere Maschinendynamik) als das Handbuch 2025 (Maschinendynamik, Sustainable Systems Design, Transport Phenomena). Maßgeblich für den Katalog: das aktuelle Handbuch.
- Generalbeschreibungen (Tutorium, Advanced Design Project, Externe Projektarbeit) sind Platzhalter. Sie werden als Katalogkarten angelegt, die man mehrfach belegen und umbenennen kann.

## 8. Vorgehen in Schritten

1. **Rechenlogik verallgemeinern**, ESE darauf umstellen, Tests bleiben grün. Für Nutzer ändert sich nichts.
2. **Ordner umbauen** (Abschnitt 6), Plan-Version 3 mit Übernahme alter Pläne.
3. **WI-MB-Daten auslesen** und prüfen, Variante A freischalten.
4. **Kombinierter Modus** (Variante B), zuerst mit Doppelanrechnung „nicht erlaubt“.
5. Doppelanrechnung und offene Regeln nachziehen, sobald geklärt.

Jeder Schritt ist für sich nutzbar und einzeln veröffentlichbar.

## 9. Offene Fragen (Prüfungsausschuss bzw. Studienbüro)

1. Darf ein Modul in ESE und WI-MB gleichzeitig angerechnet werden? Wenn ja, bis zu wie vielen CP?
2. Müssen die 42 CP Maschinenbau exakt erreicht werden, oder ist eine Überschreitung durch das letzte Modul erlaubt (z. B. 44 CP bei 4-CP-Modulen)? Wenn ja: zählen die überschüssigen CP mit in die Note?
3. Ist die Externe Projektarbeit eine Alternative zum Studium Generale oder zusätzlich möglich?
4. Gilt im RuW-Wahlbereich eine Mindestverteilung auf Fächer (BWL, VWL, Recht)? Im Plan steht keine.
5. Darf ein Modul, das man in ESE als Grundlage belegt, in WI-MB im Ergänzungsbereich zählen?
6. Wie gehen Wahl- und Schwerpunktnoten in die WI-MB-Gesamtnote ein (Gewichtung laut Anhang I)?
