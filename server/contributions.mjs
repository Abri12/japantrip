/**
 * 기여 교차검증 — 「다른 사람이 확인했다」를 서버가 보증한다.
 *
 * ## 왜 서버여야 하나
 *
 * 교차검증은 **다른 사람이 확인했다는 사실 자체가 전부**인 장치다. 그 판정이
 * 제보자 기기 안에 있으면 아무 의미가 없다 — 지금까지는 같은 기기에서 자기
 * 제보를 자기가 확인할 수 있었다(단일 기기 시뮬레이션이라 그렇게 열어 뒀다).
 *
 * 서버가 강제하는 것은 셋이다.
 *
 *   제보자 ≠ 확인자      자기 것을 자기가 확인할 수 없다
 *   확인자 1인 1회        같은 사람이 여러 번 눌러도 한 번으로 센다
 *   지급은 확정 시점에    원장에 쌓는 것과 상태를 바꾸는 것이 한 자리에서 일어난다
 *
 * ## 확인을 세지 않고 **무게를 잰다**
 *
 * 계정이 없는 구조라 「확인자 N명」은 기기 N대로 만들 수 있다. 그래서 머릿수
 * 대신 무게를 쓴다 — 현장에서 누른 확인은 3, 원격은 1, 담합으로 의심되는
 * 관계는 0. `confirmationsNeeded` 는 이제 **필요한 무게**다.
 *
 * 무게를 매기는 규칙은 anti-collusion.mjs 에 있다. 이 파일은 그 값을 받아
 * 쌓기만 한다.
 *
 * ## 보류라는 상태
 *
 * 무게가 찼는데 모인 확인이 죄다 수상하면 `held` 로 둔다. 지급은 하지 않고
 * 운영자가 본다. **거부가 아니다** — 휴리스틱만으로 사람의 노동을 떼먹으면
 * 안 된다.
 *
 * ## 반려가 쌓이면 제재한다
 *
 * 확인만 있고 반려에 대가가 없으면, 아무 말이나 올려 두고 통과하기를 기다리는
 * 쪽이 이득이 된다. 반려가 임계를 넘은 사람은 새 제보를 받지 않는다.
 */

import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import { lifetimeEarnedOf, post } from './ledger.mjs';
import { checkAt } from './geo.mjs';
import { shouldHold, weighConfirmation } from './anti-collusion.mjs';

import { saver } from './store.mjs';

const FILE = process.env.CONTRIBUTIONS_FILE ?? join(process.cwd(), '.data', 'contributions.json');

/** 이 수를 넘게 반려당하면 새 제보를 받지 않는다 */
const REJECT_LIMIT = 3;

/** @type {{items: object[]}} */
let db = { items: [] };
let loaded = false;

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    db = JSON.parse(await readFile(FILE, 'utf8'));
    db.items ??= [];
    console.log(`[contrib] ${db.items.length}건 불러옴`);
  } catch {
    // 첫 실행이다
  }
}

const store = saver('contrib', FILE, () => db);

/** 저장은 미뤄서 몰아 쓴다. 안전하게 쓰는 방법은 store.mjs 에 있다 */
function scheduleSave() {
  store.schedule();
}

/** 이 기여에 모인 무게 */
function weightOf(item) {
  return (item.confirms ?? []).reduce((n, c) => n + (c.weight ?? 0), 0);
}

/**
 * 밖으로 내보낼 형태.
 *
 * 확인자 목록과 무게 계산 근거는 뗀다. 누가 확인했는지는 남에게 보일 이유가
 * 없고, **어떤 확인이 0점이었는지를 보여주면 그건 공격자에게 주는 설명서**가
 * 된다. 사용자에게는 진행도만 보인다.
 */
function strip(c, viewerId) {
  const { confirms = [], authorId, authorNet: _n, holdReason: _h, ...rest } = c;
  const weight = weightOf(c);
  return {
    ...rest,
    // 화면의 진행 표시에 쓴다. 머릿수가 아니라 무게다.
    confirmations: Math.min(weight, c.confirmationsNeeded),
    mine: authorId === viewerId,
    // 내가 이미 확인했는지 — 버튼을 잠그는 데 쓴다
    confirmedByMe: confirms.some((x) => x.by === viewerId),
  };
}

export async function submit({ authorId, type, placeId, cityId, note, credits, needed, net }) {
  await load();
  if (!authorId || !type) return { error: 'invalid' };

  const rejected = db.items.filter((c) => c.authorId === authorId && c.status === 'rejected').length;
  if (rejected >= REJECT_LIMIT) return { error: 'suspended' };

  const item = {
    id: randomUUID(),
    authorId,
    // 제보자의 회선. 확인자가 같은 회선인지 보는 데만 쓰고 원본 IP 는 남기지 않는다.
    authorNet: net ?? null,
    type,
    placeId: placeId ?? null,
    cityId: cityId ?? null,
    note: String(note ?? '').trim().slice(0, 500),
    createdAt: new Date().toISOString(),
    // 요구 무게가 0이면(최고 등급) 바로 확정된다
    status: needed === 0 ? 'confirmed' : 'pending',
    confirmationsNeeded: needed,
    pendingCredits: credits,
    confirms: [],
    holdReason: null,
  };

  db.items.push(item);
  scheduleSave();

  if (item.status === 'confirmed') {
    await post({
      key: `contrib:${item.id}`,
      userId: authorId,
      delta: credits,
      reason: 'contribution',
      ref: item.id,
    });
  }

  return { contribution: strip(item, authorId) };
}

