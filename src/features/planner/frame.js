// Which side of the roof the panels lean towards.
//
// The layout and shade maths always work in "array axes", where +z is the side the panels lean towards.
// When the panels lean towards the front of the house, array axes and house axes are the same. When they
// lean towards the right, back or left side, the roof, the things on it and the buildings around it are
// turned by quarter turns into array axes, the usual maths runs, and the results are turned back.
//
// House axes: origin at the centre of the roof, +x = right when you look at the house from the street,
// +z = the front of the house.

import { facingOf } from './shading';

/** Sides of the house the panels can lean towards, in quarter turns from the front. */
export const SIDES = ['front', 'right', 'back', 'left'];
const BEARING_STEP = [0, -90, 180, 90]; // compass bearing of each side, relative to the front
const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

const norm = (deg) => ((deg % 360) + 360) % 360;
const fromSouth = (deg) => Math.abs(norm(deg) - 180); // degrees away from due south

/** Nearest of the eight compass names to a bearing, e.g. 172 -> "south". */
export const compassName = (deg) => COMPASS[Math.round(norm(deg) / 45) % 8];

/** Compass bearing of a side of the house. */
export const sideBearing = (site, turn) => norm(facingOf(site) + BEARING_STEP[turn]);

/** The side of the roof that looks most nearly south: where the panels lean when left on auto. */
export function bestTurn(site) {
  let best = 0;
  for (let k = 1; k < 4; k++) if (fromSouth(sideBearing(site, k)) < fromSouth(sideBearing(site, best)) - 1e-9) best = k;
  return best;
}

/** Quarter turns (0-3) from the front to the side the panels lean towards. `panelDir` is 'auto' or 0-3. */
export function panelTurn(site) {
  const d = site?.panelDir;
  return Number.isInteger(d) && d >= 0 && d < 4 ? d : bestTurn(site);
}

// house (x, z) -> array (x, z), and back (adding 0 turns a negative zero into zero)
const TO_ARRAY = [(x, z) => [x, z], (x, z) => [0 - z, x], (x, z) => [0 - x, 0 - z], (x, z) => [z, 0 - x]];
const TO_HOUSE = [(x, z) => [x, z], (x, z) => [z, 0 - x], (x, z) => [0 - x, 0 - z], (x, z) => [0 - z, x]];

const turnBox = (map, odd) => (o) => {
  const [x, z] = map(Number(o.x) || 0, Number(o.z) || 0);
  return odd ? { ...o, x, z, w: o.d, d: o.w } : { ...o, x, z };
};

/** The roof and site as the panel array sees them, and the way back to house axes. */
export function arrayFrame(roof, site) {
  const turn = panelTurn(site);
  const odd = turn % 2 === 1;
  const bearing = sideBearing(site, turn);
  const into = turnBox(TO_ARRAY[turn], odd);
  const back = turnBox(TO_HOUSE[turn], odd);
  return {
    turn, odd, bearing, side: SIDES[turn], auto: !Number.isInteger(site?.panelDir),
    roof: odd ? { width: roof.length, length: roof.width } : roof,
    site: { ...site, facing: bearing, items: (site.items || []).map(into), surroundings: (site.surroundings || []).map(into) },
    point: (p) => { const [x, z] = TO_HOUSE[turn](p.x, p.z); return { ...p, x, z }; },
    box: back,
    rect: (k) => {
      const [ax, az] = TO_HOUSE[turn](k.x0, k.z0); const [bx, bz] = TO_HOUSE[turn](k.x1, k.z1);
      return { ...k, x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) };
    },
  };
}

/** A layout worked out in array axes, turned back to house axes for drawing. */
export function houseLayout(layout, frame) {
  return {
    ...layout,
    turn: frame.turn, side: frame.side, bearing: frame.bearing,
    // footprint of one panel on the roof, along the house's x and z
    footX: frame.odd ? layout.depth : layout.colW - 0.03,
    footZ: frame.odd ? layout.colW - 0.03 : layout.depth,
    slots: layout.slots.map(frame.point),
    obstacles: layout.obstacles.map(frame.box),
    keepOuts: layout.keepOuts.map(frame.rect),
    overflowSlot: (k) => frame.point(layout.overflowSlot(k)),
  };
}
