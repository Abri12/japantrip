/**
 * 공항 상세 화면의 조각들.
 *
 * 라우트(`app/airport/[id].tsx`)는 여기서만 가져간다. 조각끼리는 서로를
 * 직접 import 한다 — 배럴을 거치면 순환 참조가 생긴다.
 *
 * 구역(`*-section`)과 카드(`*-card`)를 나눠 뒀다. 구역은 라우트가 조립하는
 * 단위고, 카드는 구역 안에서 반복되는 단위다.
 */

// 구역 — 라우트가 조립한다
export * from './access-section';
export * from './contactless-section';
export * from './fare-disclaimer';
export * from './other-options-section';
export * from './other-routes-section';
export * from './return-trip-section';
export * from './tips-section';

// 상태
export * from './use-airport-detail';

// 조각 — 구역 안에서 쓰인다
export * from './constants';
export * from './contactless-card';
export * from './hub-picker';
export * from './last-train-info';
export * from './metrics';
export * from './other-option-card';
export * from './route-steps';
export * from './route-stops';
export * from './styles';
export * from './transit-card';
