import { APPLIANCE_MAP, PROFILES } from './appliances';
import { PLANNER_CONFIG as CFG, PANEL_OPTIONS, INVERTER_SIZES, CITIES, DEFAULT_SITE, STRUCTURES, STRUCTURE_ORDER, structureFor } from './config';
import { houseWings, roofArea } from './roofShape';
import { dailyShape, seasonOf, sunFor } from '../three/sun';
import { tiltRad, tiltDeg, REF_TILT_DEG } from '../three/dims';
import { computeShading, facingOf } from './shading';
import { arrayFrame, houseLayout, bestTurn, panelTurn, compassName, SIDES } from './frame';

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
    return { ...o, onTop, hostId: host ? host.id : null, top: (host ? onTop + 0.16 : 0) + o.h };
  });
}

/** Area each obstacle keeps free of panels for a given structure (its footprint + walkway + shadow). */
export function keepOutZones(obstacles, structure) {
  const elevated = Boolean(structure.elevated);
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

const WINTER = { declination: -23.44, sunFactor: 1 };

/**
 * Clear distance (metres) a panel row needs behind the next one so that it is not shaded
 * between 10 am and 2 pm on 21 December.
 */
export function winterRowGap(lat, panel, site = DEFAULT_SITE) {
  const rise = panel.length * Math.sin(tiltRad(site));
  const facing = facingOf(site);
  return [10, 14].reduce((gap, hour) => {
    const sun = sunFor(lat, WINTER, hour, facing);
    // the shadow of the high back edge reaches this far behind the row
    return sun.alt > 0 ? Math.max(gap, (rise * Math.max(0, sun.dir[2])) / sun.dir[1]) : gap;
  }, 0);
}

const ROOM_FRAME = 0.15; // low frame used on top of a room (metres at the front edge)
const ROOM_EDGE = 0.2; // kept clear along the edges of the room's roof

/** Panel spots on top of a room, clear of anything standing on it (a water tank, for example). */
function roomTopSlots(room, obstacles, colW, depth, pitch) {
  const cols = Math.floor((room.w - 2 * ROOM_EDGE + CFG.panelGap) / colW);
  const usableD = room.d - 2 * ROOM_EDGE;
  if (cols < 1 || usableD < depth) return [];
  const rows = Math.floor((usableD - depth) / pitch) + 1;
  const onIt = obstacles.filter((o) => o.hostId === room.id).map((o) => ({ ...o, top: o.h }));
  const keep = keepOutZones(onIt, { key: 'room', frontH: ROOM_FRAME });
  const hits = (x, z) => keep.some((k) => x + colW / 2 > k.x0 && x - colW / 2 < k.x1 && z + depth / 2 > k.z0 && z - depth / 2 < k.z1);
  const startX = room.x - ((cols - 1) * colW) / 2;
  const startZ = room.z - ((rows - 1) * pitch) / 2;
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * colW; const z = startZ + r * pitch;
      if (!hits(x, z)) out.push({ x, z, base: room.h + ROOM_FRAME, onRoom: room.id });
    }
  }
  return out;
}

/**
 * Panel spots on a roof. Works in array axes: +z is the side the panels lean towards, which is the
 * front of the house unless the roof and site were turned first (see frame.js).
 */
