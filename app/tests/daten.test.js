/* Prüft den Modulkatalog auf Konsistenz. Start: npm test */
const test = require('node:test');
const assert = require('node:assert');
const S = require('../../studiengaenge/ese/struktur.js');
const Katalog = require('../../studiengaenge/ese/module.js');

test('Katalog enthält alle 160 Module des Modulhandbuchs', () => {
  assert.strictEqual(Katalog.length, 160);
});

test('Modul-IDs und Modulnummern sind eindeutig', () => {
  const ids = Katalog.map(m => m.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  const nrs = Katalog.map(m => m.nr);
  assert.strictEqual(new Set(nrs).size, nrs.length);
});

test('jedes Modul hat gültige Pflichtfelder', () => {
  Katalog.forEach(m => {
    assert.match(m.id, /^[a-z0-9_]+$/, m.id + ': ID ungültig');
    assert.ok(m.name && m.name.trim(), m.id + ': Name fehlt');
    assert.ok(Number.isInteger(m.cp) && m.cp > 0, m.id + ': CP ungültig');
    assert.ok(S.bereiche[m.bereich], m.id + ': Bereich unbekannt');
    assert.ok(S.turnus[m.turnus], m.id + ': Turnus unbekannt');
    assert.ok(S.sprachen[m.sprache], m.id + ': Sprache unbekannt');
  });
});

test('Wahlpflichtmodule haben gültige Themenbereiche, andere keine', () => {
  Katalog.forEach(m => {
    if (m.bereich === 'Wahlpflicht') {
      assert.ok(m.themen.length >= 1, m.id + ': Thema fehlt');
      m.themen.forEach(t => assert.ok(S.themen.some(x => x.id === t), m.id + ': Thema ' + t + ' unbekannt'));
    } else assert.deepStrictEqual(m.themen, [], m.id + ': Thema nur bei Wahlpflicht');
  });
});

test('Pflichtbereich: IEP und Thesis je einmal, 11 Grundlagenmodule', () => {
  assert.strictEqual(Katalog.filter(m => m.bereich === 'IEP').length, 1);
  assert.strictEqual(Katalog.filter(m => m.bereich === 'Thesis').length, 1);
  assert.strictEqual(Katalog.filter(m => m.bereich === 'Grundlagen').length, 11);
});

test('Grenzen sind in sich stimmig', () => {
  const g = S.grenzen;
  assert.strictEqual(g.basisPlusWahlpflicht + g.wahlbereich, g.gesamt);
  assert.strictEqual(g.basisPlusWahlpflicht - g.iep - g.thesis, g.wahlpflichtMax);
});
