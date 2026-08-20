/**
 * 맥락 점검 — 「이 화면이 지금 누구 이야기를 하고 있나」가 어긋날 자리를 잡는다.
 *
 * ## 무엇을 막으려는 건가
 *
 * 이 앱에는 답이 갈리는 두 출처가 있다.
 *
 *   ① **고른 도시** — 저장돼 있고 앱 어디서나 읽힌다 (`useSelectedCity`)
 *   ② **지금 보고 있는 화면** — 라우트 파라미터로 온다 (`/airport/fuk`)
 *
 * 대부분의 화면은 ①만 쓴다. 그런데 공항 탭에 「전체 보기」가 있어서, 도쿄를
 * 고른 사람도 후쿠오카 공항을 열어 볼 수 있다. 그 화면에서 ①을 읽으면
 * 후쿠오카 화면이 나리타 답을 한다.
 *
 * 실제로 그랬다. 「몇 시에 숙소를 나서야 하나요」가 **나리타 기준 4시간
 * 20분**을 답했다 — 후쿠오카는 2시간 55분인데. 방향이 반대면 1시간 25분을
 * 모자라게 답한다. 되돌릴 수 없는 날에.
 *
 * 타입 검사도 린트도 이걸 못 잡는다. 두 값 다 타입이 맞고 문법도 맞다.
 * 틀린 건 **어느 쪽을 읽어야 하는가**뿐이다.
 *
 * ## 어떻게 막나
 *
 *   규칙 A. `useSelectedCity` 는 **아래 목록의 파일만** 부를 수 있다.
 *           목록에 있는 것들은 전부 「이 화면의 주제가 곧 고른 도시」인 곳이다.
 *
 *   규칙 B. 라우트 파라미터를 읽는 화면은 `useSelectedCity` 에 **닿으면 안
 *           된다.** 직접이든, 임포트를 타고 간접으로든. 단 하나의 문
 *           (`lib/airport-context.ts`)만 통과시킨다 — 거기가 두 출처를
 *           어떻게 화해시킬지 정해 둔 자리다.
 *
 * 새 화면이 규칙을 어기면 목록에 안 올라와 있으므로 여기서 걸린다. 정당한
 * 예외라면 목록에 추가하면서 **이유를 적게** 된다. 그 강제가 이 스크립트의
 * 본체다.
 *
 * ## 왜 이건 실패시키나
 *
 * `audit-data.mjs` 는 실패시키지 않는다 — 데이터가 낡은 건 버그가 아니라
 * 할 일이라서다. 이쪽은 반대다. 코드 구조에 대한 불변식이고 답이 결정돼
 * 있으므로, 어긋나면 고치거나 목록에 올리거나 둘 중 하나여야 한다.
 *
 * 실행: npm run check:context
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/** 두 출처를 화해시키는 유일한 문. 여기만 규칙 B 를 통과한다 */
const GATEWAY = 'src/lib/airport-context.ts';

/** `useSelectedCity` 를 직접 불러도 되는 파일과 그 이유 */
const MAY_READ_SELECTED_CITY = {
  'src/lib/selected-city.tsx': '출처 그 자체',
  [GATEWAY]: '두 출처를 화해시키는 자리. 규칙이 여기 하나로만 있어야 한다',
  'src/app/(tabs)/index.tsx': '홈 — 화면의 주제가 곧 고른 도시다',
  'src/app/(tabs)/airports.tsx': '목록을 고른 도시로 좁힐 뿐, 특정 공항을 주제로 삼지 않는다',
  'src/app/(tabs)/places.tsx': '목록 좁히기',
  'src/app/(tabs)/transit.tsx': '목록 좁히기',
  'src/app/(tabs)/safety.tsx': '지진·날씨를 고른 도시로 좁힌다',
  'src/app/weather.tsx': '고른 도시의 날씨가 주제다',
  'src/features/pick/ladder.tsx': '도시를 고른 뒤에만 닿는 화면이라 어긋날 여지가 없다',
  'src/features/pick/roulette.tsx': '도시를 고른 뒤에만 닿는 화면이라 어긋날 여지가 없다',
};

// ── 파일 모으기 ────────────────────────────────────────

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(name)) files.push(p);
  }
})(SRC);