export function roofLayout(roof, panel, site = DEFAULT_SITE, structureKey = 'L2', lat = 32) {
  const structure = structureFor(structureKey, site);
  const elevated = Boolean(structure.elevated);
  const tilted = Boolean(structure.tilted);
  const depth = panel.length * Math.cos(tiltRad(site));
  const winterSafe = site.rowSpacing === 'winter';
  const winterGap = winterRowGap(lat, panel, site);
  // on a tilted frame the rows lie edge to edge up one slope; otherwise each row stands alone with a gap behind it
  let rowGap = winterSafe ? Math.max(CFG.rowGap, winterGap) : CFG.rowGap;
  const pitch = tilted ? depth + CFG.panelGap : depth + rowGap;
  const colW = panel.width + CFG.panelGap;
  // parapet walls shade the panels behind them, mostly on the sunny (front) side;
  // a higher frame clears more of the wall, an elevated one clears it completely
  const wallAbove = elevated ? 0 : Math.max(0, (site.parapetH || 0) - structure.frontH);
  const sFront = elevated ? 0.3 : Math.max(CFG.roofSetback, 0.3 + wallAbove * 1.6);
  const sOther = elevated ? 0.3 : Math.max(CFG.roofSetback, 0.3 + wallAbove * 0.8);
  const obstacles = roofObstacles(roof, site);
  const keepOuts = keepOutZones(obstacles, structure);
  const hits = (x, z) => keepOuts.some((k) => x + colW / 2 > k.x0 && x - colW / 2 < k.x1 && z + depth / 2 > k.z0 && z - depth / 2 < k.z1);
  const stepUp = pitch * Math.tan(tiltRad(site));
  const perTable = tilted ? Math.max(1, Math.floor((structure.maxBackH - structure.frontH) / (panel.length * Math.sin(tiltRad(site))))) : 1;
  let rows = 0; let tables = 0;

  // Fill one rectangle of the roof (centre cx, cz) with panel spots. `base` is the height of a panel's low
  // front edge above the roof.
  const fill = (cx, cz, width, length, tag) => {
    const out = [];
    const nCols = Math.max(0, Math.floor(Math.max(0, width - 2 * sOther) / colW));
    const x0 = cx - ((nCols - 1) * colW) / 2;
    const zEnd = cz + length / 2 - sFront - depth / 2 + 1e-6;
    let z = cz - length / 2 + sOther + depth / 2;
    const row = (rz, base, extra) => {
      rows += 1;
      for (let c = 0; c < nCols; c++) {
        const x = x0 + c * colW;
        if (!hits(x, rz)) out.push({ x, z: rz, base, ...extra, ...tag });
      }
    };
    if (tilted) {
      // One sloped table: every row back from the front sits one step higher. When the back edge would pass
      // the structure's height limit, a new table starts behind a gap wide enough to stay out of its shadow.
      for (; z <= zEnd; tables++) {
        const n = Math.min(perTable, Math.floor((zEnd - z) / pitch) + 1);
        for (let i = 0; i < n; i++) row(z + i * pitch, structure.frontH + (n - 1 - i) * stepUp, { table: tables });
        rowGap = Math.max(CFG.rowGap, winterGap * n);
        z += (n - 1) * pitch + depth + rowGap;
      }
    } else {
      for (; z <= zEnd; z += pitch) row(z, structure.frontH);
    }
    return { slots: out, cols: nCols };
  };
  const main = fill(0, 0, roof.width, roof.length, {});
  const cols = main.cols;
  const mainRows = rows;
  // roof extensions are filled after the main roof
  const wings = houseWings(roof, site);
  const wingSlots = wings.flatMap((g) => fill(g.x, g.z, g.w, g.d, { wing: g.id }).slots);
  const roofSlots = [...main.slots, ...wingSlots];
  // panels on top of a room come first: that is where the installer starts, to save roof space
  const roomSlots = obstacles.filter((o) => o.type === 'room' && o.panelsOnTop).flatMap((room) => roomTopSlots(room, obstacles, colW, depth, pitch));
  const slots = [...roomSlots, ...roofSlots];
  const ovCols = cols || 3;
  const ovStart = -((ovCols - 1) * colW) / 2;
  const overflowSlot = (k) => ({
    base: structure.frontH,
    x: ovStart + (k % ovCols) * colW,
    z: roof.length / 2 + 0.4 + depth / 2 + Math.floor(k / ovCols) * pitch,
  });
  return {
    structure, cols, rows: mainRows, pitch, colW, depth, sFront, sOther, rowGap, winterSafe, tilted,
    slots, obstacles, keepOuts, overflowSlot, onRooms: roomSlots.length, wings, onWings: wingSlots.length,
    maxPanels: slots.length,
    footprint: pitch * colW,
    roofArea: roofArea(roof, site),
  };
}

