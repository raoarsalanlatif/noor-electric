// Month-by-month and 25-year figures for the design report.
// Each month is a full planner run for the same system (same panels, inverter and battery), with the sun on
// its real path for that month. The split of sun hours across the year is modelled, not measured:
// it follows a smooth curve between the winter low and the summer high and averages to the city's annual figure.

import { computePlan } from './sizing';
import { PLANNER_CONFIG as CFG } from './config';

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
