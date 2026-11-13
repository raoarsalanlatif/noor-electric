import {
  faSnowflake, faFan, faLightbulb, faTv, faDroplet, faShirt, faLaptop,
  faTemperatureHigh, faSoap, faWind, faIcicles, faFireBurner, faBolt,
} from '@fortawesome/free-solid-svg-icons';

// watts = rated power, duty = average fraction of time actually drawing that power while "on".
// profile = when during the day the appliance is normally used.
export const APPLIANCES = [
  { id: 'ac15', name: 'AC 1.5 ton', note: 'non-inverter', watts: 1800, duty: 0.75, hours: 8, profile: 'cooling', icon: faSnowflake },
  { id: 'ac15inv', name: 'AC 1.5 ton', note: 'inverter', watts: 1300, duty: 0.55, hours: 8, profile: 'cooling', icon: faSnowflake },
  { id: 'ac1', name: 'AC 1 ton', note: 'non-inverter', watts: 1200, duty: 0.75, hours: 8, profile: 'cooling', icon: faSnowflake },
  { id: 'cooler', name: 'Air cooler', watts: 200, duty: 1, hours: 10, profile: 'day', icon: faWind },
  { id: 'fan', name: 'Ceiling fan', watts: 80, duty: 1, hours: 16, profile: 'allday', icon: faFan },
  { id: 'light', name: 'LED light', watts: 15, duty: 1, hours: 7, profile: 'evening', icon: faLightbulb },
  { id: 'fridge', name: 'Refrigerator', watts: 250, duty: 0.4, hours: 24, profile: 'allday', icon: faIcicles },
  { id: 'freezer', name: 'Deep freezer', watts: 300, duty: 0.45, hours: 24, profile: 'allday', icon: faIcicles },
  { id: 'tv', name: 'TV', watts: 120, duty: 1, hours: 6, profile: 'evening', icon: faTv },
  { id: 'pc', name: 'Laptop / PC', watts: 150, duty: 1, hours: 8, profile: 'day', icon: faLaptop },
  { id: 'motor', name: 'Water motor 1 hp', watts: 750, duty: 1, hours: 1, profile: 'morning', icon: faDroplet },
  { id: 'iron', name: 'Iron', watts: 1000, duty: 0.5, hours: 0.5, profile: 'morning', icon: faShirt },
  { id: 'washer', name: 'Washing machine', watts: 500, duty: 0.6, hours: 1, profile: 'day', icon: faSoap },
  { id: 'microwave', name: 'Microwave / oven', watts: 1200, duty: 0.8, hours: 0.5, profile: 'evening', icon: faFireBurner },
  { id: 'geyser', name: 'Electric geyser', watts: 2000, duty: 0.6, hours: 1.5, profile: 'morning', icon: faTemperatureHigh },
  { id: 'other', name: 'Other load', watts: 500, duty: 1, hours: 4, profile: 'day', icon: faBolt },
];

export const APPLIANCE_MAP = Object.fromEntries(APPLIANCES.map((a) => [a.id, a]));

// Hours of the day (0–23) each profile uses, in order of priority.
// 'allday' is spread evenly; the others are filled hour by hour in this order.
export const PROFILES = {
  allday: Array.from({ length: 24 }, (_, i) => i),
  day: [12, 13, 11, 14, 10, 15, 9, 16, 17],
  morning: [7, 6, 8],
  evening: [19, 20, 21, 18, 22, 23],
  cooling: [14, 15, 13, 16, 23, 0, 1, 2, 3, 22, 4, 5, 12, 17, 21, 6],
};

// A typical Pakistani home as a starting point.
export const DEFAULT_LOAD = {
  ac15: { qty: 2, hours: 8 },
  fan: { qty: 6, hours: 16 },
  light: { qty: 12, hours: 7 },
  fridge: { qty: 1, hours: 24 },
  tv: { qty: 1, hours: 6 },
  motor: { qty: 1, hours: 1 },
  iron: { qty: 1, hours: 0.5 },
  pc: { qty: 1, hours: 6 },
};
