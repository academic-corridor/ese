/* app/src/kern/zusatzregeln.js: Regeln, die nicht in den Strukturbaum passen, weil sie quer über
   Bereiche gehen oder einzelne Module betreffen. Kennt keinen Studiengang beim Namen; welche Regeln
   gelten, steht in studiengaenge/<name>/struktur.js unter "zusatzregeln". Reine Funktionen, getestet.

   Regeltypen:
     maxModule   höchstens max Module, deren Modulnummer auf nrMuster passt, in den genannten Bereichen
     minCP       mindestens min CP aus den genannten Fachbereichen (Gruppen), in den genannten Bereichen
     cpVorher    vor dem Semester eines Moduls im Bereich "knoten" müssen mindestens min CP eingeplant sein
     vertiefungEnthaelt  im Vertiefungs-Themenbereich soll ein Modul liegen, dessen Nummer auf nrMuster passt

   Einträge: { knoten, cp, status, nr, gruppe, sem }. Ergebnis: Liste { regel, ok, ...Kennzahlen }. */
(function (root) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  var Sem = node ? require('./semester.js') : root.ESE.Semester;

  /* true, wenn Knoten id im Teilbaum eines der Knoten in "bereiche" liegt */
  function liegtIn(baum, id, bereiche) {
    for (var k = id; k; k = baum.knoten[k] && baum.knoten[k].eltern) if (bereiche.indexOf(k) >= 0) return true;
    return false;
  }
  var passt = function (muster, nr) { return !!nr && new RegExp(muster).test(nr); };

  var pruefer = {
    maxModule: function (r, ein, baum) {
      var treffer = ein.filter(function (e) { return liegtIn(baum, e.knoten, r.bereiche) && passt(r.nrMuster, e.nr); });
      return { anzahl: treffer.length, max: r.max, ok: treffer.length <= r.max };
    },
    minCP: function (r, ein, baum) {
      var drin = ein.filter(function (e) { return liegtIn(baum, e.knoten, r.bereiche); });
      var cp = 0, d = 0, ohneNummer = 0;
      drin.forEach(function (e) {
        if (e.gruppe === null || e.gruppe === undefined) { ohneNummer++; return; }
        if (r.gruppen.indexOf(e.gruppe) < 0) return;
        cp += e.cp; if (e.status === 'd') d += e.cp;
      });
      return { cp: cp, d: d, min: r.min, ohneNummer: ohneNummer, ok: cp >= r.min };
    },
    cpVorher: function (r, ein, baum) {
      var ziel = ein.filter(function (e) { return liegtIn(baum, e.knoten, [r.knoten]); });
      if (!ziel.length) return { ok: true, sem: null };
      var sem = ziel.map(function (e) { return e.sem; }).sort(Sem.vergleich)[0];
      var cp = 0;
      ein.forEach(function (e) { if (Sem.vergleich(e.sem, sem) < 0) cp += e.cp; });
      return { sem: sem, cp: cp, min: r.min, ok: cp >= r.min };
    },
    vertiefungEnthaelt: function (r, ein, baum) {
      var v = baum.knoten[r.knoten] && baum.knoten[r.knoten].vertiefung;
      if (!v || !v.erreicht) return { ok: true, thema: null };
      var hat = ein.some(function (e) { return e.knoten === v.knoten && passt(r.nrMuster, e.nr); });
      return { thema: v.knoten, ok: hat };
    }
  };

  function pruefe(regeln, eintraege, baum) {
    return (regeln || []).map(function (r) {
      var f = pruefer[r.typ];
      if (!f) throw new Error('Unbekannter Regeltyp: ' + r.typ);
      return Object.assign({ regel: r }, f(r, eintraege, baum));
    });
  }

  /* Fachbereich aus der Modulnummer, z. B. "18-st-2010" -> "18"; ohne Nummer null */
  function fachbereich(nr) {
    var m = /^(\d{2})-/.exec(String(nr || '').trim());
    return m ? m[1] : null;
  }

  var Zusatzregeln = { pruefe: pruefe, fachbereich: fachbereich };
  if (node) { module.exports = Zusatzregeln; } else { (root.ESE = root.ESE || {}).Zusatzregeln = Zusatzregeln; }
})(typeof self !== 'undefined' ? self : this);
