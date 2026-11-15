// Safety net: locks the planner's numbers for a set of fixed inputs.
// If a snapshot changes, the planner now gives customers different results — make sure that is intended.
import { describe, it, expect } from 'vitest';
import { computePlan, roofLayout } from '../sizing';
import { DEFAULT_LOAD } from '../appliances';
import { CITIES, DEFAULT_SITE, PANEL_OPTIONS, defaultRoofItems } from '../config';

const base = {
  load: DEFAULT_LOAD, location: CITIES[0], season: 'annual', site: DEFAULT_SITE,
  roof: { width: 10, length: 14 }, panelWatts: 550, mode: 'auto',
  custom: { panels: 12, inverterKW: 6, batteryKWh: 10 }, withBattery: false, offGrid: false,
};

const r = (n) => (typeof n === 'number' ? Math.round(n * 1000) / 1000 : n);
const arr = (a) => a.map(r);

/** The figures a customer sees, rounded so harmless float noise does not fail the test. */
function summary(p) {
  return {
    status: p.status, structure: p.structure.key, issues: p.issues.map((i) => i.type), fixes: p.fixes.map((f) => f.title),
    panelsNeeded: p.panelsNeeded, installed: p.installed, overflow: p.overflow, maxPanels: p.layout.maxPanels,
    chosen: p.chosen, recommended: p.recommended,
    systemKW: r(p.systemKW), dailyKWh: r(p.dailyKWh), peakW: r(p.peakW), sunHours: r(p.sunHours),
    solarKWh: r(p.solarKWh), gridKWh: r(p.gridKWh), exportKWh: r(p.exportKWh), unmetKWh: r(p.unmetKWh), coverage: r(p.coverage),
    billBefore: r(p.billBefore), billAfter: r(p.billAfter), monthlySaving: r(p.monthlySaving),
    cost: r(p.cost), structureCost: r(p.structureCost), paybackYears: r(p.paybackYears), co2TonsYear: r(p.co2TonsYear),
    solarKw: arr(p.solarKw), loadKw: arr(p.loadKw), soc: arr(p.sim.soc),
    structureOptions: p.structureOptions.map((o) => [o.key, o.maxPanels, o.fits, r(o.cost)]),
  };
}

const cases = {
  'default house': {},
  'winter': { season: 'winter' },
  'summer in Karachi': { season: 'summer', location: CITIES.find((c) => c.id === 'karachi') },
  'with battery, off-grid': { withBattery: true, offGrid: true },
  'small roof (overflow)': { roof: { width: 5, length: 6 }, site: { ...DEFAULT_SITE, items: defaultRoofItems({ width: 5, length: 6 }) } },
  'clear roof, no parapet': { site: { ...DEFAULT_SITE, parapetH: 0, items: [] } },
  'forced elevated structure': { site: { ...DEFAULT_SITE, structure: 'elevated' } },
  'forced L3, 620 W panels': { panelWatts: 620, site: { ...DEFAULT_SITE, structure: 'L3' } },
  'custom, undersized inverter': { mode: 'custom', custom: { panels: 20, inverterKW: 3, batteryKWh: 5 }, withBattery: true },
  'heavy load': { load: { ...DEFAULT_LOAD, ac15: { qty: 4, hours: 10 } } },
};

describe('computePlan', () => {
  Object.entries(cases).forEach(([name, over]) => {
    it(name, () => { expect(summary(computePlan({ ...base, ...over }))).toMatchSnapshot(); });
  });
});

describe('roofLayout', () => {
  it('panel positions for every structure', () => {
    const out = {};
    ['L2', 'L3', 'elevated'].forEach((k) => {
      const l = roofLayout(base.roof, PANEL_OPTIONS[1], DEFAULT_SITE, k);
      out[k] = { slots: l.slots.map((s) => [r(s.x), r(s.z)]), keepOuts: l.keepOuts.map((z) => [z.id, r(z.x0), r(z.x1), r(z.z0), r(z.z1), z.shade]) };
    });
    expect(out).toMatchSnapshot();
  });
});
