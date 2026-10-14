# ESE-Modulplaner

Planer für den Master Energy Science and Engineering (ESE), Prüfungsordnung (PO) 2023, 120 Credit Points (CP). Läuft komplett im Browser, ohne Server und ohne Anmeldung.

## Starten

`index.html` per Doppelklick öffnen. Dazu muss der ganze Ordner zusammenbleiben.

Beim ersten Öffnen ist der Plan leer. Unter **Zeitraum** stellst du deinen Studienbeginn und die Anzahl der Semester ein.

## Bedienung

Beim ersten Besuch erscheint eine kurze Anleitung. Du erreichst sie jederzeit über das „i“ oben.

| Was | Wie |
|---|---|
| Modul einplanen | aus dem Katalog in eine Semesterspalte ziehen, oder antippen und Semester wählen |
| Bestanden markieren | Häkchen links an der Karte |
| Note eintragen | Karte antippen, bei gesetztem Häkchen Note wählen |
| Themenbereich wählen | Karte antippen, "zählt für" (nur bei Modulen, die in mehreren Themenbereichen stehen) |
| Zurück in den Katalog | zurück in den Katalog ziehen, oder Karte antippen |
| Eigenes Modul (z. B. Studium Generale) | Feld **Eigenes Modul anlegen** ganz oben im Katalog. Ist ein Themenfilter aktiv, wird der Themenbereich vorbelegt, sonst der Wahlbereich; ein Suchbegriff wird als Name übernommen. Bearbeiten oder löschen über Antippen der Karte |
| Semester anhängen | **+ Semester** rechts im Semesterplan; leeres letztes Semester mit "entfernen" |

Status einer Karte: mit Häkchen = bestanden, im laufenden Semester ohne Häkchen = läuft, sonst = geplant. Das laufende Semester ist farbig umrandet.

## Was liegt wo

```
ese-modulplaner/
├─ index.html            Gerüst der Seite, lädt alle Skripte in der richtigen Reihenfolge
├─ README.md             diese Anleitung
├─ CHANGELOG.md          was sich wann geändert hat
├─ package.json          nur für "npm test", keine Abhängigkeiten
├─ data/                 alles, was Studieninhalt ist
│  ├─ module-ese.js      Modulkatalog: alle Module aus dem Modulhandbuch (nur Moduldaten)
│  └─ ese-struktur.js    CP-Grenzen, Themenbereiche, Bereiche, Turnus, Sprachen, Notenstufen
├─ src/                  alles, was Programm ist
│  ├─ semester.js        Semester-Kennungen, Reihenfolge, laufendes Semester (getestet)
│  ├─ regeln.js          Rechnung, Notenschnitt und Hinweise (reine Funktionen, getestet)
│  ├─ zustand.js         Plan anlegen, sichern, laden, eigene Module (getestet)
│  ├─ app.js             Oberfläche: Darstellung, Ziehen und Ablegen, Dialoge
│  └─ styles.css         Aussehen, Hell- und Dunkelmodus
├─ tests/                automatische Prüfungen (npm test)
│  ├─ daten.test.js      Katalog ist vollständig und in sich stimmig
│  ├─ semester.test.js   Semesterrechnung
│  ├─ regeln.test.js     Rechnung, Notenschnitt, Hinweise
│  └─ zustand.test.js    Zeitraum, Sichern, Laden, eigene Module
└─ docs/
   └─ entscheidungen.md  warum so aufgebaut, Quellen, offene Punkte, Backlog
```

Faustregel: Ändert sich ein **Modul oder eine Zahl**, gehört die Änderung nach `data/`. Ändert sich eine **Rechenregel**, nach `src/regeln.js`. Ändert sich **Aussehen oder Bedienung**, nach `src/app.js` oder `src/styles.css`.

Dein persönlicher Stand (was du wann belegt hast) liegt **nicht** im Code, sondern im Browser und in deinen Sicherungsdateien.

## Module im Katalog ändern (`data/module-ese.js`)

Jedes Modul ist eine Zeile:

```js
{"id": "18_st_2080", "nr": "18-st-2080", "name": "Energiewende gestalten", "cp": 6, "bereich": "Wahlpflicht", "themen": ["mul"], "gruppe": null, "turnus": "WiSe", "sprache": "de"},
```

| Feld | Werte |
|---|---|
| `id` | eindeutiges Kürzel, aus der Modulnummer gebildet (Kleinbuchstaben, Ziffern, Unterstrich) |
| `bereich` | `Grundlagen`, `IEP`, `Thesis`, `Wahlpflicht`, `Wahlbereich` |
| `themen` | nur bei Wahlpflicht: Liste aus `ebi`, `mob`, `mat`, `ern`, `mul`, `kw`, `qs`; sonst `[]` |
| `gruppe` | Unterbereich im Handbuch (z. B. `"Geothermie"`) oder `null` |
| `turnus` | `WiSe`, `SoSe`, `jedes`, `zwei` (jedes 2. Semester), `drei` (jedes 3. Semester), `x` (offen) |
| `sprache` | `de`, `en`, `de/en` |
| `hinweis` | optional, Freitext |

Module, die du nur für dich brauchst, legst du besser in der App als eigenes Modul an. Nach jeder Änderung am Katalog `npm test` ausführen. Achtung: Ändert sich die `id` eines Moduls, findet ein gesicherter Plan es nicht mehr.

## Plan sichern und laden

- **Plan sichern:** speichert deinen Stand als `ese-plan-DATUM.json` im Download-Ordner (Zeitraum, belegte Module mit Häkchen und Note, eigene Module).
- **Plan laden:** stellt den Stand aus so einer Datei wieder her. Ungültige Einträge werden übersprungen, eine ungültige Datei ändert nichts.
- **Plan als Text:** zum Kopieren in eine E-Mail, kein Backup.
- **Plan leeren:** entfernt alle Einträge und eigenen Module, der Zeitraum bleibt.

Ohne Sichern liegt der Plan nur im Browser (`localStorage`). Löschst du die Browserdaten, ist er weg.

## Tests

Voraussetzung: Node.js ab Version 18.

```
npm test
```

Erwartet: 28 Tests bestanden.

## Online nutzen

Die App läuft auch über GitHub Pages, siehe README im Hauptordner. Dein Plan wird dabei nicht hochgeladen, er liegt nur in deinem Browser und in deinen Sicherungsdateien.

Kein offizielles Angebot der TU Darmstadt. Angaben ohne Gewähr, maßgeblich sind Prüfungsordnung, Studienplan und Modulhandbuch.
