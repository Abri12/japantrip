/**
 * 출금 게이트 — 가치가 **밖으로 나가는 한 지점**.
 *
 * ## 왜 여기여야 하나
 *
 * 담합을 막는 정공법은 계정 생성을 비싸게 만드는 것이다. 하지만 이 앱은
 * 「회원가입이 없다」를 지켜 왔고, 전화번호 인증을 앱 입구에 두면 그게
 * 무너진다 — 정보만 보러 온 사람 99%가 대가를 치르게 된다.
 *
 * 그래서 입구가 아니라 **출구**에 둔다. 근거는 단순하다.
 *
 *   **익명인 사람에게는 기프티콘을 보낼 수 없다.**
 *
 * 어차피 받을 곳(전화번호·이메일)을 적어야 한다. 그 값을 한 사람에 하나로
 * 묶으면, 기기를 열 대 만들어도 **받는 곳이 하나면 한 사람분만 나간다.**
 * 새로 생기는 부담이 없다 — 원래 적어야 하는 것을 신원으로 쓸 뿐이다.
 *
 * 적립·확인·잔액 조회는 그대로 익명이다. 교환을 한 번도 안 하는 사용자는
 * 아무것도 내지 않는다.
 *
 * ## 세 겹
 *
 *   수령처 유일성   전화번호 하나 = 사람 하나. 바꿔치기도 막는다
 *   숙려 기간       받은 지 얼마 안 된 크레딧은 못 쓴다. 되돌릴 시간을 번다
 *   기간 상한       뚫려도 새어 나가는 양이 유한하다
 *
 * ## 저장하는 것
 *
 * 수령처는 **해시만** 남긴다. 「이 번호가 이미 쓰였나」를 보는 데는 해시로
 * 충분하고, 실제 발송은 교환 요청 그 순간의 값으로 한다. 서버에 전화번호
 * 목록이 쌓이면 그건 출금 장치가 아니라 연락처 데이터베이스가 된다.
 */

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { balanceOf, maturedBalanceOf } from './ledger.mjs';

import { saver } from './store.mjs';

const FILE = process.env.PAYOUT_FILE ?? join(process.cwd(), '.data', 'payout.json');

/** 받은 크레딧이 이만큼 지나야 쓸 수 있다 */
export const MATURITY_MS = Number(process.env.PAYOUT_MATURITY_HOURS ?? 72) * 3600_000;

/** 한 사람이 이 기간 동안 교환할 수 있는 상한 */
const WINDOW_MS = 30 * 24 * 3600_000;
export const WINDOW_LIMIT = Number(process.env.PAYOUT_WINDOW_LIMIT ?? 5000);

/** 수령처를 소금과 함께 해시한다. 목록이 새도 번호를 되찾을 수 없게 */
const SALT = process.env.PAYOUT_SALT ?? 'japantrip-payout-salt';

/** @type {{bindings: Record<string,string>, taken: Record<string,string>, payouts: object[]}} */
let db = { bindings: {}, taken: {}, payouts: [] };
let loaded = false;

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    db = JSON.parse(await readFile(FILE, 'utf8'));
    db.bindings ??= {};
    db.taken ??= {};
    db.payouts ??= [];
  } catch {
    // 첫 실행이다
  }
}

const store = saver('payout', FILE, () => db);

/*
 * 원장과 출금은 **미루지 않고 그 자리에서 쓴다.**
 *
 * 다른 파일(리뷰·구독자·오류)은 1초 몰아 쓰는 게 맞다. 그 1초를 잃어도
 * 리뷰 하나가 늦게 저장될 뿐이다. 원장은 다르다 — 그 1초를 잃으면
 * **누군가의 크레딧이 사라진다.** 서버를 끄는 것도 죽는 것도 드문 일이
 * 아니고, 되돌릴 방법도 없다.
 *
 * 종료 신호를 받았을 때 마저 쓰는 장치가 있긴 한데(index.mjs), 그건
 * 신호를 받을 수 있을 때만 통한다. 전원이 나가거나 강제 종료되면 안 통하고,
 * 윈도우에서는 신호 자체가 그렇게 전달되지 않는다. 지킬 수 있는 것에만
 * 기대는 편이 낫다.
 *
 * 비용은 거의 없다. 이 원장에 줄이 쌓이는 속도는 기여·교환이 일어날 때뿐이라
 * 초당 수천 건이 아니다.
 */
async function saveNow() {
  await store.flush();
}

