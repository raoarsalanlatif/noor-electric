// Month-by-month and 25-year figures for the design report.
// Each month is a full planner run for the same system (same panels, inverter and battery), with the sun on
// its real path for that month. The split of sun hours across the year is modelled, not measured:
// it follows a smooth curve between the winter low and the summer high and averages to the city's annual figure.

import { computePlan } from './sizing';
import { PLANNER_CONFIG as CFG } from './config';
import { orientationFactor, facingOf } from './shading';
import { tiltDeg } from '../three/dims';
import { dailyShape } from '../three/sun';

export const MONTHS = [
  ['January', 31], ['February', 28], ['March', 31], ['April', 30], ['May', 31], ['June', 30],
  ['July', 31], ['August', 31], ['September', 30], ['October', 31], ['November', 30], ['December', 31],
];

const RAD = Math.PI / 180;
const SWING = 0.17; // sun hours run from about −17% (December) to +17% (June) of the annual average

/** Sun declination (degrees) and sun-hours factor for the middle of month m (0 = January). */
export function monthSun(m) {
  const day = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349][m];
  const angle = ((360 / 365) * (day + 10)) * RAD; // 0 at the December solstice
  return { declination: -23.44 * Math.cos(angle), sunFactor: 1 - SWING * Math.cos(angle) };
}

/**
 * @param input  the same object given to computePlan for the design on screen
 * @param plan   that design's result (its panels, inverter and battery are kept for every month)
 */
export function yearlyOutlook(input, plan) {
  const fixed = {
    ...input,
    mode: 'custom',
    withBattery: plan.chosen.batteryKWh > 0,
    custom: { panels: plan.chosen.panels, inverterKW: plan.chosen.inverterKW, batteryKWh: plan.chosen.batteryKWh },
    site: { ...plan.site, structure: plan.structure.key },
  };
  const months = MONTHS.map(([name, days], m) => {
    const p = computePlan({ ...fixed, season: monthSun(m) });
    return {
      name, days,
      sunHours: p.sunHours,
      kWhDay: p.solarKWh,
      kWh: p.solarKWh * days,
      shadePct: p.shading.lossPct,
      saving: (p.monthlySaving / 30) * days,
      perPanel: p.shading.perPanel,
      billBefore: (p.billBefore / 30) * days,
      // share of the panel area in direct sun in each hour (0-100), or null when the sun is down
      sunAccess: dailyShape(p.city.lat, p.season).map((w, k) => (w > 0 ? Math.round((1 - p.shading.shade[k]) * 100) : null)),
      clippedKWh: p.clippedKWh * days,
    };
  });
  const sum = (k) => months.reduce((s, x) => s + x[k], 0);
  const year = { kWh: sum('kWh'), saving: sum('saving'), billBefore: sum('billBefore') };
  // energy-weighted shade loss over the year
  const open = months.reduce((s, x) => s + (x.shadePct < 100 ? x.kWh / (1 - x.shadePct / 100) : 0), 0);
  year.shadePct = open > 0 ? (1 - year.kWh / open) * 100 : 0;
  // share of each panel's yearly energy lost to shade (months weighted by the energy they would make unshaded)
  const openOf = (x) => (x.shadePct < 100 ? x.kWh / (1 - x.shadePct / 100) : 0);
  year.perPanel = Array.from({ length: plan.installed }, (_, i) => (open > 0 ? months.reduce((s, x) => s + (x.perPanel[i] || 0) * openOf(x), 0) / open : 0));

  // Solar access: share of the unshaded energy the panels still receive over the year.
  year.sunAccessPct = 100 - year.shadePct;
  // Tilt and orientation factor: this tilt and direction against the best fixed tilt facing south.
  const lat = plan.city.lat;
  const yearFactor = (tilt, facing) => MONTHS.reduce((s, [, days], m) => {
    const season = monthSun(m);
    return s + days * season.sunFactor * orientationFactor(lat, season, tilt, facing);
  }, 0);
  let bestTilt = 0; let bestFactor = 0;
  for (let tilt = 0; tilt <= 45; tilt += 5) {
    const f = yearFactor(tilt, 180);
    if (f > bestFactor) { bestFactor = f; bestTilt = tilt; }
  }
  year.bestTilt = bestTilt;
  year.tofPct = bestFactor > 0 ? Math.min(100, (yearFactor(tiltDeg(plan.site), facingOf(plan.site)) / bestFactor) * 100) : 100;
  year.tsrfPct = (year.sunAccessPct * year.tofPct) / 100;
  year.clippedKWh = sum('clippedKWh');

  const life = [];
  let cumKWh = 0; let cumSaving = 0; let paybackYear = null;
  for (let y = 1; y <= CFG.systemLifeYears; y++) {
    const f = (1 - CFG.panelDegradationPerYear) ** (y - 1);
    cumKWh += year.kWh * f; cumSaving += year.saving * f;
    if (paybackYear === null && cumSaving >= plan.cost) paybackYear = y;
    life.push({ year: y, kWh: year.kWh * f, saving: year.saving * f, cumKWh, cumSaving, net: cumSaving - plan.cost });
  }
  return { months, year, life, paybackYear, lifeSaving: cumSaving, lifeKWh: cumKWh, cost: plan.cost };
}
