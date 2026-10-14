/* Prüft das Rechnen mit Semestern. */
const test = require('node:test');
const assert = require('node:assert');
const Sem = require('../src/kern/semester.js');

test('laufendes Semester aus dem Datum', () => {
  assert.strictEqual(Sem.aktuell(new Date(2026, 9, 14)), 'W2026');  // 14.10.2026
  assert.strictEqual(Sem.aktuell(new Date(2027, 1, 1)), 'W2026');   // 01.02.2027
  assert.strictEqual(Sem.aktuell(new Date(2027, 3, 1)), 'S2027');   // 01.04.2027
  assert.strictEqual(Sem.aktuell(new Date(2027, 8, 30)), 'S2027');  // 30.09.2027
});

test('Beschriftung und Saison', () => {
  assert.strictEqual(Sem.label('W2026'), 'WiSe 26/27');
  assert.strictEqual(Sem.label('S2027'), 'SoSe 27');
  assert.strictEqual(Sem.label('W2099'), 'WiSe 99/00');
  assert.strictEqual(Sem.saison('W2026'), 'WiSe');
  assert.strictEqual(Sem.saison('S2027'), 'SoSe');
});

test('Reihenfolge: WiSe 25/26, SoSe 26, WiSe 26/27', () => {
  assert.deepStrictEqual(Sem.liste('W2025', 3), ['W2025', 'S2026', 'W2026']);
  assert.deepStrictEqual(Sem.liste('S2026', 2), ['S2026', 'W2026']);
  assert.strictEqual(Sem.naechstes('W2026', -1), 'S2026');
  assert.strictEqual(Sem.vergleich('S2026', 'W2025'), 1);
  assert.strictEqual(Sem.vergleich('W2025', 'S2026'), -1);
  assert.strictEqual(Sem.vergleich('W2025', 'W2025'), 0);
});

test('gültige Kennungen', () => {
  assert.ok(Sem.gueltig('W2025'));
  ['w2025', 'W25', 'X2025', '', null, 2025].forEach(x => assert.ok(!Sem.gueltig(x), String(x)));
});
