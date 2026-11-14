import { APPLIANCE_MAP, PROFILES } from './appliances';
import { PLANNER_CONFIG as CFG, PANEL_OPTIONS, INVERTER_SIZES, CITIES, DEFAULT_SITE, STRUCTURES, STRUCTURE_ORDER } from './config';
import { dailyShape, SEASONS } from '../three/sun';

const TILT = (15 * Math.PI) / 180;
const DIVERSITY = 0.8; // not every appliance switches on at the same instant

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/** Fraction of each hour (0–23) an appliance is on, given daily hours and its profile. */
export function hourlyUse(hours, profileKey) {
  const out = new Array(24).fill(0);
  const h = Math.max(0, Math.min(24, hours));
  if (profileKey === 'allday') return out.map(() => h / 24);
  const order = PROFILES[profileKey] || PROFILES.day;
  let rem = h;
  for (const k of order) {
    if (rem <= 0) break;
    const take = Math.min(1, rem);
    out[k] = take;
    rem -= take;
  }
  if (rem > 0) {
    const others = out.map((_, i) => i).filter((i) => !order.includes(i));
    const per = rem / others.length;
    others.forEach((i) => { out[i] = Math.min(1, per); });
  }
  return out;
}

/** Hourly energy (kWh per hour = average kW) and simultaneous running watts. */
export function buildLoadCurve(load) {
  const kw = new Array(24).fill(0);
  const running = new Array(24).fill(0);
  Object.entries(load).forEach(([id, { qty, hours }]) => {
    const a = APPLIANCE_MAP[id];
    if (!a || !qty) return;
    const use = hourlyUse(hours, a.profile);
    use.forEach((u, k) => {
      kw[k] += (qty * a.watts * a.duty * u) / 1000;
      if (u > 0) running[k] += qty * a.watts * DIVERSITY;
    });
  });
  return { kw, running };
}

/** Solar output for one kWp per hour, following the real sun path; sums to `sunHours`. */
export function solarShape(sunHours, lat = 32, season = 'annual') {
  return dailyShape(lat, season).map((w) => w * sunHours);
}

/**
 * Things standing on the roof, in roof coordinates (origin at roof centre, +x = east, +z = front/south).
 * Items are clamped inside the roof; a tank (or other small item) placed on a room sits on top of it.
 */
export function roofObstacles(roof, site = DEFAULT_SITE) {
  const W = roof.width; const L = roof.length;
  const items = (site.items || []).map((it) => {
    const w = Math.min(Math.max(0.2, it.w), W); const d = Math.min(Math.max(0.2, it.d), L);
    return {
      ...it, w, d, h: Math.max(0.1, it.h),
      x: Math.min(W / 2 - w / 2, Math.max(-W / 2 + w / 2, it.x)),
      z: Math.min(L / 2 - d / 2, Math.max(-L / 2 + d / 2, it.z)),
    };
  });
  const rooms = items.filter((o) => o.type === 'room');
  return items.map((o) => {
    if (o.type === 'room') return { ...o, onTop: 0, top: o.h };
    const host = rooms.find((r) => Math.abs(o.x - r.x) < r.w / 2 && Math.abs(o.z - r.z) < r.d / 2 && o.w <= r.w && o.d <= r.d);
    const onTop = host ? host.h : 0;
    return { ...o, onTop, top: (host ? onTop + 0.16 : 0) + o.h };
  });
}

/** Area each obstacle keeps free of panels for a given structure (its footprint + walkway + shadow). */
export function keepOutZones(obstacles, structure) {
  const elevated = structure.key === 'elevated';
  return obstacles.map((o) => {
    // an elevated structure spans over anything comfortably below its frame
    if (elevated && o.top < structure.frontH - 0.25) return null;
    const above = Math.max(0, o.top - structure.frontH); // how far it rises above the panels
    const gap = elevated ? 0.2 : CFG.accessGap;
    const side = gap + above * CFG.shadeSide;
    return {
      id: o.id,
      x0: o.x - o.w / 2 - side,
      x1: o.x + o.w / 2 + side,
      z0: o.z - o.d / 2 - gap - above * CFG.shadeNorth, // shadow falls to the north (behind)
      z1: o.z + o.d / 2 + gap,
      shade: above > 0.05,
    };
  }).filter(Boolean);
}

