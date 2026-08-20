/**
 * 화면이 실제로 그려지나 — 내보낸 HTML 을 읽어서 본다.
 *
 * ## 왜 브라우저 없이 되나
 *
 * `expo export` 는 화면을 **미리 그려서** HTML 로 낸다. 그래서 파일을 열어
 * 글자가 있는지 보는 것만으로 「이 화면이 내용을 그렸나」를 알 수 있다.
 *
 * 이 앱에서 가장 나쁜 실패가 **흰 화면**이다. 여행 중에 앱이 안 열리면 그건
 * 앱이 없는 것과 같고, 사용자는 왜 그런지 알 수 없다. 오류 그물을 붙여 그런
 * 화면에도 「다시 열어보기」가 나오게 했지만, 애초에 안 나게 하는 편이 낫다.
 *
 * ## 화면이 세 종류다
 *
 * 미리 그리는 시점에는 **저장소도 네트워크도 없다.** 그래서 화면마다 나오는
 * 것이 다르고, 한 잣대로 재면 멀쩡한 화면이 실패로 잡힌다.
 *
 *   static    내용이 그대로 나온다 — 공항·이동수단·관광처럼 데이터가 앱 안에
 *             있는 화면. 여기가 비면 진짜 문제다.
 *   stateful  **빈 상태**가 나온다 — 홈·날씨·내 일정처럼 「고른 도시」나
 *             저장한 값이 있어야 내용이 생기는 화면. 빈 것이 정상이고,
 *             대신 **안내 문구가 제대로 나오는지**를 본다.
 *   dynamic   파라미터가 있어야 한다 — `airport/[id]` 같은 것. 여기는 비는 게
 *             맞고 검사할 것이 없다.
 *
 * ## 무엇을 못 보나
 *
 * **눌러야 나오는 것.** 거점을 고르고 다음 화면으로 넘어가는 흐름은 안 보인다 —
 * 후쿠오카 공항에서 나리타 시각이 나오던 버그가 그런 종류였다. 그건 사람이
 * 눌러 보거나 브라우저를 자동으로 몰아야 잡힌다.
 *
 * 그러니 이 검사는 **바닥을 받치는 것**이지 천장이 아니다. 「적어도 흰 화면은
 * 아니다」를 매 배포마다 확인한다.
 *
 * 실행: npm run check:screens   (npm run build:web 뒤에)
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const DIST = 'dist';

/** 내용이 있어야 하는 화면의 최소 글자 수. 제목만 그려진 것을 걸러낸다 */
const MIN_TEXT = 120;

/**
 * 화면마다 무엇을 기대하나.
 *
 * `kind` 는 위 세 종류. `must` 는 그 화면에 반드시 있어야 할 말이다.
 * 글자 수만 보면 「제목만 그려지고 본문이 비었다」를 못 잡는다 — 실제로
 * 며칠째 선택이 1일차만 나오던 버그가 그런 모양이었다.
 */
