// Business settings for the Solar Planner.
// All money values are in PKR and are INDICATIVE — update them to your current price list.

export const PLANNER_CONFIG = {
  // Company WhatsApp number in international format, digits only.
  whatsappNumber: '923421946568',

  // Pricing (indicative)
  costPerKW: 110000, // panels + inverter + structure + installation, per kW
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
};

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
  stairRoom: true,
  tank: true,
  acUnits: 2,
  elevated: false,
};
