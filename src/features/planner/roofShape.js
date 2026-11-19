// Roof shapes that are not one rectangle.
//
// A roof is the main rectangle plus any number of extensions: extra rectangles at the same height that join
// one of its sides. An L, a T or a house with a "tail" is the main roof with one or two extensions.
// Everything here works in whatever axes it is given (house axes, or array axes: see frame.js).

/** A roof extension placed in the 3D editor. Sizes in metres (w = across, d = front to back). */
export const WING = { label: 'Roof extension', short: 'Extension', w: 4, d: 5 };

const MIN_SHARED = 1; // an extension shares at least this much of an edge with the main roof (metres)
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Extensions with safe sizes, each moved so that it joins a side of the main roof without overlapping it. */
export function houseWings(roof, site) {
  const hw = roof.width / 2; const hl = roof.length / 2;
  return (site?.wings || []).map((g) => {
    const w = clamp(Number(g.w) || WING.w, 1.5, 40); const d = clamp(Number(g.d) || WING.d, 1.5, 40);
    let x = Number(g.x) || 0; let z = Number(g.z) || 0;
    // join the side it is furthest out towards
    if (Math.abs(x) / (hw + w / 2) >= Math.abs(z) / (hl + d / 2)) {
      x = (x >= 0 ? 1 : -1) * (hw + w / 2);
      z = clamp(z, -(hl + d / 2 - MIN_SHARED), hl + d / 2 - MIN_SHARED);
    } else {
      z = (z >= 0 ? 1 : -1) * (hl + d / 2);
      x = clamp(x, -(hw + w / 2 - MIN_SHARED), hw + w / 2 - MIN_SHARED);
    }
    return { ...g, type: 'wing', x, z, w, d };
  });
}

/** Every rectangle of the roof: the main one first, then the extensions. */
export function roofSections(roof, site) {
  return [{ id: 'main', x: 0, z: 0, w: roof.width, d: roof.length }, ...houseWings(roof, site)];
}

export const roofArea = (roof, site) => roofSections(roof, site).reduce((a, s) => a + s.w * s.d, 0);

const inside = (s, x, z, pad = 0) => Math.abs(x - s.x) <= s.w / 2 + pad && Math.abs(z - s.z) <= s.d / 2 + pad;

/**
 * Where the parapet wall runs: along every outer edge of the roof, but not along the stretch where an
 * extension joins the main roof (there is no wall between them).
 * Each run is { along: 'x' | 'z', at, from, to, out }: a straight piece of wall at x or z = `at`,
 * from `from` to `to` on the other axis, with `out` (+1 / -1) pointing away from the roof.
 */
export function parapetRuns(roof, site) {
  const sections = roofSections(roof, site);
  const STEP = 0.25;
  const runs = [];
  sections.forEach((s) => {
    const others = sections.filter((o) => o !== s);
    const edges = [
      { along: 'x', at: s.z + s.d / 2, out: 1, from: s.x - s.w / 2, to: s.x + s.w / 2 },
      { along: 'x', at: s.z - s.d / 2, out: -1, from: s.x - s.w / 2, to: s.x + s.w / 2 },
      { along: 'z', at: s.x + s.w / 2, out: 1, from: s.z - s.d / 2, to: s.z + s.d / 2 },
      { along: 'z', at: s.x - s.w / 2, out: -1, from: s.z - s.d / 2, to: s.z + s.d / 2 },
    ];
    edges.forEach((e) => {
      // walk along the edge; a piece is open (no wall) when just outside it there is more roof
      const n = Math.max(1, Math.round((e.to - e.from) / STEP));
      const len = (e.to - e.from) / n;
      let start = null;
      for (let i = 0; i <= n; i++) {
        const mid = e.from + (i + 0.5) * len; const off = e.at + e.out * 0.1;
        const open = i === n || others.some((o) => (e.along === 'x' ? inside(o, mid, off) : inside(o, off, mid)));
        if (!open && start === null) start = e.from + i * len;
        if (open && start !== null) { runs.push({ along: e.along, at: e.at, out: e.out, from: start, to: e.from + i * len }); start = null; }
      }
    });
  });
  return runs;
}

/** A parapet run as a box footprint { x, z, w, d }, `t` thick, sitting inside (-1) or outside (+1) the roof edge. */
export function runBox(run, t, side = -1) {
  const mid = (run.from + run.to) / 2; const len = run.to - run.from;
  const at = run.at + side * run.out * (t / 2);
  return run.along === 'x' ? { x: mid, z: at, w: len, d: t } : { x: at, z: mid, w: t, d: len };
}
