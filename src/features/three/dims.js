import { STOREY_H, SLAB } from './constants';

export const houseHeight = (site) => site.storeys * STOREY_H + SLAB;

/** Panel tilt above horizontal. 15 degrees is the reference the sun-hour figures are quoted for. */
export const REF_TILT_DEG = 15;
export const tiltDeg = (site) => {
  const v = Number(site?.tilt);
  return Number.isFinite(v) ? Math.min(40, Math.max(5, v)) : REF_TILT_DEG;
};
export const tiltRad = (site) => (tiltDeg(site) * Math.PI) / 180;
