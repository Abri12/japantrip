/**
 * 웹 미리보기 빌드.
 *
 * `expo export` 만으로는 GitHub Pages 에 올렸을 때 두 가지가 빠진다.
 *
 *  ① **.nojekyll** — Pages 는 기본으로 Jekyll 을 거치는데, Jekyll 은 밑줄로
 *     시작하는 폴더를 내부용으로 보고 감춘다. 번들이 `_expo/` 아래에 있어서
 *     이 파일이 없으면 자바스크립트를 통째로 못 찾아 흰 화면만 뜬다.
 *
 *  ② **문서 제목** — 화면 제목은 `_layout.tsx` 에 다 적어 뒀지만, 탭 화면은
 *     NativeTabs 가 렌더링해서 웹 문서 제목까지 내려오지 않는다. 결과적으로
 *     `<title>` 이 빈 채로 나가고, 브라우저 탭에는 주소만 보인다.
 *
 * 둘 다 내보낸 뒤에 손대야 하는 일이라 스크립트로 묶었다. 손으로 고치면 다음
 * 배포 때 그대로 되돌아간다.
 */

import { execSync } from 'node:child_process';
import { copyFileSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SITE = '일본 여행 안전 가이드';

/** 경로 → 제목. `_layout.tsx` 의 Stack.Screen 제목과 맞춰 둔다. */
const TITLES = {
  'index.html': SITE,
  '(tabs)/index.html': SITE,
  // expo-router 가 자동으로 만드는 경로 목록 페이지. 우리가 만든 화면은
  // 아니지만 내보내기에 섞여 나가므로, 빈 제목으로 나가지 않게 등록해 둔다.
  '_sitemap.html': '전체 화면 목록',
  '(tabs)/airports.html': '공항에서 시내로',
  '(tabs)/transit.html': '교통',
  '(tabs)/places.html': '관광 · 맛집',
  '(tabs)/safety.html': '안전',
  'airports.html': '공항에서 시내로',
  'transit.html': '교통',
  'places.html': '관광 · 맛집',
  'safety.html': '안전',
  'weather.html': '오늘 날씨',
  'prep.html': '여행 준비',
  'packing.html': '여행 준비물',
  'departure.html': '귀국하는 날',
  'pick.html': '못 정하겠을 때',
  'privacy.html': '개인정보처리방침',
  'licenses.html': '오픈소스 라이선스',
  'etiquette.html': '현지 예절 · 생존 회화',
  'entry-guide.html': '입국 심사 · 세관 신고',
  'tax-free.html': '면세 계산기',
  'roadmap.html': '오픈 로드맵',
  'rewards.html': '크레딧',
  'itinerary.html': '내 일정',
  'airport/[id].html': '공항',
  'place/[id].html': '관광 · 맛집',
  'course/[id].html': '추천 코스',
  '+not-found.html': '없는 페이지',
};

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

console.log('웹 번들 내보내는 중…');
/*
 * 어느 빌드에서 난 오류인지 알 수 있게 버전을 번들에 넣는다.
 *
 * 크래시 보고를 받았을 때 가장 먼저 묻는 것이 「어느 판에서 났나」다. 없으면
 * 이미 고친 오류가 계속 올라오는 건지 새 오류인지 구분이 안 된다.
 *
 * `app.json` 의 version 에 커밋 해시를 붙인다. 버전은 자주 안 올리는데 배포는
 * 자주 하므로, 해시가 있어야 실제로 구분이 된다.
 */
const appJson = JSON.parse(readFileSync('app.json', 'utf8'));
let sha = 'local';
try {
  sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  // 저장소가 아니거나 git 이 없다. 버전만으로도 없는 것보다 낫다.
}
const buildVersion = `${appJson.expo?.version ?? '0'}+${sha}`;
console.log(`빌드 버전: ${buildVersion}`);

execSync('npx expo export --platform web --clear', {
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_APP_VERSION: buildVersion },
});

writeFileSync(join(DIST, '.nojekyll'), '');
console.log('.nojekyll 생성');

// gh-pages 는 이 dist 를 통째로 올리는 브랜치라 소스 쪽 .gitattributes 가 닿지
// 않는다. 그래서 배포할 때마다 파일 하나당 「LF will be replaced by CRLF」
// 경고가 한 줄씩 찍혔다(윈도우 core.autocrlf=true). 빌드 산출물과 함께 내보내
// 그 소음을 없앤다.
writeFileSync(join(DIST, '.gitattributes'), '* text=auto eol=lf\n');
console.log('.gitattributes 생성');

