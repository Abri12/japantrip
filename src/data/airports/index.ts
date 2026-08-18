export * from './types';
export * from './regions';

import { Airport } from './types';
import { NRT } from './nrt';
import { HND } from './hnd';
import { KIX } from './kix';
import { FUK } from './fuk';
import { CTS } from './cts';
import { NGO } from './ngo';
import { OKA } from './oka';

export const AIRPORTS: Airport[] = [
  NRT,
  HND,
  KIX,
  FUK,
  CTS,
  NGO,
  OKA,
];

export function airportsByRegion(regionId: string): Airport[] {
  return AIRPORTS.filter((a) => a.region === regionId);
}

export function findAirport(id: string): Airport | undefined {
  return AIRPORTS.find((a) => a.id === id);
}

/** 데이터 기준 시점. UI에 노출해 사용자가 신선도를 판단하게 한다. */
export const FARE_BASELINE = '2026년 8월 기준';
