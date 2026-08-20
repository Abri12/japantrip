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
export interface ExpiringLot {
  credits: number;
  expiresAt: string;
  daysLeft: number;
}

export async function loadServerProfile(): Promise<{
  balance: number;
  lifetimeEarned: number;
  expiring?: ExpiringLot[];
} | null> {
  if (!apiUrl('/api/credits')) return null;
  const me = await authorId();
  const res = await fromServer<{
    balance: number;
    lifetimeEarned: number;
    expiring?: ExpiringLot[];
  }>('/api/credits', { userId: me });
  return res ?? null;
}

/**
 * 소멸을 알려야 하는 시점인가.
 *
 * 공정거래위원회가 2024년 적립식 포인트 개선안에서 정한 것이 **2개월 전 ·
 * 1개월 전 · 3일 전 3회**다(종전에는 15일 전 1회였다). 그 시점들을 그대로
 * 쓴다.
 *
 * 계정이 없어 푸시 명부에 사용자 id 가 없다. 그래서 고지는 **앱을 열었을 때
 * 화면으로** 한다 — 푸시로 보내려면 토큰과 사용자를 묶어야 하는데, 그러면
 * 지진 알림 명부가 「누구인지 아는 명부」가 된다. 고지 하나에 그 성질을
 * 내주지 않는다.
 */
export function expiryNoticeFor(lots: ExpiringLot[] | undefined): ExpiringLot | null {
  if (!lots?.length) return null;
  // 가장 급한 것 하나만 보여준다. 여러 개를 한꺼번에 띄우면 아무것도 안 읽힌다.
  const soonest = lots[0];
  return soonest.daysLeft <= 60 ? soonest : null;
}

/** 고지 문구 — 남은 기간에 따라 말투를 바꾼다 */
export function expiryNoticeMessage(lot: ExpiringLot): string {
  const n = lot.credits.toLocaleString();
  if (lot.daysLeft <= 3) return `${n} 크레딧이 ${lot.daysLeft}일 뒤에 사라져요.`;
  if (lot.daysLeft <= 31) return `${n} 크레딧이 한 달 안에 사라져요.`;
  return `${n} 크레딧이 두 달 안에 사라져요.`;
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

/** 확인을 누른 위치. expo-location 의 coords 를 그대로 넘기면 된다 */
export interface ConfirmFix {
  lat: number;
  lng: number;
  accuracyM: number | null;
}

/**
 * 다른 사용자가 "맞음"을 눌렀을 때.
 *
 * 서버는 머릿수가 아니라 **무게**를 센다. 좌표를 함께 보내면 현장 인증을
 * 시도하고, 통과하면 한 번에 3점이 붙어 대개 그 자리에서 확정된다 — 거기까지
 * 갔다는 것이 이 시스템에서 가장 비싼 증거이기 때문이다.
 *
 * `fix` 는 **선택이다.** 위치를 요구하지 않는다. 안 보내면 원격 확인(1점)이
 * 될 뿐이다 — 위치를 켜야만 참여할 수 있게 만들면 그건 위치 수집의 다른
 * 이름이 된다.
 *
 * 반환값은 이번 확인으로 확정되었는지 여부다. 보류(held)는 확정이 아니므로
 * false 가 나온다.
 */
export async function confirmContribution(id: string, fix?: ConfirmFix): Promise<boolean> {
  /* 서버가 있으면 서버가 판정한다 — 제보자 ≠ 확인자, 1인 1회를 강제한다 */
  const url = apiUrl('/api/contributions/confirm');
  if (url) {
    try {
      const me = await authorId();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, userId: me, ...(fix ?? {}) }),
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
  /** 화면이 다음 행동을 안내할 때 쓴다 (예: not-bound 면 수령처 등록으로 보낸다) */
  reason?: string;
}

/**
 * 거부 사유를 사람 말로.
 *
 * **무엇을 하면 되는지까지 적는다.** 「교환할 수 없어요」만 돌려주면 사용자는
 * 기다리면 되는 건지, 뭘 등록해야 하는 건지, 애초에 모자란 건지 알 수 없다.
 */
function redeemErrorMessage(data: { error?: string; matured?: number; balance?: number }): string {
  switch (data.error) {
    case 'not-bound':
      return '받으실 곳을 먼저 등록해주세요.';
    case 'maturing':
      // 잔액은 있는데 아직 못 쓰는 경우다. 모자란 것과 구분해서 알려준다.
      return '방금 받은 크레딧은 조금 뒤에 쓸 수 있어요. 확인이 끝나면 알려드릴게요.';
    case 'insufficient':
      return '크레딧이 모자라요.';
    case 'unknown-reward':
      // 화면의 가격표와 서버의 가격표가 어긋난 경우다. 사용자 잘못이 아니다.
      return '지금은 교환할 수 없는 상품이에요. 앱을 최신으로 업데이트해주세요.';
    case 'window-limit':
      return '이번 달 교환 한도를 채웠어요. 다음 달에 다시 시도해주세요.';
    case 'cap-outstanding':
    case 'cap-annual':
      return '지금은 교환이 어려워요. 잠시 뒤에 다시 시도해주세요.';
    case 'rate-limited':
      // 서버가 요청 제한으로 막았다. 사용자가 뭘 잘못한 게 아니라 잠깐
      // 기다리면 되는 상황이므로, 그렇다고 분명히 말한다.
      return '잠깐 너무 많이 요청했어요. 몇 초 뒤에 다시 해주세요.';
    default:
      return '교환하지 못했어요. 잠시 뒤에 다시 시도해주세요.';
  }
}

/**
 * 보상을 받을 곳을 등록한다.
 *
 * 이 앱은 회원가입이 없다. 그런데 **익명인 사람에게는 기프티콘을 보낼 수
 * 없다** — 어차피 받을 곳을 적어야 한다. 그 값을 한 사람에 하나로 묶으면,
 * 기기를 여러 개 만들어도 받는 곳이 하나이므로 한 사람분만 나간다.
 *
 * 그래서 이 부담은 **교환할 때만** 생긴다. 정보만 보러 온 사람은 아무것도
 * 내지 않는다. 서버는 해시만 갖고, 실제 발송은 그때의 값으로 한다.
 */
export async function bindPayout(target: string): Promise<{ ok: boolean; message: string }> {
  const url = apiUrl('/api/payout/bind');
  if (!url) return { ok: false, message: '지금은 등록할 수 없어요.' };

  try {
    const me = await authorId();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: me, target }),
    });
    const data = await res.json();
    if (res.ok && data.ok) return { ok: true, message: '등록됐어요.' };

    if (data.error === 'target-taken') {
      return { ok: false, message: '이미 다른 계정에 등록된 번호예요.' };
    }
    if (data.error === 'already-bound') {
      // 바꿀 수 있으면 번호 하나로 계정 여러 개를 차례로 통과시킬 수 있다.
      return { ok: false, message: '이미 등록된 곳이 있어요. 변경은 문의해주세요.' };
    }
    return { ok: false, message: '등록하지 못했어요. 번호를 다시 확인해주세요.' };
  } catch {
    return { ok: false, message: '등록하지 못했어요. 잠시 뒤에 다시 시도해주세요.' };
  }
}

