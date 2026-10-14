/* Referenztests: Rechnung und Hinweise für viele zufällig erzeugte, aber feste Beispielpläne.
   Die erwarteten Ergebnisse liegen in referenz/ese.json und wurden VOR dem Umbau der
   Rechenlogik aufgezeichnet. Der Test stellt sicher, dass ein Umbau nichts an den Ergebnissen ändert.

   Neu aufzeichnen (nur wenn sich eine Regel absichtlich ändert):
     REFERENZ_NEU=1 npm test */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const R = require('../src/kern/regeln.js');
const Z = require('../src/kern/plan.js');

const HEUTE = new Date(2026, 9, 14);
const DATEI = path.join(__dirname, 'referenz', 'ese.json');

/* Fester Zufallsgenerator, damit bei jedem Lauf dieselben Pläne entstehen */
function zufall(seed) {
  return function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
}

/* Erzeugt Plan Nummer n: Zeitraum ab WiSe 25/26, Modulauswahl je nach n mal klein, mal übervoll */
function beispielplan(n) {
  const r = zufall(n + 1);
  const plan = Z.neu(HEUTE);
  Z.zeitraumAendern(plan, 'W2025', 6);
  const sems = Z.semester(plan);
  const anteil = [0.03, 0.1, 0.25, 0.5][n % 4];
  plan.mods.forEach(m => {
    if (r() >= anteil) return;
    m.sem = sems[Math.floor(r() * sems.length)];
    m.ok = r() < 0.5;
    m.note = m.ok && r() < 0.7 ? [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0][Math.floor(r() * 10)] : null;
    if (m.themen.length > 1) m.thema = m.themen[Math.floor(r() * m.themen.length)];
  });
  if (n % 5 === 0) {
    plan.mods.push(Z.neuesModul({ name: 'Studium Generale', cp: 4, bereich: 'Wahlbereich' }, 'eigen1'));
    plan.mods[plan.mods.length - 1].sem = sems[1];
  }
  return plan;
}

function ergebnis(plan) {
  const c = R.berechne(plan, HEUTE);
  /* genau die Kennzahlen, die es vor dem Umbau gab; neue Felder (z. B. baum) bleiben außen vor */
  const zahlen = {};
  ['S', 'T', 'load', 'aktuell', 'G', 'needWP', 'soll', 'done', 'total', 'noten'].forEach(k => { zahlen[k] = c[k]; });
  return { zahlen: JSON.parse(JSON.stringify(zahlen)), hinweise: R.hinweise(c, plan) };
}

const ANZAHL = 40;

if (process.env.REFERENZ_NEU) {
  const alle = [];
  for (let n = 0; n < ANZAHL; n++) alle.push(ergebnis(beispielplan(n)));
  fs.writeFileSync(DATEI, JSON.stringify(alle, null, 1) + '\n');
}

test('Referenz: ' + ANZAHL + ' Beispielpläne rechnen wie vor dem Umbau', () => {
  const erwartet = JSON.parse(fs.readFileSync(DATEI, 'utf8'));
  assert.strictEqual(erwartet.length, ANZAHL);
  for (let n = 0; n < ANZAHL; n++) {
    assert.deepStrictEqual(ergebnis(beispielplan(n)), erwartet[n], 'Plan ' + n);
  }
});
