/**
 * 테스트가 쓰는 최소한의 도구.
 *
 * ## 왜 프레임워크를 안 쓰나
 *
 * Node 22 에 테스트 러너가 들어 있다(`node --test`). 서버가 이미 내장만으로
 * 돌아가고 있어서, 테스트 때문에 의존성 트리를 새로 만들 이유가 없다.
 * 러너는 **파일마다 별도 프로세스**로 돌리므로 모듈 상태도 저절로 격리된다.
 *
 * ## 모듈 상태를 어떻게 초기화하나
 *
 * 원장·출금 모듈은 파일 경로를 **모듈 최상단에서** 환경변수로 읽고, 불러온
 * 데이터를 모듈 변수에 담는다. 서버로서는 맞는 설계지만(한 프로세스에 원장
 * 하나) 테스트에서는 시나리오마다 다른 원장이 필요할 때가 있다.
 *
 * 그래서 임포트 지정자에 쿼리를 붙여 **모듈을 새로 평가시킨다.** 그 직전에
 * 환경변수를 바꿔 두면 새 인스턴스가 새 파일을 본다. 러너가 아니라 ESM 의
 * 성질을 쓰는 것이라 러너를 갈아도 그대로 쓸 수 있다.
 *
 * ⚠ 이 수법은 **직접 임포트하는 모듈에만** 통한다. `payout.mjs` 안의
 * `import './ledger.mjs'` 는 쿼리 없는 지정자라 캐시된 원장을 본다. 그래서
 * 출금 테스트는 파일 맨 위에서 환경변수를 한 번만 정하고 원장 하나를 같이
 * 쓴다 — 시나리오는 사용자 id 로 가른다.
 */

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DIR = mkdtempSync(join(tmpdir(), 'japantrip-test-'));
let seq = 0;

/** 이번 시나리오만 쓰는 파일 경로 */
export function tempFile(name) {
  return join(DIR, `${name}-${seq++}.json`);
}

/** 원장 파일을 심어 두고 경로를 환경변수에 꽂는다 */
export function seedLedgerFile(entries = []) {
  const file = tempFile('ledger');
  writeFileSync(file, JSON.stringify({ entries }), 'utf8');
  process.env.LEDGER_FILE = file;
  return file;
}

/**
 * 원장을 하나 새로 연다.
 *
 * @param seed 미리 심어 둘 줄들. 시각을 직접 정할 수 있어서 소멸·FIFO 를
 *   실제 시계에 의존하지 않고 검증할 수 있다.
 */
export async function freshLedger(seed = []) {
  seedLedgerFile(seed);
  return import(`../ledger.mjs?t=${seq++}`);
}

/**
 * 리뷰 모듈을 새로 연다.
 *
 * `lastFix` 를 심을 수 있다. 이동 속도 검사는 **직전 인증과의 시간차**를
 * 보는데, 테스트에서 두 요청 사이는 늘 몇 밀리초라 정상 이동도 전부 걸린다.
 * 직전 좌표를 과거로 밀어 두면 실제 상황(몇 시간 전에 다른 도시에서 인증)을
 * 그대로 만들 수 있다 — 제품 코드에 테스트용 뒷문을 내지 않아도 된다.
 */
export async function freshReviews(lastFix = {}) {
  const file = tempFile('reviews');
  writeFileSync(file, JSON.stringify({ reviews: [], lastFix }), 'utf8');
  process.env.REVIEWS_FILE = file;
  return import(`../reviews.mjs?t=${seq++}`);
}

/** n 일 전 시각의 ISO 문자열 */
export function daysAgo(n) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

/** n 시간 전 */
export function hoursAgo(n) {
  return new Date(Date.now() - n * 3600_000).toISOString();
}

/** 원장 줄 하나 — 시각을 직접 정한다 */
export function entry(userId, delta, at, reason = 'test') {
  return { id: `e${seq++}`, key: `k${seq++}`, userId, delta, reason, ref: null, at };
}
