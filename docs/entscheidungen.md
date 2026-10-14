# Entscheidungen und offene Punkte

## Warum so aufgebaut

| Entscheidung | Grund |
|---|---|
| Kein Build-Werkzeug, keine Abhängigkeiten | Die App läuft per Doppelklick auf `index.html`. Es gibt nichts zu installieren und nichts, das veralten kann. |
| Gewöhnliche Skripte statt ES-Module | Browser blockieren Module, die direkt von der Festplatte geladen werden. Jede Datei hängt sich deshalb an `window.ESE` und exportiert zusätzlich für Node (`module.exports`). |
| Daten, Regeln, Oberfläche getrennt | Moduldaten ändern sich oft, Regeln selten, die Oberfläche je nach Wunsch. So fasst jede Änderung nur eine Datei an. |
| Rechenlogik ohne Zugriff auf die Seite | Nur so lässt sie sich mit `npm test` prüfen. |
| Persönlicher Stand nicht im Code | Der Katalog enthält nur Moduldaten. Was du belegt hast, liegt im Browser und in Sicherungsdateien. Dadurch startet die App leer und das Repository enthält keine persönlichen Daten. |
| Semester statt Status-Spalten | Jedes Modul hat ein Semester und ein Häkchen. So sieht man, wann was belegt wurde, und "bestanden" ist keine eigene Spalte. |
| Semester-Kennung `W2026` / `S2027` | Lässt sich sortieren und rechnen; die Beschriftung "WiSe 26/27" entsteht erst in der Anzeige. |
| Modul-ID aus der Modulnummer | Eindeutig und stabil, auch wenn ein Modul umbenannt wird. |
| Ein Git-Repository für alle Teilprojekte | Weitere Studiengänge (z. B. WI-MB) kommen später dazu; gemeinsamer Verlauf, eine `.gitignore`. |
| Neutrale Namensgebung | Projekt, Code und Commits tragen keinen persönlichen Namen. Commits laufen unter einer neutralen Git-Identität. |

## Quellen und Annahmen

- Soll-Werte: Studienplan ESE (Satzungsbeilage 2026_IV).
- Wahlpflicht-Soll = 108 minus Grundlagen, IEP (6) und Thesis (30), mindestens 41. Das ist abgeleitet, nicht wörtlich im Studienplan.
- Katalog: automatisch aus dem Modulhandbuch ESE (PO 2023, Stand 01.10.2023) ausgelesen, 161 Moduleinträge, davon einer doppelt (Energy Converters - CAD and System Dynamics in zwei Themenbereichen), also 160 Module.
- Module, die nicht im Handbuch stehen, legt man in der App als eigenes Modul an.
- Turnus und Sprache stehen so im Handbuch. Neuere Angaben im Vorlesungsverzeichnis (TUCaN) können abweichen.
- Notenschnitt: einfacher CP-gewichteter Durchschnitt über alle Module mit Note. Die Gewichtung der Gesamtnote laut Prüfungsordnung (z. B. Thesis, Wahlbereich) ist nicht abgebildet.

## Offene Punkte

- Regel zur Doppelanrechnung zwischen ESE und WI-MB bei einem Doppelstudium.
- Gibt es ein neueres Modulhandbuch als Stand 01.10.2023? Dann Katalog neu auslesen.
- Bei "jedes 2. Semester" sagt das Handbuch nicht, ob Winter oder Sommer. Dafür gibt es keine Warnung.
- Der Plan liegt nur im Browser, bis er mit "Plan sichern" in eine Datei geschrieben wird.

## Nächste Schritte (Backlog)

1. Turnus der Module mit "jedes 2. Semester" aus TUCaN nachtragen (dann greift die Saison-Warnung).
2. Anerkannte Leistungen (z. B. aus dem Bachelor) als eigene Spalte vor dem ersten Semester.
3. Gesamtnote nach den Regeln der Prüfungsordnung berechnen.
4. Erinnerung an "Plan sichern", wenn länger nicht gesichert wurde.
5. WI-MB als zweiter Studiengang, sobald die Doppelanrechnung geklärt ist: eigener Ordner unter `studiengaenge/`, siehe `docs/konzept-wi-mb.md`, Module mit Modulnummer in beiden Katalogen markieren.
