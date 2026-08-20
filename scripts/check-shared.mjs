/**
 * 앱과 서버가 **말을 맞추고 있나.**
 *
 * ## 왜 필요한가
 *
 * 앱은 React Native, 서버는 순수 Node 다. 빌드를 같이 하지 않으니 코드를
 * 공유할 방법이 없고, 그래서 **같은 값을 양쪽에 각각 적어 둔 자리**가 있다.
 * 타입 검사도 린트도 이걸 못 본다 — 두 파일은 서로를 임포트하지 않으니
 * 컴파일러에게는 남남이다.
 *
 * 그런데 이 값들이 어긋나면 증상이 고약하다. **앱은 통과인데 서버는 거부**
 * 하는 상태가 되고, 사용자는 앱이 「인증됨」이라고 해 놓고 저장이 안 되는
 * 걸 보게 된다. 무엇을 고쳐야 하는지 알 방법이 없다.
 *
 * 실제로 옆 동네에서 같은 일이 있었다. 리뷰 판정이 서버 안에서 두 벌로
 * 갈라져 있었고, 한쪽만 「좌표가 아예 없는 경우」를 다뤘다. 사람이 눌러 볼
 * 때까지 아무도 몰랐다.
 *
 * ## 무엇을 보나
 *
 *   규칙 A. 아래 `SHARED` 에 등록한 값이 양쪽에서 같은가
 *   규칙 B. 서버가 돌려줄 수 있는 거부 사유를 앱이 전부 사람 말로 옮기는가
 *
 * 규칙 B가 더 자주 깨진다. 서버에 사유를 하나 더하는 것은 쉽고, 그때 앱의
 * switch 를 같이 고치는 것은 잊기 쉽다. 잊으면 사용자가 「잠시 뒤에 다시
 * 시도해주세요」를 보는데, 다시 시도해도 안 된다.
 *
 * 실행: npm run check:shared
 */

import { readFileSync } from 'node:fs';

/**
 * 양쪽에 각각 적혀 있는 값.
 *
 * 새로 생기면 여기 등록한다. 등록하지 않으면 이 스크립트가 모르므로, **값을
 * 두 곳에 적는 순간 여기도 한 줄 적는다**가 규칙이다.
 */
const SHARED = [
  {
    what: '위치 정확도 상한 (m)',
    why: '다르면 앱은 통과인데 서버가 거부한다. 사용자는 이유를 알 수 없다',
    sides: [
      { file: 'src/lib/reviews.ts', pattern: /MAX_ACCEPTABLE_ACCURACY_M\s*=\s*(\d+)/ },
      { file: 'server/geo.mjs', pattern: /MAX_ACCEPTABLE_ACCURACY_M\s*=\s*(\d+)/ },
    ],
  },
  {
    what: '기본 인증 반경 (m)',
    why: '장소별 반경이 없을 때 쓰는 값. 앱과 좌표 생성 스크립트가 같아야 한다',
    sides: [
      { file: 'src/lib/reviews.ts', pattern: /VERIFY_RADIUS_M\s*=\s*(\d+)/ },
      { file: 'scripts/gen-places-geo.mjs', pattern: /radiusM:\s*p\.radiusM\s*\?\?\s*(\d+)/ },
    ],
  },
];

/**
 * 서버가 돌려주지만 앱이 굳이 옮기지 않아도 되는 사유.
 *
 * 전부 **화면으로는 만들 수 없는** 것들이다 — 별점은 1~5 중에 고르게 돼
 * 있고, 본문은 입력칸이 길이를 막고, 장소와 작성자는 화면이 채운다. 이런
 * 사유가 실제로 나왔다면 그건 앱을 거치지 않은 요청이라, 일반 문구로
 * 떨어지는 편이 맞다.
 */
const GENERIC_OK = {
  'unknown-place': '화면이 장소 id 를 채우므로 앱에서는 나올 수 없다',
  rating: '별점은 1~5 중에 고르게 돼 있다',
  text: '입력칸이 길이를 막는다',
  author: '기기 id 는 앱이 항상 채운다',
};

const read = (f) => readFileSync(f, 'utf8');

let bad = 0;
console.log('앱·서버 대조\n');

// ── 규칙 A ────────────────────────────────────────────

