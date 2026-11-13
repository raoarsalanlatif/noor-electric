// Business settings for the Solar Planner.
// All money values are in PKR and are INDICATIVE — update them to your current price list.

export const PLANNER_CONFIG = {
  // Replace with the company WhatsApp number in international format, digits only (e.g. 923001234567).
  whatsappNumber: '923000000000',

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
  { id: 'lahore', name: 'Lahore', sunHours: 5.3 },
  { id: 'karachi', name: 'Karachi', sunHours: 5.6 },
  { id: 'islamabad', name: 'Islamabad / Rawalpindi', sunHours: 5.1 },
  { id: 'faisalabad', name: 'Faisalabad', sunHours: 5.4 },
  { id: 'multan', name: 'Multan', sunHours: 5.6 },
  { id: 'peshawar', name: 'Peshawar', sunHours: 5.2 },
  { id: 'quetta', name: 'Quetta', sunHours: 6.0 },
];
