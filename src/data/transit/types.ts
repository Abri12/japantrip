/**
 * 도시 내 이동 — 교통패스 · IC카드 · 노선 요령.
 *
 * 공항에서 시내로 들어온 다음이 진짜 문제다. 패스 종류가 많고 커버 범위가 겹치는데,
 * 잘못 사면 본전을 못 뽑는다. 그래서 패스마다 네 가지를 반드시 함께 적는다:
 * **언제 이득인지 · 무엇이 안 되는지 · 어디서 사는지 · 어떻게 쓰는지.**
 * 가격만 나열한 정보는 이미 넘치고, 도움이 안 되는 이유가 이 넷이 빠져서다.
 *
 * 말투는 옆에서 알려주듯 쓴다. 여행 중에 급하게 읽는 글이라
 * 격식보다 이해 속도가 중요하다.
 *
 * 요금·운영 방식은 자주 바뀌므로 항목마다 확인 여부(`verified`)를 남긴다.
 * 확인하지 못한 값은 UI에서 금액 대신 "변동 가능"으로 표시된다.
 */

import { BuyLink } from '@/constants/affiliates';

export type PassScope = 'city' | 'wide';

export interface TransitPass {
  id: string;
  name: string;
  /** 뱃지에 쓰는 짧은 이름. 관광지 목록에서 「주유패스 가능」처럼 보인다 */
  shortName: string;
  nameJa: string;
  /** 적용 도시 (data/cities.ts 의 id) */
  cityIds: string[];
  scope: PassScope;
  tiers: { label: string; yen: number }[];
  /** 무엇을 탈 수 있는지 */
  covers: string[];
  /** 무엇이 안 되는지 — 사고는 대개 여기서 난다 */
  excludes: string[];
  /**
   * 한 줄로 끊은 손익 판단.
   *
   * 이 화면에서 사용자가 하는 질문은 하나다 — **「내가 이걸 사면 이득인가?」**
   * `worthIt` 은 그 답을 문단으로 설명하는데, 문단은 훑을 때 안 읽힌다.
   * 카드 맨 위에서 3초 안에 읽고 넘어갈 한 줄이 따로 필요하다.
   *
   * 「지하철 5번」처럼 **셀 수 있는 기준**으로 적는다. 「많이 타면 이득」은
   * 판단에 아무 도움이 안 된다.
   */
  breakEven: string;
  /** 위의 한 줄을 풀어 쓴 설명 */
  worthIt: string;
  /** 어디서 사는지 */
  whereToBuy: string[];
  /**
   * 온라인 구매 링크. 제휴 추천 ID는 constants/affiliates.ts 에서 붙는다.
   * `productUrl` 을 채우면 검색이 아니라 상품 페이지로 바로 간다.
   */
  buyLinks?: BuyLink[];
  /** 어떻게 쓰는지 — 개찰구·버스에서 실제로 하는 동작 */
  howToUse: string[];
  /** 꼭 알아야 할 함정 */
  caution?: string;
  verified: boolean;
}

export const PASS_CHECKED_AT = '2026년 8월 확인';

export interface IcCard {
  id: string;
  name: string;
  nameJa: string;
  region: string;
  note: string;
}

export interface PassAdvisory {
  cityId: string;
  /** 한 줄 결론. 이것만 읽고 넘어가도 판단이 서야 한다 */
  headline: string;
  /** 왜 그런지 — 도시의 구조에서 오는 이유를 적는다 */
  body: string;
  tone: 'worth' | 'careful';
}

export interface TransitTip {
  cityId: string;
  title: string;
  body: string;
}
