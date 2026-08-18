/**
 * 날씨 · 체감 옷차림 · 우산 시간대.
 *
 * Open-Meteo(https://open-meteo.com) — 인증키 불필요, 상업·비상업 모두 무료.
 * "오늘 28도"는 여행자에게 안 와닿는다. 특히 오사카·교토는 여름 습도가 높아
 * 체감온도가 실제 기온보다 훨씬 높게 느껴지는데, 이 격차를 옷차림으로
 * 바로 바꿔주는 것이 목적이다.
 */

export * from './fetch';
export * from './phase';
export * from './clothing';
export * from './conditions';
export * from './risk';
export * from './hazard';
export * from './trends';