let filled = 0;
/*
 * 상세 화면 제목은 **데이터에서 뽑는다.**
 *
 * 위 TITLES 는 화면 하나에 한 줄씩 손으로 적은 표다. 화면이 스무 개일 때는
 * 됐는데, 상세 화면을 미리 그리기 시작하면서 장소 108개·공항 9개·코스 8개가
 * 한꺼번에 들어왔다. 그걸 표에 옮겨 적으면 **장소를 하나 더할 때마다 여기도
 * 고쳐야 하고, 언젠가 반드시 빠뜨린다.**
 *
 * 그래서 상세 화면만 데이터에서 뽑아 합친다. 장소가 몇 개로 늘어도 손댈
 * 곳이 없다. (`gen-places-geo.mjs` 와 같은 방식이다)
 */
function detailTitles() {
  const script = `
import { PLACES } from './src/data/places';
import { AIRPORTS } from './src/data/airports';
import { COURSES } from './src/data/courses';
const out = {};
for (const p of PLACES) out['place/' + p.id + '.html'] = p.name + ' · ' + p.city;
for (const a of AIRPORTS) out['airport/' + a.id + '.html'] = a.name + ' (' + a.code + ')';
for (const c of COURSES) out['course/' + c.id + '.html'] = c.title;
process.stdout.write(JSON.stringify(out));
`;
  writeFileSync('.gen-titles.ts', script);
  try {
    return JSON.parse(
      execSync('npx tsx .gen-titles.ts', { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }),
    );
  } finally {
    unlinkSync('.gen-titles.ts');
  }
}

const ALL_TITLES = { ...TITLES, ...detailTitles() };

let missing = [];

for (const file of htmlFiles(DIST)) {
  const key = relative(DIST, file).split('\\').join('/');
  const title = ALL_TITLES[key];

  if (!title) {
    missing.push(key);
    continue;
  }

  const html = readFileSync(file, 'utf8');
  // 비어 있을 때만 채운다. 화면이 스스로 제목을 넣었다면 그쪽이 더 정확하다.
  const next = html.replace(
    /<title([^>]*)><\/title>/,
    `<title$1>${key === 'index.html' || key === '(tabs)/index.html' ? title : `${title} · ${SITE}`}</title>`,
  );

  if (next !== html) {
    writeFileSync(file, next);
    filled++;
  }
}

console.log(`제목 채움: ${filled}개`);

/*
 * 404.html — 주소를 직접 친 사람을 위한 폴백.
 *
 * 정적 내보내기는 동적 경로를 `airport/[id].html` **파일 하나**로만 만든다.
 * 대괄호가 파일 이름에 그대로 들어가 있어서, 누가 주소창에
 * `/japantrip/airport/kix` 를 치면 Pages 는 그런 파일이 없다며 404 를 준다.
 * 앱 안에서 눌러 들어가는 건 클라이언트 라우팅이라 멀쩡한데, **링크를 공유
 * 받은 사람**과 즐겨찾기로 다시 여는 사람만 막힌다.
 *
 * Pages 는 못 찾은 주소에 `404.html` 을 대신 준다. 거기에 index 와 같은 앱을
 * 넣어 두면, 앱이 뜬 뒤 주소를 읽어 알맞은 화면을 그린다. 자산 경로가 전부
 * `/japantrip/...` 로 절대 경로라 어느 깊이에서 열려도 깨지지 않는다.
 *
 * 서버 설정을 못 건드리는 Pages 에서 쓰는 표준 수법이다. 응답 코드는 404 로
 * 남지만(검색엔진에는 그 편이 정직하다) 사람에게는 화면이 제대로 뜬다.
 *
 * 제목을 채운 **뒤에** 복사한다. 먼저 복사하면 빈 제목인 index 를 베껴서
 * 브라우저 탭에 주소만 뜬다.
 */
copyFileSync(join(DIST, 'index.html'), join(DIST, '404.html'));
console.log('404.html 폴백 생성');
if (missing.length) {
  // 새 화면을 추가하고 여기 등록하지 않으면 제목이 빈 채로 나간다. 조용히
  // 넘어가면 알아채지 못하므로 이름을 찍어 준다.
  console.log(`제목 미등록(빈 제목으로 나감): ${missing.join(', ')}`);
}
