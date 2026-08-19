/**
 * 크레딧 원장 — 잔액의 **유일한 사본**.
 *
 * ## 왜 서버여야 하나
 *
 * 크레딧은 eSIM·티켓 할인으로 교환되는, 즉 **금전적 가치가 있는 잔액**이다.
 * 기기 저장소에 두면 파일 하나 고쳐서 무한히 만들 수 있다. 클라이언트가 자기
 * 잔액을 계산하는 구조로는 절대 켜면 안 된다.
 *
 * ## 추가 전용 원장
 *
 * 잔액을 숫자 하나로 들고 있지 않는다. **지급·차감을 줄로 쌓고, 잔액은 그
 * 합으로 낸다.** 이유가 둘이다.
 *
 * 하나는 감사다. 「이 사람 잔액이 왜 이렇지」에 답하려면 어떻게 그 수가
 * 됐는지를 되짚을 수 있어야 한다. 숫자만 있으면 되짚을 것이 없다.
 *
 * 다른 하나는 사고 복구다. 버그로 잘못 지급했을 때, 잔액을 손으로 고치면
 * 그 사실이 어디에도 남지 않는다. 반대 부호의 줄을 추가하면 무슨 일이
 * 있었는지가 원장에 남는다.
 *
 * ## 멱등 처리
 *
 * 같은 요청이 두 번 오면(네트워크 재시도, 버튼 두 번 누름) 두 번 반영되면
 * 안 된다. 모든 줄에 `key` 를 두고, 같은 키가 이미 있으면 새로 쓰지 않고
 * **이미 있는 결과를 그대로 돌려준다.** 「실패했나」 싶어 다시 눌렀을 때
 * 이중 차감이 나는 것이 이 기능에서 가장 나쁜 사고다.
 *
 * ## 유효기간 — 소멸도 계산으로 낸다
 *
 * 크레딧은 **적립일로부터 5년**에 소멸한다. 상법상 상사소멸시효와 같은
 * 기간이고, 공정거래위원회가 2024년 적립식 포인트 실태조사에서 업계에
 * 권고한 방향이다(당시 2~3년이던 곳들이 3~5년으로 연장했다). 짧게 잡으면
 * 나중에 고쳐야 한다.
 *
 * 소멸도 **줄을 지우지 않는다.** 지급 줄에 유효기간을 매기고, 잔액을 낼 때
 * 다시 계산한다. 원장이 추가 전용이라는 성질이 소멸 때문에 깨지면 감사도
 * 복구도 같이 무너진다.
 *
 * 쓸 때는 **오래된 것부터 나간다(FIFO).** 새것부터 쓰면 곧 소멸할 크레딧이
 * 남아서 사용자가 손해를 본다. 소비자에게 불리한 쪽을 기본값으로 두지 않는다.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

import { checkIssuance } from './issuance.mjs';

const FILE = process.env.LEDGER_FILE ?? join(process.cwd(), '.data', 'ledger.json');

/**
 * @type {{entries: {id:string,key:string,userId:string,delta:number,reason:string,ref:string|null,at:string}[]}}
 */
let db = { entries: [] };
let loaded = false;
let saveTimer = null;

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    db = JSON.parse(await readFile(FILE, 'utf8'));
    db.entries ??= [];
    console.log(`[ledger] ${db.entries.length}줄 불러옴`);
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
      console.warn('[ledger] 저장 실패:', err.message);
    }
  }, 1000);
}

/**
 * 원장에 한 줄 쌓는다.
 *
 * @param key 멱등 키. 같은 키가 이미 있으면 아무것도 하지 않는다.
 * @param delta 양수는 지급, 음수는 차감
 */
