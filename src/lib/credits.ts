/**
 * 크레딧 경제 — 획득(Earn)과 사용(Burn).
 *
 * 설계 원칙 셋:
 *
 * 1. **수고에 비례해서 지급한다.** 폐업 신고 한 번과 영수증 인증 리뷰는 품이
 *    다르고, 데이터로서의 가치도 다르다. 같은 보상을 주면 쉬운 것만 쌓인다.
 * 2. **크레딧은 교차검증 통과 후에 지급한다.** 제출 즉시 주면 거짓 제보가
 *    곧바로 돈이 된다. 지급 시점을 검증 뒤로 미루는 것만으로 어뷰징 기대수익이
 *    크게 떨어진다. (lib/contributions.ts)
 * 3. **여행 중에 쓸 수 있어야 한다.** 귀국 후에만 쓸 수 있으면 여행 중 기여
 *    동기가 약하다. 그래서 eSIM·공항 티켓처럼 현지에서 즉시 체감되는 소비처를
 *    앞에 둔다. 남은 크레딧의 기프티콘 전환은 귀국 후 리텐션 장치다.
 */

import { City } from '@/data/cities';

export type Difficulty = '하' | '중' | '상';

export type ContributionType =
  /** 폐업 · 영업시간 변경 신고 */
  | 'closure'
  /** 한국어 메뉴판 사진 */
  | 'menu_photo'
  /** 위치 인증 리뷰 (영수증 첨부 시 가산) */
  | 'verified_review'
  /** 실시간 현장 제보 — 대기줄, 입장 마감 등 */
  | 'live_report';

export interface ContributionSpec {
  type: ContributionType;
  label: string;
  description: string;
  difficulty: Difficulty;
  /** 기본 지급량. 등급 배율과 도시 배율이 곱해진다 */
  baseCredits: number;
  /** 확정에 필요한 타 사용자 확인 수 (등급에 따라 완화된다) */
  baseConfirmations: number;
  /** 이 기여가 데이터에 남기는 효과 */
  effect: string;
}

export const CONTRIBUTIONS: ContributionSpec[] = [
  {
    type: 'closure',
    label: '폐업 · 영업시간 변경 신고',
    description: '문 닫았거나 영업시간이 바뀐 곳을 알려 주세요.',
    difficulty: '하',
    baseCredits: 10,
    baseConfirmations: 3,
    effect: '구글맵보다 빠른 최신 영업 정보 유지',
  },
  {
    type: 'menu_photo',
    label: '한국어 메뉴판 사진',
    description: '메뉴판을 찍어 올리면 다음 사람이 주문할 수 있어요.',
    difficulty: '중',
    baseCredits: 30,
    baseConfirmations: 2,
    effect: '언어 장벽 해소 · 메뉴판 DB 축적',
  },
  {
    type: 'live_report',
    label: '실시간 현장 제보',
    description: '대기줄, 입장 마감, 임시 휴업 등 지금 상황을 알려 주세요.',
    difficulty: '상',
    baseCredits: 80,
    baseConfirmations: 2,
    effect: '실시간성 확보 · 체류 시간 증가',
  },
  {
    type: 'verified_review',
    label: '위치 인증 맛집 리뷰',
    description: '현장에서 작성한 리뷰. 영수증을 함께 올리면 보상이 올라갑니다.',
    difficulty: '상',
    baseCredits: 100,
    baseConfirmations: 1,
    effect: '어뷰징 없는 고품질 평점 데이터',
  },
];

export function findContribution(type: ContributionType): ContributionSpec {
  const spec = CONTRIBUTIONS.find((c) => c.type === type);
  if (!spec) throw new Error(`알 수 없는 기여 유형: ${type}`);
  return spec;
}

/** 영수증까지 첨부한 리뷰에 붙는 가산 배율. */
export const RECEIPT_BONUS = 1.5;

// ── 등급 ───────────────────────────────────────────────

export interface Tier {
  id: string;
  name: string;
  emoji: string;
  /** 이 등급에 진입하는 누적 획득 크레딧 */
  threshold: number;
  /** 지급 배율 */
  multiplier: number;
  /**
   * 교차검증 요구치 감면. 신뢰가 쌓인 사용자의 제보를 매번 3명이 확인하게 하면
   * 정보 반영이 너무 늦다. 최고 등급은 즉시 반영한다.
   */
  confirmationsRelief: number;
  perk: string;
}