const SCREENS = {
  // ── 내용이 그대로 나오는 화면 ─────────────────────
  'airports.html': { kind: 'static', must: ['공항', '나리타', '간사이'] },
  'transit.html': { kind: 'static', must: ['이동수단', '패스'] },
  'places.html': { kind: 'static', must: ['관광'] },
  'safety.html': { kind: 'static', must: ['안전'] },
  'departure.html': { kind: 'static', must: ['귀국하는 날', '몇 시에 나서야 하나요'] },
  'prep.html': { kind: 'static', must: ['여행 준비'] },
  'packing.html': { kind: 'static', must: ['준비물'] },
  'entry-guide.html': { kind: 'static', must: ['입국'] },
  'tax-free.html': { kind: 'static', must: ['면세'] },
  'etiquette.html': { kind: 'static', must: ['예절'] },
  'privacy.html': { kind: 'static', must: ['개인정보'] },
  'licenses.html': { kind: 'static', must: ['라이선스'] },
  'roadmap.html': { kind: 'static', must: ['로드맵'] },
  'rewards.html': { kind: 'static', must: ['크레딧'] },
  'pick.html': { kind: 'static', must: ['못 정하겠'] },

  // 탭 묶음 아래로도 같은 화면이 나온다. 둘 다 확인한다 — 한쪽만 깨질 수 있다.
  '(tabs)/airports.html': { kind: 'static', must: ['공항', '나리타'] },
  '(tabs)/transit.html': { kind: 'static', must: ['이동수단'] },
  '(tabs)/places.html': { kind: 'static', must: ['관광'] },
  '(tabs)/safety.html': { kind: 'static', must: ['안전'] },

  // ── 저장된 값이 있어야 내용이 생기는 화면 ──────────
  //
  // 빈 것이 정상이다. 대신 **안내가 제대로 나오는지**를 본다 — 여기가 비면
  // 사용자는 아무 설명 없는 화면을 보게 된다.
  'index.html': { kind: 'stateful', must: ['홈', '공항', '이동'] },
  '(tabs)/index.html': { kind: 'stateful', must: ['홈', '공항', '이동'] },
  'weather.html': { kind: 'stateful', must: ['도시를 골라'] },
  'itinerary.html': { kind: 'stateful', must: ['저장한 곳이 없어요'] },

  // ── 파라미터가 있어야 하는 화면 ────────────────────
  'airport/[id].html': { kind: 'dynamic' },
  'place/[id].html': { kind: 'dynamic' },
  'course/[id].html': { kind: 'dynamic' },

  // ── 그 밖 ─────────────────────────────────────────
  '404.html': { kind: 'dynamic' }, // 클라이언트 라우팅 폴백이라 비어 있는 게 맞다
  '+not-found.html': { kind: 'dynamic' },
  '_sitemap.html': { kind: 'dynamic' }, // expo-router 가 만드는 목록
};

/** 그려지다 만 흔적 */
const CRASH_MARKS = [
  '화면을 그리지 못했어요', // 우리 오류 그물이 잡은 화면
  'Unexpected token',
  'ReferenceError',
  'TypeError:',
];

if (!existsSync(DIST)) {
  console.error('dist 가 없어요. npm run build:web 을 먼저 돌리세요.');
  process.exit(2);
}

function htmlFiles(dir, base = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full, rel));
    else if (name.endsWith('.html')) out.push({ rel: rel.split(sep).join('/'), full });
  }
  return out;
}

/** 스크립트·스타일을 걷어내고 사람이 읽는 글자만 남긴다 */
function visibleText(html) {
  const body = html.slice(html.indexOf('<body'));
  return body
    .replace(/<script[^]*?<\/script>/g, ' ')
    .replace(/<style[^]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const files = htmlFiles(DIST);
const problems = [];

console.log(`화면 점검 · ${files.length}개\n`);

for (const { rel, full } of files) {
  const text = visibleText(readFileSync(full, 'utf8'));
  const spec = SCREENS[rel];
  const issues = [];

  if (!spec) {
    issues.push('목록에 없는 화면이에요 — scripts/check-screens.mjs 의 SCREENS 에 등록하세요');
  } else if (spec.kind !== 'dynamic') {
    if (spec.kind === 'static' && text.length < MIN_TEXT) {
      issues.push(`내용이 ${text.length}자뿐이에요 — 흰 화면일 수 있어요`);
    }
    for (const word of spec.must ?? []) {
      if (!text.includes(word)) issues.push(`「${word}」가 안 보여요`);
    }
  }

  for (const mark of CRASH_MARKS) {
    if (text.includes(mark)) issues.push(`그려지다 만 흔적: ${mark}`);
  }

  if (issues.length) {
    problems.push(rel);
    console.log(`   ✗ ${rel}`);
    for (const i of issues) console.log(`       ${i}`);
  } else {
    const tag = spec?.kind === 'dynamic' ? '파라미터 필요' : `${text.length}자`;
    console.log(`   · ${rel} (${tag})`);
  }
}

/* 목록에 있는데 안 나온 화면 — 라우트가 통째로 빠졌다는 뜻이다 */
const seen = new Set(files.map((f) => f.rel));
const missing = Object.keys(SCREENS).filter((k) => !seen.has(k));
if (missing.length) {
  console.log('\n## 내보내지지 않은 화면');
  for (const m of missing) console.log(`   - ${m}`);
  problems.push(...missing);
}

console.log();
if (problems.length === 0) {
  console.log('전부 그려졌어요.');
} else {
  console.log(`문제 있는 화면 ${problems.length}개.`);
  process.exit(1);
}
