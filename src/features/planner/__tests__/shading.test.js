import { describe, it, expect } from 'vitest';
import { computePlan } from '../sizing';
import { surroundingBuildings } from '../shading';
import { DEFAULT_LOAD } from '../appliances';
import { CITIES, DEFAULT_SITE } from '../config';

const base = {
  load: DEFAULT_LOAD, location: CITIES[0], season: 'winter', site: DEFAULT_SITE,
  roof: { width: 10, length: 14 }, panelWatts: 550, mode: 'auto',
  custom: { panels: 12, inverterKW: 6, batteryKWh: 10 }, withBattery: false, offGrid: false,
};
const withSite = (patch, over = {}) => computePlan({ ...base, ...over, site: { ...DEFAULT_SITE, ...patch } });
const tower = (x, z, h = 30) => ({ id: 'b', x, z, w: 12, d: 10, h });
const total = (a) => a.reduce((s, v) => s + v, 0);

describe('shading', () => {
  it('does nothing for a south-facing house with open sky', () => {
    const p = computePlan(base);
    expect(p.shading.active).toBe(false);
    expect(p.shading.lossPct).toBe(0);
    expect(p.issues.map((i) => i.type)).not.toContain('shade');
  });

  it('a tall building to the south (front) shades the panels in winter', () => {
    const open = computePlan(base);
    const p = withSite({ surroundings: [tower(0, 20)] });
    expect(p.shading.lossPct).toBeGreaterThan(30);
    expect(p.solarKWh).toBeLessThan(open.solarKWh * 0.7);
    expect(p.issues.map((i) => i.type)).toContain('shade');
    expect(p.shading.perPanel).toHaveLength(p.installed);
  });

  it('the same building to the north (behind) casts no shade on the roof', () => {
    const p = withSite({ surroundings: [tower(0, -20)] });
    expect(p.shading.lossPct).toBe(0);
    expect(p.solarKWh).toBeCloseTo(computePlan(base).solarKWh, 9);
  });

  it('a building lower than the roof casts no shade', () => {
    expect(withSite({ surroundings: [tower(0, 14, 5)] }).shading.lossPct).toBe(0);
  });

  it('a building to the east shades the morning, one to the west the afternoon', () => {
    const east = withSite({ surroundings: [tower(14, 0)] }).shading.shade;
    const west = withSite({ surroundings: [tower(-14, 0)] }).shading.shade;
    expect(total(east.slice(0, 12))).toBeGreaterThan(total(east.slice(12)));
    expect(total(west.slice(12))).toBeGreaterThan(total(west.slice(0, 12)));
  });

  it('shade is lighter in summer, when the sun is high', () => {
    const b = [tower(0, 20, 16)];
    const winter = withSite({ surroundings: b }).shading.lossPct;
    const summer = withSite({ surroundings: b }, { season: 'summer' }).shading.lossPct;
    expect(winter).toBeGreaterThan(summer);
  });

  it('panels that lean north make less energy than south-facing ones', () => {
    const south = computePlan({ ...base, season: 'annual' });
    const north = withSite({ facing: 0 }, { season: 'annual' });
    const east = withSite({ facing: 90 }, { season: 'annual' });
    expect(north.solarKWh).toBeLessThan(east.solarKWh);
    expect(east.solarKWh).toBeLessThan(south.solarKWh);
    expect(north.shading.orientPct).toBeLessThan(-5);
  });

  it('keeps buildings off the house footprint', () => {
    const [b] = surroundingBuildings(base.roof, { surroundings: [{ id: 'b', x: 1, z: 2, w: 8, d: 8, h: 9 }] });
    const clearX = Math.abs(b.x) - b.w / 2 >= base.roof.width / 2;
    const clearZ = Math.abs(b.z) - b.d / 2 >= base.roof.length / 2;
    expect(clearX || clearZ).toBe(true);
  });
});
