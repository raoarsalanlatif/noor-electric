// Engineering checks: tilt, row spacing, shade between rows and on the roof, inverter sizing and clipping,
// and the yearly solar access and TSRF figures.
import { describe, it, expect } from 'vitest';
import { computePlan, roofLayout, winterRowGap } from '../sizing';
import { orientationFactor } from '../shading';
import { yearlyOutlook } from '../yearly';
import { DEFAULT_LOAD } from '../appliances';
import { CITIES, DEFAULT_SITE, PANEL_OPTIONS, PLANNER_CONFIG as CFG } from '../config';

const peshawar = CITIES[0];
const panel = PANEL_OPTIONS.find((p) => p.watts === 550);
const clear = { ...DEFAULT_SITE, items: [], parapetH: 0 };
const base = {
  load: DEFAULT_LOAD, location: peshawar, season: 'annual', site: DEFAULT_SITE,
  roof: { width: 10, length: 14 }, panelWatts: 550, mode: 'auto',
  custom: { panels: 12, inverterKW: 6, batteryKWh: 10 }, withBattery: false, offGrid: false,
};

describe('row spacing', () => {
  it('a winter-safe row gap in Peshawar is wider than the compact walkway', () => {
    const gap = winterRowGap(peshawar.lat, panel, DEFAULT_SITE);
    expect(gap).toBeGreaterThan(0.9);
    expect(gap).toBeLessThan(1.3);
    expect(gap).toBeGreaterThan(CFG.rowGap);
  });

  it('a steeper tilt needs a wider gap; a city further south needs a narrower one', () => {
    const karachi = CITIES.find((c) => c.id === 'karachi');
    expect(winterRowGap(peshawar.lat, panel, { ...DEFAULT_SITE, tilt: 30 })).toBeGreaterThan(winterRowGap(peshawar.lat, panel, DEFAULT_SITE));
    expect(winterRowGap(karachi.lat, panel, DEFAULT_SITE)).toBeLessThan(winterRowGap(peshawar.lat, panel, DEFAULT_SITE));
  });

  it('winter-safe spacing opens the rows', () => {
    const compact = roofLayout(base.roof, panel, clear, 'L2', peshawar.lat);
    const winter = roofLayout(base.roof, panel, { ...clear, rowSpacing: 'winter' }, 'L2', peshawar.lat);
    expect(compact.rowGap).toBe(CFG.rowGap);
    expect(winter.pitch).toBeGreaterThan(compact.pitch);
    expect(winter.rows).toBeLessThanOrEqual(compact.rows);
  });

  it('compact rows shade each other in December and winter-safe rows much less', () => {
    const custom = { panels: 16, inverterKW: 8, batteryKWh: 0 };
    const compact = computePlan({ ...base, season: 'winter', mode: 'custom', custom, site: clear });
    const winter = computePlan({ ...base, season: 'winter', mode: 'custom', custom, site: { ...clear, rowSpacing: 'winter' } });
    expect(compact.shading.sources.rows).toBeGreaterThan(3);
    expect(compact.issues.map((i) => i.type)).toContain('rowshade');
    expect(compact.fixes.some((f) => f.action?.rowSpacing === 'winter')).toBe(true);
    expect(winter.shading.sources.rows).toBeLessThan(compact.shading.sources.rows / 2);
    expect(winter.solarKWh).toBeGreaterThan(compact.solarKWh);
  });

  it('rows do not shade each other at midday in the year-average season', () => {
    const p = computePlan({ ...base, site: clear });
    expect(p.shading.shade[12]).toBe(0);
  });
});

describe('shade from things on the roof', () => {
  it('a clear roof with no parapet has none; a tall room in front of the panels has some', () => {
    const open = computePlan({ ...base, site: clear });
    expect(open.shading.sources.roof).toBe(0);
    const room = { id: 'r', type: 'room', x: 0, z: 5, w: 6, d: 3, h: 3 };
    const blocked = computePlan({ ...base, season: 'winter', site: { ...clear, items: [room] } });
    expect(blocked.shading.sources.roof).toBeGreaterThan(0);
  });
});

describe('tilt', () => {
  it('15° facing south is the reference', () => {
    expect(orientationFactor(peshawar.lat, 'annual', 15, 180)).toBeCloseTo(1, 9);
  });

  it('a steeper tilt makes more in winter and less in summer', () => {
    expect(orientationFactor(peshawar.lat, 'winter', 30, 180)).toBeGreaterThan(1);
    expect(orientationFactor(peshawar.lat, 'summer', 30, 180)).toBeLessThan(1);
  });

  it('tilt changes the row depth used for the layout', () => {
    const flat = roofLayout(base.roof, panel, { ...clear, tilt: 10 }, 'L2', peshawar.lat);
    const steep = roofLayout(base.roof, panel, { ...clear, tilt: 30 }, 'L2', peshawar.lat);
    expect(steep.depth).toBeLessThan(flat.depth);
  });

  it('any compass bearing is accepted', () => {
    const p = computePlan({ ...base, site: { ...DEFAULT_SITE, facing: 172 } });
    expect(p.shading.facing).toBe(172);
    expect(Math.abs(p.shading.orientPct)).toBeLessThan(2);
  });
});

describe('inverter', () => {
  it('auto sizing keeps the array within the inverter ratio', () => {
    const p = computePlan(base);
    expect(p.dcAcRatio).toBeLessThanOrEqual(CFG.dcAcRatioMax + 1e-9);
    expect(p.issues.map((i) => i.type)).not.toContain('oversize');
  });

  it('output never exceeds the inverter rating, and the clipped energy is reported', () => {
    const p = computePlan({ ...base, season: 'summer', site: clear, mode: 'custom', custom: { panels: 20, inverterKW: 4, batteryKWh: 0 } });
    expect(Math.max(...p.solarKw)).toBeLessThanOrEqual(4);
    expect(p.clippedKWh).toBeGreaterThan(0);
    expect(p.solarKWh + p.clippedKWh).toBeCloseTo(p.solarKwArray.reduce((a, b) => a + b, 0), 9);
    expect(p.issues.map((i) => i.type)).toContain('oversize');
    expect(p.fixes.some((f) => f.action?.inverterKW > 4)).toBe(true);
  });
});

describe('yearly solar access and TSRF', () => {
  const plan = computePlan(base);
  const y = yearlyOutlook(base, plan);

  it('gives a sun-access figure for every daylight hour of every month', () => {
    expect(y.months).toHaveLength(12);
    y.months.forEach((m) => {
      expect(m.sunAccess).toHaveLength(24);
      expect(m.sunAccess[0]).toBeNull();
      expect(m.sunAccess[12]).toBeGreaterThanOrEqual(0);
      expect(m.sunAccess[12]).toBeLessThanOrEqual(100);
    });
  });

  it('TSRF is solar access times the tilt and direction factor', () => {
    expect(y.year.sunAccessPct).toBeGreaterThan(50);
    expect(y.year.sunAccessPct).toBeLessThanOrEqual(100);
    expect(y.year.tofPct).toBeGreaterThan(80);
    expect(y.year.tofPct).toBeLessThanOrEqual(100);
    expect(y.year.tsrfPct).toBeCloseTo((y.year.sunAccessPct * y.year.tofPct) / 100, 9);
  });

  it('panels facing north score a lower TSRF', () => {
    const input = { ...base, site: { ...DEFAULT_SITE, facing: 0 } };
    const north = yearlyOutlook(input, computePlan(input));
    expect(north.year.tsrfPct).toBeLessThan(y.year.tsrfPct);
  });
});
