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
 * ## 반려가 쌓이면 제재한다
 *
 * 원래 설계에 없던 것이다. 확인만 있고 반려에 대가가 없으면, 아무 말이나
 * 올려 두고 통과하기를 기다리는 쪽이 이득이 된다. 반려가 임계를 넘은 사람은
 * 새 제보를 받지 않는다.
 *
 * ## 이 구조로 못 막는 것
 *
 * 계정 여러 개를 만들어 서로 확인해 주는 담합은 막지 못한다. 계정 생성 비용
 * (전화번호 인증 등)과 이상 패턴 탐지가 따로 필요하다 — 크레딧을 실제로 켤
 * 때 반드시 먼저 정해야 하는 부분이라 여기 남겨 둔다.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

import { lifetimeEarnedOf, post } from './ledger.mjs';

const FILE = process.env.CONTRIBUTIONS_FILE ?? join(process.cwd(), '.data', 'contributions.json');

/** 이 수를 넘게 반려당하면 새 제보를 받지 않는다 */
const REJECT_LIMIT = 3;

/** @type {{items: object[]}} */
let db = { items: [] };
let loaded = false;
let saveTimer = null;

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

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try {
      await mkdir(dirname(FILE), { recursive: true });
      await writeFile(FILE, JSON.stringify(db), 'utf8');
    } catch (err) {
      console.warn('[contrib] 저장 실패:', err.message);
    }
  }, 1000);
}

/** 확인자 목록을 떼고 내보낸다 — 누가 확인했는지는 남에게 보일 이유가 없다 */
function strip(c, viewerId) {
  const { confirmedBy, authorId, ...rest } = c;
  return {
    ...rest,
    confirmations: confirmedBy.length,
    mine: authorId === viewerId,
    // 내가 이미 확인했는지 — 버튼을 잠그는 데 쓴다
    confirmedByMe: confirmedBy.includes(viewerId),
  };
}

export async function submit({ authorId, type, placeId, cityId, note, credits, needed }) {
  await load();
  if (!authorId || !type) return { error: 'invalid' };

  const rejected = db.items.filter((c) => c.authorId === authorId && c.status === 'rejected').length;
  if (rejected >= REJECT_LIMIT) return { error: 'suspended' };

  const item = {
    id: randomUUID(),
    authorId,
    type,
    placeId: placeId ?? null,
    cityId: cityId ?? null,
    note: String(note ?? '').trim().slice(0, 500),
    createdAt: new Date().toISOString(),
    // 요구 확인 수가 0이면(최고 등급) 바로 확정된다
    status: needed === 0 ? 'confirmed' : 'pending',
    confirmationsNeeded: needed,
    pendingCredits: credits,
    confirmedBy: [],
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
 * 확정되는 순간 원장에 지급 줄이 쌓인다. 멱등 키가 기여 id 라서, 어떤 경로로
 * 이 함수가 두 번 불려도 지급은 한 번만 일어난다.
 */
export async function confirm(id, viewerId) {
  await load();
  const item = db.items.find((c) => c.id === id);
  if (!item) return { error: 'not-found' };
  if (item.status !== 'pending') return { error: 'not-pending' };

  // 교차검증의 전부다 — 자기 것을 자기가 확인할 수 없다.
  if (item.authorId === viewerId) return { error: 'self' };
  if (item.confirmedBy.includes(viewerId)) return { error: 'already' };

  item.confirmedBy.push(viewerId);

  if (item.confirmedBy.length >= item.confirmationsNeeded) {
    item.status = 'confirmed';
    await post({
      key: `contrib:${item.id}`,
      userId: item.authorId,
      delta: item.pendingCredits,
      reason: 'contribution',
      ref: item.id,
    });
  }

  scheduleSave();
  return { contribution: strip(item, viewerId) };
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
        c.status === 'pending' && c.authorId !== viewerId && !c.confirmedBy.includes(viewerId),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit)
    .map((c) => strip(c, viewerId));
}

/** 등급 계산에 필요한 누적 획득 — 원장이 낸다 */
export async function lifetimeEarned(userId) {
  return lifetimeEarnedOf(userId);
}
