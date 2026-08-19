/**
 * 교통패스·IC카드 데이터.
 *
 * 도시별 파일을 여기서 합친다. `places/` · `courses/` 와 같은 모양이다.
 * 한 파일에 몰아 두면 도시가 늘 때마다 같은 파일 한가운데를 열게 되고,
 * 여러 도시를 동시에 손볼 때 서로 부딪힌다. 도시를 추가하는 일이 「파일 하나
 * 만들고 여기 한 줄 더하기」로 끝나야 한다.
 *
 * 도시에 속하지 않는 둘은 따로 둔다 — 여러 도시에 걸친 광역 패스(`wide`)와
 * 전국 어디서나 같은 IC카드(`ic-cards`).
 */

import { PassAdvisory, TransitPass, TransitTip } from './types';
import { OSAKA_ADVISORY, OSAKA_PASSES, OSAKA_TIPS } from './osaka';
import { KYOTO_ADVISORY, KYOTO_PASSES, KYOTO_TIPS } from './kyoto';
import { FUKUOKA_ADVISORY, FUKUOKA_PASSES, FUKUOKA_TIPS } from './fukuoka';
import { TOKYO_ADVISORY, TOKYO_PASSES, TOKYO_TIPS } from './tokyo';
import { SAPPORO_ADVISORY, SAPPORO_PASSES, SAPPORO_TIPS } from './sapporo';
import { MATSUYAMA_ADVISORY, MATSUYAMA_PASSES, MATSUYAMA_TIPS } from './matsuyama';
import { TAKAMATSU_ADVISORY, TAKAMATSU_PASSES, TAKAMATSU_TIPS } from './takamatsu';
import { WIDE_PASSES } from './wide';

export * from './types';
export * from './ic-cards';

/*
 * 순서를 바꾸지 않는다. 화면은 `passesForCity` 로 걸러 쓰지만, 한 도시 안의
 * 순서는 그대로 화면 순서가 된다. 광역 패스를 맨 뒤에 두는 것도 원래 그대로다 —
 * 그 도시 전용 패스를 먼저 보고 나서 「더 넓게 다닐 건가」를 따지는 순서다.
 */
export const PASSES: TransitPass[] = [
  ...OSAKA_PASSES,
  ...KYOTO_PASSES,
  ...FUKUOKA_PASSES,
  ...TOKYO_PASSES,
  ...SAPPORO_PASSES,
  ...MATSUYAMA_PASSES,
  ...TAKAMATSU_PASSES,
  ...WIDE_PASSES,
];

export const PASS_ADVISORIES: PassAdvisory[] = [
  TOKYO_ADVISORY,
  KYOTO_ADVISORY,
  OSAKA_ADVISORY,
  FUKUOKA_ADVISORY,
  SAPPORO_ADVISORY,
  MATSUYAMA_ADVISORY,
  TAKAMATSU_ADVISORY,
];

export const TRANSIT_TIPS: TransitTip[] = [
  ...OSAKA_TIPS,
  ...KYOTO_TIPS,
  ...FUKUOKA_TIPS,
  ...TOKYO_TIPS,
  ...SAPPORO_TIPS,
  ...MATSUYAMA_TIPS,
  ...TAKAMATSU_TIPS,
];

/* 장소와 같은 이유로 색인을 미리 만든다 (data/places/index.ts 주석 참고) */
const PASSES_BY_CITY = (() => {
  const map = new Map<string, TransitPass[]>();
  for (const p of PASSES) {
    for (const cityId of p.cityIds) {
      const list = map.get(cityId);
      if (list) list.push(p);
      else map.set(cityId, [p]);
    }
  }
  return map;
})();

const NO_PASSES: TransitPass[] = [];

export function passesForCity(cityId: string): TransitPass[] {
  return PASSES_BY_CITY.get(cityId) ?? NO_PASSES;
}

// ── IC 카드 ────────────────────────────────────────────

export function advisoryForCity(cityId: string): PassAdvisory | undefined {
  return PASS_ADVISORIES.find((a) => a.cityId === cityId);
}

// ── 도시별 이동 요령 ──────────────────────────────────

export function tipsForCity(cityId: string): TransitTip[] {
  return TRANSIT_TIPS.filter((t) => t.cityId === cityId);
}

/** id 로 패스를 찾는다. 관광지 화면에서 뱃지 이름을 얻을 때 쓴다. */
export function findPass(id: string): TransitPass | undefined {
  return PASSES.find((p) => p.id === id);
}

/** 뱃지에 쓸 짧은 이름. 못 찾으면 null 이라 UI가 조용히 건너뛴다. */
export function passShortName(id: string): string | null {
  return findPass(id)?.shortName ?? null;
}
