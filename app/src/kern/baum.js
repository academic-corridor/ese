/* app/src/kern/baum.js: Allgemeine Prüfung einer Studienstruktur. Kennt keinen Studiengang beim Namen.
   Reine Funktionen, testbar mit `npm test`.

   Eine Struktur ist ein Baum aus Knoten (Bereichen):
     { id, name,
       cp:       { min, max }   CP-Grenzen (beide optional)
       module:   { min, max }   Grenzen für die Anzahl Module (optional)
       freiwillig: true         Bereich darf leer bleiben
       ausgleich:  true         Bereich übernimmt, was die Geschwister zum Soll des Elternbereichs nicht liefern
       vertiefung: { min, ohne: [ids] }   mindestens min CP in einem einzigen Unterbereich
       kinder:   [ Knoten ] }

   Einträge sind belegte Module: { knoten: id, cp, status } mit status
     d  bestanden, a  läuft, p  geplant.

   Ergebnis je Knoten:
     roh          CP aller Einträge im Teilbaum, getrennt nach d, a, p
     n            Anzahl Module im Teilbaum, getrennt nach d, a, p
     angerechnet  { d, alle }: CP nach Kappung an den Höchstgrenzen (von unten nach oben)
     soll         CP, die dieser Bereich bringen muss
     spielraum    nur bei Knoten mit Kindern: CP, die über die Mindestwerte der Kinder hinaus noch fehlen
     zustand      'ok', 'offen' oder 'zuviel' (bezogen auf alle Einträge, also mit Planung) */
(function (root) {
  'use strict';

  var null3 = function () { return { d: 0, a: 0, p: 0 }; };
  var summe = function (o) { return o.d + o.a + o.p; };
  var grenze = function (k, art, feld) { return k[art] && typeof k[art][feld] === 'number' ? k[art][feld] : null; };
  var kappe = function (wert, max) { return max === null ? wert : Math.min(wert, max); };

  function pruefe(baum, eintraege) {
    var knoten = {}, reihenfolge = [], direkt = {};

    /* 1. Knoten einsammeln */
    (function sammle(k, tiefe, eltern) {
      knoten[k.id] = { id: k.id, name: k.name || k.id, tiefe: tiefe, eltern: eltern, def: k,
                       roh: null3(), n: null3(), direkt: null3() };
      reihenfolge.push(k.id);
      (k.kinder || []).forEach(function (c) { sammle(c, tiefe + 1, k.id); });
    })(baum, 0, null);

    /* 2. Einträge zuordnen und nach oben summieren */
    var unbekannt = [];
    eintraege.forEach(function (e) {
      if (!knoten[e.knoten]) { if (unbekannt.indexOf(e.knoten) < 0) unbekannt.push(e.knoten); return; }
      knoten[e.knoten].direkt[e.status] += e.cp;
      for (var id = e.knoten; id; id = knoten[id].eltern) {
        knoten[id].roh[e.status] += e.cp;
        knoten[id].n[e.status] += 1;
      }
    });

    /* 3. Anrechnung mit Kappung, von unten nach oben */
    (function rechne(k) {
      var r = knoten[k.id], max = grenze(k, 'cp', 'max');
      var d = r.direkt.d, alle = summe(r.direkt);
      (k.kinder || []).forEach(function (c) {
        rechne(c);
        d += knoten[c.id].angerechnet.d;
        alle += knoten[c.id].angerechnet.alle;
      });
      r.angerechnet = { d: kappe(d, max), alle: kappe(alle, max) };
    })(baum);

    /* 4. Soll und Spielraum, von oben nach unten */
    var mindest = function (c) { return c.freiwillig ? 0 : (grenze(c, 'cp', 'min') || 0); };
    (function soll(k, wert) {
      var r = knoten[k.id];
      r.soll = wert;
      var kinder = k.kinder || [];
      if (!kinder.length) return;
      var beitrag = function (c) { return Math.max(mindest(c), knoten[c.id].angerechnet.alle); };
      var gesamt = summe(r.direkt);
      kinder.forEach(function (c) { gesamt += beitrag(c); });
      r.spielraum = Math.max(0, wert - gesamt);
      kinder.forEach(function (c) {
        var s = mindest(c);
        if (c.ausgleich) s = Math.max(s, wert - (gesamt - beitrag(c)));
        soll(c, kappe(s, grenze(c, 'cp', 'max')));
      });
    })(baum, mindest(baum));

    /* 5. Zustand und Vertiefung */
    reihenfolge.forEach(function (id) {
      var r = knoten[id], k = r.def, alle = summe(r.roh), anzahl = summe(r.n);
      var cpMax = grenze(k, 'cp', 'max'), modMin = k.freiwillig ? null : grenze(k, 'module', 'min'), modMax = grenze(k, 'module', 'max');
      r.ueberschuss = cpMax !== null && alle > cpMax ? alle - cpMax : 0;
      r.ueberzaehligeModule = modMax !== null && anzahl > modMax ? anzahl - modMax : 0;
      r.fehlendeCP = Math.max(0, r.soll - r.angerechnet.alle);
      r.fehlendeModule = modMin !== null && anzahl < modMin ? modMin - anzahl : 0;
      r.zustand = r.ueberschuss || r.ueberzaehligeModule ? 'zuviel'
                : r.fehlendeCP || r.fehlendeModule ? 'offen' : 'ok';
      if (k.vertiefung) {
        var best = null, ohne = k.vertiefung.ohne || [];
        (k.kinder || []).forEach(function (c) {
          if (ohne.indexOf(c.id) >= 0) return;
          var s = summe(knoten[c.id].roh);
          if (!best || s > best.alle) best = { knoten: c.id, alle: s, d: knoten[c.id].roh.d };
        });
        if (best) {
          best.min = k.vertiefung.min;
          best.erreicht = best.alle >= best.min;
          best.bestanden = best.d >= best.min;
        }
        r.vertiefung = best;
      }
      delete r.def; delete r.direkt;
    });

    return { knoten: knoten, reihenfolge: reihenfolge, unbekannt: unbekannt };
  }

  var Baum = { pruefe: pruefe };
  if (typeof module === 'object' && module.exports) { module.exports = Baum; }
  else { (root.ESE = root.ESE || {}).Baum = Baum; }
})(typeof self !== 'undefined' ? self : this);
