// Panels can lean towards any side of the roof, and can sit on top of a room.
import { describe, it, expect } from 'vitest';
import { computePlan, chooseStructure } from '../sizing';
import { arrayFrame, bestTurn, panelTurn, sideBearing, compassName } from '../frame';
import { DEFAULT_LOAD } from '../appliances';
import { CITIES, DEFAULT_SITE } from '../config';

const clear = { ...DEFAULT_SITE, items: [], parapetH: 0 };
const base = {
  load: DEFAULT_LOAD, location: CITIES[0], season: 'annual', site: clear,
  roof: { width: 10, length: 14 }, panelWatts: 550, mode: 'auto',
  custom: { panels: 12, inverterKW: 6, batteryKWh: 10 }, withBattery: false, offGrid: false,
};
const withSite = (patch, over = {}) => computePlan({ ...base, ...over, site: { ...clear, ...patch } });
const insideRoof = (p, roof = base.roof) => p.layout.slots.every((s) => Math.abs(s.x) <= roof.width / 2 && Math.abs(s.z) <= roof.length / 2);

describe('panel direction', () => {
  it('on auto, panels lean towards the side of the roof that looks most nearly south', () => {
    expect(bestTurn({ facing: 180 })).toBe(0); // house faces south: lean to the front
    expect(bestTurn({ facing: 0 })).toBe(2); // faces north: lean to the back
    expect(bestTurn({ facing: 90 })).toBe(3); // faces east: south is on the left, seen from the street
    expect(bestTurn({ facing: 270 })).toBe(1); // faces west: south is on the right
    [0, 45, 90, 135, 180, 225, 270, 315, 172].forEach((facing) => {
      const away = Math.abs(sideBearing({ facing }, bestTurn({ facing })) - 180);
      expect(away).toBeLessThanOrEqual(45);
    });
  });

  it('a house facing north makes as much as one facing south once the panels turn to the back', () => {
    const south = withSite({ facing: 180 });
    const north = withSite({ facing: 0 });
    expect(north.layout.side).toBe('back');
    expect(north.shading.bearing).toBe(180);
    expect(north.shading.facing).toBe(0);
    expect(north.solarKWh).toBeCloseTo(south.solarKWh, 6);
    expect(north.issues.map((i) => i.type)).not.toContain('facing');
  });

  it('a chosen side overrides auto, and a poor choice gets a fix', () => {
    const p = withSite({ facing: 0, panelDir: 0 });
    expect(panelTurn(p.site)).toBe(0);
    expect(p.shading.bearing).toBe(0);
    expect(p.issues.map((i) => i.type)).toContain('facing');
    expect(p.fixes.some((f) => f.action?.panelDir === 'auto')).toBe(true);
    expect(p.solarKWh).toBeLessThan(withSite({ facing: 0 }).solarKWh);
  });

  it('panels stay on the roof whichever side they lean towards', () => {
    [0, 1, 2, 3].forEach((panelDir) => {
      const p = withSite({ panelDir });
      expect(p.layout.turn).toBe(panelDir);
      expect(p.layout.maxPanels).toBeGreaterThan(0);
      expect(insideRoof(p)).toBe(true);
      // a panel's footprint is longer along the direction it leans
      const along = panelDir % 2 ? p.layout.footX : p.layout.footZ;
      const across = panelDir % 2 ? p.layout.footZ : p.layout.footX;
      expect(along).toBeGreaterThan(across);
    });
  });

  it('roof items and nearby buildings come back in house axes', () => {
    const room = { id: 'r', type: 'room', x: -3, z: -5, w: 3, d: 3.4, h: 2.7 };
    const tower = { id: 'b', x: 20, z: 0, w: 8, d: 10, h: 20 };
    [0, 1, 2, 3].forEach((panelDir) => {
      const p = withSite({ panelDir, items: [room], surroundings: [tower] });
      const o = p.layout.obstacles[0];
      expect([o.x, o.z, o.w, o.d]).toEqual([room.x, room.z, room.w, room.d]);
      const b = p.shading.buildings[0];
      expect([b.x, b.z, b.w, b.d]).toEqual([tower.x, tower.z, tower.w, tower.d]);
      // no panel overlaps the room
      p.layout.slots.forEach((s) => {
        const overlap = Math.abs(s.x - o.x) < (o.w + p.layout.footX) / 2 && Math.abs(s.z - o.z) < (o.d + p.layout.footZ) / 2;
        expect(overlap).toBe(false);
      });
    });
  });

  it('a building east of the house shades the morning whichever side the panels lean towards', () => {
    const tower = { id: 'b', x: 14, z: 0, w: 12, d: 10, h: 30 };
    const total = (a) => a.reduce((s, v) => s + v, 0);
    [0, 1, 2, 3].forEach((panelDir) => {
      const { shade } = withSite({ panelDir, surroundings: [tower] }, { season: 'winter' }).shading;
      expect(total(shade.slice(0, 12))).toBeGreaterThan(total(shade.slice(12)));
    });
  });

  it('turning to array axes and back returns the same point', () => {
    [0, 1, 2, 3].forEach((panelDir) => {
      const f = arrayFrame(base.roof, { ...clear, panelDir, items: [{ id: 'a', type: 'ac', x: 2, z: -3, w: 0.9, d: 0.4, h: 0.6 }] });
      const back = f.box(f.site.items[0]);
      expect([back.x, back.z, back.w, back.d]).toEqual([2, -3, 0.9, 0.4]);
    });
  });

  it('names a bearing by the nearest compass point', () => {
    expect(compassName(172)).toBe('south');
    expect(compassName(350)).toBe('north');
    expect(compassName(120)).toBe('south-east');
  });
});