/**
 * 「맞아요」를 누른다.
 *
 * 머릿수가 아니라 **무게**를 쌓는다. 좌표를 함께 보내면 현장 인증을 시도하고,
 * 통과하면 3점이 붙는다 — 거기까지 갔다는 것이 이 시스템에서 가장 비싼 증거다.
 *
 * 확정되는 순간 원장에 지급 줄이 쌓인다. 멱등 키가 기여 id 라서, 어떤 경로로
 * 이 함수가 두 번 불려도 지급은 한 번만 일어난다.
 */
export async function confirm(id, viewerId, opts = {}) {
  await load();
  const item = db.items.find((c) => c.id === id);
  if (!item) return { error: 'not-found' };
  if (item.status !== 'pending') return { error: 'not-pending' };

  // 교차검증의 전부다 — 자기 것을 자기가 확인할 수 없다.
  if (item.authorId === viewerId) return { error: 'self' };
  item.confirms ??= [];
  if (item.confirms.some((c) => c.by === viewerId)) return { error: 'already' };

  /*
   * 현장 인증은 **좌표를 보냈을 때만** 시도한다.
   *
   * 위치를 요구하지는 않는다. 안 보내면 원격 확인(1점)이 될 뿐이다 — 위치를
   * 켜야만 참여할 수 있게 만들면 그건 위치 수집의 다른 이름이 된다.
   */
  let onSite = false;
  let distanceM = null;
  if (item.placeId && opts.lat !== undefined && opts.lat !== null) {
    const v = checkAt(item.placeId, opts.lat, opts.lng, opts.accuracyM ?? null);
    onSite = v.ok;
    distanceM = v.distanceM;
  }

  const { weight, flags } = weighConfirmation({
    items: db.items,
    item,
    viewerId,
    onSite,
    net: opts.net ?? null,
  });

  item.confirms.push({
    by: viewerId,
    at: new Date().toISOString(),
    onSite,
    distanceM,
    net: opts.net ?? null,
    weight,
    flags,
  });

  if (weightOf(item) >= item.confirmationsNeeded) {
    const hold = shouldHold(item);
    if (hold) {
      // 무게는 찼지만 사람이 한 번 본다. 지급은 아직 없다.
      item.status = 'held';
      item.holdReason = hold;
    } else {
      item.status = 'confirmed';
      await post({
        key: `contrib:${item.id}`,
        userId: item.authorId,
        delta: item.pendingCredits,
        reason: 'contribution',
        ref: item.id,
      });
    }
  }

  scheduleSave();
  return { contribution: strip(item, viewerId) };
}

/**
 * 보류를 푼다 — 운영자용.
 *
 * 보류는 「의심스럽다」이지 「거짓이다」가 아니다. 사람이 보고 문제가 없으면
 * 여기서 확정하고 지급한다. 멱등 키가 같으므로 두 번 눌러도 한 번만 나간다.
 */
export async function release(id) {
  await load();
  const item = db.items.find((c) => c.id === id);
  if (!item) return { error: 'not-found' };
  if (item.status !== 'held') return { error: 'not-held' };

  item.status = 'confirmed';
  item.holdReason = null;
  await post({
    key: `contrib:${item.id}`,
    userId: item.authorId,
    delta: item.pendingCredits,
    reason: 'contribution',
    ref: item.id,
  });
  scheduleSave();
  return { contribution: strip(item, item.authorId) };
}

/** 보류 중인 건 — 운영자가 봐야 하는 목록 */
export async function listHeld() {
  await load();
  return db.items
    .filter((c) => c.status === 'held')
    .map((c) => ({
      id: c.id,
      type: c.type,
      placeId: c.placeId,
      cityId: c.cityId,
      note: c.note,
      createdAt: c.createdAt,
      credits: c.pendingCredits,
      holdReason: c.holdReason,
      // 운영자는 근거를 봐야 판단할 수 있다. 이 목록은 밖으로 나가지 않는다.
      confirms: c.confirms.map((x) => ({ onSite: x.onSite, weight: x.weight, flags: x.flags })),
    }));
}

export async function reject(id, viewerId) {
  await load();
  const item = db.items.find((c) => c.id === id);
  if (!item) return { error: 'not-found' };
  if (item.status !== 'pending') return { error: 'not-pending' };
  if (item.authorId === viewerId) return { error: 'self' };

  item.status = 'rejected';
  scheduleSave();
  return { contribution: strip(item, viewerId) };
}

/** 내 제보 목록 */
export async function listMine(authorId) {
  await load();
  return db.items
    .filter((c) => c.authorId === authorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => strip(c, authorId));
}

/**
 * 확인을 기다리는 남의 제보.
 *
 * 내 것과 이미 확인한 것은 빼고 준다 — 눌러 봤자 거부당할 항목을 목록에
 * 두면 그건 기능이 아니라 함정이다.
 */
export async function listPending(viewerId, limit = 20) {
  await load();
  return db.items
    .filter(
      (c) =>
        c.status === 'pending' &&
        c.authorId !== viewerId &&
        !(c.confirms ?? []).some((x) => x.by === viewerId),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit)
    .map((c) => strip(c, viewerId));
}

/** 등급 계산에 필요한 누적 획득 — 원장이 낸다 */
export async function lifetimeEarned(userId) {
  return lifetimeEarnedOf(userId);
}
