import { houseHeight } from '../three/dims';

export const ROOF = { width: 11, length: 11 };
export const SITE = { storeys: 2, parapetH: 0.9, stairRoom: false, tank: false, acUnits: 0, elevated: false };
export const DAY_LEN = 34;
export const NIGHT_LEN = 12;
export const LAT = 34;
export const ROOF_TOP = houseHeight(SITE);
export const BOUND = ROOF.width / 2 - 0.75;
export const PANEL = { width: 1.13, length: 2.28 };
export const PLAYER_SCALE = 1.25;
export const CATCH_Y0 = ROOF_TOP + 2.15;
export const CATCH_Y1 = ROOF_TOP + 3.45;

const POOLS = { sun: 26, big: 4, dust: 18, battery: 5, water: 5 };
export const rand = (a, b) => a + Math.random() * (b - a);

export function newGame() {
  return {
    status: 'playing', t: 0, day: 1, phase: 'day', phaseT: 0,
    energy: 60, cap: 100, score: 0, kwh: 0, combo: 1, best: 0,
    dirt: 0, stun: 0, cleaning: 0,
    px: 0, pz: 1, target: null,
    timers: { sun: 0.5, big: 6, dust: 2, battery: 9, water: 12, cloud: 10, strike: 3 },
    clouds: [{ active: false }, { active: false }],
    strikes: [{ active: false }, { active: false }, { active: false }],
    items: Object.entries(POOLS).flatMap(([type, n]) => Array.from({ length: n }, () => ({ type, active: false }))),
    flash: 0,
  };
}

