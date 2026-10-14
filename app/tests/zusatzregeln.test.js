/* Prüft die Zusatzregeln an einer kleinen, erfundenen Struktur. */
const test = require('node:test');
const assert = require('node:assert');
const Baum = require('../src/kern/baum.js');
const Z = require('../src/kern/zusatzregeln.js');

const B = { id: 'g', kinder: [
  { id: 'wp', vertiefung: { min: 20 }, kinder: [{ id: 'a' }, { id: 'b' }] },
  { id: 'wb' }, { id: 'th' }
]};
const e = (knoten, cp, nr, sem, status) => ({ knoten, cp, nr, gruppe: Z.fachbereich(nr), sem: sem || 'W2025', status: status || 'p' });
const lauf = (regel, ein) => Z.pruefe([regel], ein, Baum.pruefe(B, ein))[0];

test('Fachbereich aus der Modulnummer', () => {
  assert.strictEqual(Z.fachbereich('18-st-2010'), '18');
  assert.strictEqual(Z.fachbereich('01-10-1028/f'), '01');
  assert.strictEqual(Z.fachbereich(''), null);
  assert.strictEqual(Z.fachbereich(undefined), null);
});

test('maxModule: höchstens zwei passende Module', () => {
  const r = { typ: 'maxModule', bereiche: ['wp'], nrMuster: '^18-en-202', max: 2 };
  assert.strictEqual(lauf(r, [e('a', 5, '18-en-2020'), e('b', 5, '18-en-2021')]).ok, true);
  const x = lauf(r, [e('a', 5, '18-en-2020'), e('b', 5, '18-en-2021'), e('a', 5, '18-en-2026'), e('wb', 5, '18-en-2023')]);
  assert.deepStrictEqual([x.ok, x.anzahl], [false, 3]);
});

test('minCP: Mindest-CP aus bestimmten Fachbereichen, Module ohne Nummer werden gezählt', () => {
  const r = { typ: 'minCP', bereiche: ['wp', 'wb'], gruppen: ['01', '02', '03'], min: 5 };
  const x = lauf(r, [e('wb', 3, '01-10-1028'), e('wb', 4, ''), e('th', 30, '02-00-0000')]);
  assert.deepStrictEqual([x.ok, x.cp, x.ohneNummer], [false, 3, 1]);
  assert.strictEqual(lauf(r, [e('wb', 3, '01-10-1028'), e('a', 5, '02-23-3001')]).ok, true);
});

test('cpVorher: genug CP vor dem Semester der Thesis', () => {
  const r = { typ: 'cpVorher', knoten: 'th', min: 75 };
  assert.strictEqual(lauf(r, [e('a', 50, '18-x', 'W2025')]).sem, null);
  const x = lauf(r, [e('a', 50, '18-x', 'W2025'), e('b', 20, '16-x', 'S2026'), e('a', 20, '13-x', 'W2026'), e('th', 30, '18-dy-5003', 'W2026')]);
  assert.deepStrictEqual([x.ok, x.cp, x.sem], [false, 70, 'W2026']);
});

test('vertiefungEnthaelt: Mini-Forschungsprojekt im Vertiefungsbereich', () => {
  const r = { typ: 'vertiefungEnthaelt', knoten: 'wp', nrMuster: '^18-en-202' };
  assert.deepStrictEqual(lauf(r, [e('a', 15, '18-x')]), { regel: r, ok: true, thema: null });
  assert.strictEqual(lauf(r, [e('a', 20, '18-x'), e('b', 5, '18-en-2021')]).ok, false);
  assert.strictEqual(lauf(r, [e('a', 20, '18-x'), e('a', 5, '18-en-2020')]).ok, true);
});

test('unbekannter Regeltyp fällt auf', () => {
  assert.throws(() => Z.pruefe([{ typ: 'gibtsnicht' }], [], Baum.pruefe(B, [])));
});
