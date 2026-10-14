/* data/ese-struktur.js: Aufbau des Studiengangs ESE (Energy Science and Engineering).
   Quellen: Studienplan ESE (Satzungsbeilage 2026_IV), Modulhandbuch ESE (PO 2023).
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
    /* Notenstufen an der TU Darmstadt */
    noten: [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0]
  };
  if (typeof module === 'object' && module.exports) { module.exports = Struktur; }
  else { (root.ESE = root.ESE || {}).Struktur = Struktur; }
})(typeof self !== 'undefined' ? self : this);