/**
 * Energy a kW of panels makes over the year on this layout, after shade, relative to an unshaded reference
 * panel. Summer and winter are averaged, so the answer does not change with the season the customer is viewing.
 */
function yearEnergyPerKW(roof, panel, site, layout, installed, lat) {
  if (!installed) return 0;
  return ['summer', 'winter'].reduce((total, season) => {
    const { factor } = computeShading({ roof, site, layout, panel, installed, lat, season });
    const weights = dailyShape(lat, season);
    return total + (seasonOf(season).sunFactor * weights.reduce((s, w, k) => s + w * factor[k], 0)) / 2;
  }, 0);
}

/**
 * Compare all structures for this roof and pick one.
 *
 * 'auto' = the best value among the structures that fit the panels we need: the lowest cost for each unit of
 * energy over the year. A dearer structure wins only when it earns its price back in energy, for example a
 * tilted frame whose rows do not shade each other. If none fits, auto takes the one that fits the most panels.
 * Pass `value: false` to skip the energy comparison when the structure is already decided.
 */
// The comparison traces shade for every structure, so recent answers are kept: most input changes
// (a slider, the time of day, the season) leave the roof and the panel count as they were.
const structureCache = new Map();

export function chooseStructure(roof, panel, site, panelsWanted, lat = 32, { value = true } = {}) {
  const cacheKey = JSON.stringify([roof, panel, site, panelsWanted, lat, value]);
  if (structureCache.has(cacheKey)) return structureCache.get(cacheKey);
  const result = compareStructures(roof, panel, site, panelsWanted, lat, value);
  if (structureCache.size >= 24) structureCache.delete(structureCache.keys().next().value);
  structureCache.set(cacheKey, result);
  return result;
}

