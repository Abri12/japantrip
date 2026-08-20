/**
 * 앱이 죽은 기록 — 「문제가 있어도 아무도 모른다」에서 벗어나는 장치.
 *
 * ## 왜 남의 서비스를 안 쓰나
 *
 * 오류 추적은 보통 센트리 같은 곳에 붙인다. 여기서는 안 붙인다. 이 앱은
 * 회원가입도 사용 기록도 없애는 쪽으로 계속 결정해 왔는데, 크래시 리포트
 * 하나 때문에 **모든 사용자의 화면 이동과 기기 정보가 제3자 서버로 나가는**
 * 것은 그 결정을 통째로 뒤집는 일이다.
 *
 * 대신 운영자가 이미 띄우고 있는 이 서버로 보낸다. 나가는 곳이 늘지 않는다.
 *
 * ## 무엇을 안 담나
 *
 * 사용자를 가리키는 값은 하나도 안 받는다 — 기기 id 도, IP 도, 좌표도.
 * 크래시를 고치는 데 필요한 것은 **어느 화면에서 무슨 오류가 났나**뿐이고,
 * 그 이상을 받으면 이건 오류 추적이 아니라 행동 기록이 된다.
 *
 * 그래서 「이 사용자가 세 번 겪었다」는 알 수 없고 「이 오류가 세 번 일어났다」
 * 만 안다. 고치는 데는 그걸로 충분하다.
 *
 * ## 같은 오류를 쌓지 않는다
 *
 * 크래시는 보통 **연속으로** 난다 — 화면이 죽고, 다시 그리려다 또 죽는다.
 * 그대로 쌓으면 파일이 몇 초 만에 수백 줄이 되고, 그 안에서 다른 오류를
 * 못 찾는다. 같은 (화면 × 메시지)는 한 줄로 묶고 횟수만 센다.
 *
 * 이 엔드포인트는 인증이 없다(앱이 죽은 시점에 인증할 방법이 없다). 그래서
 * 묶기와 상한이 **저장 용량 방어이기도 하다** — 아무나 불러도 늘어나는 줄
 * 수가 유한하다.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const FILE = process.env.ERRORS_FILE ?? join(process.cwd(), '.data', 'errors.json');

/** 서로 다른 오류를 몇 개까지 들고 있을지 */
const MAX_KINDS = Number(process.env.ERRORS_MAX_KINDS ?? 200);

/** 메시지·스택을 자르는 길이. 스택은 위쪽 몇 줄이면 대개 충분하다 */
const MAX_MESSAGE = 300;
const MAX_STACK = 2000;

/**
 * `seq` 가 왜 있나 — 시각만으로는 순서를 못 매긴다.
 *
 * 크래시는 **같은 밀리초에 몰려서** 난다. 그러면 `lastAt` 이 전부 같은
 * 문자열이 되고, 그걸로 정렬하면 순서가 입력 순서 그대로 남는다. 넘칠 때
 * 앞에서부터 자르면 **방금 생긴 새 오류가 먼저 사라진다** — 정작 가장 알고
 * 싶은 것이 그건데.
 *
 * 그래서 단조 증가하는 번호를 따로 들고 그걸로 정렬한다. 시각은 사람이 읽는
 * 값으로만 남긴다.
 */
/** @type {{seq:number, kinds: {key:string,message:string,stack:string,where:string,platform:string,version:string,count:number,seq:number,firstAt:string,lastAt:string}[]}} */
let db = { seq: 0, kinds: [] };
let loaded = false;
let saveTimer = null;

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    db = JSON.parse(await readFile(FILE, 'utf8'));
    db.kinds ??= [];
    // 예전 파일에는 번호가 없다. 있는 것 중 가장 큰 값 다음부터 이어 센다.
    db.seq ??= db.kinds.reduce((m, k) => Math.max(m, k.seq ?? 0), 0);
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
      console.warn('[errors] 저장 실패:', err.message);
    }
  }, 1000);
}

const clip = (v, n) => String(v ?? '').slice(0, n);

/**
 * 오류 하나를 접수한다.
 *
 * 무엇이 와도 던지지 않는다. 오류를 받는 곳이 오류를 내면 그때부터는 정말로
 * 아무것도 모르게 된다.
 */
export async function record({ message, stack, where, platform, version }) {
  await load();

  const msg = clip(message, MAX_MESSAGE);
  if (!msg) return { error: 'message' };

  const at = new Date().toISOString();
  const key = `${clip(where, 120)}::${msg}`;
  const found = db.kinds.find((k) => k.key === key);

  if (found) {
    found.count += 1;
    found.lastAt = at;
    found.seq = ++db.seq;
    // 스택은 처음 것을 남긴다. 같은 오류의 두 번째 스택은 새로 알려주는 게 없다.
    scheduleSave();
    return { ok: true, count: found.count };
  }

  db.kinds.push({
    key,
    message: msg,
    stack: clip(stack, MAX_STACK),
    where: clip(where, 120),
    platform: clip(platform, 40),
    version: clip(version, 40),
    count: 1,
    seq: ++db.seq,
    firstAt: at,
    lastAt: at,
  });

  /*
   * 넘치면 **가장 오래 조용한 것**부터 버린다.
   *
   * 횟수가 적은 것부터 버리면 방금 생긴 새 오류가 먼저 사라진다 — 정작 가장
   * 알고 싶은 것이 그건데. 마지막으로 일어난 지 오래된 쪽이 이미 고쳐졌을
   * 가능성이 높다. 순서는 시각이 아니라 seq 로 본다(위 주석 참고).
   */
  if (db.kinds.length > MAX_KINDS) {
    db.kinds.sort((a, b) => b.seq - a.seq);
    db.kinds.length = MAX_KINDS;
  }

  scheduleSave();
  return { ok: true, count: 1 };
}

/** 운영자가 보는 목록 — 최근에 일어난 순서 */
export async function list(limit = 100) {
  await load();
  return db.kinds
    .slice()
    .sort((a, b) => b.seq - a.seq)
    .slice(0, limit)
    .map(({ key: _k, seq: _s, ...rest }) => rest);
}

/** 지금 몇 종류가 쌓여 있나 — /health 에 얹어 한눈에 보게 한다 */
export async function count() {
  await load();
  return db.kinds.length;
}