export function roofLayout(roof, panel, site = DEFAULT_SITE, structureKey = 'L2') {
  const structure = STRUCTURES[structureKey] || STRUCTURES.L2;
  const elevated = structure.key === 'elevated';
  const depth = panel.length * Math.cos(TILT);
  const pitch = depth + 0.6;
  const colW = panel.width + CFG.panelGap;
  // parapet walls shade the panels behind them, mostly on the sunny (front) side;
  // a higher frame clears more of the wall, an elevated one clears it completely
  const wallAbove = elevated ? 0 : Math.max(0, (site.parapetH || 0) - structure.frontH);
  const sFront = elevated ? 0.3 : Math.max(CFG.roofSetback, 0.3 + wallAbove * 1.6);
  const sOther = elevated ? 0.3 : Math.max(CFG.roofSetback, 0.3 + wallAbove * 0.8);
  const usableW = Math.max(0, roof.width - 2 * sOther);
  const cols = Math.max(0, Math.floor(usableW / colW));
  const startX = -((cols - 1) * colW) / 2;
  const obstacles = roofObstacles(roof, site);
  const keepOuts = keepOutZones(obstacles, structure);
  const hits = (x, z) => keepOuts.some((k) => x + colW / 2 > k.x0 && x - colW / 2 < k.x1 && z + depth / 2 > k.z0 && z - depth / 2 < k.z1);

  const slots = [];
  let rows = 0;
  for (let z = -roof.length / 2 + sOther + depth / 2; z <= roof.length / 2 - sFront - depth / 2 + 1e-6; z += pitch) {
    rows += 1;
    for (let c = 0; c < cols; c++) {
      const x = startX + c * colW;
      if (!hits(x, z)) slots.push({ x, z });
    }
  }
  const ovCols = cols || 3;
  const ovStart = -((ovCols - 1) * colW) / 2;
  const overflowSlot = (k) => ({
    x: ovStart + (k % ovCols) * colW,
    z: roof.length / 2 + 0.4 + depth / 2 + Math.floor(k / ovCols) * pitch,
  });
  return {
    structure, cols, rows, pitch, colW, depth, sFront, sOther,
    slots, obstacles, keepOuts, overflowSlot,
    maxPanels: slots.length,
    footprint: pitch * colW,
    roofArea: roof.width * roof.length,
  };
}

/**
 * Compare all structures for this roof and pick one.
 * 'auto' = the cheapest structure that fits the panels we need; if none fits, the one that fits the most.
 */
export function chooseStructure(roof, panel, site, panelsWanted) {
  const options = STRUCTURE_ORDER.map((key) => {
    const layout = roofLayout(roof, panel, site, key);
    return { key, structure: STRUCTURES[key], layout, maxPanels: layout.maxPanels, fits: layout.maxPanels >= panelsWanted };
  });
  const best = options.find((o) => o.fits)
    || options.reduce((a, b) => (b.maxPanels > a.maxPanels ? b : a), options[0]);
  const picked = site.structure && site.structure !== 'auto' ? options.find((o) => o.key === site.structure) || best : best;
  return { picked, best, options };
}

const pickInverter = (kw) => INVERTER_SIZES.find((s) => s >= kw) || INVERTER_SIZES[INVERTER_SIZES.length - 1];

function simulate({ loadKw, running, solarKw, inverterKW, batteryKWh, offGrid }) {
  const cap = batteryKWh * CFG.batteryUsable;
  let soc = cap * 0.5;
  let res;
  // run three days so the battery reaches a steady daily cycle; keep the last day
  for (let day = 0; day < 3; day++) {
    res = { soc: [], grid: [], export: [], unmet: [], blackout: [], trip: [], solarUsed: [] };
    for (let k = 0; k < 24; k++) {
      const L = loadKw[k];
      const trip = inverterKW > 0 && running[k] > inverterKW * 1000;
      const S = trip ? 0 : solarKw[k];
      let grid = 0; let exp = 0; let unmet = 0;
      if (trip) {
        // inverter shuts down: no solar, no battery
        if (offGrid) unmet = L; else grid = L;
      } else if (S >= L) {
        const surplus = S - L;
        const charge = Math.min(cap - soc, surplus * CFG.batteryRoundTrip);
        soc += charge;
        exp = offGrid ? 0 : surplus - charge / CFG.batteryRoundTrip;
      } else {
        const deficit = L - S;
        const draw = Math.min(soc, deficit);
        soc -= draw;
        const rem = deficit - draw;
        if (offGrid) unmet = rem; else grid = rem;
      }
      res.soc.push(cap > 0 ? (soc / cap) * 100 : 0);
      res.grid.push(grid);
      res.export.push(exp);
      res.unmet.push(unmet);
      res.trip.push(trip);
      res.blackout.push(trip ? true : unmet > 0.05 * L && L > 0.05);
      res.solarUsed.push(Math.min(S, L));
    }
  }
  return res;
}

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

/**
 * Main entry: everything the UI needs, recomputed on every input change.
 */
