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
| Regeln als Baum in den Daten | Jeder Studiengang beschreibt seine Bereiche als Baum mit CP- und Modulgrenzen (`studiengaenge/<name>/struktur.js`). `app/src/kern/baum.js` rechnet für jeden Studiengang gleich. So braucht WI-MB keine eigene Rechenlogik. |
| Referenztests | `app/tests/referenz/ese.json` hält die Ergebnisse von 40 festen Beispielplänen fest. Ein Umbau der Rechenlogik darf daran nichts ändern. |
| Neutrale Namensgebung | Projekt, Code und Commits tragen keinen persönlichen Namen. Commits laufen unter einer neutralen Git-Identität. |

## Quellen und Annahmen

- Regeln: Ordnung des Studiengangs ESE vom 20.04.2022, in Kraft ab 01.10.2023 (PO 2023), Anhang I Studien- und Prüfungsplan (Stand 01.08.2022). Ergänzend: Studienplan ESE (Satzungsbeilage 2026_IV).
- Grenzen laut Anhang I: Basisbereich und Wahlpflichtbereich zusammen 108 CP, davon Basisbereich 36 bis 67 CP (Grundlagenmodule 0 bis 31, Interdisziplinäres Energieprojekt 6, Thesis 30) und Wahlpflichtbereich 41 bis 72 CP; Wahlbereich 12 CP. Daraus folgt das Wahlpflicht-Soll: 108 minus Grundlagen, Projekt und Thesis, mindestens 41.
- Wahlpflichtbereich laut Anhang I, alle umgesetzt:
  - Vertiefung: mindestens 20 CP **bestanden** in einem Themenbereich, Querschnittsthemen ausgenommen. Eine zweite Vertiefung mit weiteren 20 CP in einem anderen Themenbereich wird ebenfalls ausgewiesen.
  - Höchstens 32 CP aus dem Angebot eines Fachbereichs. Darüber hinausgehende CP rechnet die App nicht an.
  - Höchstens zwei Mini-Forschungsprojekte (18-en-2020 bis 18-en-2026).
  - Im Themenbereich der Vertiefung *soll* ein Mini-Forschungsprojekt liegen. Weil es eine Soll-Vorschrift ist, gibt die App nur einen Hinweis.
  - Im Wahlpflicht- und Wahlbereich zusammen mindestens 5 CP aus den Fachbereichen 01 (Rechts- und Wirtschaftswissenschaften), 02 (Gesellschafts- und Geschichtswissenschaften) oder 03 (Humanwissenschaften). Grundlagenmodule dieser Fachbereiche zählen dafür nicht.
- Thesis: Das Thema wird erst ab 75 erworbenen CP ausgegeben. Die App vergleicht mit allen CP, die in Semestern vor der Thesis eingeplant sind.
- Annahmen, weil die Ordnung es nicht genau sagt:
  - Der Fachbereich ergibt sich aus den ersten beiden Stellen der Modulnummer (z. B. 18 = Elektrotechnik und Informationstechnik). Eigene Module ohne Modulnummer sind von der 32-CP-Grenze ausgenommen und zählen nicht für die 5-CP-Regel.
  - Die 32-CP-Grenze gilt für den ganzen Wahlpflichtbereich, also auch für die Module der Vertiefung. Der Satz in Anhang I („Alle weiteren Module … höchstens 32 CP aus dem Angebot eines Fachbereichs“) lässt auch die Lesart zu, dass nur die Module außerhalb der Vertiefung gemeint sind. Die App rechnet mit der strengeren Lesart.
  - Die Mini-Forschungsprojekte (Modulnummer 18-en-…) zählen zum Fachbereich 18.
- Katalog: automatisch aus dem Modulhandbuch ESE (PO 2023, Stand 01.10.2023) ausgelesen, 161 Moduleinträge, davon einer doppelt (Energy Converters - CAD and System Dynamics in zwei Themenbereichen), also 160 Module.
- Module, die nicht im Handbuch stehen, legt man in der App als eigenes Modul an.
- Turnus und Sprache stehen so im Handbuch. Neuere Angaben im Vorlesungsverzeichnis (TUCaN) können abweichen.
- Notenschnitt: CP-gewichteter Durchschnitt über alle Module mit Note. Das entspricht der Ordnung (zu § 28 (2) APB: Modulnoten gehen nach CP in die Gesamtnote ein, soweit Anhang I nichts anderes festlegt). Module, die laut Anhang I nur mit bestanden/nicht bestanden bewertet werden (z. B. einige Physik-Module), sollten keine Note bekommen.

## Offene Punkte

- Regel zur Doppelanrechnung zwischen ESE und WI-MB bei einem Doppelstudium.
- Gilt die Grenze von 32 CP je Fachbereich für den ganzen Wahlpflichtbereich oder nur für die Module außerhalb der Vertiefung? Und zählen die Mini-Forschungsprojekte zum Fachbereich 18? (Prüfungskommission fragen)
- Gibt es ein neueres Modulhandbuch als Stand 01.10.2023? Dann Katalog neu auslesen.
- Bei "jedes 2. Semester" sagt das Handbuch nicht, ob Winter oder Sommer. Dafür gibt es keine Warnung.
- Der Plan liegt nur im Browser, bis er mit "Plan sichern" in eine Datei geschrieben wird.

## Nächste Schritte (Backlog)

1. Turnus der Module mit "jedes 2. Semester" aus TUCaN nachtragen (dann greift die Saison-Warnung).
2. Anerkannte Leistungen (z. B. aus dem Bachelor) als eigene Spalte vor dem ersten Semester.
3. Gesamtnote nach den Regeln der Prüfungsordnung berechnen.
4. Erinnerung an "Plan sichern", wenn länger nicht gesichert wurde.
5. WI-MB als zweiter Studiengang, sobald die Doppelanrechnung geklärt ist: eigener Ordner unter `studiengaenge/`, siehe `docs/konzept-wi-mb.md`, Module mit Modulnummer in beiden Katalogen markieren.
