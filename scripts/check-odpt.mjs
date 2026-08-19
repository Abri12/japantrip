/**
 * ODPT 키 점검 — 「키를 넣으면 실제로 뭐가 늘어나나」에 답한다.
 *
 * 키를 넣고 서버를 띄워도 화면만 봐서는 넓어졌는지 알기 어렵다. 평상시에는
 * 전 노선이 「지연 없음」이라 키가 있든 없든 화면이 똑같이 조용하기 때문이다.
 * 그래서 **사업자와 노선 수를 직접 세어** 보여준다.
 *
 * 실행
 *
 *   npm run check:odpt              .env 의 ODPT_TOKEN 을 쓴다
 *   ODPT_TOKEN=xxx npm run check:odpt
 *   npm run check:odpt -- xxx       인자로 바로
 *
 * 키가 없어도 돌아간다 — 그때는 키 없이 받는 범위를 보여주고, 키를 넣으면
 * 무엇이 늘어나는지 알려준다.
 */

/*
 * .env 를 읽는다. Node 22 부터 내장이라 의존성이 필요 없다.
 * 파일이 없어도 그냥 넘어간다 — 환경변수로 직접 줄 수도 있다.
 */
try {
  process.loadEnvFile('.env');
} catch {
  // .env 가 없다. 아래에서 환경변수·인자를 본다.
}

const token = process.argv[2] || process.env.ODPT_TOKEN;

const PUBLIC_URL = 'https://api-public.odpt.org/api/v4/odpt:TrainInformation';
const KEYED_URL = (t) => `https://api.odpt.org/api/v4/odpt:TrainInformation?acl:consumerKey=${t}`;

/** 이 앱이 도쿄에서 쓰는 사업자 — 키가 이걸 열어주는지가 관심사다 */
const WANTED = {
  Toei: '도에이 지하철',
  TokyoMetro: '도쿄메트로',
  'JR-East': 'JR 동일본',
};

async function fetchInfo(url, label) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(
      res.status === 401 || res.status === 403
        ? `키가 거부됐어요 (HTTP ${res.status}). 토큰을 다시 확인해주세요.`
        : `HTTP ${res.status}`,
    );
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('예상과 다른 응답이에요');
  console.log(`${label}: 노선 ${data.length}개`);
  return data;
}

/** 사업자별로 몇 노선인지, 지금 이상이 있는지 */
function summarize(items) {
  const byOp = new Map();
  for (const x of items) {
    const op = String(x['odpt:operator'] ?? '').replace('odpt.Operator:', '');
    const cur = byOp.get(op) ?? { lines: 0, abnormal: 0 };
    cur.lines++;
    if (x['odpt:trainInformationStatus']) cur.abnormal++;
    byOp.set(op, cur);
  }
  return byOp;
}

console.log('ODPT 운행정보 점검\n');

let publicOps;
try {
  publicOps = summarize(await fetchInfo(PUBLIC_URL, '키 없이 (api-public)'));
  for (const [op, v] of publicOps) {
    console.log(`   ${(WANTED[op] ?? op).padEnd(14)} ${v.lines}개 노선` + (v.abnormal ? ` · 이상 ${v.abnormal}건` : ''));
  }
} catch (err) {
  console.log('키 없이: 실패 —', err.message);
  publicOps = new Map();
}

console.log();

if (!token) {
  console.log('키 없음 — ODPT_TOKEN 이 설정되지 않았어요.\n');
  console.log('키를 넣으면 늘어나는 것');
  for (const [op, name] of Object.entries(WANTED)) {
    if (!publicOps.has(op)) console.log(`   + ${name}`);
  }
  console.log('\n발급: https://developer.odpt.org 에서 개발자 등록 (무료 · 상업 이용 가능)');
  console.log('넣는 곳: .env 의 ODPT_TOKEN=');
  process.exit(0);
}

try {
  const keyed = summarize(await fetchInfo(KEYED_URL(token), '키 사용 (api.odpt.org)'));

  for (const [op, v] of [...keyed].sort((a, b) => b[1].lines - a[1].lines)) {
    const isNew = !publicOps.has(op);
    console.log(
      `   ${isNew ? '+' : ' '} ${(WANTED[op] ?? op).padEnd(14)} ${v.lines}개 노선` +
        (v.abnormal ? ` · 이상 ${v.abnormal}건` : ''),
    );
  }

  const gained = [...keyed.keys()].filter((op) => !publicOps.has(op));
  const gainedLines = gained.reduce((n, op) => n + keyed.get(op).lines, 0);

  console.log();
  if (gained.length === 0) {
    console.log('키를 썼는데 늘어난 사업자가 없어요. 토큰이 맞는지 확인해주세요.');
    process.exit(1);
  }
  console.log(`키가 동작해요 — 사업자 ${gained.length}곳 · 노선 ${gainedLines}개가 늘었어요.`);

  // 이 앱이 실제로 쓰는 셋이 다 들어왔는지가 최종 확인이다.
  const missing = Object.keys(WANTED).filter((op) => !keyed.has(op));
  if (missing.length) {
    console.log(`아직 안 잡히는 곳: ${missing.map((m) => WANTED[m]).join(', ')}`);
  } else {
    console.log('앱이 도쿄에서 쓰는 세 사업자가 모두 잡혀요.');
  }
  console.log('\n서버를 다시 띄우면 반영돼요: npm run server');
} catch (err) {
  console.log('키 사용: 실패 —', err.message);
  process.exit(1);
}
