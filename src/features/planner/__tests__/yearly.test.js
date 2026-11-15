import { describe, it, expect } from 'vitest';
import { computePlan } from '../sizing';
import { yearlyOutlook, monthSun } from '../yearly';
import { DEFAULT_LOAD } from '../appliances';
import { CITIES, DEFAULT_SITE } from '../config';

const input = {
  load: DEFAULT_LOAD, location: CITIES[0], season: 'annual', site: DEFAULT_SITE,
  roof: { width: 10, length: 14 }, panelWatts: 550, mode: 'auto',
  custom: { panels: 12, inverterKW: 6, batteryKWh: 10 }, withBattery: false, offGrid: false,
};

describe('yearly outlook', () => {
  const plan = computePlan(input);
  const y = yearlyOutlook(input, plan);

  it('sun follows the calendar: lowest in December, highest in June', () => {
    expect(monthSun(11).declination).toBeLessThan(-22);
    expect(monthSun(5).declination).toBeGreaterThan(22);
    const kwh = y.months.map((m) => m.kWhDay);
    expect(kwh.indexOf(Math.min(...kwh))).toBe(11);
    expect(kwh.indexOf(Math.max(...kwh))).toBe(5);
  });

  it('the year adds up to about 365 average days', () => {
    expect(y.months).toHaveLength(12);
    expect(y.year.kWh / (plan.solarKWh * 365)).toBeGreaterThan(0.97);
    expect(y.year.kWh / (plan.solarKWh * 365)).toBeLessThan(1.03);
  });

  it('25 years: output falls slowly, savings pay the system back', () => {
    expect(y.life).toHaveLength(25);
    expect(y.life[24].kWh).toBeLessThan(y.life[0].kWh);
    expect(y.life[24].kWh).toBeGreaterThan(y.life[0].kWh * 0.85);
    expect(y.paybackYear).toBeGreaterThan(0);
    expect(y.lifeSaving).toBeGreaterThan(plan.cost);
  });

  it('a building to the south costs more in winter than in summer', () => {
    const site = { ...DEFAULT_SITE, surroundings: [{ id: 'b', x: 0, z: 20, w: 12, d: 10, h: 16 }] };
    const shaded = { ...input, site };
    const ys = yearlyOutlook(shaded, computePlan(shaded));
    expect(ys.months[11].shadePct).toBeGreaterThan(ys.months[5].shadePct);
    expect(ys.year.kWh).toBeLessThan(y.year.kWh);
    expect(ys.year.shadePct).toBeGreaterThan(0);
  });
});