describe('panels on top of a room', () => {
  const room = { id: 'r', type: 'room', x: -3, z: -5, w: 3.6, d: 3.4, h: 2.7 };

  it('are off unless asked for', () => {
    const p = withSite({ items: [room] });
    expect(p.layout.onRooms).toBe(0);
    expect(p.layout.slots.some((s) => s.onRoom)).toBe(false);
  });

  it('add panel spots, which come first and sit at the height of the room', () => {
    const off = withSite({ items: [room] });
    const on = withSite({ items: [{ ...room, panelsOnTop: true }] });
    expect(on.layout.onRooms).toBeGreaterThan(0);
    expect(on.layout.maxPanels).toBe(off.layout.maxPanels + on.layout.onRooms);
    const first = on.layout.slots[0];
    expect(first.onRoom).toBe('r');
    expect(first.base).toBeGreaterThan(room.h);
    on.layout.slots.filter((s) => s.onRoom).forEach((s) => {
      expect(Math.abs(s.x - room.x) + on.layout.footX / 2).toBeLessThanOrEqual(room.w / 2 + 1e-9);
      expect(Math.abs(s.z - room.z) + on.layout.footZ / 2).toBeLessThanOrEqual(room.d / 2 + 1e-9);
    });
  });

  it('keep clear of a water tank standing on the room', () => {
    const tank = { id: 't', type: 'tank', x: room.x, z: room.z, w: 1.2, d: 1.2, h: 1.3 };
    const withTank = withSite({ items: [{ ...room, panelsOnTop: true }, tank] });
    const noTank = withSite({ items: [{ ...room, panelsOnTop: true }] });
    expect(withTank.layout.onRooms).toBeLessThan(noTank.layout.onRooms);
  });

  it('a room too small for a panel gets none', () => {
    const p = withSite({ items: [{ ...room, w: 1, d: 1.5, panelsOnTop: true }] });
    expect(p.layout.onRooms).toBe(0);
  });

  it('work with the panels turned to another side', () => {
    const p = withSite({ facing: 0, items: [{ ...room, panelsOnTop: true }] });
    expect(p.layout.side).toBe('back');
    expect(p.layout.onRooms).toBeGreaterThan(0);
    p.layout.slots.filter((s) => s.onRoom).forEach((s) => {
      expect(Math.abs(s.x - room.x)).toBeLessThan(room.w / 2);
      expect(Math.abs(s.z - room.z)).toBeLessThan(room.d / 2);
    });
  });
});

