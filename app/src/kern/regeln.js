/* app/src/kern/regeln.js: Rechenlogik und Prüfregeln. Reine Funktionen, kein Zugriff auf die Seite (DOM).
   Dadurch testbar mit `npm test`. Zahlen und Aufbau kommen aus studiengaenge/ese/struktur.js,
   die allgemeine Rechnung aus baum.js. Die Hinweistexte sind noch auf ESE zugeschnitten.

   Ein Modul im Plan zählt als
     d  bestanden          (Häkchen gesetzt)
     a  läuft              (im laufenden Semester, ohne Häkchen)
     p  geplant            (in einem anderen Semester, ohne Häkchen) */
(function (root) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  var S = node ? require('../../../studiengaenge/ese/struktur.js') : root.ESE.Struktur;
  var Sem = node ? require('./semester.js') : root.ESE.Semester;
  var Baum = node ? require('./baum.js') : root.ESE.Baum;
  var Zusatz = node ? require('./zusatzregeln.js') : root.ESE.Zusatzregeln;
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

  /* Knoten im Strukturbaum, für den ein Modul zählt: Themenbereich bei Wahlpflicht, sonst der Bereich */
  function knotenVon(m) {
    return m.bereich === 'Wahlpflicht' && m.thema && themaName(m.thema) ? m.thema : m.bereich;
  }

  /* Summen pro Bereich und Themenbereich, getrennt nach d, a, p (siehe oben).
     Die eigentliche Rechnung (Kappung, Soll) macht baum.js anhand von S.baum. */
  function berechne(plan, heute) {
    var aktuell = Sem.aktuell(heute);
    var load = {};
    Sem.liste(plan.start, plan.anzahl).forEach(function (id) { load[id] = 0; });

    var eintraege = [];
    plan.mods.forEach(function (m) {
      var k = status(m, aktuell); if (!k) return;
      eintraege.push({ knoten: knotenVon(m), cp: m.cp, status: k, nr: m.nr, gruppe: Zusatz.fachbereich(m.nr), sem: m.sem });
      if (load[m.sem] !== undefined) load[m.sem] += m.cp;
    });
    var baum = Baum.pruefe(S.baum, eintraege);
    var K = baum.knoten;
    var zusatz = {};
    Zusatz.pruefe(S.zusatzregeln, eintraege, baum).forEach(function (z) { zusatz[z.regel.id] = z; });

    var Sum = {};
    Object.keys(S.bereiche).forEach(function (k) { Sum[k] = K[k].roh; });
    var T = {};
    S.themen.forEach(function (t) { T[t.id] = K[t.id].roh; });

    var grundlagen = K.Grundlagen.angerechnet.alle;
    /* Wahlpflicht nach Fachbereich (aus den ersten beiden Stellen der Modulnummer) */
    var fbListe = Object.keys(K.Wahlpflicht.gruppen || {}).map(function (fb) {
      var g = K.Wahlpflicht.gruppen[fb];
      return { fb: fb, name: S.fachbereiche[fb] || '', d: g.d, alle: g.alle, max: g.max, ueberschuss: g.ueberschuss,
               frei: Math.max(0, g.max - g.alle) };
    }).sort(function (a, b) { return b.alle - a.alle || (a.fb < b.fb ? -1 : 1); });
    var ohneFb = 0;
    eintraege.forEach(function (e) { if (e.gruppe === null && (e.knoten === 'Wahlpflicht' || themaName(e.knoten))) ohneFb += e.cp; });
    var needWP = K.Wahlpflicht.soll;
    var soll = { Grundlagen: grundlagen, IEP: G.iep, Wahlpflicht: needWP, Thesis: G.thesis, Wahlbereich: G.wahlbereich };
    var all = function (o) { return o.d + o.a + o.p; };
    return { S: Sum, T: T, load: load, aktuell: aktuell, G: grundlagen, needWP: needWP, soll: soll, all: all,
             done: K.gesamt.angerechnet.d, total: K.gesamt.angerechnet.alle, noten: notenschnitt(plan.mods),
             baum: baum, zusatz: zusatz, fachbereiche: { liste: fbListe, ohneNummer: ohneFb } };
  }

  /* true, wenn ein Wintersemester-Modul im Sommersemester steht (oder umgekehrt) */
  function saisonKonflikt(m) {
    if (!m.sem) return false;
    return (m.turnus === 'WiSe' || m.turnus === 'SoSe') && m.turnus !== Sem.saison(m.sem);
  }

  /* Hinweise für die Seitenleiste: Liste aus [stufe, text], stufe = ok | warn | info */
  function hinweise(c, plan) {
    var msgs = [], mods = plan.mods;
    var WP = c.baum.knoten.Wahlpflicht, wp = c.all(c.S.Wahlpflicht), wpZaehlt = WP.angerechnet.alle;
    if (wpZaehlt < c.needWP) msgs.push(['warn', 'Wahlpflicht: ' + (c.needWP - wpZaehlt) + ' CP fehlen noch bis zum Soll von ' + c.needWP + ' CP.']);
    else msgs.push(['ok', 'Wahlpflicht: Soll von ' + c.needWP + ' CP ist mit Planung erreicht.']);
    c.fachbereiche.liste.forEach(function (f) {
      var wer = 'Fachbereich ' + f.fb + (f.name ? ' (' + f.name + ')' : '');
      if (f.ueberschuss) msgs.push(['warn', 'Wahlpflicht: ' + f.alle + ' CP aus ' + wer + '. Höchstens ' + f.max +
        ' CP je Fachbereich zählen, ' + f.ueberschuss + ' CP zählen nicht.']);
      else if (f.frei === 0) msgs.push(['info', 'Wahlpflicht: Grenze von ' + f.max + ' CP aus ' + wer + ' erreicht. Weitere Module von dort zählen nicht mehr.']);
      else if (f.frei <= G.fachbereichVorwarnung) msgs.push(['info', 'Wahlpflicht: ' + f.alle + ' von höchstens ' + f.max +
        ' CP aus ' + wer + ' eingeplant, noch ' + f.frei + ' CP frei.']);
    });
    if (wp > G.wahlpflichtMax) msgs.push(['info', 'Wahlpflicht: Über ' + G.wahlpflichtMax + ' CP zählen nicht mehr (' + (wp - G.wahlpflichtMax) + ' CP Überschuss).']);
    if (c.all(c.S.Grundlagen) > 0) msgs.push(['info', 'Grundlagenmodule (' + c.G + ' CP) zählen nur nach Zuweisung durch die Prüfungskommission. Ohne Zuweisung steigt das Wahlpflicht-Soll auf ' + (G.basisPlusWahlpflicht - G.iep - G.thesis) + ' CP.']);

    var v = c.baum.knoten.Wahlpflicht.vertiefung;
    if (v) {
      var vn = themaName(v.knoten);
      if (v.bestanden) msgs.push(['ok', 'Vertiefung erreicht: ' + vn + ' (' + v.d + ' CP bestanden).']);
      else if (v.erreicht) msgs.push(['ok', 'Vertiefung mit Planung erreicht: ' + vn + ' (' + v.alle + ' CP).']);
      else msgs.push(['warn', 'Noch keine Vertiefung: ' + (v.alle ? vn + ' liegt vorn mit ' + v.alle : 'bisher 0') + ' von ' + v.min + ' CP.']);
    }
    (c.baum.knoten.Wahlpflicht.weitereVertiefungen || []).forEach(function (w) {
      msgs.push(['ok', 'Zweite Vertiefung ' + (w.bestanden ? 'erreicht' : 'mit Planung erreicht') + ': ' + themaName(w.knoten) +
        ' (' + (w.bestanden ? w.d + ' CP bestanden' : w.alle + ' CP') + '). Wird ebenfalls auf dem Zeugnis ausgewiesen.']);
    });
    var z = c.zusatz;
    if (z.mfpVertiefung && !z.mfpVertiefung.ok) msgs.push(['info', 'Im Themenbereich der Vertiefung (' + themaName(z.mfpVertiefung.thema) + ') soll laut Studienordnung ein Mini-Forschungsprojekt absolviert werden.']);
    if (z.mfp && !z.mfp.ok) msgs.push(['warn', 'Mini-Forschungsprojekte: ' + z.mfp.anzahl + ' eingeplant, höchstens ' + z.mfp.max + ' können eingebracht werden.']);
    if (z.fachfremd && !z.fachfremd.ok) msgs.push(['info', 'Im Wahlpflicht- und Wahlbereich zusammen sind mindestens ' + z.fachfremd.min +
      ' CP aus den Fachbereichen Rechts- und Wirtschaftswissenschaften, Gesellschafts- und Geschichtswissenschaften oder Humanwissenschaften nötig (bisher ' + z.fachfremd.cp + ' CP).' +
      (z.fachfremd.ohneNummer ? ' Bei eigenen Modulen bitte die Modulnummer eintragen, sonst lässt sich das nicht prüfen.' : '')]);
    if (z.thesis && !z.thesis.ok) msgs.push(['warn', 'Masterthesis im ' + Sem.label(z.thesis.sem) + ': Bis dahin sind ' + z.thesis.cp +
      ' CP eingeplant. Das Thema wird erst ausgegeben, wenn mindestens ' + z.thesis.min + ' CP erworben sind.']);
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
                 saisonKonflikt: saisonKonflikt, hinweise: hinweise, themaName: themaName, knotenVon: knotenVon };
  if (node) { module.exports = Regeln; } else { (root.ESE = root.ESE || {}).Regeln = Regeln; }
})(typeof self !== 'undefined' ? self : this);