export async function post({ key, userId, delta, reason, ref = null }) {
  await load();

  const existing = db.entries.find((e) => e.key === key);
  if (existing) return { entry: existing, duplicated: true };

  // 차감은 잔액을 넘을 수 없다. 원장이 음수가 되면 그건 버그의 흔적이지
  // 정상 상태가 아니다.
  if (delta < 0 && (await balanceOf(userId)) + delta < 0) {
    return { error: 'insufficient' };
  }

  /*
   * 발행 한도.
   *
   * 지급은 전부 이 함수를 지나가므로 여기 한 곳만 막으면 된다. 규제선(발행잔액
   * 30억원)보다 훨씬 낮은 자체 한도를 두는 이유는 성공을 막으려는 게 아니라
   * **사고를 막으려는** 것이다 — 지급 로직 버그나 대규모 어뷰징으로 하룻밤에
   * 폭증하는 쪽이 현실적인 위험이다. (server/issuance.mjs)
   *
   * 차감은 검사하지 않는다. 이미 준 것을 못 쓰게 하는 것은 미상환 잔액을
   * 줄이는 방향이 아니고, 그냥 이용자 손해다.
   */
  if (delta > 0) {
    const gate = checkIssuance(await outstandingTotal(), await issuedLastYear(), delta);
    if (!gate.ok) {
      console.warn(`[ledger] 발행 한도로 지급을 멈췄어요: ${gate.error}`);
      return gate;
    }
  }

  const entry = {
    id: randomUUID(),
    key,
    userId,
    delta,
    reason,
    ref,
    at: new Date().toISOString(),
  };
  db.entries.push(entry);
  scheduleSave();
  return { entry, duplicated: false };
}

/**
 * 유효기간 — 적립일로부터 5년.
 *
 * 상법 제64조의 상사소멸시효와 같게 맞췄다. 공정위가 적립식 포인트를 그
 * 수준으로 유도하고 있어서, 더 짧게 잡으면 언젠가 되돌려야 한다. 무상으로
 * 준 것이라 더 짧게 둘 여지도 있지만, 발행 한도(issuance.mjs)가 이미 채무를
 * 묶고 있어 기간을 길게 잡는 비용이 작다.
 */
export const TTL_MS = Number(process.env.CREDIT_TTL_DAYS ?? 1825) * 86_400_000;

/**
 * 원장을 되짚어 **로트별 잔량**을 낸다.
 *
 * 지급 한 줄이 로트 하나다. 차감은 그 시점에 살아 있는 로트 중 **가장 오래된
 * 것부터** 먹는다. 소멸한 로트는 먹을 수 없다 — 이미 없어진 것이다.
 *
 * 이 함수가 소멸·FIFO·잔액을 한 자리에서 결정한다. 세 곳에 흩어 두면 어느
 * 하나만 고쳐져 서로 어긋나는 날이 온다.
 */
function lotsOf(entries, at = Date.now()) {
  const rows = entries.slice().sort((a, b) => a.at.localeCompare(b.at));
  const lots = [];

  for (const e of rows) {
    const t = Date.parse(e.at);
    if (e.delta > 0) {
      lots.push({ at: t, expiresAt: t + TTL_MS, amount: e.delta, remaining: e.delta });
      continue;
    }

    // 차감 — 이 시점에 살아 있는 로트를 오래된 순으로 먹는다
    let need = -e.delta;
    for (const lot of lots) {
      if (need <= 0) break;
      if (lot.expiresAt <= t || lot.remaining <= 0) continue;
      const take = Math.min(lot.remaining, need);
      lot.remaining -= take;
      need -= take;
    }
    /*
     * need 가 남으면 잔액보다 많이 썼다는 뜻이다. post() 가 막고 있어서
     * 정상 경로로는 생기지 않는다 — 생겼다면 원장이 손으로 편집됐거나
     * 버그다. 조용히 넘기면 그 사실이 묻히므로 남긴다.
     */
    if (need > 0) console.warn(`[ledger] 잔액을 넘는 차감이 있어요: ${e.id} (${need} 부족)`);
  }

  return lots.filter((l) => l.remaining > 0 && l.expiresAt > at);
}

/** 한 사람의 살아 있는 로트 */
async function myLots(userId, at = Date.now()) {
  await load();
  return lotsOf(db.entries.filter((e) => e.userId === userId), at);
}

