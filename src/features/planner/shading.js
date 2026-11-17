// Shade on the panels and the effect of the direction and tilt they face.
// Pure maths (no 3D engine): for every installed panel we trace rays towards the sun through the day
// and check whether something is in the way: a nearby building, something standing on the roof
// (room, tank, AC, parapet wall) or the panel row in front.
//
// Axes are the same as the 3D scene: origin at the centre of the roof, +x = right when you look at the
// house from the street, +z = the front of the house, +y = up. Ground is y = 0.

import { sunFor, sunPosition, dailyShape } from '../three/sun';
import { houseHeight, tiltRad, REF_TILT_DEG } from '../three/dims';
import { PLANNER_CONFIG as CFG, FACINGS } from './config';

const REF_TILT = (REF_TILT_DEG * Math.PI) / 180;
const REF_NORMAL = [0, Math.cos(REF_TILT), Math.sin(REF_TILT)];
const STEPS = 4; // sun positions sampled per hour
const GAP = 0.5; // a neighbour can not stand closer than this to the house (metres)
const WALL = 0.15; // parapet wall thickness (metres)

export const facingOf = (site) => (Number.isFinite(site?.facing) ? ((site.facing % 360) + 360) % 360 : 180);
export const facingLabel = (deg) => (FACINGS.find((f) => f.deg === deg) || { label: `${Math.round(deg)}°` }).label;

/** Height of the middle of a tilted panel above the ground (metres). */
export const panelHeight = (site, layout, panel) => houseHeight(site) + layout.structure.frontH + Math.sin(tiltRad(site)) * panel.length * 0.5;

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

