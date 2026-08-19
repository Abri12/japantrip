/**
 * 데이터 점검 — 「지금 무엇을 다시 봐야 하나」에 답한다.
 *
 * ## 왜 필요한가
 *
 * 이 앱의 값은 대부분 **남이 정하는 것**이다. 요금은 사업자가 개정하고,
 * 첫차는 다이어 개정으로 움직이고, 가게는 문 여는 시간을 바꾼다. 코드가
 * 멀쩡해도 데이터는 가만히 있는 채로 틀려 간다 — 테스트도 타입 검사도
 * 이걸 잡지 못한다.
 *
 * 「확인하지 않은 값은 넣지 않는다」가 이 앱의 규칙이었다. 그 규칙의 운영판이
 * 이 스크립트다 — **확인이 낡았다는 사실을 사람이 기억하지 않아도 되게 한다.**
 *
 * ## 무엇을 보나
 *
 *   ① 확인이 오래된 항목      checkedAt 이 기준 개월을 넘긴 것
 *   ② 확인 못 한 값           verified: false
 *   ③ 코드에 남긴 재확인 표시   주석의 「⚠ … 재확인」
 *   ④ 지나간 개정 예정일       아래 KNOWN_REVISIONS
 *
 * ## 왜 종료 코드로 실패시키지 않나
 *
 * 데이터가 낡은 것은 **버그가 아니라 할 일**이다. 배포를 막으면 급한 수정을
 * 못 내보내게 되고, 그러면 이 검사를 꺼 버리게 된다. 목록을 보여주고 끝낸다 —
 * 정기 실행이 그걸 이슈로 만들어 잊지 않게 한다(.github/workflows/data-audit.yml).
 *
 * 실행: npm run audit:data
 */

import { execSync } from 'node:child_process';

/** 몇 달이 지나면 다시 볼 때가 됐다고 보나 — 영역마다 바뀌는 주기가 다르다 */
const STALE_MONTHS = {
  // 교통패스는 연 1회 개정이 흔하고, 그 사이에도 권종이 없어지곤 한다.
  pass: 6,
  // 공항 요금·첫차는 봄 다이어 개정(3월)에 맞물려 움직인다.
  airport: 6,
};

/**
 * 미리 아는 개정 일정.
 *
 * 조사 중에 「언제부터 바뀐다」를 알게 되는 일이 있다. 그때 여기 적어 두면
 * 그날이 지났을 때 스크립트가 알려 준다 — 기억에 맡기면 반드시 놓친다.
 *
 * 반영을 끝냈으면 지운다. 남겨 두면 매달 같은 항목이 뜨고, 그러면 목록
 * 전체를 흘려보게 된다.
 */
const KNOWN_REVISIONS = [
  // 예시 형식 — 반영 후 삭제한다
  // { at: '2027-04-01', what: 'JR동일본 운임 개정 예고', where: 'data/airports/hnd.ts · nrt.ts' },
];

const now = new Date();
const monthsSince = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
};

/** 소스에서 grep 한다 — 데이터를 import 하면 앱 코드 전체가 딸려 온다 */
const grep = (pattern, path) => {
  try {
    return execSync(`git grep -n -- "${pattern}" ${path}`, { encoding: 'utf8' }).trim().split('\n');
  } catch {
    return []; // 일치가 없으면 git grep 이 1을 반환한다
  }
};

const sections = [];

// ── ① 확인이 오래된 항목 ────────────────────────────────
const stale = [];
for (const [label, path, limit] of [
  ['패스', 'src/data/transit/', STALE_MONTHS.pass],
  ['공항', 'src/data/airports/', STALE_MONTHS.airport],
]) {
  for (const line of grep("checkedAt: '", path)) {
    const [file, , ...rest] = line.split(':');
    const ym = rest.join(':').match(/'(\d{4}-\d{2})'/)?.[1];
    if (!ym) continue;
    const age = monthsSince(ym);
    if (age >= limit) stale.push(`${label} · ${file} — ${ym} 확인 (${age}개월 지남)`);
  }
}
sections.push({
  title: `확인이 오래된 항목 (패스 ${STALE_MONTHS.pass}개월 · 공항 ${STALE_MONTHS.airport}개월 기준)`,
  items: stale,
  ok: '전부 최근에 확인했어요.',
});

// ── ② 확인 못 한 값 ────────────────────────────────────
sections.push({
  title: '확인하지 못한 값 (verified: false)',
  items: grep('verified: false', 'src/data/').map((l) => l.split(':').slice(0, 2).join(':')),
  ok: '없어요.',
});

// ── ③ 코드에 남긴 재확인 표시 ──────────────────────────
sections.push({
  title: '코드에 남긴 재확인 표시',
  items: grep('재확인이 필요', 'src/data/').map((l) => {
    const [file, no] = l.split(':');
    return `${file}:${no}`;
  }),
  ok: '없어요.',
});

// ── ④ 지나간 개정 예정일 ───────────────────────────────
const today = now.toISOString().slice(0, 10);
sections.push({
  title: '지나간 개정 예정일',
  items: KNOWN_REVISIONS.filter((r) => r.at <= today).map((r) => `${r.at} · ${r.what} → ${r.where}`),
  ok: KNOWN_REVISIONS.length ? '아직 안 왔어요.' : '등록된 예정이 없어요.',
});

// ── 출력 ────────────────────────────────────────────────
console.log(`데이터 점검 · ${today}\n`);
let total = 0;
for (const s of sections) {
  console.log(`## ${s.title}`);
  if (s.items.length === 0) {
    console.log(`   ${s.ok}\n`);
  } else {
    total += s.items.length;
    for (const i of s.items) console.log(`   - ${i}`);
    console.log();
  }
}

console.log(
  total === 0
    ? '다시 볼 항목이 없어요.'
    : `다시 볼 항목 ${total}건. 확인했으면 해당 항목의 checkedAt 을 이번 달로 옮기세요.`,
);