/** 윈도우·맥 어디서 돌려도 같은 이름이 나오게 슬래시로 통일한다 */
const rel = (abs) => abs.slice(ROOT.length + 1).split(sep).join('/');

const source = new Map(files.map((f) => [rel(f), readFileSync(f, 'utf8')]));

// ── 임포트 그래프 ──────────────────────────────────────

function resolveImport(fromRel, spec) {
  let base;
  if (spec.startsWith('@/')) base = 'src/' + spec.slice(2);
  else if (spec.startsWith('.')) {
    const abs = resolve(dirname(join(ROOT, fromRel)), spec);
    base = rel(abs);
  } else return null; // node_modules 는 안 따라간다

  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (source.has(base + ext)) return base + ext;
  }
  return source.has(base) ? base : null;
}

const imports = new Map();
for (const [file, code] of source) {
  const out = new Set();
  for (const m of code.matchAll(/from\s+'([^']+)'/g)) {
    const target = resolveImport(file, m[1]);
    if (target) out.add(target);
  }
  imports.set(file, [...out]);
}

// ── 규칙 A ────────────────────────────────────────────

const CALLS_CITY = /useSelectedCity\s*\(/;
const READS_PARAMS = /useLocalSearchParams/;

const readsCity = (file) => CALLS_CITY.test(source.get(file) ?? '');

const unlisted = [...source.keys()]
  .filter(readsCity)
  .filter((f) => !(f in MAY_READ_SELECTED_CITY));

// ── 규칙 B ────────────────────────────────────────────

/** file 에서 useSelectedCity 에 닿는 경로. 게이트웨이는 통과로 친다 */
function pathToCity(file, seen = new Set()) {
  if (seen.has(file) || file === GATEWAY) return null;
  seen.add(file);
  if (readsCity(file)) return [file];
  for (const dep of imports.get(file) ?? []) {
    const rest = pathToCity(dep, seen);
    if (rest) return [file, ...rest];
  }
  return null;
}

const leaks = [];
for (const [file, code] of source) {
  if (!READS_PARAMS.test(code)) continue;
  const path = pathToCity(file);
  if (path) leaks.push({ file, path });
}

// ── 출력 ──────────────────────────────────────────────

const paramScreens = [...source].filter(([, c]) => READS_PARAMS.test(c)).map(([f]) => f);

console.log('맥락 점검\n');

console.log('## 라우트 파라미터를 읽는 화면');
for (const f of paramScreens) {
  const leak = leaks.find((l) => l.file === f);
  console.log(leak ? `   ✗ ${f}` : `   · ${f}`);
}
console.log();

console.log('## useSelectedCity 를 직접 부르는 파일');
for (const f of [...source.keys()].filter(readsCity)) {
  const why = MAY_READ_SELECTED_CITY[f];
  console.log(why ? `   · ${f}\n       ${why}` : `   ✗ ${f} — 목록에 없어요`);
}
console.log();

let bad = 0;

if (unlisted.length) {
  bad += unlisted.length;
  console.log('## 규칙 A 위반 — 목록에 없는 파일이 고른 도시를 읽어요');
  for (const f of unlisted) console.log(`   - ${f}`);
  console.log(
    '\n   이 화면의 주제가 정말 「고른 도시」라면 scripts/check-context.mjs 의',
  );
  console.log('   MAY_READ_SELECTED_CITY 에 이유와 함께 올리세요. 아니라면 화면이 들고 있는');
  console.log('   값(라우트 파라미터)을 써야 해요.\n');
}

if (leaks.length) {
  bad += leaks.length;
  console.log('## 규칙 B 위반 — 파라미터를 읽는 화면이 고른 도시에 닿아요');
  for (const { file, path } of leaks) {
    console.log(`   - ${file}`);
    console.log(`       ${path.join('\n       → ')}`);
  }
  console.log(`\n   이 화면은 자기가 보고 있는 대상을 알고 있어요. 그런데 고른 도시까지`);
  console.log('   읽으면 둘이 어긋날 때 남의 답을 하게 돼요. lib/airport-context 의');
  console.log('   useAirportContext 를 거치세요 — 어느 쪽을 따를지 거기서 정합니다.\n');
}

if (bad === 0) {
  console.log('어긋난 곳이 없어요.');
} else {
  console.log(`어긋난 곳 ${bad}건.`);
  process.exit(1);
}