function compareStructures(roof, panel, site, panelsWanted, lat, value) {
  const options = STRUCTURE_ORDER.map((key) => {
    const layout = roofLayout(roof, panel, site, key, lat);
    const structure = STRUCTURES[key];
    const o = { key, structure, layout, maxPanels: layout.maxPanels, fits: layout.maxPanels >= panelsWanted, energy: null, costPerEnergy: null };
    if (value) {
      o.energy = yearEnergyPerKW(roof, panel, site, layout, Math.min(panelsWanted, layout.maxPanels), lat);
      o.costPerEnergy = o.energy > 0 ? (CFG.costPerKW + structure.costPerKW) / o.energy : Infinity;
    }
    return o;
  });
  const cheaper = (a, b) => (value ? b.costPerEnergy < a.costPerEnergy - 1e-9 : false);
  const fitting = options.filter((o) => o.fits);
  const best = fitting.length
    ? fitting.reduce((a, b) => (cheaper(a, b) ? b : a))
    : options.reduce((a, b) => (b.maxPanels > a.maxPanels || (b.maxPanels === a.maxPanels && cheaper(a, b)) ? b : a));
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
  const { load, cityId, roof, panelWatts, mode, custom, withBattery, offGrid, location, season = 'annual', site = DEFAULT_SITE, compareStructures = true } = input;
  const city = location || CITIES.find((c) => c.id === cityId) || CITIES[0];
  const sunHours = city.sunHours * seasonOf(season).sunFactor;
  const panel = PANEL_OPTIONS.find((p) => p.watts === panelWatts) || PANEL_OPTIONS[1];

  const { kw: loadKw, running } = buildLoadCurve(load);
  const dailyKWh = sum(loadKw);
  const peakW = Math.max(...running);

  const requiredKW = dailyKWh / (sunHours * CFG.performanceRatio);
  const panelsNeeded = Math.ceil((requiredKW * 1000) / panel.watts);
  const panelsWanted = mode === 'custom' ? custom.panels : panelsNeeded;
  // the panels may lean towards any side of the roof; the layout and shade are worked out in the array's own axes
  const frame = arrayFrame(roof, site);
  const structurePick = chooseStructure(frame.roof, panel, frame.site, panelsWanted, city.lat, { value: compareStructures });
  const arrayLayout = structurePick.picked.layout;
  const layout = houseLayout(arrayLayout, frame);
  const structure = layout.structure;
  const areaNeeded = panelsNeeded * layout.footprint + 2 * CFG.roofSetback * (roof.width + roof.length);

  // energy the battery must cover = load not served directly by sun (assuming a right-sized array)
  const shape = solarShape(sunHours * CFG.performanceRatio, city.lat, season);
  const idealSolar = shape.map((s) => s * requiredKW);
  const nightKWh = sum(loadKw.map((l, k) => Math.max(0, l - idealSolar[k])));
  const recBattery = Math.ceil(nightKWh / CFG.batteryUsable / 2.5) * 2.5;
  // the inverter has to carry the peak load and must not be undersized for the array it is connected to
  const autoArrayKW = (Math.min(panelsNeeded, layout.maxPanels) * panel.watts) / 1000;
  const recInverter = pickInverter(Math.max((peakW * CFG.inverterSafetyFactor) / 1000, autoArrayKW / CFG.dcAcRatioMax));

  const chosen = mode === 'custom'
    ? { panels: custom.panels, inverterKW: custom.inverterKW, batteryKWh: withBattery ? custom.batteryKWh : 0 }
    : { panels: panelsNeeded, inverterKW: recInverter, batteryKWh: withBattery ? recBattery : 0 };

  const installed = Math.min(chosen.panels, layout.maxPanels);
  const overflow = Math.max(0, chosen.panels - layout.maxPanels);
  const systemKW = (installed * panel.watts) / 1000;
  // surrounding buildings and the direction the house faces (no effect on a south-facing house with open sky)
  const inArray = computeShading({ roof: frame.roof, site: frame.site, layout: arrayLayout, panel, installed, lat: city.lat, season });
  // `facing` stays the direction of the house front; `bearing` is the direction the panels lean
  const shading = { ...inArray, facing: facingOf(site), bearing: frame.bearing, buildings: inArray.buildings.map(frame.box) };
  const solarKwArray = shading.active ? shape.map((s, k) => s * systemKW * shading.factor[k]) : shape.map((s) => s * systemKW);
  // the inverter can not deliver more than its rating: anything above it is clipped (lost)
  const cap = chosen.inverterKW > 0 ? chosen.inverterKW : Infinity;
  const solarKw = solarKwArray.map((s) => Math.min(s, cap));
  const clippedKWh = sum(solarKwArray) - sum(solarKw);
  const clipPct = sum(solarKwArray) > 0 ? (clippedKWh / sum(solarKwArray)) * 100 : 0;
  const dcAcRatio = chosen.inverterKW > 0 ? systemKW / chosen.inverterKW : 0;

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
  if (dcAcRatio > CFG.dcAcRatioMax + 1e-9) {
    issues.push({
      type: 'oversize', severity: 'warn',
      title: 'Array too big for the inverter',
      detail: `${round(systemKW)} kW of panels on a ${chosen.inverterKW} kW inverter is ${round(dcAcRatio, 2)} times its rating (keep it under ${CFG.dcAcRatioMax}).${clipPct >= 1 ? ` About ${Math.round(clipPct)}% of the day's solar energy is clipped.` : ''} Check the inverter's PV input limit.`,
    });
  }
  if (shading.sources.buildings >= 3) {
    const wh = shading.worstHour;
    issues.push({
      type: 'shade', severity: 'warn',
      title: 'Shade from nearby buildings',
      detail: `Nearby buildings shade the panels and cost about ${Math.round(shading.sources.buildings)}% of the day's solar energy${wh === null ? '' : `, mostly around ${((wh + 11) % 12) + 1} ${wh < 12 ? 'am' : 'pm'}`}.`,
    });
  }
  if (shading.sources.roof >= 3) {
    issues.push({
      type: 'roofshade', severity: 'warn',
      title: 'Shade from things on the roof',
      detail: `The room, tanks or parapet wall shade the panels and cost about ${Math.round(shading.sources.roof)}% of the day's solar energy. A higher structure clears them.`,
    });
  }
  if (shading.sources.rows >= 3) {
    issues.push({
      type: 'rowshade', severity: 'warn',
      title: 'Panel rows shade each other',
      detail: `The rows are close together, so each one shades the row behind it and about ${Math.round(shading.sources.rows)}% of the day's solar energy is lost.`,
    });
  }
  if (shading.orientPct <= -5) {
    const turnedAway = shading.bearing !== 180;
    issues.push({
      type: 'facing', severity: 'warn',
      title: turnedAway ? `Panels face ${compassName(shading.bearing)}` : `Panels tilted ${tiltDeg(site)}°`,
      detail: turnedAway
        ? `Panels that lean ${compassName(shading.bearing)} instead of south make about ${Math.round(-shading.orientPct)}% less energy.`
        : `At ${tiltDeg(site)}° the panels make about ${Math.round(-shading.orientPct)}% less energy in this season than at ${REF_TILT_DEG}°.`,
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
      const bigLayout = roofLayout(frame.roof, big, frame.site, structure.key, city.lat);
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
  if (!frame.auto && panelTurn(site) !== bestTurn(site)) {
    fixes.push({ title: 'Turn the panels towards the sun', detail: `Lean them towards the ${SIDES[bestTurn(site)]} of the house, the side that looks most nearly south.`, action: { panelDir: 'auto' } });
  }
  if (shading.sources.rows >= 3 && !layout.winterSafe) {
    fixes.push({ title: 'Use winter-safe row spacing', detail: 'Opens the rows so none shades the next around midday in December. Fewer panels fit.', action: { rowSpacing: 'winter' } });
  }
  const oversizeFix = pickInverter(Math.max((peakW * CFG.inverterSafetyFactor) / 1000, systemKW / CFG.dcAcRatioMax));
  if (tripHours === 0 && dcAcRatio > CFG.dcAcRatioMax + 1e-9 && oversizeFix > chosen.inverterKW) {
    fixes.push({ title: `Upgrade to ${oversizeFix} kW inverter`, detail: `Sized for ${round(systemKW)} kW of panels as well as your peak load.`, action: { inverterKW: oversizeFix } });
  }
  if (tripHours > 0) {
    fixes.push({ title: `Upgrade to ${Math.max(recInverter, oversizeFix)} kW inverter`, detail: 'Or avoid running all ACs, the motor and the iron at the same time.', action: { inverterKW: Math.max(recInverter, oversizeFix) } });
  }
  if (offGrid && blackoutHours - tripHours > 0 && recBattery > chosen.batteryKWh) {
    fixes.push({ title: `Add a ${recBattery} kWh battery`, detail: 'Enough stored energy to carry your night load.', action: { batteryKWh: recBattery } });
  }

  return {
    city, panel, layout, sunHours, season, site, panelDirAuto: frame.auto,
    structure, structureCost,
    structureAuto: !site.structure || site.structure === 'auto',
    structureBest: structurePick.best.key,
    structureOptions: structurePick.options.map(({ key, structure: st, maxPanels, fits }) => ({
      key, label: st.label, short: st.short, desc: st.desc, maxPanels, fits,
      cost: Math.min(maxPanels, panelsWanted) * (panel.watts / 1000) * st.costPerKW,
    })),
    loadKw, running, solarKw, solarKwArray, clippedKWh, clipPct, dcAcRatio, sim, shading,
    // what the same array would make facing south with open sky (the reference for the performance meter)
    solarKwOpen: shape.map((s) => s * systemKW),
    dailyKWh, peakW, requiredKW, panelsNeeded, areaNeeded,
    recommended: { inverterKW: recInverter, batteryKWh: recBattery, panels: panelsNeeded },
    chosen, installed, overflow, systemKW,
    solarKWh, gridKWh, exportKWh, unmetKWh, coverage,
    billBefore, billAfter, monthlySaving, cost, paybackYears, co2TonsYear,
    issues, fixes, status,
  };
}
