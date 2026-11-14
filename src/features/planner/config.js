// Business settings for the Solar Planner.
// All money values are in PKR and are INDICATIVE — update them to your current price list.

export const PLANNER_CONFIG = {
  // Company WhatsApp number in international format, digits only.
  whatsappNumber: '923421946568',

  // Pricing (indicative)
  costPerKW: 100000, // panels + inverter + wiring + installation, per kW (structure is priced separately below)
  batteryCostPerKWh: 45000, // lithium battery, per kWh
  tariffPerKWh: 60, // average grid tariff the customer pays
  exportRatePerKWh: 10, // credit for energy exported to the grid (net-metering)

  // Engineering assumptions
  performanceRatio: 0.8, // wiring, heat, dust, inverter losses
  gridEmissionKgPerKWh: 0.45, // approximate CO2 per grid kWh
  batteryRoundTrip: 0.92,
  batteryUsable: 0.9, // usable depth of discharge
  inverterSafetyFactor: 1.25,
  roofSetback: 0.6, // metres kept free along every roof edge
  rowPitch: 2.8, // metres between tilted panel rows (avoids shading)
  panelGap: 0.03,
  // How far a rooftop object's shadow reaches, as a multiple of how much it stands above the panels.
  // Sun is in the south, so the long shadow falls to the north (behind the object).
  shadeNorth: 1.3,
  shadeSide: 0.35,
  accessGap: 0.3, // walkway kept around objects for maintenance
};

/**
 * Mounting structures. Heights are in metres, cost is PKR per kW of panels (indicative).
 * - L2 / L3: low frames bolted to the roof. Panels must keep clear of tanks, rooms, ACs and their shadows.
 *   L3 sits higher, so short objects and parapet walls shade it less.
 * - Elevated: tall steel structure that spans over tanks, ACs and the parapet. Only taller objects
 *   (e.g. a stair room) block it.
 */
export const STRUCTURES = {
  L2: { key: 'L2', label: 'L2 frame', short: 'L2', frontH: 0.15, backFt: 2, costPerKW: 9000, desc: 'Low frame, about 2 ft at the back' },
  L3: { key: 'L3', label: 'L3 frame', short: 'L3', frontH: 0.35, backFt: 3, costPerKW: 12000, desc: 'Raised frame, about 3 ft at the back' },
  elevated: { key: 'elevated', label: 'Elevated structure', short: 'Elevated', frontH: 2.45, backFt: 10, costPerKW: 32000, desc: 'Steel structure 8–10 ft high, spans over tanks and ACs' },
};
export const STRUCTURE_ORDER = ['L2', 'L3', 'elevated'];

/** Things a customer can place on the roof in the 3D editor. Sizes in metres (w = east–west, d = north–south). */
export const ROOF_ITEMS = {
  room: { label: 'Stair room / room', short: 'Room', w: 3, d: 3.4, h: 2.7 },
  tank: { label: 'Water tank', short: 'Tank', w: 1.2, d: 1.2, h: 1.3 },
  ac: { label: 'AC outdoor unit', short: 'AC', w: 0.9, d: 0.4, h: 0.62 },
  geyser: { label: 'Solar geyser', short: 'Geyser', w: 2, d: 1.3, h: 1.4 },
  other: { label: 'Other (dish, store, shed…)', short: 'Other', w: 1, d: 1, h: 1 },
};

/** A typical roof: stair room in the back corner with a tank on top, two AC units. */
export function defaultRoofItems(roof) {
  const W = roof.width; const L = roof.length;
  const room = { id: 'room-1', type: 'room', w: 3, d: 3.4, h: 2.7 };
  room.x = -W / 2 + 0.2 + room.w / 2; room.z = -L / 2 + 0.2 + room.d / 2;
  return [
    room,
    { id: 'tank-1', type: 'tank', x: room.x, z: room.z, w: 1.2, d: 1.2, h: 1.3 },
    { id: 'ac-1', type: 'ac', x: W / 2 - 0.8, z: -L / 2 + 0.45, w: 0.9, d: 0.4, h: 0.62 },
    { id: 'ac-2', type: 'ac', x: W / 2 - 2.05, z: -L / 2 + 0.45, w: 0.9, d: 0.4, h: 0.62 },
  ];
}

export const PANEL_OPTIONS = [
  { watts: 450, width: 1.05, length: 2.09 },
  { watts: 550, width: 1.13, length: 2.28 },
  { watts: 585, width: 1.13, length: 2.38 },
  { watts: 620, width: 1.30, length: 2.38 },
];

export const INVERTER_SIZES = [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50];

// Average daily peak sun hours (approximate, annual average).
export const CITIES = [
  { id: 'peshawar', name: 'Peshawar', sunHours: 5.2, lat: 34.01, lng: 71.58 },
  { id: 'islamabad', name: 'Islamabad / Rawalpindi', sunHours: 5.1, lat: 33.68, lng: 73.05 },
  { id: 'lahore', name: 'Lahore', sunHours: 5.3, lat: 31.55, lng: 74.34 },
  { id: 'karachi', name: 'Karachi', sunHours: 5.6, lat: 24.86, lng: 67.0 },
  { id: 'faisalabad', name: 'Faisalabad', sunHours: 5.4, lat: 31.42, lng: 73.08 },
  { id: 'multan', name: 'Multan', sunHours: 5.6, lat: 30.16, lng: 71.52 },
  { id: 'quetta', name: 'Quetta', sunHours: 6.0, lat: 30.18, lng: 67.0 },
  { id: 'mardan', name: 'Mardan', sunHours: 5.2, lat: 34.2, lng: 72.04 },
  { id: 'abbottabad', name: 'Abbottabad', sunHours: 4.9, lat: 34.15, lng: 73.21 },
  { id: 'swat', name: 'Swat / Mingora', sunHours: 4.8, lat: 34.77, lng: 72.36 },
];

/** Nearest listed city to a GPS position (km). */
export function nearestCity(lat, lng) {
  const R = 6371; const rad = Math.PI / 180;
  let best = CITIES[0]; let bestD = Infinity;
  CITIES.forEach((c) => {
    const dLat = (c.lat - lat) * rad; const dLng = (c.lng - lng) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * rad) * Math.cos(c.lat * rad) * Math.sin(dLng / 2) ** 2;
    const d = 2 * R * Math.asin(Math.sqrt(a));
    if (d < bestD) { bestD = d; best = c; }
  });
  return { city: best, km: bestD };
}

export const DEFAULT_SITE = {
  storeys: 2,
  parapetH: 0.9, // metres
  structure: 'auto', // 'auto' picks the cheapest structure that fits; or 'L2' | 'L3' | 'elevated'
  items: defaultRoofItems({ width: 10, length: 14 }),
};