/**
 * 보상 교환.
 *
 * ## 값을 안 보낸다
 *
 * 예전에는 `cost` 를 같이 보냈고 서버가 그 값을 믿고 차감했다. 즉 **클라이언트가
 * 자기 값을 정했다** — `cost: 1` 이면 1크레딧으로 3,000짜리가 나간다. 지금은
 * 무엇을 바꿀지(`rewardId`)만 보내고 얼마인지는 서버가 자기 표에서 찾는다.
 *
 * ## 서버가 없으면 교환하지 않는다
 *
 * 다른 기능은 서버가 없으면 기기에서 처리하고 넘어간다(날씨·지진). 교환은
 * 그러면 안 된다. **크레딧은 지급 의무가 생기는 값**이라, 기기가 자기 잔액을
 * 깎고 「완료됐어요」라고 말해도 실제로 나가는 것은 아무것도 없다. 사용자는
 * 받은 줄 알고 기다리게 된다.
 *
 * 그래서 여기만은 실패를 그대로 말한다. 잔액도 건드리지 않는다 — 서버가
 * 돌아왔을 때 기기 쪽 숫자만 깎여 있으면 그게 더 나쁜 상태다.
 */
export async function redeem(rewardId: string): Promise<RedeemResult> {
  const url = apiUrl('/api/credits/redeem');
  if (!url) {
    return { ok: false, message: '지금은 교환할 수 없어요. 잠시 뒤에 다시 시도해주세요.', reason: 'no-server' };
  }

  try {
    const me = await authorId();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        /*
         * 멱등 키.
         *
         * 네트워크가 끊겨 응답을 못 받으면 사용자는 「실패했나」 싶어 다시
         * 누르는데, 그때 두 번 차감되면 안 된다. 같은 사람이 같은 보상을 같은
         * 순간에 두 번 누르는 것만 막으면 되므로 시간을 초 단위로 끊는다 —
         * 재시도는 합쳐지고, 나중에 다시 교환하는 것은 다른 키가 된다.
         */
        key: `${me}:${rewardId}:${Math.floor(Date.now() / 1000)}`,
        userId: me,
        rewardId,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) return { ok: true, message: '교환이 완료됐어요.' };
    return { ok: false, message: redeemErrorMessage(data), reason: data.error };
  } catch {
    return { ok: false, message: '교환하지 못했어요. 잠시 뒤에 다시 시도해주세요.', reason: 'network' };
  }
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
  /** 곧 소멸할 크레딧 — 화면이 배너로 알린다. 없으면 null */
  expiring: ExpiringLot | null;
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
    expiring: expiryNoticeFor(server?.expiring),
  };
}

/** 개발·시연용 초기화. */
export async function resetAll(): Promise<void> {
  await AsyncStorage.multiRemove([C_KEY, P_KEY]);
}
