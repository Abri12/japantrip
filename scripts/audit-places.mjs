/**
 * 가게가 **아직 거기 있나** — 원본과 자동으로 대조한다.
 *
 * ## 왜 필요한가
 *
 * 이 앱의 장소 데이터는 파일에 박혀 있다. 박아 둔 값은 스스로 갱신되지 않는데,
 * **가게 정보는 이 앱에서 제일 빨리 썩는다.** 요금 개정은 1년에 한 번 예고하고
 * 오지만, 가게는 예고 없이 휴일을 바꾸고 문을 닫는다.
 *
 * 그러면 남는 방법이 「반년에 한 번 사람이 전부 다시 본다」인데, 그건 지속되지
 * 않는다. 기억에 맡긴 점검은 두어 번 하다가 멈추고, 멈춘 뒤로는 **틀린 값과
 * 맞는 값이 화면에서 똑같이 생겼다.** 사용자는 둘을 구분할 방법이 없다.
 *
 * 그래서 사람이 기억하지 않아도 되게 만든다. 이 스크립트가 원본을 다시 보고
 * **달라진 것만** 알려준다. 달라진 게 없으면 아무 말도 안 한다 — 매번 뭔가
 * 출력하면 그 보고를 통째로 흘려보게 되기 때문이다.
 *
 * ## 무엇을 잡나
 *
 *   ① 사라짐        노드가 없어졌다 → **폐업일 가능성이 높다.** 가장 중요하다
 *   ② 이동          좌표가 크게 움직였다 → 이전했거나 우리 좌표가 틀렸다
 *   ③ 영업시간 변경  OSM 의 opening_hours 가 우리가 적어 둔 것과 어긋난다
 *   ④ 이름 변경      간판이 바뀌었다 → 주인이 바뀌었을 수 있다
 *
 * ## 무엇을 못 잡나 — 이게 더 중요하다
 *
 * OSM 은 자원봉사자가 만드는 지도다. **여기서 「이상 없음」이 「사실 확인됨」을
 * 뜻하지 않는다.** 문 닫은 가게가 몇 달씩 지도에 남아 있기도 하다.
 *
 * 그러니 이 스크립트는 **틀린 것을 찾아 주는 도구이지, 맞다고 보증하는 도구가
 * 아니다.** 현금만 받는지·예약이 필요한지·줄이 얼마나 긴지는 애초에 지도에
 * 없어서, 그건 여전히 사람이 본다(`npm run audit:data` 가 6개월마다 알려준다).
 *
 * ## 왜 구글맵이 아니고 OSM 인가
 *
 * 구글맵 정보가 더 정확한 건 맞다. 그런데 Places API 는 **받아온 값을 파일에
 * 저장해 두는 것을 약관으로 금지**한다(장소 id 를 뺀 나머지는 30일 초과 캐싱
 * 불가). 영업시간을 `.ts` 에 박아 정적 배포하는 이 앱의 구조와 정면으로
 * 어긋난다. 게다가 호출마다 과금되고, 키를 두려면 서버를 반드시 거쳐야 한다.
 *
 * OSM 은 ODbL 이라 출처만 밝히면 이렇게 쓸 수 있다. 대신 정확도가 떨어지는
 * 것을 위의 「못 잡는 것」으로 감수한다.
 *
 * 사용자에게는 어차피 **구글맵 링크로 최신 정보를 보내고 있다**(장소 화면의
 * 「구글맵에서 보기」). 이 스크립트는 그 링크를 누르기 전에 우리가 먼저
 * 틀린 걸 알아채자는 장치다.
 *
 * 실행:  npm run audit:places
 *        npm run audit:places -- --json    (자동화용)
 */

import { execSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

const JSON_OUT = process.argv.includes('--json');

/** 좌표가 이만큼 넘게 움직였으면 알린다 (m). GPS 오차가 아니라 이전을 본다 */
const MOVED_M = 120;

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

/**
 * 공개 오버패스 서버는 자주 504·429 를 낸다.
 *
 * 한 번 실패했다고 「사라짐」으로 보고하면 **가장 심각한 경고가 가짜로**
 * 뜬다. 그런 일이 두어 번 반복되면 사람이 이 보고를 안 믿게 되고, 그때부터
 * 이 스크립트는 없는 것과 같아진다. 그래서 서버를 돌아가며 세 바퀴 돈다.
 */
async function overpass(query) {
  let last = '';
  for (let round = 0; round < 3; round++) {
    for (const url of ENDPOINTS) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(query),
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': 'JapanTrip/1.0 place audit (github Abri12/japantrip)',
          },
        });
        if (r.ok) return (await r.json()).elements;
        last = `${url} → ${r.status}`;
      } catch (e) {
        last = `${url} → ${e.message}`;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error(`오버패스에 닿지 못했어요: ${last}`);
}

