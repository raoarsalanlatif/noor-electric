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

/**
 * Difficulty presets. Wind pushes the player (and on harder levels the falling items),
 * gusts get stronger every day, and harder levels pay more points.
 */
export const DIFFICULTIES = {
  easy: { label: 'Easy', blurb: 'Calm skies, slow sun', wind: 0, gust: 0, drift: 0, fall: 0.85, dust: 0.7, drain: 0.85, score: 1, start: 70 },
  normal: { label: 'Normal', blurb: 'A breeze and the odd gust', wind: 0.7, gust: 2.6, drift: 0, fall: 1, dust: 1, drain: 1, score: 1.5, start: 62 },
  hard: { label: 'Hard', blurb: 'Strong gusts push you and the sun', wind: 1.4, gust: 4.6, drift: 0.55, fall: 1.15, dust: 1.3, drain: 1.1, score: 2.5, start: 58 },
  extreme: { label: 'Extreme', blurb: 'Monsoon storm — good luck', wind: 2.2, gust: 6.5, drift: 0.9, fall: 1.3, dust: 1.6, drain: 1.2, score: 4, start: 55 },
};

export function newGame(diffKey = 'normal') {
  const diff = DIFFICULTIES[diffKey] || DIFFICULTIES.normal;
  return {
    diffKey, diff,
    wind: { angle: Math.random() * Math.PI * 2, x: 0, z: 0, speed: 0, gust: 0, gustT: 0, nextGust: 6 },
    status: 'playing', t: 0, day: 1, phase: 'day', phaseT: 0,
    energy: diff.start, cap: 100, score: 0, kwh: 0, combo: 1, best: 0,
    dirt: 0, stun: 0, cleaning: 0,
    px: 0, pz: 1, target: null,
    timers: { sun: 0.5, big: 6, dust: 2, battery: 9, water: 12, cloud: 10, strike: 3 },
    clouds: [{ active: false }, { active: false }],
    strikes: [{ active: false }, { active: false }, { active: false }],
    items: Object.entries(POOLS).flatMap(([type, n]) => Array.from({ length: n }, () => ({ type, active: false }))),
    flash: 0,
  };
}

