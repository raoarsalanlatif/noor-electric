// Shade from surrounding buildings, and the effect of the direction the house faces.
// Pure maths (no 3D engine): for every installed panel we trace rays towards the sun through the day
// and check whether a nearby building is in the way.
//
// Axes are the same as the 3D scene: origin at the centre of the roof, +x = right when you look at the
// house from the street, +z = the front of the house, +y = up. Ground is y = 0.

import { sunFor, sunPosition, dailyShape } from '../three/sun';
import { houseHeight } from '../three/dims';
import { PLANNER_CONFIG as CFG, FACINGS } from './config';

const TILT = (15 * Math.PI) / 180;
const STEPS = 4; // sun positions sampled per hour
const GAP = 0.5; // a neighbour can not stand closer than this to the house (metres)

export const facingOf = (site) => (Number.isFinite(site?.facing) ? site.facing : 180);
export const facingLabel = (deg) => (FACINGS.find((f) => f.deg === deg) || { label: `${Math.round(deg)}°` }).label;

/** Height of the middle of a tilted panel above the ground (metres). */
export const panelHeight = (site, layout, panel) => houseHeight(site) + layout.structure.frontH + Math.sin(TILT) * panel.length * 0.5;

/** Surrounding buildings with safe sizes, pushed outside the house footprint. */
export function surroundingBuildings(roof, site) {
  const hw = roof.width / 2 + GAP; const hl = roof.length / 2 + GAP;
  return (site?.surroundings || []).map((b) => {
    const w = Math.min(60, Math.max(1, Number(b.w) || 1));
    const d = Math.min(60, Math.max(1, Number(b.d) || 1));
    const h = Math.min(120, Math.max(1, Number(b.h) || 1));
    let x = Math.min(150, Math.max(-150, Number(b.x) || 0));
    let z = Math.min(150, Math.max(-150, Number(b.z) || 0));
    // overlap with the house on each axis; if it overlaps on both, slide it out the shorter way
    const ox = hw + w / 2 - Math.abs(x); const oz = hl + d / 2 - Math.abs(z);
    if (ox > 0 && oz > 0) {
      if (ox <= oz) x = (x >= 0 ? 1 : -1) * (hw + w / 2); else z = (z >= 0 ? 1 : -1) * (hl + d / 2);
    }
    return { ...b, x, z, w, d, h };
  });
}

/** Does a ray from point p along direction dir (dir[1] > 0) pass through the building? */
function blocked(p, dir, b) {
  let t0 = 0; let t1 = Infinity;
  const lo = [b.x - b.w / 2, 0, b.z - b.d / 2]; const hi = [b.x + b.w / 2, b.h, b.z + b.d / 2];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(dir[i]) < 1e-9) {
      if (p[i] < lo[i] || p[i] > hi[i]) return false;
    } else {
      let a = (lo[i] - p[i]) / dir[i]; let c = (hi[i] - p[i]) / dir[i];
      if (a > c) { const s = a; a = c; c = s; }
      if (a > t0) t0 = a;
      if (c < t1) t1 = c;
      if (t0 > t1) return false;
    }
  }
  return true;
}

/** Five points on a tilted panel: centre and near each corner (the front edge sits lower). */
function samplePoints(slot, panel, yc) {
  const dx = panel.width * 0.4; const dz = panel.length * Math.cos(TILT) * 0.4;
  const dy = Math.tan(TILT) * dz;
  return [
    [slot.x, yc, slot.z],
    [slot.x - dx, yc + dy, slot.z - dz], [slot.x + dx, yc + dy, slot.z - dz],
    [slot.x - dx, yc - dy, slot.z + dz], [slot.x + dx, yc - dy, slot.z + dz],
  ];
}

const ONES = Object.freeze(new Array(24).fill(1));
const ZEROS = Object.freeze(new Array(24).fill(0));

