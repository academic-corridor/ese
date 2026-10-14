/* Prüft Zeitraum, Sichern, Laden und eigene Module. */
const test = require('node:test');
const assert = require('node:assert');
const Z = require('../src/kern/plan.js');

const HEUTE = new Date(2026, 9, 14);
const finde = (plan, nr) => plan.mods.find(m => m.nr === nr);

test('Sichern und Laden ergibt denselben Stand, auch mit eigenem Modul, Note und Themenwahl', () => {
  const plan = Z.neu(HEUTE);
  Z.zeitraumAendern(plan, 'W2025', 5);
  Object.assign(finde(plan, '11-01-7300'), { sem: 'S2026', ok: true, note: 1.7 });
  Object.assign(finde(plan, '18-bi-2010'), { sem: 'W2026', thema: 'ern' });
  const eigen = Z.neuesModul({ nr: '16-01-1234', name: 'Wärmepumpen', cp: 4, bereich: 'Wahlpflicht', thema: 'mul', turnus: 'WiSe' });
  eigen.sem = 'W2027';
  plan.mods.push(eigen);

  const datei = JSON.parse(JSON.stringify(Z.exportieren(plan)));
  assert.strictEqual(Object.keys(datei.belegung).length, 3);
  const r = Z.importieren(datei);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.skipped, 0);
  assert.strictEqual(r.plan.start, 'W2025');
  assert.strictEqual(r.plan.anzahl, 5);
  assert.deepStrictEqual(
    (({ sem, ok, note }) => ({ sem, ok, note }))(finde(r.plan, '11-01-7300')),
    { sem: 'S2026', ok: true, note: 1.7 });
  assert.strictEqual(finde(r.plan, '18-bi-2010').thema, 'ern');
  const e = finde(r.plan, '16-01-1234');
  assert.strictEqual(e.sem, 'W2027');
  assert.strictEqual(e.id, eigen.id);
  assert.strictEqual(r.plan.mods.length, plan.mods.length);
});

test('ungültige Dateien werden abgelehnt', () => {
  [null, undefined, 'text', 42, {}, { belegung: {} }, { version: 1, zuordnung: {} },
   { version: 2, start: 'X', belegung: {} }, { version: 2, start: 'W2025', belegung: null }]
    .forEach(x => assert.strictEqual(Z.importieren(x).ok, false, JSON.stringify(x)));
});

test('teilweise ungültige Dateien: gültiges wird übernommen, Rest übersprungen', () => {
  const r = Z.importieren({
    version: 2, start: 'W2026', anzahl: 2,
    belegung: {
      '18_st_2080': { sem: 'W2026', ok: true, note: 1.3 },
      '11_01_7300': { sem: 'W2030' },              // außerhalb des Zeitraums
      'gibtsnicht': { sem: 'W2026' },              // unbekanntes Modul
      '18_hs_2100': { sem: 'S2027', note: 0.7, thema: 'xyz' } // Note und Thema ungültig, Semester gültig
    },
    eigene: [{ id: 'a', name: '', cp: 3, bereich: 'Wahlpflicht' }, { id: 'b', name: 'ok', cp: 99, bereich: 'Wahlbereich' }]
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.skipped, 4);
  const ewg = finde(r.plan, '18-st-2080');
  assert.strictEqual(ewg.ok, true);
  assert.strictEqual(ewg.note, 1.3);
  const sim = finde(r.plan, '18-hs-2100');
  assert.strictEqual(sim.sem, 'S2027');
  assert.strictEqual(sim.note, null);
  assert.strictEqual(sim.thema, 'mul');
});

test('Zeitraum ändern: belegte Module dürfen nicht herausfallen', () => {
  const plan = Z.neu(HEUTE);
  assert.deepStrictEqual(Z.semester(plan), ['W2026', 'S2027', 'W2027', 'S2028']);
  assert.strictEqual(Z.zeitraumAendern(plan, 'W2024', 6).ok, true);
  finde(plan, '18-st-2080').sem = 'W2024';
  const r = Z.zeitraumAendern(plan, 'S2025', 6);
  assert.strictEqual(r.ok, false);
  assert.match(r.grund, /Energiewende gestalten in WiSe 24\/25/);
  assert.strictEqual(plan.start, 'W2024');
  assert.strictEqual(Z.zeitraumAendern(plan, 'W2024', 0).ok, false);
  assert.strictEqual(Z.zeitraumAendern(plan, 'W2024', 13).ok, false);
});

test('eigenes Modul: Eingaben werden geprüft', () => {
  assert.strictEqual(Z.neuesModul({ name: '  ', cp: 3, bereich: 'Wahlbereich' }), null);
  assert.strictEqual(Z.neuesModul({ name: 'A', cp: 0, bereich: 'Wahlbereich' }), null);
  assert.strictEqual(Z.neuesModul({ name: 'A', cp: 3, bereich: 'Unbekannt' }), null);
  assert.strictEqual(Z.neuesModul({ name: 'A', cp: 3, bereich: 'Wahlpflicht', thema: 'xyz' }), null);
  const m = Z.neuesModul({ name: ' A ', cp: 3, bereich: 'Wahlbereich', turnus: 'unbekannt' });
  assert.strictEqual(m.name, 'A');
  assert.strictEqual(m.turnus, 'x');
  assert.strictEqual(m.custom, true);
  assert.strictEqual(m.sem, null);
  assert.deepStrictEqual(m.themen, []);
});

test('eigenes Modul bearbeiten', () => {
  const m = Z.neuesModul({ name: 'A', cp: 3, bereich: 'Wahlbereich' });
  m.sem = 'W2026';
  assert.strictEqual(Z.aendereModul(m, { name: 'B', cp: 5, bereich: 'Wahlpflicht', thema: 'kw', nr: '16-xx' }), true);
  assert.strictEqual(m.name, 'B');
  assert.strictEqual(m.thema, 'kw');
  assert.strictEqual(m.sem, 'W2026');
  assert.strictEqual(Z.aendereModul(m, { name: '', cp: 5, bereich: 'Wahlbereich' }), false);
  assert.strictEqual(m.name, 'B');
  const katalog = Z.neu(HEUTE).mods[0];
  assert.strictEqual(Z.aendereModul(katalog, { name: 'X', cp: 3, bereich: 'Wahlbereich' }), false);
});

test('neue Module bekommen eindeutige IDs', () => {
  const a = Z.neuesModul({ name: 'A', cp: 3, bereich: 'Wahlbereich' });
  const b = Z.neuesModul({ name: 'B', cp: 3, bereich: 'Wahlbereich' });
  assert.notStrictEqual(a.id, b.id);
});