/**
 * 앱 데이터에서 osmId 가 있는 장소만 뽑는다.
 *
 * `tsx -e` 로 넘기지 않고 임시 파일에 쓴다 — 윈도우 셸이 여러 줄 인자를 물고
 * 늘어져서 빈 출력이 돌아온다. `scripts/gen-places-geo.mjs` 도 같은 방식이다.
 */
function loadPlaces() {
  const script = `
import { PLACES } from './src/data/places';
process.stdout.write(JSON.stringify(PLACES.filter((p) => p.osmId).map((p) => ({
  id: p.id, name: p.name, nameJa: p.nameJa, osmId: p.osmId,
  lat: p.lat, lng: p.lng, hours: p.local?.hours ?? null, closed: p.local?.closed ?? null,
}))));
`;
  writeFileSync('.audit-places.ts', script);
  try {
    return JSON.parse(
      execSync('npx tsx .audit-places.ts', { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }),
    );
  } finally {
    rmSync('.audit-places.ts', { force: true });
  }
}

const metres = (a, b) => Math.round(Math.hypot((a.lat - b.lat) * 111_000, (a.lng - b.lng) * 91_000));

/**
 * 문장에서 시각만 뽑는다.
 *
 * 정확히 비교할 수 없다. 우리는 사람이 읽는 한국어(「11:00~22:30 안팎」)를 쓰고
 * OSM 은 기계용 문법(`Mo-Su 11:00-22:30`)을 쓴다. 그래서 시각만 뽑아서 견준다.
 */
function timesOf(text) {
  if (!text) return null;
  const found = [...String(text).matchAll(/(\d{1,2}):(\d{2})/g)].map(
    (m) => String(Number(m[1]) % 24).padStart(2, '0') + ':' + m[2],
  );
  return found.length ? new Set(found) : null;
}

/**
 * 영업시간이 **달라졌나** — 「똑같나」가 아니다.
 *
 * ## 왜 같은지를 안 보나
 *
 * 처음에는 시각 집합이 정확히 같은지 봤다. 그랬더니 **맞는 항목이 무더기로
 * 걸렸다.** 우리 문장이 지도보다 자세하기 때문이다:
 *
 *     우리  「9:00~16:30 (입장은 16:00까지)」   → 9:00 · 16:30 · 16:00
 *     지도  「09:00-16:30」                     → 9:00 · 16:30
 *
 * 두 값은 어긋난 게 아니다. 우리 쪽에 **마감 입장 시각이 하나 더 적혀 있을
 * 뿐**이고, 그건 여행자에게 오히려 필요한 정보다. 그런데 매달 「영업시간이
 * 달라요」로 뜬다.
 *
 * 이런 가짜 경고가 몇 번 반복되면 사람이 이 보고를 통째로 흘려보게 된다.
 * 그러면 진짜 폐업 경고도 같이 묻힌다 — 이 스크립트를 만든 이유가 통째로
 * 사라지는 셈이다.
 *
 * ## 그래서 한쪽만 본다
 *
 * **지도에 있는 시각을 우리가 다 담고 있나**만 본다. 우리 쪽에 더 적혀 있는
 * 것은 넘어간다.
 *
 *   · 가게가 22:00 → 21:00 으로 당기면 지도에 21:00 이 생기고 우리에겐 없다 → 잡힌다
 *   · 주말에 10:30 부터 열기 시작하면 지도에 10:30 이 생긴다 → 잡힌다
 *   · 우리가 「입장 마감 16:00」을 덧붙여 적는다 → 안 잡힌다
 *
 * **못 잡는 경우**도 분명히 있다. 가게가 있던 시간대를 없앴는데 우리가 그걸
 * 그대로 들고 있으면, 지도 쪽이 부분집합이라 조용히 지나간다. 그건 감수한다 —
 * 낡은 줄 하나가 남는 것보다 **도구를 안 믿게 되는 쪽이 훨씬 비싸다.**
 */
function hoursDrifted(ours, theirs) {
  if (!ours || !theirs) return false;
  for (const t of theirs) if (!ours.has(t)) return true;
  return false;
}