console.log('## 양쪽에 적힌 값');
for (const { what, why, sides } of SHARED) {
  const found = sides.map(({ file, pattern }) => {
    const m = read(file).match(pattern);
    return { file, value: m?.[1] ?? null };
  });

  const missing = found.filter((f) => f.value === null);
  const values = new Set(found.map((f) => f.value));

  if (missing.length) {
    bad++;
    console.log(`   ✗ ${what} — 값을 못 찾았어요`);
    for (const m of missing) console.log(`       ${m.file} 에서 패턴이 안 맞아요`);
    console.log(`       (이름을 바꿨다면 scripts/check-shared.mjs 의 패턴도 같이 고치세요)`);
    continue;
  }

  if (values.size > 1) {
    bad++;
    console.log(`   ✗ ${what} — 값이 달라요`);
    for (const f of found) console.log(`       ${f.value.padStart(6)}  ${f.file}`);
    console.log(`       ${why}`);
    continue;
  }

  console.log(`   · ${what} = ${[...values][0]}`);
  for (const f of found) console.log(`       ${f.file}`);
}
console.log();

// ── 규칙 B ────────────────────────────────────────────

/**
 * 서버가 **리뷰를 남기는 요청에** 돌려줄 수 있는 거부 사유.
 *
 * 흐름을 잘라서 본다. `reviews.mjs` 에는 삭제 흐름도 있는데(not-found ·
 * forbidden) 그쪽은 사유를 사용자에게 보여주지 않는다 — 삭제 버튼은 자기
 * 리뷰에만 나오므로 거부가 나면 그건 앱을 거치지 않은 요청이다. 두 흐름을
 * 한 자루에 담으면 삭제 사유가 제출 문구에 없다고 잘못 걸린다.
 */
function serverReasons() {
  const code = read('server/reviews.mjs');
  const from = code.indexOf('function verify');
  const to = code.indexOf('export async function remove');
  if (from < 0 || to < 0 || to <= from) {
    console.error('reviews.mjs 에서 제출 흐름을 못 찾았어요 — scripts/check-shared.mjs 를 고치세요');
    process.exit(2);
  }

  const out = new Set();
  for (const chunk of [code.slice(from, to), read('server/geo.mjs')]) {
    for (const m of chunk.matchAll(/reason:\s*'([a-z-]+)'/g)) out.add(m[1]);
    for (const m of chunk.matchAll(/\{\s*error:\s*'([a-z-]+)'\s*\}/g)) out.add(m[1]);
  }
  return out;
}

/** 앱이 사람 말로 옮기는 사유 */
function appCases() {
  const code = read('src/lib/reviews.ts');
  const fn = code.slice(code.indexOf('export function submitErrorMessage'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  return new Set([...body.matchAll(/case\s*'([a-z-]+)'/g)].map((m) => m[1]));
}

const reasons = serverReasons();
const handled = appCases();

console.log('## 서버가 돌려주는 거부 사유');
const unhandled = [];
for (const r of [...reasons].sort()) {
  if (handled.has(r)) console.log(`   · ${r}`);
  else if (r in GENERIC_OK) console.log(`   · ${r} — 일반 문구로 (${GENERIC_OK[r]})`);
  else unhandled.push(r);
}

// 앱에만 있는 case 도 알려준다 — 서버에서 없앤 사유가 남아 있는 것이다
const stale = [...handled].filter((r) => !reasons.has(r) && r !== 'duplicate');
console.log();

if (unhandled.length) {
  bad += unhandled.length;
  console.log('## 앱이 옮기지 않은 사유');
  for (const r of unhandled) console.log(`   - ${r}`);
  console.log('\n   src/lib/reviews.ts 의 submitErrorMessage 에 case 를 더하세요.');
  console.log('   화면으로는 만들 수 없는 사유라면 이 스크립트의 GENERIC_OK 에');
  console.log('   이유와 함께 올리면 됩니다.\n');
}

if (stale.length) {
  console.log('## 서버에 없는 사유를 앱이 들고 있어요 (지워도 되는지 보세요)');
  for (const r of stale) console.log(`   - ${r}`);
  console.log();
}

if (bad === 0) {
  console.log('말이 맞아요.');
} else {
  console.log(`어긋난 곳 ${bad}건.`);
  process.exit(1);
}
