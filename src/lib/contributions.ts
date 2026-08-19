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

import { apiUrl, fromServer } from '@/lib/api';
import { authorId } from '@/lib/author';

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

/**
 * 잔액을 서버에서 읽는다.
 *
 * 서버가 있으면 **그쪽이 유일한 사본**이다. 크레딧은 eSIM·티켓으로 교환되는
 * 금전적 가치라, 기기가 자기 잔액을 계산하는 구조로는 켤 수 없다 — 저장소
 * 파일 하나 고쳐서 무한히 만들 수 있다.
 *
 * 여기서 받은 값은 **표시용 캐시**다. 화면이 잠깐 옛 잔액을 보여주는 건
 * 괜찮지만, 그 값으로 교환 가능 여부를 판정하지는 않는다 — 그건 서버가 한다.
 */
export async function loadServerProfile(): Promise<{
  balance: number;
  lifetimeEarned: number;
} | null> {
  if (!apiUrl('/api/credits')) return null;
  const me = await authorId();
  const res = await fromServer<{ balance: number; lifetimeEarned: number }>('/api/credits', {
    userId: me,
  });
  return res ?? null;
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

  /*
   * 서버가 있으면 서버에 남긴다.
   *
   * 교차검증은 「다른 사람이 확인했다」는 사실이 전부인 장치라, 판정이 제보자
   * 기기 안에 있으면 아무 의미가 없다. 지금까지는 같은 기기에서 자기 제보를
   * 자기가 확인할 수 있었다 — 단일 기기 시뮬레이션이라 그렇게 열어 뒀던 것이다.
   */
  const url = apiUrl('/api/contributions');
  if (url) {
    try {
      const me = await authorId();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: me,
          type: input.type,
          placeId: input.placeId ?? null,
          cityId: input.cityId ?? null,
          note: input.note ?? '',
          credits,
          needed,
        }),
      });
      const data = await res.json();
      if (res.ok && data.contribution) return data.contribution as Contribution;
      // 반려가 쌓여 정지된 경우도 여기로 온다. 로컬에 쌓아 두면 서버와
      // 어긋나므로 그대로 던진다.
      throw new Error(String(data.error ?? 'failed'));
    } catch (err) {
      if (err instanceof Error && err.message === 'suspended') throw err;
      // 그 외에는 서버 장애로 보고 로컬에 남긴다
    }
  }

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
  /* 서버가 있으면 서버가 판정한다 — 제보자 ≠ 확인자, 1인 1회를 강제한다 */
  const url = apiUrl('/api/contributions/confirm');
  if (url) {
    try {
      const me = await authorId();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, userId: me }),
      });
      const data = await res.json();
      return res.ok && data.contribution?.status === 'confirmed';
    } catch {
      return false;
    }
  }

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
  /*
   * 서버가 있으면 서버가 차감한다.
   *
   * **멱등 키를 함께 보낸다.** 네트워크가 끊겨 응답을 못 받으면 사용자는
   * 「실패했나」 싶어 다시 누르는데, 그때 두 번 차감되면 안 된다. 서버는
   * 같은 키를 이미 처리했으면 그 결과를 그대로 돌려준다.
   */
  const url = apiUrl('/api/credits/redeem');
  if (url) {
    try {
      const me = await authorId();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          // 같은 사람이 같은 보상을 같은 순간에 두 번 누르는 것만 막으면 된다.
          // 시간을 초 단위로 끊어 재시도는 합치고, 나중에 다시 교환하는 것은
          // 다른 키가 되게 한다.
          key: `${me}:${rewardId}:${Math.floor(Date.now() / 1000)}`,
          userId: me,
          rewardId,
          cost,
        }),
      });
      const data = await res.json();
      if (data.error === 'insufficient') {
        return { ok: false, message: '크레딧이 모자라요.' };
      }
      if (res.ok && data.ok) return { ok: true, message: '교환이 완료됐어요.' };
      return { ok: false, message: '교환하지 못했어요. 잠시 뒤에 다시 시도해주세요.' };
    } catch {
      // 서버가 없거나 죽었다 — 아래 로컬로 떨어진다
    }
  }

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

/**
 * 화면에 보여줄 요약.
 *
 * 서버가 있으면 잔액·누적을 서버 값으로 덮는다. 기기에 쌓인 값은 서버가
 * 없을 때만 쓰는 폴백이고, 둘이 다르면 **서버가 맞다** — 잔액의 유일한
 * 사본은 원장이다.
 */
export async function loadSummary(): Promise<ProfileSummary> {
  const [local, contributions, server] = await Promise.all([
    loadProfile(),
    loadContributions(),
    loadServerProfile(),
  ]);

  /* 서버가 있으면 잔액과 누적은 서버 값이 맞다. 등급도 그 값으로 매긴다 —
     기기 값으로 등급을 내면 저장소를 고쳐 등급을 올릴 수 있다. */
  const profile: Profile = server
    ? { ...local, balance: server.balance, lifetimeEarned: server.lifetimeEarned }
    : local;

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