/**
 * Hour-by-hour effect of the house direction and of surrounding buildings on the panels.
 *
 * Returns:
 *  - factor[24]   multiply the unshaded solar output of each hour by this
 *  - shade[24]    share of the panel area in shadow in each hour (0–1)
 *  - perPanel[]   share of each panel's daily energy lost to shade (0–1), in slot order
 *  - panelHourly  [24][panel] share of each panel in shadow in each hour, or null without buildings
 *  - lossPct      daily energy lost to shade, % of what the same array would make unshaded
 *  - orientPct    daily energy change from the house direction, % (0 when the front faces south)
 *  - active       false when there is nothing to model (south-facing, no buildings): factor is all 1
 */
export function computeShading({ roof, site, layout, panel, installed, lat, season }) {
  const facing = facingOf(site);
  const buildings = surroundingBuildings(roof, site);
  const base = { facing, buildings, factor: ONES, shade: ZEROS, perPanel: [], lossPct: 0, orientPct: 0, worstHour: null, panelHourly: null, active: false };
  const turned = facing !== 180;
  const slots = layout.slots.slice(0, installed);
  if (!turned && (!buildings.length || !slots.length)) return base;

  const weights = dailyShape(lat, season); // irradiance share of each hour
  const yc = panelHeight(site, layout, panel);
  const points = slots.map((s) => samplePoints(s, panel, yc));
  const normal = [0, Math.cos(TILT), Math.sin(TILT)]; // panels lean towards the front of the house
  const beam = CFG.shadeBeamShare;

  const factor = []; const shade = []; const panelHourly = [];
  const lost = new Array(slots.length).fill(0); // irradiance-weighted shade per panel
  let made = 0; let unshaded = 0; let south = 0;
  for (let k = 0; k < 24; k++) {
    let hits = 0; let rays = 0; let num = 0; let den = 0;
    const panelHits = new Array(slots.length).fill(0);
    for (let s = 0; s < STEPS; s++) {
      const hour = k + (s + 0.5) / STEPS;
      const sun = sunFor(lat, season, hour, facing);
      if (sun.alt <= 0) continue;
      if (turned) {
        const ref = sunPosition(lat, season, hour).dir;
        num += Math.max(0, normal[1] * sun.dir[1] + normal[2] * sun.dir[2]);
        den += Math.max(0, normal[1] * ref[1] + normal[2] * ref[2]);
      }
      if (!buildings.length) continue;
      points.forEach((pts, i) => {
        pts.forEach((p) => {
          rays += 1;
          if (buildings.some((b) => blocked(p, sun.dir, b))) { hits += 1; panelHits[i] += 1; }
        });
      });
    }
    const orient = turned && den > 1e-6 ? Math.min(2.5, num / den) : 1;
    const sh = rays ? hits / rays : 0;
    shade.push(sh);
    factor.push(orient * (1 - sh * beam));
    south += weights[k];
    unshaded += weights[k] * orient;
    made += weights[k] * orient * (1 - sh * beam);
    panelHits.forEach((n, i) => { lost[i] += weights[k] * orient * (n / (points[i].length * STEPS)) * beam; });
    // share of the daylight sun positions in this hour at which each panel is shaded
    panelHourly.push(panelHits.map((n) => (rays ? n / (rays / slots.length) : 0)));
  }
  let worstHour = null;
  shade.forEach((v, k) => { if (v > 0.02 && (worstHour === null || v * weights[k] > shade[worstHour] * weights[worstHour])) worstHour = k; });
  return {
    facing, buildings, factor, shade,
    perPanel: lost.map((v) => (unshaded > 0 ? v / unshaded : 0)),
    lossPct: unshaded > 0 ? (1 - made / unshaded) * 100 : 0,
    orientPct: south > 0 ? (unshaded / south - 1) * 100 : 0,
    worstHour,
    panelHourly: buildings.length ? panelHourly : null,
    active: true,
  };
}
