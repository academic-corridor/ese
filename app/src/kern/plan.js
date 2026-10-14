/* app/src/kern/plan.js: Zustand des Plans, Sichern und Laden als Datei-Inhalt, eigene Module.
   Reine Funktionen ohne Browser-Zugriff, testbar mit `npm test`. Der Zugriff auf localStorage
   und Dateien liegt in app/src/ui/app.js.

   Ein Plan sieht so aus:
     { start: "W2025", anzahl: 4, mods: [ ...Katalogmodule und eigene Module... ] }
   Jedes Modul trägt zusätzlich seinen Stand:
     sem   Semester-Kennung (z. B. "W2025") oder null = liegt im Katalog
     ok    true = bestanden
     note  Note (1.0 bis 4.0) oder null
     thema gewählter Themenbereich (nur Wahlpflicht, aus m.themen)
     custom true = eigenes Modul */
(function (root) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  var S = node ? require('../../../studiengaenge/ese/struktur.js') : root.ESE.Struktur;
  var Katalog = node ? require('../../../studiengaenge/ese/module.js') : root.ESE.Katalog;
  var Sem = node ? require('./semester.js') : root.ESE.Semester;

  var KEY = 'ese-planer-v2';
  var VERSION = 2;
  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  function mitStand(m) {
    return Object.assign({}, m, { themen: (m.themen || []).slice(), sem: null, ok: false, note: null,
      thema: m.bereich === 'Wahlpflicht' && m.themen && m.themen.length ? m.themen[0] : null });
  }

  /* Leerer Plan: Studienbeginn = laufendes Semester, nichts belegt */
  function neu(heute) {
    return { start: Sem.aktuell(heute), anzahl: S.zeitraum.anzahl, mods: Katalog.map(mitStand) };
  }

  function semester(plan) { return Sem.liste(plan.start, plan.anzahl); }

  /* Ändert Studienbeginn und Anzahl der Semester. Scheitert, wenn dadurch belegte Module
     außerhalb des Zeitraums lägen. Gibt { ok, grund } zurück und ändert plan nur bei Erfolg. */
  function zeitraumAendern(plan, start, anzahl) {
    if (!Sem.gueltig(start)) return { ok: false, grund: 'Unbekanntes Semester.' };
    if (!Number.isInteger(anzahl) || anzahl < S.zeitraum.min || anzahl > S.zeitraum.max)
      return { ok: false, grund: 'Anzahl der Semester muss zwischen ' + S.zeitraum.min + ' und ' + S.zeitraum.max + ' liegen.' };
    var neue = Sem.liste(start, anzahl);
    var raus = plan.mods.filter(function (m) { return m.sem && neue.indexOf(m.sem) < 0; });
    if (raus.length) return { ok: false, grund: raus.length + ' belegte Module lägen außerhalb des Zeitraums (z. B. ' + raus[0].name + ' in ' + Sem.label(raus[0].sem) + '). Erst verschieben.' };
    plan.start = start; plan.anzahl = anzahl;
    return { ok: true };
  }

  /* ---------- eigene Module ---------- */
  function pruefeAngaben(a) {
    var name = String(a.name || '').trim();
    if (!name) return null;
    if (!Number.isInteger(a.cp) || a.cp < 1 || a.cp > 30) return null;
    if (!S.bereiche[a.bereich]) return null;
    if (a.bereich === 'Wahlpflicht' && !S.themen.some(function (t) { return t.id === a.thema; })) return null;
    return { nr: String(a.nr || '').trim().slice(0, 30), name: name.slice(0, 120), cp: a.cp, bereich: a.bereich,
      themen: a.bereich === 'Wahlpflicht' ? [a.thema] : [], thema: a.bereich === 'Wahlpflicht' ? a.thema : null,
      turnus: S.turnus[a.turnus] ? a.turnus : 'x', sprache: S.sprachen[a.sprache] ? a.sprache : null };
  }

  /* Legt ein eigenes Modul an. Gibt null zurück, wenn die Angaben ungültig sind. */
  function neuesModul(a, id) {
    var p = pruefeAngaben(a); if (!p) return null;
    return Object.assign({ id: id || 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
      gruppe: null, sem: null, ok: false, note: null, custom: true }, p);
  }

  /* Ändert ein eigenes Modul. Gibt false zurück, wenn die Angaben ungültig sind. */
  function aendereModul(m, a) {
    if (!m || !m.custom) return false;
    var p = pruefeAngaben(a); if (!p) return false;
    Object.assign(m, p);
    return true;
  }

  /* ---------- Sichern und Laden ---------- */

  /* Nur das, was du änderst: Zeitraum, Stand je belegtem Modul, eigene Module */
  function exportieren(plan) {
    var belegung = {}, eigene = [];
    plan.mods.forEach(function (m) {
      if (m.custom) eigene.push({ id: m.id, nr: m.nr, name: m.name, cp: m.cp, bereich: m.bereich,
        thema: m.thema, turnus: m.turnus, sprache: m.sprache });
      var e = {};
      if (m.sem) e.sem = m.sem;
      if (m.ok) e.ok = true;
      if (m.note !== null) e.note = m.note;
      if (m.thema && m.themen.length > 1 && m.thema !== m.themen[0]) e.thema = m.thema;
      if (Object.keys(e).length) belegung[m.id] = e;
    });
    return { version: VERSION, start: plan.start, anzahl: plan.anzahl, belegung: belegung, eigene: eigene };
  }

  /* Prüft eine Eingabe und liefert { ok, plan, skipped }. Ungültige Einträge werden übersprungen,
     eine ungültige Datei ändert nichts (ok: false). */
  function importieren(s) {
    if (!s || typeof s !== 'object' || s.version !== VERSION || !Sem.gueltig(s.start) ||
        !s.belegung || typeof s.belegung !== 'object') return { ok: false };
    var anzahl = Number.isInteger(s.anzahl) ? Math.min(S.zeitraum.max, Math.max(S.zeitraum.min, s.anzahl)) : S.zeitraum.anzahl;
    var plan = { start: s.start, anzahl: anzahl, mods: Katalog.map(mitStand) }, skipped = 0;
    var semListe = semester(plan);
    var ids = {}; plan.mods.forEach(function (m) { ids[m.id] = true; });

    (Array.isArray(s.eigene) ? s.eigene : []).forEach(function (e) {
      var m = e && typeof e.id === 'string' && !ids[e.id] ? neuesModul(e, e.id) : null;
      if (m) { plan.mods.push(m); ids[m.id] = true; } else skipped++;
    });

    var byId = {}; plan.mods.forEach(function (m) { byId[m.id] = m; });
    Object.keys(s.belegung).forEach(function (id) {
      var m = byId[id], e = s.belegung[id];
      if (!m || !e || typeof e !== 'object') { skipped++; return; }
      if (e.sem !== undefined && e.sem !== null) {
        if (semListe.indexOf(e.sem) < 0) { skipped++; return; }
        m.sem = e.sem;
      }
      m.ok = e.ok === true && !!m.sem;
      if (S.noten.indexOf(e.note) >= 0) m.note = e.note;
      if (e.thema && m.themen.indexOf(e.thema) >= 0) m.thema = e.thema;
    });
    return { ok: true, plan: plan, skipped: skipped };
  }

  var Zustand = { KEY: KEY, neu: neu, semester: semester, zeitraumAendern: zeitraumAendern,
                  neuesModul: neuesModul, aendereModul: aendereModul,
                  exportieren: exportieren, importieren: importieren };
  if (node) { module.exports = Zustand; } else { (root.ESE = root.ESE || {}).Zustand = Zustand; }
})(typeof self !== 'undefined' ? self : this);
