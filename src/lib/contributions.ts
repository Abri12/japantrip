/**
 * 기여 제출 → 교차검증 → 크레딧 확정.
 *
 * 어뷰징 방지의 핵심은 "제출했다고 바로 주지 않는다"는 것 하나다.
 * 다른 사용자 N명이 확인해야 확정되고, 그때 크레딧이 들어온다. 거짓 제보는
 * 확정되지 않으므로 비용만 남는다. 신뢰가 쌓인 상위 등급은 요구 확인 수가
 * 줄어들고, 최고 등급은 즉시 반영된다 — 정확한 사람의 정보가 늦게 반영되면
 * 실시간성이라는 목적 자체가 무너지기 때문이다.
 *
 * 지금은 로컬 저장소 기반 단일 기기 시뮬레이션이다. 운영 단계에서는 확정 판정과
 * 크레딧 원장이 반드시 서버로 가야 한다. 클라이언트가 잔액을 계산하는 한
 * 저장소를 직접 고쳐 크레딧을 만들어낼 수 있기 때문이다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { City, findCity } from '@/data/cities';
import {
  ContributionType,
  confirmationsRequired,
  creditsFor,
  nextTier,
  tierOf,
} from '@/lib/credits';

export type ContributionStatus = 'pending' | 'confirmed' | 'rejected';

export interface Contribution {
  id: string;
  type: ContributionType;
  /** 대상 장소 (data/places.ts 의 id). 도시 단위 제보면 null */
  placeId: string | null;
  cityId: string | null;
  /** 사용자가 적은 내용 */
  note: string;
  createdAt: string;
  status: ContributionStatus;
  /** 지금까지 모인 타인 확인 수 */
  confirmations: number;
  /** 확정에 필요한 확인 수 (제출 시점의 등급으로 고정) */
  confirmationsNeeded: number;
  /** 확정 시 지급될 크레딧 (제출 시점에 계산해 고정) */
  pendingCredits: number;
  withReceipt?: boolean;
}

export interface Profile {
  /** 누적 획득 — 등급 산정 기준. 사용해도 줄지 않는다 */
  lifetimeEarned: number;
  /** 사용 가능 잔액 */
  balance: number;
  /** 교환 완료한 보상 id 목록 */
  redeemed: string[];
}

const EMPTY_PROFILE: Profile = { lifetimeEarned: 0, balance: 0, redeemed: [] };

const C_KEY = 'contributions:v1';
const P_KEY = 'profile:v1';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function loadProfile(): Promise<Profile> {
  return readJson<Profile>(P_KEY, EMPTY_PROFILE);
}

async function writeProfile(p: Profile): Promise<void> {
  await AsyncStorage.setItem(P_KEY, JSON.stringify(p));
}

export async function loadContributions(): Promise<Contribution[]> {
  const all = await readJson<Contribution[]>(C_KEY, []);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function writeContributions(list: Contribution[]): Promise<void> {
  await AsyncStorage.setItem(C_KEY, JSON.stringify(list));
}

/**
 * 기여를 제출한다. 이 시점에는 크레딧이 지급되지 않는다 —
 * 지급량과 필요 확인 수만 계산해 붙여 둔다.
 */
export async function submitContribution(input: {
  type: ContributionType;
  placeId?: string | null;
  cityId?: string | null;
  note?: string;
  withReceipt?: boolean;
}): Promise<Contribution> {
  const profile = await loadProfile();
  const city: City | undefined = input.cityId ? findCity(input.cityId) : undefined;

  const needed = confirmationsRequired(input.type, profile.lifetimeEarned);
  const credits = creditsFor({
    type: input.type,
    lifetimeEarned: profile.lifetimeEarned,
    city,
    withReceipt: input.withReceipt,
  });

  const created: Contribution = {
    id: `${input.type}-${Date.now()}`,
    type: input.type,
    placeId: input.placeId ?? null,
    cityId: input.cityId ?? null,
    note: input.note?.trim() ?? '',
    createdAt: new Date().toISOString(),
    // 요구 확인 수가 0이면(최고 등급) 즉시 확정된다.
    status: needed === 0 ? 'confirmed' : 'pending',
    confirmations: 0,
    confirmationsNeeded: needed,
    pendingCredits: credits,
    withReceipt: input.withReceipt,
  };

  const all = await loadContributions();
  await writeContributions([created, ...all]);

  if (created.status === 'confirmed') {
    await award(credits);
  }

  return created;
}

/**
 * 다른 사용자가 "맞음"을 눌렀을 때. 필요 수를 채우면 확정되고 크레딧이 지급된다.
 *
 * 반환값은 이번 확인으로 확정되었는지 여부다.
 */
export async function confirmContribution(id: string): Promise<boolean> {
  const all = await loadContributions();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return false;

  const target = all[idx];
  if (target.status !== 'pending') return false;

  const confirmations = target.confirmations + 1;
  const confirmed = confirmations >= target.confirmationsNeeded;

  all[idx] = {
    ...target,
    confirmations,
    status: confirmed ? 'confirmed' : 'pending',
  };
  await writeContributions(all);

  if (confirmed) {
    await award(target.pendingCredits);
  }

  return confirmed;
}

/** 거짓으로 판명된 제보. 크레딧은 지급되지 않는다. */
export async function rejectContribution(id: string): Promise<void> {
  const all = await loadContributions();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0 || all[idx].status !== 'pending') return;

  all[idx] = { ...all[idx], status: 'rejected' };
  await writeContributions(all);
}

async function award(credits: number): Promise<void> {
  const p = await loadProfile();
  await writeProfile({
    ...p,
    lifetimeEarned: p.lifetimeEarned + credits,
    balance: p.balance + credits,
  });
}

export interface RedeemResult {
  ok: boolean;
  message: string;
}

/** 보상 교환. 잔액만 차감하고 누적 획득은 건드리지 않는다(등급 유지). */
export async function redeem(rewardId: string, cost: number): Promise<RedeemResult> {
  const p = await loadProfile();

  if (p.balance < cost) {
    return {
      ok: false,
      message: `${(cost - p.balance).toLocaleString()} 크레딧이 더 필요해요.`,
    };
  }

  await writeProfile({
    ...p,
    balance: p.balance - cost,
    redeemed: [...p.redeemed, rewardId],
  });

  return { ok: true, message: '교환이 완료됐어요.' };
}

export interface ProfileSummary extends Profile {
  tierName: string;
  tierEmoji: string;
  multiplier: number;
  /** 다음 등급까지 남은 누적 획득량. 최고 등급이면 null */
  toNextTier: number | null;
  nextTierName: string | null;
  pendingCount: number;
  confirmedCount: number;
}

export async function loadSummary(): Promise<ProfileSummary> {
  const [profile, contributions] = await Promise.all([
    loadProfile(),
    loadContributions(),
  ]);

  const tier = tierOf(profile.lifetimeEarned);
  const next = nextTier(profile.lifetimeEarned);

  return {
    ...profile,
    tierName: tier.name,
    tierEmoji: tier.emoji,
    multiplier: tier.multiplier,
    toNextTier: next ? next.threshold - profile.lifetimeEarned : null,
    nextTierName: next?.name ?? null,
    pendingCount: contributions.filter((c) => c.status === 'pending').length,
    confirmedCount: contributions.filter((c) => c.status === 'confirmed').length,
  };
}

/** 개발·시연용 초기화. */
export async function resetAll(): Promise<void> {
  await AsyncStorage.multiRemove([C_KEY, P_KEY]);
}
