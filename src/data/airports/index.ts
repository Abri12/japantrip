import { Airport, CityHub, HubWay } from './types';
import { NRT } from './nrt';
import { HND } from './hnd';
import { KIX } from './kix';
import { FUK } from './fuk';
import { CTS } from './cts';
import { NGO } from './ngo';
import { OKA } from './oka';
import { MYJ } from './myj';
import { TAK } from './tak';

export * from './types';
export * from './regions';

export const AIRPORTS: Airport[] = [
  NRT,
  HND,
  KIX,
  FUK,
  CTS,
  NGO,
  OKA,
  MYJ,
  TAK,
];

export function airportsByRegion(regionId: string): Airport[] {
  return AIRPORTS.filter((a) => a.region === regionId);
}

export function findAirport(id: string): Airport | undefined {
  return AIRPORTS.find((a) => a.id === id);
}

/** 데이터 기준 시점. UI에 노출해 사용자가 신선도를 판단하게 한다. */
export const FARE_BASELINE = '2026년 8월 기준';

/**
 * 그 도시에 묵는 사람이 쓸 거점.
 *
 * 공항 하나가 여러 도시의 관문일 때 답이 갈린다. 간사이공항은 오사카와 교토가
 * 같이 쓰는데, 오사카는 난카이 공항급행 45분 970엔이고 교토는 하루카 80분
 * 3,640엔이다. 그래서 「이 공항의 추천 노선」만으로는 답이 안 된다 —
 * **어느 도시에 묵느냐**를 같이 물어야 한다.
 *
 * 못 찾으면 첫 거점으로 떨어진다. 거점 순서가 「묵는 사람이 많은 순」이라
 * 아무 것도 모를 때 가장 덜 틀리는 선택이다.
 */
export function hubForCity(airport: Airport, cityId?: string): CityHub | undefined {
  if (!airport.hubs?.length) return undefined;
  return airport.hubs.find((h) => h.cityId === cityId) ?? airport.hubs[0];
}

/**
 * 그 도시 기준으로 「가장 무난한 가는 법」 한 가지.
 *
 * 화면 여러 곳이 「추천 · ○○ 45분 ¥970」 한 줄을 보여주는데, 그 값을 각자
 * `airport.routes` 에서 집으면 도시가 바뀌어도 답이 안 바뀐다. 한 곳에서
 * 답하게 모아 둔다.
 */
export function bestWayForCity(airport: Airport, cityId?: string): HubWay | undefined {
  const hub = hubForCity(airport, cityId);
  if (!hub?.ways.length) return undefined;
  return hub.ways.find((w) => w.recommended) ?? hub.ways[0];
}
