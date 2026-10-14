# ESE-Modulplaner

Studienplanung für Masterstudiengänge an der TU Darmstadt: Module per Ziehen und Ablegen auf Semester verteilen, bestandene Module abhaken, Fortschritt und Vertiefung im Blick behalten. Läuft komplett im Browser, ohne Server und ohne Anmeldung. Dein Plan verlässt deinen Browser nicht.

**Online:** https://academic-corridor.github.io/ese/

Aktuell enthalten:

- **ESE-Modulplaner** für den M.Sc. Energy Science and Engineering (PO 2023), alle Module aus dem Modulhandbuch. Anleitung: [`ese-modulplaner/README.md`](ese-modulplaner/README.md)

Kein offizielles Angebot der TU Darmstadt. Angaben ohne Gewähr, maßgeblich sind Prüfungsordnung, Studienplan und Modulhandbuch. Fehler im Katalog gern als Issue melden.

## Offline nutzen

Repository herunterladen (Code, Download ZIP), entpacken, `ese-modulplaner/index.html` per Doppelklick öffnen.

## Was liegt wo

```
ese/
├─ index.html             Startseite, leitet auf den ESE-Modulplaner weiter
├─ README.md              diese Übersicht
├─ LICENSE                Lizenz (MIT)
├─ .gitignore             Dateien, die nicht ins Repository kommen (Systemdateien, persönliche Pläne)
└─ ese-modulplaner/       der Planer für ESE (eigene README darin)
```

## Mitarbeiten

Voraussetzung für die Tests: Node.js ab Version 18.

```
cd ese-modulplaner
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