// ── 실행 ───────────────────────────────────────────────

const places = loadPlaces();
if (!places.length) {
  console.log('osmId 가 달린 장소가 없어요. 대조할 것이 없습니다.');
  process.exit(0);
}

const ids = places.map((p) => p.osmId);
const query = `[out:json][timeout:180];
(
${ids.map((i) => `  ${i.startsWith('way/') ? 'way' : i.startsWith('relation/') ? 'relation' : 'node'}(${i.split('/')[1]});`).join('\n')}
);
out center tags;`;

const found = new Map();
for (const e of await overpass(query)) {
  found.set(`${e.type}/${e.id}`, {
    lat: e.lat ?? e.center?.lat,
    lng: e.lon ?? e.center?.lon,
    tags: e.tags ?? {},
  });
}

const findings = [];
for (const p of places) {
  const hit = found.get(p.osmId);

  // ① 사라짐 — 폐업 신호. 제일 무겁다
  if (!hit) {
    findings.push({
      level: 'high',
      id: p.id,
      what: '지도에서 사라졌어요',
      detail: `${p.osmId} 가 더는 없어요 — 폐업했거나 다른 항목으로 합쳐졌을 수 있어요`,
      action: '구글맵에서 영업 여부를 확인하고, 닫았으면 이 장소를 지우세요',
    });
    continue;
  }

  // ② 이동
  const moved = metres(p, hit);
  if (moved > MOVED_M) {
    findings.push({
      level: 'high',
      id: p.id,
      what: `좌표가 ${moved}m 움직였어요`,
      detail: `우리 ${p.lat},${p.lng} → 지도 ${hit.lat?.toFixed(4)},${hit.lng?.toFixed(4)}`,
      action: '이전했는지 확인하고 lat·lng 를 고치세요 (현장 인증이 실패하게 돼요)',
    });
  }

  // ③ 영업시간
  const ours = timesOf(p.hours);
  const theirs = timesOf(hit.tags.opening_hours);
  if (hoursDrifted(ours, theirs)) {
    findings.push({
      level: 'medium',
      id: p.id,
      what: '영업시간이 달라요',
      detail: `우리 「${p.hours}」 · 지도 「${hit.tags.opening_hours}」`,
      action: '확인해서 local.hours 와 checkedAt 을 고치세요',
    });
  }

  // ④ 이름
  const nameJa = (p.nameJa ?? '').replace(/\s/g, '');
  const mapName = (hit.tags.name ?? '').replace(/\s/g, '');
  if (mapName && nameJa && !nameJa.includes(mapName) && !mapName.includes(nameJa)) {
    findings.push({
      level: 'low',
      id: p.id,
      what: '간판 이름이 달라요',
      detail: `우리 「${p.nameJa}」 · 지도 「${hit.tags.name}」`,
      action: '주인이 바뀌었을 수 있어요. 같은 가게가 맞는지 보세요',
    });
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({ checked: places.length, findings }, null, 2));
  process.exit(0);
}

const RANK = { high: 0, medium: 1, low: 2 };
const MARK = { high: '✗', medium: '·', low: '·' };

console.log(`장소 원본 대조 · ${new Date().toISOString().slice(0, 10)}`);
console.log(`대조한 곳 ${places.length}곳 (osmId 가 있는 장소만)\n`);

if (!findings.length) {
  console.log('달라진 곳이 없어요.');
  console.log('\n다만 OSM 은 자원봉사 지도라 「이상 없음」이 「확인됨」은 아니에요.');
  console.log('현금만 받는지·예약이 필요한지는 여기서 안 보이니 사람이 봐야 해요.');
  process.exit(0);
}

findings.sort((a, b) => RANK[a.level] - RANK[b.level]);
for (const f of findings) {
  console.log(`${MARK[f.level]} ${f.id} — ${f.what}`);
  console.log(`    ${f.detail}`);
  console.log(`    → ${f.action}\n`);
}

const high = findings.filter((f) => f.level === 'high').length;
console.log(`달라진 곳 ${findings.length}건${high ? ` (그중 급한 것 ${high}건)` : ''}.`);

// 급한 것이 있을 때만 실패로 끝낸다 — 영업시간 표기 차이로 CI 를 빨갛게
// 만들면, 빨간 CI 가 일상이 되어 아무도 안 본다.
process.exit(high ? 1 : 0);