/**
 * 수령처를 비교 가능한 값으로.
 *
 * 전화번호는 표기가 제각각이라(010-1234-5678 · +821012345678) 숫자만 남겨
 * 정규화한다. 그러지 않으면 같은 번호를 다르게 적는 것만으로 유일성 검사를
 * 지나갈 수 있다.
 */
function tagOf(target) {
  const raw = String(target ?? '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes('@')) {
    return raw.length < 5 ? null : createHash('sha256').update(SALT).update(raw).digest('hex');
  }

  /*
   * 국가번호를 국내 표기로.
   *
   * 예전에는 `^82` 를 `0` 으로 바꿨다. `+821012345678` 은 잘 되는데
   * **`82 010 1234 5678`** 처럼 국가번호와 앞자리 0을 같이 적은 형태가
   * `00101234...` 가 돼서 같은 번호로 안 잡혔다. 표기 하나를 흘리면 그
   * 표기로 게이트를 그냥 지나갈 수 있다.
   *
   * 그래서 82 를 **떼고**, 0으로 시작하지 않으면 그때 붙인다. 국내 번호는
   * 정규화하면 언제나 0으로 시작하므로 82로 시작하는 숫자열은 국가번호다.
   */
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('82')) digits = digits.slice(2);
  if (digits && !digits.startsWith('0')) digits = '0' + digits;

  if (digits.length < 5) return null;
  return createHash('sha256').update(SALT).update(digits).digest('hex');
}

/**
 * 수령처를 이 사람에게 묶는다.
 *
 * 한 번 묶으면 바꿀 수 없다. 바꿀 수 있으면 번호 하나로 계정 여러 개를 차례로
 * 통과시킬 수 있어서, 유일성 검사가 아무 의미가 없어진다. 진짜로 번호가 바뀐
 * 사용자는 운영자가 풀어 준다 — 드문 일을 자동화하면 그 자동화가 구멍이 된다.
 */
export async function bind(userId, target) {
  await load();
  const tag = tagOf(target);
  if (!userId || !tag) return { error: 'invalid' };

  const mine = db.bindings[userId];
  if (mine && mine !== tag) return { error: 'already-bound' };

  const owner = db.taken[tag];
  if (owner && owner !== userId) return { error: 'target-taken' };

  db.bindings[userId] = tag;
  db.taken[tag] = userId;
  await saveNow();
  return { ok: true };
}

/** 운영자용 — 번호가 실제로 바뀐 사용자를 풀어 준다 */
export async function unbind(userId) {
  await load();
  const tag = db.bindings[userId];
  if (!tag) return { error: 'not-bound' };
  delete db.bindings[userId];
  delete db.taken[tag];
  await saveNow();
  return { ok: true };
}

/** 최근 창(window) 안에 이미 나간 양 */
function spentInWindow(userId) {
  const since = Date.now() - WINDOW_MS;
  return db.payouts
    .filter((p) => p.userId === userId && Date.parse(p.at) >= since)
    .reduce((s, p) => s + p.cost, 0);
}

/**
 * 교환해도 되는지.
 *
 * 거부할 때는 **이유와 함께 필요한 값을 준다.** 「안 됩니다」만 돌려주면
 * 사용자는 얼마를 더 모아야 하는지, 언제 다시 오면 되는지 알 수 없다.
 */
export async function check(userId, cost) {
  await load();

  if (!db.bindings[userId]) return { ok: false, error: 'not-bound' };

  const matured = await maturedBalanceOf(userId, MATURITY_MS);
  if (matured < cost) {
    const total = await balanceOf(userId);
    // 잔액은 충분한데 숙려가 안 끝난 경우와, 그냥 모자란 경우를 구분해 준다.
    return total >= cost
      ? { ok: false, error: 'maturing', matured, balance: total }
      : { ok: false, error: 'insufficient', matured, balance: total };
  }

  const spent = spentInWindow(userId);
  if (spent + cost > WINDOW_LIMIT) {
    return { ok: false, error: 'window-limit', spent, limit: WINDOW_LIMIT };
  }

  return { ok: true };
}

/** 교환이 실제로 나갔음을 기록한다. 상한 계산의 근거다 */
export async function record(userId, rewardId, cost) {
  await load();
  db.payouts.push({ userId, rewardId, cost, at: new Date().toISOString() });
  await saveNow();
}

export async function isBound(userId) {
  await load();
  return Boolean(db.bindings[userId]);
}
