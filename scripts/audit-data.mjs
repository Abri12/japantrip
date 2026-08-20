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
  // 가게 정보(영업시간·정기휴일)가 **제일 빨리 썩는다.** 요금 개정은 1년에
  // 한 번 예고하고 오지만, 가게는 예고 없이 휴일을 바꾸고 문을 닫는다.
  // 그래서 가장 짧게 잡는다.
  //
  // 이 기준은 「반년마다 사람이 전부 다시 본다」는 뜻이 아니다. 대부분은
  // `npm run audit:places` 가 원본과 자동으로 대조해 잡아내고, 여기 걸리는
  // 건 자동 대조가 못 보는 것(현금만 받는지·예약이 필요한지)뿐이다.
  place: 6,
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
  /*
   * ── 해마다 돌아오는 두 날 ─────────────────────────────
   *
   * 공항 데이터에서 나온 오류를 세어 보니 대부분이 「틀리게 적었다」가 아니라
   * 「개정을 놓쳤다」였다. 그리고 일본의 개정일은 흩어져 있지 않다 — JR 그룹은
   * 봄 다이어 개정(3월 중순)에 운임을 같이 얹고, 사철과 버스는 회계연도가
   * 시작하는 4월 1일에 몰린다. 2026년만 봐도 JR 6사·세이부·쓰쿠바 익스프레스가
   * 3월 14일이었고, 난카이·니시테츠·이요테츠·홋카이도추오버스가 4월 1일이었다.
   *
   * 그래서 이 둘은 「예정을 알게 되면 적는」 항목이 아니라 **달력**이다. 확인이
   * 끝나면 지우지 말고 다음 해로 옮긴다. 아래 일회성 항목과 성격이 다르다.
   */
  { at: '2027-03-13', what: 'JR 그룹 봄 다이어·운임 개정 (매년 3월 중순)', where: 'src/data/airports/ 전체 — 확인 후 다음 해로 옮긴다' },
  { at: '2027-04-01', what: '사철·버스 연도초 운임 개정이 몰리는 날', where: 'src/data/airports/ 전체 — 확인 후 다음 해로 옮긴다' },

  // ── 일회성 예정 — 반영 후 삭제한다 ──────────────────
  { at: '2026-12-01', what: '남해버스·남해윙버스 운임 개정 인가 신청(2026-07-30) 시행 여부', where: 'src/data/airports/kix.ts (리무진)' },
  {
    at: '2027-03-01',
    what: '교토 시버스 「시민 우대 요금」 — 균일구간을 시민 200엔 / 그 밖 350~400엔으로 나누는 안(2026-02 시장 발표, 2027년도 목표). 확정되면 여행자 요금이 두 배가 되어 교토 판단이 통째로 달라진다',
    where: 'src/data/transit/kyoto.ts (요금 230엔 · 어드바이저리 · breakEven)',
  },
  {
    at: '2027-03-25',
    what: '간사이 레일웨이 패스 Lite 다음 시즌 발매 — 발매·유효기간이 반년(3월 말~9월 말)뿐이라 해마다 값과 범위가 다시 정해진다',
    where: 'src/data/transit/wide.ts',
  },
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
  ['가게', 'src/data/places/', STALE_MONTHS.place],
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
  title: `확인이 오래된 항목 (패스 ${STALE_MONTHS.pass}개월 · 공항 ${STALE_MONTHS.airport}개월 · 가게 ${STALE_MONTHS.place}개월 기준)`,
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