/** 아직 쓰이지 않은 크레딧 총합 — 회계상 채무에 해당하는 양이다 */
export async function outstandingTotal() {
  await load();
  const byUser = new Map();
  for (const e of db.entries) {
    if (!byUser.has(e.userId)) byUser.set(e.userId, []);
    byUser.get(e.userId).push(e);
  }
  // 소멸한 것은 채무가 아니다. 그게 유효기간을 두는 이유의 절반이다.
  let total = 0;
  for (const entries of byUser.values()) {
    total += lotsOf(entries).reduce((n, l) => n + l.remaining, 0);
  }
  return total;
}

/** 최근 1년 동안 **지급된** 양. 차감은 빼지 않는다 — 규제의 「총발행액」이 그렇다 */
export async function issuedLastYear() {
  await load();
  const since = Date.now() - 365 * 24 * 3600_000;
  return db.entries
    .filter((e) => e.delta > 0 && Date.parse(e.at) >= since)
    .reduce((s, e) => s + e.delta, 0);
}

export async function balanceOf(userId) {
  return (await myLots(userId)).reduce((s, l) => s + l.remaining, 0);
}

/** 등급 계산에 쓰는 값 — 차감은 빼지 않는다. 쓴다고 등급이 내려가면 안 된다 */
export async function lifetimeEarnedOf(userId) {
  await load();
  return db.entries
    .filter((e) => e.userId === userId && e.delta > 0)
    .reduce((s, e) => s + e.delta, 0);
}

/**
 * **찾을 수 있는** 잔액.
 *
 * 지급된 지 얼마 안 된 크레딧은 아직 쓸 수 없다. 부정 지급을 되돌릴 시간을
 * 벌기 위해서다 — 담합 탐지가 사후에 도는 이상, 지급 즉시 교환되면 되돌릴
 * 대상이 이미 나가 버린다.
 *
 * 차감은 숙려 없이 전부 반영한다. 「쓴 것은 즉시, 받은 것은 나중에」가
 * 안전한 방향이다. 그래서 이 값은 balanceOf 보다 절대 크지 않다.
 */
export async function maturedBalanceOf(userId, maturityMs) {
  const cutoff = Date.now() - maturityMs;
  // 차감은 이미 로트에 반영돼 있다. 여기서는 「숙려가 끝난 로트」만 세면 된다.
  return (await myLots(userId))
    .filter((l) => l.at <= cutoff)
    .reduce((s, l) => s + l.remaining, 0);
}

/**
 * 곧 소멸할 크레딧.
 *
 * 공정위는 2024년 개선안에서 소멸 고지를 **2개월 전·1개월 전·3일 전 3회**로
 * 하도록 유도했다(종전 15일 전 1회). 이 앱은 계정이 없어서 푸시 명부에
 * 사용자 id 가 없다 — 그래서 **앱을 열었을 때 화면으로 알린다.**
 *
 * 푸시로 보내려면 푸시 토큰과 사용자 id 를 묶어야 하는데, 그러면 지진 알림
 * 명부가 「누구인지 아는 명부」가 된다. 고지 하나를 위해 그 성질을 내주지
 * 않는다.
 *
 * @returns 소멸일이 가까운 순서. 화면은 맨 앞 하나만 보여주면 된다.
 */
export async function expiringSoon(userId, withinMs = 60 * 86_400_000) {
  const now = Date.now();
  return (await myLots(userId, now))
    .filter((l) => l.expiresAt <= now + withinMs)
    .sort((a, b) => a.expiresAt - b.expiresAt)
    .map((l) => ({
      credits: l.remaining,
      expiresAt: new Date(l.expiresAt).toISOString(),
      daysLeft: Math.ceil((l.expiresAt - now) / 86_400_000),
    }));
}

export async function historyOf(userId, limit = 50) {
  await load();
  return db.entries
    .filter((e) => e.userId === userId)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit)
    .map(({ key: _k, userId: _u, ...rest }) => rest);
}
