import { STOREY_H, SLAB } from './constants';

export const houseHeight = (site) => site.storeys * STOREY_H + SLAB;
