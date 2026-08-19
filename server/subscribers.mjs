/**
 * 푸시 대상자 명부.
 *
 * 저장하는 것은 셋뿐이다 — **푸시 토큰 · 체류 도도부현 · 알림 받을 진도**.
 * 위치 좌표도, 이동 이력도, 계정도 없다. 「어느 현에 있는가」만 알면 대상자를
 * 고를 수 있고, 그 이상은 알 이유가 없다.
 *
 * ## 왜 파일에 저장하나
 *
 * 메모리에만 두면 서버를 재시작할 때마다 명부가 비고, 사용자는 앱을 다시
 * 열기 전까지 알림을 못 받는다. 지진 알림에서 그건 기능이 없는 것과 같다.
 * 그렇다고 DB 를 붙일 규모도 아니라, JSON 파일 하나로 둔다. 수천 명까지는
 * 이걸로 충분하고, 그보다 커지면 그때가 DB 를 고를 시점이다.
 *
 * ## 지우는 규칙
 *
 * Expo 가 「이 토큰은 죽었다」(DeviceNotRegistered)고 알려주면 즉시 지운다.
 * 죽은 토큰에 계속 보내면 발송 한도만 쓰고, 명부가 실제 사용자 수를 말해주지
 * 못하게 된다.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const FILE = process.env.SUBSCRIBERS_FILE ?? join(process.cwd(), '.data', 'subscribers.json');

/** @type {Map<string, {pref: string, minScale: number, at: number}>} */
let subs = new Map();
let loaded = false;
let saveTimer = null;

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await readFile(FILE, 'utf8');
    subs = new Map(Object.entries(JSON.parse(raw)));
    console.log(`[push] 명부 ${subs.size}건 불러옴`);
  } catch {
    // 파일이 아직 없다 — 첫 실행이다
  }
}

/**
 * 저장을 몰아서 한다.
 *
 * 등록이 연달아 들어올 때마다 파일을 쓰면 디스크만 긁는다. 1초 모았다가
 * 한 번 쓴다 — 그 사이에 서버가 죽어도 잃는 건 최근 등록 몇 건이고,
 * 앱이 다시 열릴 때 재등록되므로 회복된다.
 */
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try {
      await mkdir(dirname(FILE), { recursive: true });
      await writeFile(FILE, JSON.stringify(Object.fromEntries(subs)), 'utf8');
    } catch (err) {
      console.warn('[push] 명부 저장 실패:', err.message);
    }
  }, 1000);
}

/**
 * 등록하거나 갱신한다.
 *
 * 같은 토큰이 다시 오면 덮어쓴다 — 사용자가 도시를 바꾸면 체류 현이 바뀌고,
 * 그때 오사카 사람에게 홋카이도 지진을 보내면 안 된다.
 */
export async function register(token, pref, minScale) {
  await load();
  subs.set(token, { pref, minScale, at: Date.now() });
  scheduleSave();
  return subs.size;
}

export async function unregister(token) {
  await load();
  const had = subs.delete(token);
  if (had) scheduleSave();
  return had;
}

/**
 * 이 지진의 대상자를 고른다.
 *
 * @param {(pref: string) => number | null} scaleForPref
 *   그 현의 예상·관측 진도를 돌려준다. 해당 없으면 null.
 *   판정 자체는 호출부가 한다 — 지진정보와 긴급속보는 진도를 담는 자리가 달라서다.
 */
export async function targets(scaleForPref) {
  await load();
  /** @type {{token: string, scale: number}[]} */
  const out = [];
  for (const [token, s] of subs) {
    const scale = scaleForPref(s.pref);
    if (scale === null || scale < s.minScale) continue;
    out.push({ token, scale });
  }
  return out;
}

export async function size() {
  await load();
  return subs.size;
}

/** Expo 가 죽었다고 알려준 토큰을 명부에서 뺀다 */
export async function drop(tokens) {
  await load();
  let n = 0;
  for (const t of tokens) if (subs.delete(t)) n++;
  if (n) {
    scheduleSave();
    console.log(`[push] 죽은 토큰 ${n}건 정리`);
  }
  return n;
}