describe('elevated structures', () => {
  const tiltedSite = { structure: 'elevatedTilt' };

  it('a tilted frame lays the rows edge to edge on one slope, each row a step higher', () => {
    const p = withSite(tiltedSite);
    expect(p.structure.key).toBe('elevatedTilt');
    expect(p.layout.tilted).toBe(true);
    const col = p.layout.slots.filter((s) => s.table === 0 && Math.abs(s.x - p.layout.slots[0].x) < 1e-6).sort((a, b) => b.z - a.z);
    expect(col.length).toBeGreaterThan(1);
    // front row lowest; rows touch (no walkway) and rise with the tilt
    expect(col[0].base).toBeCloseTo(p.structure.frontH, 9);
    for (let i = 1; i < col.length; i++) {
      expect(col[i - 1].z - col[i].z).toBeCloseTo(p.layout.pitch, 9);
      expect(col[i].base - col[i - 1].base).toBeCloseTo(p.layout.pitch * Math.tan((15 * Math.PI) / 180), 9);
    }
    expect(p.layout.pitch).toBeLessThan(p.layout.depth + 0.1);
  });

  it('the back of a tilted table stays under the height limit; a long roof gets a second table', () => {
    const p = withSite(tiltedSite, { roof: { width: 10, length: 24 } });
    const top = Math.max(...p.layout.slots.map((s) => s.base)) + p.panel.length * Math.sin((15 * Math.PI) / 180);
    expect(top).toBeLessThanOrEqual(p.structure.maxBackH + 1e-9);
    expect(new Set(p.layout.slots.map((s) => s.table)).size).toBeGreaterThan(1);
  });

  it('rows on a tilted frame do not shade each other in December; rows on a level frame do', () => {
    const custom = { panels: 16, inverterKW: 8, batteryKWh: 0 };
    const level = withSite({ structure: 'elevated' }, { season: 'winter', mode: 'custom', custom });
    const tilted = withSite(tiltedSite, { season: 'winter', mode: 'custom', custom });
    expect(level.shading.sources.rows).toBeGreaterThan(3);
    expect(tilted.shading.sources.rows).toBeLessThan(1);
    expect(tilted.solarKWh).toBeGreaterThan(level.solarKWh);
  });

  it('auto keeps the low frame when it fits: it is the best value', () => {
    const p = withSite({});
    expect(p.structureAuto).toBe(true);
    expect(p.structure.key).toBe('L2');
    expect(p.structureBest).toBe('L2');
  });

  it('auto compares the two elevated structures on cost for the energy they make, and takes the better', () => {
    // enough panels that only an elevated structure fits this cluttered roof
    const p = computePlan({ ...base, site: DEFAULT_SITE, mode: 'custom', custom: { panels: 24, inverterKW: 12, batteryKWh: 0 } });
    const { options, best } = chooseStructure(base.roof, p.panel, DEFAULT_SITE, 24, CITIES[0].lat);
    const fitting = options.filter((o) => o.fits);
    expect(fitting.map((o) => o.key)).toEqual(['elevated', 'elevatedTilt']);
    const cheapest = fitting.reduce((a, b) => (b.costPerEnergy < a.costPerEnergy ? b : a));
    expect(best.key).toBe(cheapest.key);
    expect(p.structure.key).toBe(cheapest.key);
  });

  it('auto does not change with the season being viewed', () => {
    const custom = { panels: 24, inverterKW: 12, batteryKWh: 0 };
    const keys = ['summer', 'annual', 'winter'].map((season) => computePlan({ ...base, site: DEFAULT_SITE, season, mode: 'custom', custom }).structure.key);
    expect(new Set(keys).size).toBe(1);
  });

  it('when nothing fits, auto takes the structure that holds the most panels', () => {
    const p = computePlan({ ...base, site: DEFAULT_SITE, mode: 'custom', custom: { panels: 60, inverterKW: 30, batteryKWh: 0 } });
    const most = Math.max(...p.structureOptions.map((o) => o.maxPanels));
    expect(p.layout.maxPanels).toBe(most);
    expect(p.overflow).toBe(60 - most);
  });
});
