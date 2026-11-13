// Simple solar geometry: good enough to put the sun in the right part of the sky
// for a given latitude, season and hour (solar time).

const RAD = Math.PI / 180;

export const SEASONS = {
  summer: { label: 'Summer', declination: 23.44, sunFactor: 1.12 },
  annual: { label: 'Year average', declination: 0, sunFactor: 1 },
  winter: { label: 'Winter', declination: -23.44, sunFactor: 0.78 },
};

/**
 * Sun altitude/azimuth (degrees) and a unit direction vector in scene space.
 * Scene axes: +x = east, +y = up, +z = south (the street side of the house).
 */
export function sunPosition(lat, seasonKey, hour) {
  const dec = (SEASONS[seasonKey] || SEASONS.annual).declination * RAD;
  const phi = lat * RAD;
  const H = (hour - 12) * 15 * RAD;
  const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(phi)) / (Math.cos(alt) * Math.cos(phi) || 1e-6);
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))); // from north
  if (H > 0) az = 2 * Math.PI - az; // afternoon: west side
  const x = Math.sin(az) * Math.cos(alt);
  const z = -Math.cos(az) * Math.cos(alt);
  const y = Math.sin(alt);
  return { alt: alt / RAD, az: az / RAD, dir: [x, y, z] };
}

/** Hourly irradiance weights (sum = 1) for the given latitude and season. */
export function dailyShape(lat, seasonKey) {
  const raw = Array.from({ length: 24 }, (_, k) => {
    const { alt } = sunPosition(lat, seasonKey, k + 0.5);
    return alt > 0 ? Math.pow(Math.sin(alt * RAD), 1.25) : 0;
  });
  const s = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((v) => v / s);
}

/** 0 at night, 1 at high sun — used for lighting. */
export const daylightFromAlt = (alt) => Math.max(0, Math.min(1, (alt + 4) / 30));