/** Does a ray from point p along direction dir (dir[1] > 0) pass through the box [lo, hi]? */
function hitsBox(p, dir, lo, hi) {
  let t0 = 0; let t1 = Infinity;
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

const box = (x, z, w, d, y0, y1) => ({ lo: [x - w / 2, y0, z - d / 2], hi: [x + w / 2, y1, z + d / 2] });

/** Things standing on the roof as boxes: rooms, tanks, ACs and the parapet wall. */
export function roofBoxes(roof, site, layout) {
  const H = houseHeight(site);
  const out = (layout.obstacles || []).map((o) => box(o.x, o.z, o.w, o.d, H, H + o.top));
  const ph = Number(site?.parapetH) || 0;
  if (ph > 0) {
    const W = roof.width; const L = roof.length;
    out.push(
      box(0, L / 2 - WALL / 2, W, WALL, H, H + ph), box(0, -L / 2 + WALL / 2, W, WALL, H, H + ph),
      box(W / 2 - WALL / 2, 0, WALL, L, H, H + ph), box(-W / 2 + WALL / 2, 0, WALL, L, H, H + ph),
    );
  }
  return out;
}

/**
 * Does a ray from p towards the sun pass through the tilted panel centred on slot s?
 * The panel is a rectangle `width` wide and `length` long, leaning towards +z.
 */
function hitsPanel(p, dir, s, yc, panel, normal, cosT, sinT) {
  const dn = dir[1] * normal[1] + dir[2] * normal[2];
  if (Math.abs(dn) < 1e-6) return false;
  const t = ((yc - p[1]) * normal[1] + (s.z - p[2]) * normal[2]) / dn;
  if (t <= 1e-4) return false;
  const qx = p[0] + dir[0] * t - s.x;
  if (Math.abs(qx) > panel.width / 2) return false;
  // distance along the slope from the panel centre
  const v = (p[2] + dir[2] * t - s.z) * cosT - (p[1] + dir[1] * t - yc) * sinT;
  return Math.abs(v) <= panel.length / 2;
}

const ACROSS = 3; const ALONG = 6; // sample grid on each panel

/**
 * Points spread evenly over a tilted panel, each at the centre of an equal share of its area
 * (the front edge sits lower). Six steps up the slope, because the row in front shades from the bottom up.
 */
function samplePoints(slot, panel, yc, tilt) {
  const cosT = Math.cos(tilt); const sinT = Math.sin(tilt);
  const pts = [];
  for (let j = 0; j < ALONG; j++) {
    const v = ((j + 0.5) / ALONG - 0.5) * panel.length; // along the slope, towards the front (down)
    for (let i = 0; i < ACROSS; i++) {
      const u = ((i + 0.5) / ACROSS - 0.5) * panel.width;
      pts.push([slot.x + u, yc - v * sinT, slot.z + v * cosT]);
    }
  }
  return pts;
}

/**
 * Direct sunlight on a panel with this tilt and facing in hour k, relative to the reference panel
 * (15° tilt, facing south). 1 = same as the reference.
 */
function orientHour(lat, season, k, normal, facing) {
  let num = 0; let den = 0;
  for (let s = 0; s < STEPS; s++) {
    const hour = k + (s + 0.5) / STEPS;
    const sun = sunFor(lat, season, hour, facing);
    if (sun.alt <= 0) continue;
    const ref = sunPosition(lat, season, hour).dir;
    num += Math.max(0, normal[1] * sun.dir[1] + normal[2] * sun.dir[2]);
    den += Math.max(0, REF_NORMAL[1] * ref[1] + REF_NORMAL[2] * ref[2]);
  }
  return den > 1e-6 ? Math.min(2.5, num / den) : 1;
}

/** Day's energy for a panel at this tilt (degrees) and facing, relative to the reference panel. */
export function orientationFactor(lat, season, tiltDegrees, facing = 180) {
  const tilt = (tiltDegrees * Math.PI) / 180;
  const normal = [0, Math.cos(tilt), Math.sin(tilt)];
  const weights = dailyShape(lat, season);
  return weights.reduce((sum, w, k) => (w > 0 ? sum + w * orientHour(lat, season, k, normal, facing) : sum), 0);
}

const ONES = Object.freeze(new Array(24).fill(1));
const ZEROS = Object.freeze(new Array(24).fill(0));
const NO_SOURCES = Object.freeze({ buildings: 0, roof: 0, rows: 0 });

/**
 * Hour-by-hour effect of the panel direction, tilt and shade on the panels.
 *
 * Returns:
 *  - factor[24]   multiply the reference solar output of each hour by this
 *  - shade[24]    share of the panel area in shadow in each hour (0–1)
 *  - perPanel[]   share of each panel's daily energy lost to shade (0–1), in slot order
 *  - panelHourly  [24][panel] share of each panel in shadow in each hour, or null with no panels
 *  - lossPct      daily energy lost to shade, % of what the same array would make unshaded
 *  - sources      lossPct split by cause: { buildings, roof, rows }
 *  - orientPct    daily energy change from the tilt and direction, % (0 for 15° facing south)
 *  - active       false when there is nothing to model (no panels, reference tilt, facing south)
 */
export function computeShading({ roof, site, layout, panel, installed, lat, season }) {
  const facing = facingOf(site);
  const tilt = tiltRad(site);
  const buildings = surroundingBuildings(roof, site);
  const base = { facing, buildings, factor: ONES, shade: ZEROS, perPanel: [], lossPct: 0, sources: NO_SOURCES, orientPct: 0, worstHour: null, panelHourly: null, active: false };
  const turned = facing !== 180 || Math.abs(tilt - REF_TILT) > 1e-9;
  const slots = layout.slots.slice(0, installed);
  if (!turned && !slots.length) return base;

  const weights = dailyShape(lat, season); // irradiance share of each hour
  const yc = panelHeight(site, layout, panel);
  const cosT = Math.cos(tilt); const sinT = Math.sin(tilt);
  const normal = [0, cosT, sinT]; // panels lean towards the front of the house
  const points = slots.map((s) => samplePoints(s, panel, yc, tilt));
  const towers = buildings.map((b) => box(b.x, b.z, b.w, b.d, 0, b.h));
  const onRoof = slots.length ? roofBoxes(roof, site, layout) : [];
  // only the rows in front of a panel can shade it
  const reach = layout.pitch * 2.5;
  const inFront = slots.map((s) => slots.filter((o) => o.z > s.z + 1e-6 && o.z - s.z <= reach && Math.abs(o.x - s.x) <= reach * 2));
  const beam = CFG.shadeBeamShare;
  const perPoint = points.length ? points[0].length : 1;

  const factor = []; const shade = []; const panelHourly = [];
  const lost = new Array(slots.length).fill(0); // irradiance-weighted shade per panel
  const lostBy = { buildings: 0, roof: 0, rows: 0 };
  let made = 0; let unshaded = 0; let south = 0;
  for (let k = 0; k < 24; k++) {
    let rays = 0;
    const by = { buildings: 0, roof: 0, rows: 0 };
    const panelHits = new Array(slots.length).fill(0);
    for (let s = 0; s < STEPS; s++) {
      const sun = sunFor(lat, season, k + (s + 0.5) / STEPS, facing);
      if (sun.alt <= 0) continue;
      const dir = sun.dir;
      points.forEach((pts, i) => {
        pts.forEach((p) => {
          rays += 1;
          let cause = null;
          if (towers.some((b) => hitsBox(p, dir, b.lo, b.hi))) cause = 'buildings';
          else if (onRoof.some((b) => hitsBox(p, dir, b.lo, b.hi))) cause = 'roof';
          else if (inFront[i].some((o) => hitsPanel(p, dir, o, yc, panel, normal, cosT, sinT))) cause = 'rows';
          if (cause) { by[cause] += 1; panelHits[i] += 1; }
        });
      });
    }
    const orient = turned && weights[k] > 0 ? orientHour(lat, season, k, normal, facing) : 1;
    const hits = by.buildings + by.roof + by.rows;
    const sh = rays ? hits / rays : 0;
    shade.push(sh);
    factor.push(orient * (1 - sh * beam));
    south += weights[k];
    unshaded += weights[k] * orient;
    made += weights[k] * orient * (1 - sh * beam);
    if (rays) Object.keys(by).forEach((c) => { lostBy[c] += weights[k] * orient * (by[c] / rays) * beam; });
    const daySteps = rays && slots.length ? rays / (slots.length * perPoint) : 0; // sun positions above the horizon this hour
    panelHits.forEach((n, i) => { lost[i] += weights[k] * orient * (n / (perPoint * STEPS)) * beam; });
    // share of the daylight sun positions in this hour at which each panel is shaded
    panelHourly.push(panelHits.map((n) => (daySteps ? n / (perPoint * daySteps) : 0)));
  }
  let worstHour = null;
  shade.forEach((v, k) => { if (v > 0.02 && (worstHour === null || v * weights[k] > shade[worstHour] * weights[worstHour])) worstHour = k; });
  const pct = (v) => (unshaded > 0 ? (v / unshaded) * 100 : 0);
  return {
    facing, buildings, factor, shade,
    perPanel: lost.map((v) => (unshaded > 0 ? v / unshaded : 0)),
    lossPct: unshaded > 0 ? (1 - made / unshaded) * 100 : 0,
    sources: { buildings: pct(lostBy.buildings), roof: pct(lostBy.roof), rows: pct(lostBy.rows) },
    orientPct: south > 0 ? (unshaded / south - 1) * 100 : 0,
    worstHour,
    panelHourly: slots.length ? panelHourly : null,
    active: true,
  };
}
