/* data/ese-struktur.js: Aufbau des Studiengangs ESE (Energy Science and Engineering).
   Quellen: Ordnung des Studiengangs ESE vom 20.04.2022 (PO 2023) mit Anhang I Studien- und Prüfungsplan
   (Stand 01.08.2022), Studienplan ESE (Satzungsbeilage 2026_IV), Modulhandbuch ESE (PO 2023).
   Änderungen an Regeln oder Beschriftungen gehören hierher, nicht in src/. */
(function (root) {
  'use strict';
  var Struktur = {
    studiengang: { kurz: 'ESE', name: 'Energy Science and Engineering', po: 'Prüfungsordnung 2023' },
    grenzen: {
      gesamt: 120,
      basisPlusWahlpflicht: 108,
      grundlagenMax: 31,
      iep: 6,
      thesis: 30,
      wahlpflichtMin: 41,
      wahlpflichtMax: 72,
      wahlbereich: 12,
      vertiefungMin: 20,
      wahlpflichtJeFachbereich: 32,  /* höchstens 32 CP im Wahlpflichtbereich aus dem Angebot eines Fachbereichs */
      miniForschungMax: 2,           /* höchstens zwei Mini-Forschungsprojekte */
      fachfremdMin: 5,               /* mind. 5 CP aus FB 01, 02 oder 03 im Wahlpflicht- und Wahlbereich */
      thesisVorher: 75,              /* Thema der Thesis erst ab 75 erworbenen CP */
      semesterRichtwert: 30,
      semesterHoch: 36
    },
    /* Themenbereiche des Wahlpflichtbereichs. vertiefung: false = kann nicht als Vertiefung gewählt werden */
    themen: [
      { id: 'ebi', name: 'Energie, Bau, Infrastruktur' },
      { id: 'mob', name: 'Mobilität und Transport' },
      { id: 'mat', name: 'Materialien' },
      { id: 'ern', name: 'Erneuerbare Energien' },
      { id: 'mul', name: 'Multimodale Systeme' },
      { id: 'kw',  name: 'Zukünftige Kraftwerke' },
      { id: 'qs',  name: 'Querschnittsthemen', vertiefung: false }
    ],
    bereiche: {
      Grundlagen:  { name: 'Grundlagenmodule',                  farbe: '--c-gr' },
      IEP:         { name: 'Interdisziplinäres Energieprojekt', farbe: '--c-iep' },
      Wahlpflicht: { name: 'Wahlpflichtbereich',                farbe: '--c-mul' },
      Thesis:      { name: 'Masterthesis',                      farbe: '--c-th' },
      Wahlbereich: { name: 'Wahlbereich',                       farbe: '--c-wb' }
    },
    /* Zeitraum, mit dem ein neuer Plan startet. Studienbeginn ist das laufende Semester,
       in der App unter "Zeitraum" änderbar. */
    zeitraum: { anzahl: 4, min: 1, max: 12 },
    turnus: { WiSe: 'Wintersemester', SoSe: 'Sommersemester', jedes: 'jedes Semester',
              zwei: 'jedes 2. Semester', drei: 'jedes 3. Semester', x: 'Turnus offen' },
    sprachen: { de: 'Deutsch', en: 'Englisch', 'de/en': 'Deutsch oder Englisch' },
    /* Fachbereiche der TU Darmstadt nach den ersten beiden Stellen der Modulnummer */
    fachbereiche: {
      '01': 'Rechts- und Wirtschaftswissenschaften', '02': 'Gesellschafts- und Geschichtswissenschaften',
      '03': 'Humanwissenschaften', '04': 'Mathematik', '05': 'Physik', '07': 'Chemie', '10': 'Biologie',
      '11': 'Material- und Geowissenschaften', '13': 'Bau- und Umweltingenieurwissenschaften',
      '15': 'Architektur', '16': 'Maschinenbau', '18': 'Elektrotechnik und Informationstechnik', '20': 'Informatik'
    },
    /* Notenstufen an der TU Darmstadt */
    noten: [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0]
  };
  /* Aufbau als Baum für die allgemeine Rechnung in app/src/kern/baum.js.
     Wahlpflicht ist der Ausgleichsbereich: Er muss bringen, was Grundlagen, Projekt und Thesis
     zu den 108 CP nicht beitragen (mindestens 41, höchstens 72 CP). Die Knoten-IDs entsprechen
     den Werten von "bereich" im Katalog bzw. den IDs der Themenbereiche. */
  var G = Struktur.grenzen, B = Struktur.bereiche;
  Struktur.baum = { id: 'gesamt', name: 'Gesamt', cp: { min: G.gesamt, max: G.gesamt }, kinder: [
    { id: 'basis', name: 'Grundlagen, Projekt, Wahlpflicht und Thesis',
      cp: { min: G.basisPlusWahlpflicht, max: G.basisPlusWahlpflicht }, kinder: [
      { id: 'Grundlagen', name: B.Grundlagen.name, cp: { max: G.grundlagenMax } },
      { id: 'IEP', name: B.IEP.name, cp: { min: G.iep, max: G.iep } },
      { id: 'Wahlpflicht', name: B.Wahlpflicht.name, cp: { min: G.wahlpflichtMin, max: G.wahlpflichtMax },
        ausgleich: true,
        maxJeGruppe: { max: G.wahlpflichtJeFachbereich },
        vertiefung: { min: G.vertiefungMin,
                      ohne: Struktur.themen.filter(function (t) { return t.vertiefung === false; }).map(function (t) { return t.id; }) },
        kinder: Struktur.themen.map(function (t) { return { id: t.id, name: t.name }; }) },
      { id: 'Thesis', name: B.Thesis.name, cp: { min: G.thesis, max: G.thesis } }
    ]},
    { id: 'Wahlbereich', name: B.Wahlbereich.name, cp: { min: G.wahlbereich, max: G.wahlbereich } }
  ]};

  /* Regeln aus Anhang I, die quer über Bereiche gehen (Auswertung: app/src/kern/zusatzregeln.js) */
  var MFP = '^18-en-202[0-6]$';
  Struktur.zusatzregeln = [
    { id: 'mfp', typ: 'maxModule', name: 'Mini-Forschungsprojekte', bereiche: ['Wahlpflicht'], nrMuster: MFP,
      max: G.miniForschungMax },
    { id: 'fachfremd', typ: 'minCP', bereiche: ['Wahlpflicht', 'Wahlbereich'], gruppen: ['01', '02', '03'],
      min: G.fachfremdMin },
    { id: 'thesis', typ: 'cpVorher', knoten: 'Thesis', min: G.thesisVorher },
    { id: 'mfpVertiefung', typ: 'vertiefungEnthaelt', knoten: 'Wahlpflicht', nrMuster: MFP }
  ];

  if (typeof module === 'object' && module.exports) { module.exports = Struktur; }
  else { (root.ESE = root.ESE || {}).Struktur = Struktur; }
})(typeof self !== 'undefined' ? self : this);
