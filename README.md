# ESE-Modulplaner

Studienplanung für Masterstudiengänge an der TU Darmstadt: Module per Ziehen und Ablegen auf Semester verteilen, bestandene Module abhaken, Fortschritt und Vertiefung im Blick behalten. Läuft komplett im Browser, ohne Server und ohne Anmeldung. Dein Plan verlässt deinen Browser nicht.

**Online:** https://academic-corridor.github.io/ese/

Aktuell enthalten:

- **ESE-Modulplaner** für den M.Sc. Energy Science and Engineering (PO 2023), alle Module aus dem Modulhandbuch. Anleitung: [`docs/bedienung.md`](docs/bedienung.md)

Kein offizielles Angebot der TU Darmstadt. Angaben ohne Gewähr, maßgeblich sind Prüfungsordnung, Studienplan und Modulhandbuch. Fehler im Katalog gern als Issue melden.

## Offline nutzen

Repository herunterladen (Code, Download ZIP), entpacken, `index.html` per Doppelklick öffnen.

## Was liegt wo

```
ese/
├─ index.html                 die App (Seitengerüst, lädt alle Skripte)
├─ README.md                  diese Übersicht
├─ CHANGELOG.md               was sich wann geändert hat
├─ LICENSE                    Lizenz (MIT)
├─ package.json               nur für "npm test", keine Abhängigkeiten
├─ .gitignore                 Dateien, die nicht ins Repository kommen
├─ app/                       Programm, für alle Studiengänge gleich
│  ├─ src/
│  │  ├─ kern/                Rechenlogik ohne Zugriff auf die Seite, getestet
│  │  │  ├─ semester.js       Semester-Kennungen, Reihenfolge, laufendes Semester
│  │  │  ├─ regeln.js         Rechnung, Notenschnitt, Hinweise
│  │  │  └─ plan.js           Plan anlegen, sichern, laden, eigene Module
│  │  ├─ ui/
│  │  │  └─ app.js            Oberfläche: Darstellung, Ziehen und Ablegen, Dialoge
│  │  └─ styles.css           Aussehen, Hell- und Dunkelmodus
│  └─ tests/                  automatische Prüfungen (npm test)
├─ studiengaenge/             nur Daten, kein Programmcode
│  └─ ese/
│     ├─ struktur.js          CP-Grenzen, Themenbereiche, Bereiche, Turnus, Sprachen, Noten
│     └─ module.js            Modulkatalog aus dem Modulhandbuch
├─ docs/                      Bedienung, Entscheidungen, Konzepte
└─ ese-modulplaner/           nur Weiterleitung, damit alte Links funktionieren
```

Faustregel: Ändert sich ein **Modul oder eine Zahl**, gehört die Änderung nach `studiengaenge/`. Ändert sich eine **Rechenregel**, nach `app/src/kern/`. Ändert sich **Aussehen oder Bedienung**, nach `app/src/ui/` oder `app/src/styles.css`.

## Mitarbeiten

Voraussetzung für die Tests: Node.js ab Version 18.

```
npm test                   automatische Prüfungen, alle müssen bestehen
```

Danach mit Git:

```
git status                 was hat sich geändert?
git add .                  Änderungen vormerken
git commit -m "Text"       Änderungen sichern (eine Änderung pro Commit)
git push                   auf GitHub hochladen, die Online-Version aktualisiert sich nach etwa einer Minute
```

## Lizenz

MIT, siehe [`LICENSE`](LICENSE).
