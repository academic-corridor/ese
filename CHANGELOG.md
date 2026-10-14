# Änderungsprotokoll

## 0.5.0 (14.10.2026)

- Neue Ordnerstruktur `app/` (Programm) und `studiengaenge/ese/` (Daten), Rechnung über einen allgemeinen Strukturbaum (`app/src/kern/baum.js`). Vorbereitung für weitere Studiengänge.
- Regeln aus der Studienordnung (PO 2023, Anhang I) ergänzt: höchstens 32 CP je Fachbereich im Wahlpflichtbereich (überzählige CP werden nicht angerechnet), höchstens zwei Mini-Forschungsprojekte, mindestens 5 CP aus Rechts- und Wirtschafts-, Gesellschafts- oder Humanwissenschaften, Thesis erst ab 75 CP, zweite Vertiefung, Hinweis auf ein Mini-Forschungsprojekt in der Vertiefung.
- Wahlpflicht nach Fachbereich: Übersicht der CP je Fachbereich, Vorwarnung ab 26 von 32 CP, Fachbereich im Detailfenster eines Moduls.
- Katalogfilter ausklappbar, neu mit Filter nach Fachbereich (mehrere wählbar) und „Alle Filter zurücksetzen“.
- Handyansicht aus 0.4.0 nachgetragen: Sie stand im Änderungsprotokoll, war aber nicht im Commit enthalten (Kapitel im Katalog, Balken je Bereich, Menü als Seitenleiste).
- Referenztests mit 40 Beispielplänen, Tests für jede neue Regel (54 Tests).

## 0.4.0 (14.10.2026)

- Handyansicht: Fortschritt je Bereich als eigener Balken statt einer schmalen Gesamtleiste, Semesterspalten (Karten 78 % der Breite, mit Einrasten) und Menü als Seitenleiste.
- Modulkatalog in Kapitel gegliedert (Bereiche und Themenbereiche), standardmäßig zugeklappt. Mit Suche oder Filter sind alle Kapitel offen.
- Auf Tablet und Handy steht der Semesterplan über dem Modulkatalog.
- Hinweis beim Einplanen eines Moduls auf kleinen Bildschirmen, in welches Semester es gekommen ist.
- Menü ("Menü" oben rechts) als Seitenleiste auf dem Handy; auf dem Rechner bleibt die Knopfleiste.

## 0.3.1 (14.10.2026)

- Kurze Anleitung als Fenster beim ersten Besuch; über das „i“ oben jederzeit erneut abrufbar.

## 0.3.0 (14.10.2026): erste öffentliche Version

- Modulkatalog mit allen 160 Modulen aus dem Modulhandbuch ESE (PO 2023, Stand 01.10.2023), mit Unterbereich, Turnus und Sprache.
- Semesterspalten ab frei wählbarem Studienbeginn, Semester anhängen und entfernen.
- Häkchen "bestanden" an der Karte, Status "läuft" ergibt sich aus dem laufenden Semester.
- Noten pro bestandenem Modul, CP-gewichteter Notenschnitt.
- Module in mehreren Themenbereichen einem Themenbereich zuordnen.
- Eigene Module (z. B. Studium Generale) direkt im Katalog anlegen, bearbeiten, löschen.
- Katalogfilter nach Themenbereich, Turnus und Sprache, Suche nach Name und Modulnummer.
- Hinweise zu CP-Soll, Vertiefung, Semesterlast, Angebotsturnus.
- Plan sichern und laden als Datei, Plan als Text.
- 28 automatische Tests (`npm test`).
