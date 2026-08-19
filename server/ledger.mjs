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
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

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

export async function balanceOf(userId) {
  await load();
  return db.entries.filter((e) => e.userId === userId).reduce((s, e) => s + e.delta, 0);
}

/** 등급 계산에 쓰는 값 — 차감은 빼지 않는다. 쓴다고 등급이 내려가면 안 된다 */
export async function lifetimeEarnedOf(userId) {
  await load();
  return db.entries
    .filter((e) => e.userId === userId && e.delta > 0)
    .reduce((s, e) => s + e.delta, 0);
}

export async function historyOf(userId, limit = 50) {
  await load();
  return db.entries
    .filter((e) => e.userId === userId)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit)
    .map(({ key: _k, userId: _u, ...rest }) => rest);
}
