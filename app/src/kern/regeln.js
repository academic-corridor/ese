/* app/src/kern/regeln.js: Rechenlogik und Prüfregeln. Reine Funktionen, kein Zugriff auf die Seite (DOM).
   Dadurch testbar mit `npm test`. Zahlen kommen aus studiengaenge/ese/struktur.js.

   Ein Modul im Plan zählt als
     d  bestanden          (Häkchen gesetzt)
     a  läuft              (im laufenden Semester, ohne Häkchen)
     p  geplant            (in einem anderen Semester, ohne Häkchen) */
(function (root) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  var S = node ? require('../../../studiengaenge/ese/struktur.js') : root.ESE.Struktur;
  var Sem = node ? require('./semester.js') : root.ESE.Semester;
  var G = S.grenzen;

  function themaName(id) {
    var t = S.themen.filter(function (x) { return x.id === id; })[0];
    return t ? t.name : '';
  }

  /* Status eines Moduls: null (Katalog), 'd', 'a' oder 'p' */
  function status(m, aktuell) {
    if (!m.sem) return null;
    if (m.ok) return 'd';
    return m.sem === aktuell ? 'a' : 'p';
  }

  /* CP-gewichteter Durchschnitt über bestandene Module mit Note, oder null */
  function notenschnitt(mods) {
    var cp = 0, sum = 0;
    mods.forEach(function (m) { if (m.ok && m.note !== null && m.note !== undefined) { cp += m.cp; sum += m.cp * m.note; } });
    return cp ? { schnitt: Math.round(sum / cp * 100) / 100, cp: cp } : null;
  }

  /* Summen pro Bereich und Themenbereich, getrennt nach d, a, p (siehe oben) */
  function berechne(plan, heute) {
    var aktuell = Sem.aktuell(heute);
    var z = function () { return { d: 0, a: 0, p: 0 }; };
    var Sum = {};
    Object.keys(S.bereiche).forEach(function (k) { Sum[k] = z(); });
    var T = {};
    S.themen.forEach(function (t) { T[t.id] = z(); });
    var load = {};
    Sem.liste(plan.start, plan.anzahl).forEach(function (id) { load[id] = 0; });

    plan.mods.forEach(function (m) {
      var k = status(m, aktuell); if (!k) return;
      Sum[m.bereich][k] += m.cp;
      if (m.bereich === 'Wahlpflicht' && m.thema && T[m.thema]) T[m.thema][k] += m.cp;
      if (load[m.sem] !== undefined) load[m.sem] += m.cp;
    });

    var all = function (o) { return o.d + o.a + o.p; };
    var grundlagen = Math.min(all(Sum.Grundlagen), G.grundlagenMax);
    var needWP = Math.max(G.wahlpflichtMin, G.basisPlusWahlpflicht - grundlagen - G.iep - G.thesis);
    var soll = { Grundlagen: grundlagen, IEP: G.iep, Wahlpflicht: needWP, Thesis: G.thesis, Wahlbereich: G.wahlbereich };

    var tot = function (f) {
      var g = Math.min(f(Sum.Grundlagen), G.grundlagenMax),
          i = Math.min(f(Sum.IEP), G.iep),
          t = Math.min(f(Sum.Thesis), G.thesis),
          w = Math.min(f(Sum.Wahlpflicht), G.wahlpflichtMax),
          b = Math.min(f(Sum.Wahlbereich), G.wahlbereich);
      return Math.min(G.basisPlusWahlpflicht, g + i + t + w) + b;
    };
    return { S: Sum, T: T, load: load, aktuell: aktuell, G: grundlagen, needWP: needWP, soll: soll, all: all,
             done: tot(function (o) { return o.d; }), total: tot(all), noten: notenschnitt(plan.mods) };
  }

  /* true, wenn ein Wintersemester-Modul im Sommersemester steht (oder umgekehrt) */
  function saisonKonflikt(m) {
    if (!m.sem) return false;
    return (m.turnus === 'WiSe' || m.turnus === 'SoSe') && m.turnus !== Sem.saison(m.sem);
  }

  /* Hinweise für die Seitenleiste: Liste aus [stufe, text], stufe = ok | warn | info */
  function hinweise(c, plan) {
    var msgs = [], mods = plan.mods;
    var wp = c.all(c.S.Wahlpflicht);
    if (wp < c.needWP) msgs.push(['warn', 'Wahlpflicht: ' + (c.needWP - wp) + ' CP fehlen noch bis zum Soll von ' + c.needWP + ' CP.']);
    else msgs.push(['ok', 'Wahlpflicht: Soll von ' + c.needWP + ' CP ist mit Planung erreicht.']);
    if (wp > G.wahlpflichtMax) msgs.push(['info', 'Wahlpflicht: Über ' + G.wahlpflichtMax + ' CP zählen nicht mehr (' + (wp - G.wahlpflichtMax) + ' CP Überschuss).']);
    if (c.all(c.S.Grundlagen) > 0) msgs.push(['info', 'Grundlagenmodule (' + c.G + ' CP) zählen nur nach Zuweisung durch die Prüfungskommission. Ohne Zuweisung steigt das Wahlpflicht-Soll auf ' + (G.basisPlusWahlpflicht - G.iep - G.thesis) + ' CP.']);

    var best = null;
    S.themen.forEach(function (t) {
      if (t.vertiefung === false) return;
      var a = c.T[t.id], s = a.d + a.a + a.p;
      if (!best || s > best.s) best = { n: t.name, s: s, d: a.d };
    });
    if (best) {
      if (best.d >= G.vertiefungMin) msgs.push(['ok', 'Vertiefung erreicht: ' + best.n + ' (' + best.d + ' CP bestanden).']);
      else if (best.s >= G.vertiefungMin) msgs.push(['ok', 'Vertiefung mit Planung erreicht: ' + best.n + ' (' + best.s + ' CP).']);
      else msgs.push(['warn', 'Noch keine Vertiefung: ' + (best.s ? best.n + ' liegt vorn mit ' + best.s : 'bisher 0') + ' von ' + G.vertiefungMin + ' CP.']);
    }
    if (c.all(c.S.IEP) < G.iep) msgs.push(['info', 'Das Interdisziplinäre Energieprojekt (' + G.iep + ' CP) ist noch nicht eingeplant.']);
    if (c.all(c.S.Thesis) < G.thesis) msgs.push(['info', 'Die Masterthesis (' + G.thesis + ' CP) ist noch nicht eingeplant.']);
    var wb = c.all(c.S.Wahlbereich);
    if (wb < G.wahlbereich) msgs.push(['info', 'Wahlbereich: ' + (G.wahlbereich - wb) + ' CP offen. Frei wählbar aus dem Gesamtkatalog der TU Darmstadt, dafür oben im Katalog "Eigenes Modul anlegen" nutzen.']);

    Object.keys(c.load).forEach(function (id) {
      if (c.load[id] > G.semesterHoch) msgs.push(['warn', Sem.label(id) + ': ' + c.load[id] + ' CP sind viel für ein Semester (Richtwert ' + G.semesterRichtwert + ' CP).']);
    });
    var offenAlt = mods.filter(function (m) { return m.sem && !m.ok && Sem.vergleich(m.sem, c.aktuell) < 0; });
    if (offenAlt.length) msgs.push(['warn', offenAlt.length + (offenAlt.length === 1 ? ' Modul liegt' : ' Module liegen') + ' in vergangenen Semestern ohne Häkchen: ' + offenAlt.map(function (m) { return m.name; }).join(', ') + '.']);
    mods.forEach(function (m) {
      if (saisonKonflikt(m)) msgs.push(['warn', m.name + ' wird im ' + S.turnus[m.turnus] + ' angeboten, steht aber im ' + Sem.label(m.sem) + '.']);
    });
    return msgs;
  }

  var Regeln = { berechne: berechne, status: status, notenschnitt: notenschnitt,
                 saisonKonflikt: saisonKonflikt, hinweise: hinweise, themaName: themaName };
  if (node) { module.exports = Regeln; } else { (root.ESE = root.ESE || {}).Regeln = Regeln; }
})(typeof self !== 'undefined' ? self : this);
