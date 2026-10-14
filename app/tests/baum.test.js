/* Prüft die allgemeine Baum-Rechnung an kleinen, erfundenen Strukturen. */
const test = require('node:test');
const assert = require('node:assert');
const Baum = require('../src/kern/baum.js');

/* Zwei Ebenen, angelehnt an WI-MB Maschinenbau */
const MB = { id: 'mb', name: 'Maschinenbau', cp: { min: 42, max: 42 }, kinder: [
  { id: 'kern', cp: { min: 32, max: 42 }, kinder: [
    { id: 'gl', cp: { min: 6, max: 18 }, module: { min: 1 } },
    { id: 'wf', cp: { min: 14, max: 32 }, module: { min: 2, max: 10 } }
  ]},
  { id: 'praxis', cp: { min: 4, max: 6 }, module: { min: 1, max: 2 } },
  { id: 'wahl', cp: { max: 10 }, freiwillig: true, kinder: [
    { id: 'erg', module: { max: 2 } }
  ]}
]};

const e = (knoten, cp, status) => ({ knoten, cp, status: status || 'p' });

test('leer: alles offen, außer freiwillige Bereiche', () => {
  const r = Baum.pruefe(MB, []);
  assert.strictEqual(r.knoten.mb.zustand, 'offen');
  assert.strictEqual(r.knoten.gl.zustand, 'offen');
  assert.strictEqual(r.knoten.wahl.zustand, 'ok');
  assert.strictEqual(r.knoten.erg.zustand, 'ok');
  assert.deepStrictEqual(r.reihenfolge, ['mb', 'kern', 'gl', 'wf', 'praxis', 'wahl', 'erg']);
  assert.strictEqual(r.knoten.wf.tiefe, 2);
});

test('Summen wandern nach oben, getrennt nach Status', () => {
  const r = Baum.pruefe(MB, [e('gl', 6, 'd'), e('wf', 8, 'a'), e('wf', 6, 'p'), e('erg', 4, 'd')]);
  assert.deepStrictEqual(r.knoten.kern.roh, { d: 6, a: 8, p: 6 });
  assert.deepStrictEqual(r.knoten.kern.n, { d: 1, a: 1, p: 1 });
  assert.deepStrictEqual(r.knoten.mb.roh, { d: 10, a: 8, p: 6 });
  assert.deepStrictEqual(r.knoten.mb.angerechnet, { d: 10, alle: 24 });
});

test('Höchstgrenzen kappen von unten nach oben', () => {
  const r = Baum.pruefe(MB, [e('gl', 24), e('wf', 32), e('praxis', 6), e('erg', 12)]);
  assert.strictEqual(r.knoten.gl.angerechnet.alle, 18);
  assert.strictEqual(r.knoten.kern.angerechnet.alle, 42);
  assert.strictEqual(r.knoten.wahl.angerechnet.alle, 10);
  assert.strictEqual(r.knoten.mb.angerechnet.alle, 42);
  assert.strictEqual(r.knoten.gl.zustand, 'zuviel');
  assert.strictEqual(r.knoten.gl.ueberschuss, 6);
});

test('Modulanzahl: zu wenige und zu viele', () => {
  const r = Baum.pruefe(MB, [e('wf', 14), e('erg', 2), e('erg', 2), e('erg', 2)]);
  assert.strictEqual(r.knoten.wf.zustand, 'offen');
  assert.strictEqual(r.knoten.wf.fehlendeModule, 1);
  assert.strictEqual(r.knoten.erg.zustand, 'zuviel');
  assert.strictEqual(r.knoten.erg.ueberzaehligeModule, 1);
});

test('Soll: ein Ausgleichsbereich übernimmt, was die Geschwister nicht liefern', () => {
  const T = { id: 't', cp: { min: 108, max: 108 }, kinder: [
    { id: 'g', cp: { max: 31 } }, { id: 'i', cp: { min: 6, max: 6 } },
    { id: 'w', cp: { min: 41, max: 72 }, ausgleich: true }, { id: 'th', cp: { min: 30, max: 30 } }
  ]};
  assert.strictEqual(Baum.pruefe(T, []).knoten.g.soll, 0);
  assert.strictEqual(Baum.pruefe(T, []).knoten.w.soll, 72);
  assert.strictEqual(Baum.pruefe(T, [e('g', 10)]).knoten.w.soll, 62);
  assert.strictEqual(Baum.pruefe(T, [e('g', 40)]).knoten.w.soll, 41);
});

test('Spielraum: CP, die über die Mindestwerte der Unterbereiche hinaus noch zu verteilen sind', () => {
  const leer = Baum.pruefe(MB, []);
  assert.strictEqual(leer.knoten.mb.spielraum, 6);
  assert.strictEqual(leer.knoten.kern.spielraum, 12);
  assert.strictEqual(leer.knoten.kern.soll, 32);
  const r = Baum.pruefe(MB, [e('gl', 12), e('wf', 20), e('praxis', 4)]);
  assert.strictEqual(r.knoten.mb.spielraum, 6);
  assert.strictEqual(r.knoten.kern.spielraum, 0);
  assert.strictEqual(r.knoten.gl.spielraum, undefined);
});

test('Einträge direkt an einem Knoten mit Kindern zählen mit', () => {
  const r = Baum.pruefe(MB, [e('kern', 5), e('gl', 6)]);
  assert.strictEqual(r.knoten.kern.angerechnet.alle, 11);
  assert.strictEqual(r.knoten.kern.n.p, 2);
});

test('Vertiefung: bestes Kind, ausgenommene Kinder zählen nicht', () => {
  const W = { id: 'w', vertiefung: { min: 20, ohne: ['q'] }, kinder: [{ id: 'a' }, { id: 'b' }, { id: 'q' }] };
  const r = Baum.pruefe(W, [e('a', 8, 'd'), e('b', 12), e('b', 4, 'd'), e('q', 30, 'd')]);
  assert.deepStrictEqual(r.knoten.w.vertiefung, { knoten: 'b', alle: 16, d: 4, min: 20, erreicht: false, bestanden: false });
});

test('unbekannter Knoten wird gemeldet statt verschluckt', () => {
  const r = Baum.pruefe(MB, [e('gibtsnicht', 6)]);
  assert.deepStrictEqual(r.unbekannt, ['gibtsnicht']);
});
