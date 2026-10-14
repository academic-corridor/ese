/* Prüft Rechnung und Hinweise. Stichtag ist der 14.10.2026 (laufendes Semester WiSe 26/27). */
const test = require('node:test');
const assert = require('node:assert');
const R = require('../src/kern/regeln.js');
const Z = require('../src/kern/plan.js');

const HEUTE = new Date(2026, 9, 14);
const texte = (plan) => R.hinweise(R.berechne(plan, HEUTE), plan).map(h => h[1]);

/* Plan ab WiSe 25/26 mit einigen belegten Modulen */
function beispiel() {
  const plan = Z.neu(HEUTE);
  Z.zeitraumAendern(plan, 'W2025', 4);
  const set = (nr, sem, ok, note) => {
    const m = plan.mods.find(x => x.nr === nr);
    Object.assign(m, { sem, ok: !!ok, note: note === undefined ? null : note });
    return m;
  };
  set('18-st-2010', 'S2026', true, 1.3);   // Energiemanagement & Optimierung, 6 CP, mul
  set('18-st-2060', 'S2026', true, 2.0);   // Technik und Ökonomie Multimodaler Energiesysteme, 5 CP, mul
  set('18-st-2070', 'S2026', true);        // Scientific Computing, 4 CP, qs, ohne Note
  set('18-st-2080', 'W2026');              // Energiewende gestalten, 6 CP, mul, läuft
  set('18-hs-2100', 'W2026');              // Simulation des el. EVS, 3 CP, mul, läuft
  set('11-01-4404', 'W2026');              // Grundlagen, 5 CP, läuft
  set('18-en-2010', 'S2027');              // IEP, 6 CP, geplant
  return plan;
}

test('leerer Plan: nichts belegt, Studienbeginn = laufendes Semester', () => {
  const plan = Z.neu(HEUTE);
  assert.strictEqual(plan.start, 'W2026');
  assert.ok(plan.mods.every(m => m.sem === null && !m.ok));
  const c = R.berechne(plan, HEUTE);
  assert.strictEqual(c.done, 0);
  assert.strictEqual(c.total, 0);
  assert.strictEqual(c.needWP, 72);
  assert.strictEqual(c.noten, null);
});

test('Status: bestanden, läuft, geplant', () => {
  const plan = beispiel();
  const c = R.berechne(plan, HEUTE);
  assert.deepStrictEqual(c.S.Wahlpflicht, { d: 15, a: 9, p: 0 });
  assert.deepStrictEqual(c.S.Grundlagen, { d: 0, a: 5, p: 0 });
  assert.deepStrictEqual(c.S.IEP, { d: 0, a: 0, p: 6 });
  assert.strictEqual(c.done, 15);
  assert.strictEqual(c.total, 35);
  assert.strictEqual(c.load.S2026, 15);
  assert.strictEqual(c.load.W2026, 14);
  assert.strictEqual(c.T.mul.d, 11);
  assert.strictEqual(c.T.mul.a, 9);
  assert.strictEqual(c.T.qs.d, 4);
});

test('Notenschnitt: CP-gewichtet, nur bestandene Module mit Note', () => {
  const c = R.berechne(beispiel(), HEUTE);
  // (6 * 1.3 + 5 * 2.0) / 11 = 1.618...
  assert.deepStrictEqual(c.noten, { schnitt: 1.62, cp: 11 });
});

test('Grundlagenmodule senken das Wahlpflicht-Soll', () => {
  const c = R.berechne(beispiel(), HEUTE);
  assert.strictEqual(c.G, 5);
  assert.strictEqual(c.needWP, 67);
});

test('Wahlpflicht über 72 CP und Grundlagen über 31 CP zählen nicht', () => {
  const p = (bereich, cp) => ({ start: 'W2026', anzahl: 1, mods: [{ id: 'x', cp, bereich, thema: bereich === 'Wahlpflicht' ? 'mul' : null, sem: 'W2026', ok: true, note: null }] });
  assert.strictEqual(R.berechne(p('Wahlpflicht', 80), HEUTE).done, 72);
  assert.strictEqual(R.berechne(p('Grundlagen', 40), HEUTE).done, 31);
});

test('Themenwahl bei Modulen in mehreren Themenbereichen', () => {
  const plan = Z.neu(HEUTE);
  const m = plan.mods.find(x => x.nr === '18-bi-2010'); // Energy Converters, mob und ern
  assert.deepStrictEqual(m.themen, ['mob', 'ern']);
  Object.assign(m, { sem: 'W2026', thema: 'ern' });
  const c = R.berechne(plan, HEUTE);
  assert.strictEqual(c.T.ern.a, 7);
  assert.strictEqual(c.T.mob.a, 0);
});

test('Saison-Konflikt: Wintersemester-Modul im Sommersemester', () => {
  const ewg = Z.neu(HEUTE).mods.find(m => m.nr === '18-st-2080');
  assert.strictEqual(R.saisonKonflikt(Object.assign({}, ewg, { sem: 'W2026' })), false);
  assert.strictEqual(R.saisonKonflikt(Object.assign({}, ewg, { sem: 'S2027' })), true);
  assert.strictEqual(R.saisonKonflikt(Object.assign({}, ewg, { sem: null })), false);
  const offen = Object.assign({}, ewg, { turnus: 'zwei', sem: 'S2027' });
  assert.strictEqual(R.saisonKonflikt(offen), false);
});

test('Hinweise im Beispielplan', () => {
  const t = texte(beispiel());
  assert.ok(t.includes('Wahlpflicht: 43 CP fehlen noch bis zum Soll von 67 CP.'));
  assert.ok(t.includes('Vertiefung mit Planung erreicht: Multimodale Systeme (20 CP).'));
  assert.ok(!t.some(x => x.startsWith('Das Interdisziplinäre Energieprojekt')));
});

test('Hinweis bei Modulen in vergangenen Semestern ohne Häkchen', () => {
  const plan = beispiel();
  plan.mods.find(m => m.nr === '18-st-2060').ok = false;
  assert.ok(texte(plan).some(x => x.startsWith('1 Modul liegt in vergangenen Semestern ohne Häkchen: Technik und Ökonomie')));
});

test('Hinweise im leeren Plan: IEP, Thesis und Wahlbereich offen, keine Vertiefung', () => {
  const t = texte(Z.neu(HEUTE));
  assert.ok(t.some(x => x.startsWith('Das Interdisziplinäre Energieprojekt (6 CP)')));
  assert.ok(t.some(x => x.startsWith('Die Masterthesis (30 CP)')));
  assert.ok(t.some(x => x.startsWith('Wahlbereich: 12 CP offen')));
  assert.ok(t.includes('Noch keine Vertiefung: bisher 0 von 20 CP.'));
});

test('Warnung bei mehr als 36 CP in einem Semester', () => {
  const plan = Z.neu(HEUTE);
  const wp = plan.mods.filter(m => m.bereich === 'Wahlpflicht').slice(0, 9);
  wp.forEach(m => { m.sem = 'S2027'; });
  const cp = wp.reduce((s, m) => s + m.cp, 0);
  assert.ok(cp > 36, 'Testdaten zu klein: ' + cp);
  assert.ok(texte(plan).some(x => x.startsWith('SoSe 27: ' + cp + ' CP sind viel')));
});