export function computePlan(input) {
  const { load, cityId, roof, panelWatts, mode, custom, withBattery, offGrid, location, season = 'annual', site = DEFAULT_SITE } = input;
  const city = location || CITIES.find((c) => c.id === cityId) || CITIES[0];
  const sunHours = city.sunHours * (SEASONS[season] || SEASONS.annual).sunFactor;
  const panel = PANEL_OPTIONS.find((p) => p.watts === panelWatts) || PANEL_OPTIONS[1];

  const { kw: loadKw, running } = buildLoadCurve(load);
  const dailyKWh = sum(loadKw);
  const peakW = Math.max(...running);

  const requiredKW = dailyKWh / (sunHours * CFG.performanceRatio);
  const panelsNeeded = Math.ceil((requiredKW * 1000) / panel.watts);
  const panelsWanted = mode === 'custom' ? custom.panels : panelsNeeded;
  const structurePick = chooseStructure(roof, panel, site, panelsWanted);
  const { layout } = structurePick.picked;
  const structure = layout.structure;
  const areaNeeded = panelsNeeded * layout.footprint + 2 * CFG.roofSetback * (roof.width + roof.length);

  // energy the battery must cover = load not served directly by sun (assuming a right-sized array)
  const shape = solarShape(sunHours * CFG.performanceRatio, city.lat, season);
  const idealSolar = shape.map((s) => s * requiredKW);
  const nightKWh = sum(loadKw.map((l, k) => Math.max(0, l - idealSolar[k])));
  const recBattery = Math.ceil(nightKWh / CFG.batteryUsable / 2.5) * 2.5;
  const recInverter = pickInverter((peakW * CFG.inverterSafetyFactor) / 1000);

  const chosen = mode === 'custom'
    ? { panels: custom.panels, inverterKW: custom.inverterKW, batteryKWh: withBattery ? custom.batteryKWh : 0 }
    : { panels: panelsNeeded, inverterKW: recInverter, batteryKWh: withBattery ? recBattery : 0 };

  const installed = Math.min(chosen.panels, layout.maxPanels);
  const overflow = Math.max(0, chosen.panels - layout.maxPanels);
  const systemKW = (installed * panel.watts) / 1000;
  const solarKw = shape.map((s) => s * systemKW);

  const simArgs = { loadKw, running, solarKw, inverterKW: chosen.inverterKW, batteryKWh: chosen.batteryKWh };
  // money is always calculated with the grid available; the off-grid run only drives the outage view
  const simGrid = simulate({ ...simArgs, offGrid: false });
  const sim = offGrid ? simulate({ ...simArgs, offGrid: true }) : simGrid;

  const solarKWh = sum(solarKw);
  const gridKWh = sum(simGrid.grid);
  const exportKWh = sum(simGrid.export);
  const unmetKWh = sum(sim.unmet);
  // net-metered view: daytime surplus exported to the grid offsets night-time import
  const coverage = dailyKWh > 0 ? Math.min(1, (dailyKWh - gridKWh + exportKWh) / dailyKWh) : 0;

  const billBefore = dailyKWh * 30 * CFG.tariffPerKWh;
  const billAfter = Math.max(0, gridKWh * 30 * CFG.tariffPerKWh - exportKWh * 30 * CFG.exportRatePerKWh);
  const monthlySaving = billBefore - billAfter;
  const structureCost = systemKW * structure.costPerKW;
  const cost = systemKW * CFG.costPerKW + structureCost + chosen.batteryKWh * CFG.batteryCostPerKWh;
  const paybackYears = monthlySaving > 0 ? cost / (monthlySaving * 12) : null;
  const co2TonsYear = ((dailyKWh - gridKWh) * 365 * CFG.gridEmissionKgPerKWh) / 1000;

  // ---- diagnosis ----
  const issues = [];
  const tripHours = sim.trip.filter(Boolean).length;
  const blackoutHours = sim.blackout.filter(Boolean).length;
  if (overflow > 0) {
    issues.push({
      type: 'overflow', severity: 'fail',
      title: 'Not doable on this roof',
      detail: `You need ${chosen.panels} panels but the roof safely fits ${layout.maxPanels}. ${overflow} panels have nowhere to go.`,
    });
  }
  if (tripHours > 0) {
    issues.push({
      type: 'inverter', severity: 'fail',
      title: 'Inverter overload',
      detail: `Your peak load of ${round(peakW / 1000)} kW is above a ${chosen.inverterKW} kW inverter. It will trip for ${tripHours} hour${tripHours > 1 ? 's' : ''} a day.`,
    });
  }
  if (offGrid && blackoutHours - tripHours > 0) {
    issues.push({
      type: 'battery', severity: 'warn',
      title: 'Lights out at night',
      detail: `Without the grid, the house loses power for about ${blackoutHours - tripHours} hour${blackoutHours - tripHours > 1 ? 's' : ''} a day. ${chosen.batteryKWh ? 'The battery runs empty.' : 'There is no battery.'}`,
    });
  }
  if (!overflow && coverage < 0.85 && dailyKWh > 0) {
    issues.push({
      type: 'under', severity: 'warn',
      title: 'Partial coverage',
      detail: `Solar covers ${Math.round(coverage * 100)}% of your daily use. The rest comes from the grid.`,
    });
  }
  const status = issues.some((i) => i.severity === 'fail') ? 'fail' : issues.length ? 'warn' : 'ok';

  // ---- fixes ----
  const fixes = [];
  const prodPerPanel = (panel.watts / 1000) * sunHours * CFG.performanceRatio;
  if (overflow > 0) {
    const fitPct = Math.min(100, Math.round(((layout.maxPanels * prodPerPanel) / dailyKWh) * 100));
    fixes.push({ title: `Best fit: ${layout.maxPanels} panel${layout.maxPanels === 1 ? '' : 's'}`, detail: `${round((layout.maxPanels * panel.watts) / 1000)} kW on this roof covers about ${fitPct}% of your use.` });
    const better = structurePick.options.filter((o) => o.key !== structure.key && o.maxPanels > layout.maxPanels);
    better.forEach((o) => {
      fixes.push({
        title: `Use an ${o.structure.label}`,
        detail: o.fits
          ? `${o.structure.desc}. Fits all ${chosen.panels} panels on this roof (${o.maxPanels} possible).`
          : `${o.structure.desc}. Fits ${o.maxPanels} panels instead of ${layout.maxPanels}.`,
        action: { structure: o.key },
      });
    });
    const big = PANEL_OPTIONS[PANEL_OPTIONS.length - 1];
    if (big.watts !== panel.watts) {
      const bigLayout = roofLayout(roof, big, site, structure.key);
      const bigPct = Math.min(100, Math.round(((bigLayout.maxPanels * (big.watts / 1000) * sunHours * CFG.performanceRatio) / dailyKWh) * 100));
      if (bigPct > fitPct) fixes.push({ title: `Use ${big.watts} W panels`, detail: `Higher-wattage panels raise coverage to about ${bigPct}%.`, action: { panelWatts: big.watts } });
    }
  }
  const nonInvAC = (load.ac15?.qty || 0) + (load.ac1?.qty || 0);
  if (nonInvAC > 0 && (status !== 'ok')) {
    const swapped = { ...load };
    swapped.ac15inv = { qty: (load.ac15inv?.qty || 0) + nonInvAC, hours: load.ac15?.hours || load.ac1?.hours || 8 };
    delete swapped.ac15; delete swapped.ac1;
    const newKWh = sum(buildLoadCurve(swapped).kw);
    const pct = Math.round((1 - newKWh / dailyKWh) * 100);
    if (pct > 5) fixes.push({ title: 'Switch to inverter ACs', detail: `Replacing ${nonInvAC} non-inverter AC${nonInvAC > 1 ? 's' : ''} cuts your daily use by about ${pct}%.`, action: { swapAC: true } });
  }
  if (tripHours > 0) {
    fixes.push({ title: `Upgrade to ${recInverter} kW inverter`, detail: 'Or avoid running all ACs, the motor and the iron at the same time.', action: { inverterKW: recInverter } });
  }
  if (offGrid && blackoutHours - tripHours > 0 && recBattery > chosen.batteryKWh) {
    fixes.push({ title: `Add a ${recBattery} kWh battery`, detail: 'Enough stored energy to carry your night load.', action: { batteryKWh: recBattery } });
  }

  return {
    city, panel, layout, sunHours, season, site,
    structure, structureCost,
    structureAuto: !site.structure || site.structure === 'auto',
    structureOptions: structurePick.options.map(({ key, structure: st, maxPanels, fits }) => ({
      key, label: st.label, short: st.short, desc: st.desc, maxPanels, fits,
      cost: Math.min(maxPanels, panelsWanted) * (panel.watts / 1000) * st.costPerKW,
    })),
    loadKw, running, solarKw, sim,
    dailyKWh, peakW, requiredKW, panelsNeeded, areaNeeded,
    recommended: { inverterKW: recInverter, batteryKWh: recBattery, panels: panelsNeeded },
    chosen, installed, overflow, systemKW,
    solarKWh, gridKWh, exportKWh, unmetKWh, coverage,
    billBefore, billAfter, monthlySaving, cost, paybackYears, co2TonsYear,
    issues, fixes, status,
  };
}
