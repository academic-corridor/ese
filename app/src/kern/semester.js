/* app/src/kern/semester.js: Rechnen mit Semestern. Reine Funktionen, testbar mit `npm test`.
   Kennung: "W2026" = Wintersemester 2026/27, "S2027" = Sommersemester 2027.
   Wintersemester beginnt am 1. Oktober, Sommersemester am 1. April. */
(function (root) {
  'use strict';

  function gueltig(id) { return typeof id === 'string' && /^[WS]\d{4}$/.test(id); }
  function jahr(id) { return parseInt(id.slice(1), 10); }

  /* Sortierschlüssel: SoSe 2027 < WiSe 2027/28 */
  function rang(id) { return jahr(id) * 2 + (id[0] === 'W' ? 1 : 0); }
  function ausRang(r) { return (r % 2 ? 'W' : 'S') + Math.floor(r / 2); }

  function saison(id) { return id[0] === 'W' ? 'WiSe' : 'SoSe'; }

  function label(id) {
    var j = jahr(id);
    return id[0] === 'W'
      ? 'WiSe ' + String(j).slice(2) + '/' + String(j + 1).slice(2)
      : 'SoSe ' + String(j).slice(2);
  }

  function naechstes(id, n) { return ausRang(rang(id) + (n === undefined ? 1 : n)); }

  /* Liste von "anzahl" Semestern ab "start" */
  function liste(start, anzahl) {
    var out = [];
    for (var i = 0; i < anzahl; i++) out.push(naechstes(start, i));
    return out;
  }

  /* Semester, das am Datum d läuft */
  function aktuell(d) {
    d = d || new Date();
    var y = d.getFullYear(), m = d.getMonth() + 1;
    if (m >= 10) return 'W' + y;
    if (m <= 3) return 'W' + (y - 1);
    return 'S' + y;
  }

  /* -1 = a liegt vor b, 0 = gleich, 1 = a liegt nach b */
  function vergleich(a, b) { var d = rang(a) - rang(b); return d < 0 ? -1 : (d > 0 ? 1 : 0); }

  var Semester = { gueltig: gueltig, saison: saison, label: label, naechstes: naechstes,
                   liste: liste, aktuell: aktuell, vergleich: vergleich };
  if (typeof module === 'object' && module.exports) { module.exports = Semester; }
  else { (root.ESE = root.ESE || {}).Semester = Semester; }
})(typeof self !== 'undefined' ? self : this);