export const TIERS: Tier[] = [
  {
    id: 'sprout',
    name: '새싹',
    emoji: '🌱',
    threshold: 0,
    multiplier: 1.0,
    confirmationsRelief: 0,
    perk: '기본 적립',
  },
  {
    id: 'guide',
    name: '길잡이',
    emoji: '🧭',
    threshold: 300,
    multiplier: 1.1,
    confirmationsRelief: 0,
    perk: '10% 더 받아요',
  },
  {
    id: 'explorer',
    name: '탐험가',
    emoji: '🗺️',
    threshold: 1500,
    multiplier: 1.25,
    confirmationsRelief: 1,
    perk: '25% 더 받고, 더 빨리 반영돼요',
  },
  {
    id: 'local',
    name: '로컬 가이드',
    emoji: '🏅',
    threshold: 5000,
    multiplier: 1.5,
    confirmationsRelief: 99,
    perk: '50% 더 받고, 바로 반영돼요',
  },
];

export function tierOf(lifetimeEarned: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (lifetimeEarned >= t.threshold) current = t;
  }
  return current;
}

export function nextTier(lifetimeEarned: number): Tier | null {
  return TIERS.find((t) => t.threshold > lifetimeEarned) ?? null;
}

/**
 * 실제 지급량.
 *
 * 기본량 × 등급 배율 × 도시 배율 × (영수증 가산). 도시 배율을 곱하는 이유는
 * 데이터가 얇은 소도시일수록 한 건의 기여가 더 귀하기 때문이다 —
 * 보상을 지역별로 기울여 자연스럽게 빈 곳을 메우게 한다.
 */
export function creditsFor(options: {
  type: ContributionType;
  lifetimeEarned: number;
  city?: City;
  withReceipt?: boolean;
}): number {
  const spec = findContribution(options.type);
  const tier = tierOf(options.lifetimeEarned);
  const cityMult = options.city?.contributionMultiplier ?? 1;
  const receiptMult =
    options.type === 'verified_review' && options.withReceipt ? RECEIPT_BONUS : 1;

  return Math.round(spec.baseCredits * tier.multiplier * cityMult * receiptMult);
}

/** 이 사용자의 제보를 확정하는 데 필요한 타인 확인 수. */
export function confirmationsRequired(
  type: ContributionType,
  lifetimeEarned: number,
): number {
  const spec = findContribution(type);
  const tier = tierOf(lifetimeEarned);
  return Math.max(0, spec.baseConfirmations - tier.confirmationsRelief);
}

// ── 사용처 ─────────────────────────────────────────────

export type RewardKind = 'travel' | 'transport' | 'cashout';

export interface Reward {
  id: string;
  name: string;
  detail: string;
  cost: number;
  kind: RewardKind;
  /** 여행 중에 쓰는 것인지, 귀국 후에 쓰는 것인지 */
  timing: '여행 중' | '귀국 후';
}

export const REWARD_KIND_LABEL: Record<RewardKind, string> = {
  travel: '여행 필수품',
  transport: '공항 · 교통',
  cashout: '귀국 후 전환',
};

export const REWARDS: Reward[] = [
  {
    id: 'esim-1gb',
    name: 'eSIM 데이터 1GB 쿠폰',
    detail: '일본 현지 데이터. 도착하면 바로 쓸 수 있어요.',
    cost: 500,
    kind: 'travel',
    timing: '여행 중',
  },
  {
    id: 'donki',
    name: '돈키호테 할인 바우처',
    detail: '제휴 매장에서 사용 가능한 모바일 할인권.',
    cost: 800,
    kind: 'travel',
    timing: '여행 중',
  },
  {
    id: 'skyliner',
    name: '스카이라이너 할인',
    detail: '나리타 ↔ 도쿄 티켓 구매 시 크레딧을 현금처럼 차감합니다.',
    cost: 1200,
    kind: 'transport',
    timing: '여행 중',
  },
  {
    id: 'limousine',
    name: '공항 리무진 버스 할인',
    detail: '주요 공항 리무진 노선에 쓸 수 있어요.',
    cost: 1000,
    kind: 'transport',
    timing: '여행 중',
  },
  {
    id: 'naverpay',
    name: '네이버페이 포인트 전환',
    detail: '남은 크레딧을 귀국 후 포인트로 바꿉니다.',
    cost: 2000,
    kind: 'cashout',
    timing: '귀국 후',
  },
  {
    id: 'starbucks',
    name: '스타벅스 기프티콘',
    detail: '여행이 끝난 뒤에도 남은 크레딧을 쓸 수 있어요.',
    cost: 3000,
    kind: 'cashout',
    timing: '귀국 후',
  },
];
