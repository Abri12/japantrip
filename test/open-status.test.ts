/**
 * 「지금 열려 있나」 — 틀리면 사람이 닫힌 문 앞에 선다.
 *
 * 이 모듈의 핵심은 판정이 아니라 **침묵이다.** `hours` 는 자유 문장이라
 * (「대부분 오후 6시 전후로 닫아요」) 그럴듯하게 해석해서 「영업 중」이라고
 * 말하면 틀렸을 때 되돌릴 방법이 없다. 확실한 패턴만 다루고 나머지는
 * `null` 을 준다 — 그러면 화면이 원문만 보여준다.
 *
 * 그래서 테스트도 **안 하는 것**을 더 많이 본다.
 */

import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { openStatus } from '@/lib/open-status';

/** 일본 시각을 정해 그 순간의 Date 를 만든다 */
function jst(day: string, hhmm: string): Date {
  return new Date(`${day}T${hhmm}:00+09:00`);
}

/* 2026-08-20 은 목요일, 2026-08-23 은 일요일 */
const THU = '2026-08-20';
const SUN = '2026-08-23';

describe('시간 판정', () => {
  const local = { hours: '9:30~14:30' };

  it('여는 시각 전이면 닫혔다고 한다', () => {
    const s = openStatus(local, jst(THU, '08:00'));
    strictEqual(s?.kind, 'closed');
    strictEqual(s?.detail, '9:30에 열어요.');
  });

  it('영업시간 안이면 언제까지인지 같이 말한다', () => {
    const s = openStatus(local, jst(THU, '10:00'));
    strictEqual(s?.kind, 'open');
    strictEqual(s?.label, '지금 영업시간이에요 · 14:30까지');
  });

  it('마감 1시간 안이면 「곧 닫아요」', () => {
    strictEqual(openStatus(local, jst(THU, '13:30'))?.kind, 'closingSoon');
    strictEqual(openStatus(local, jst(THU, '13:29'))?.kind, 'open');
  });

  it('마감 시각 정각은 이미 닫힌 것으로 본다', () => {
    /* 14:30 에 도착해 봐야 못 들어간다. 경계에서는 사용자에게 불리하지
       않은 쪽으로 판정한다. */
    strictEqual(openStatus(local, jst(THU, '14:30'))?.kind, 'closed');
  });

  it('여는 시각 정각은 열린 것으로 본다', () => {
    strictEqual(openStatus(local, jst(THU, '09:30'))?.kind, 'open');
  });

  it('닫힌 뒤에는 오늘 언제까지였고 내일 언제 여는지 말한다', () => {
    const s = openStatus(local, jst(THU, '20:00'));
    strictEqual(s?.detail, '영업은 14:30까지였어요. 내일 9:30에 열어요.');
  });
});

describe('판정하지 않는 것 — 틀리느니 침묵한다', () => {
  it('시간 앞에 조건이 붙으면 손대지 않는다', () => {
    /* 「목욕만 하면」을 우리가 해석할 수 없다. 그런데도 6:00~23:00 을
       읽어 「영업 중」이라 하면, 밥 먹으러 간 사람이 헛걸음한다. */
    strictEqual(openStatus({ hours: '목욕만 하면 6:00~23:00' }, jst(THU, '10:00')), null);
  });

  it('숫자 범위가 아니면 손대지 않는다', () => {
    for (const hours of [
      '대부분 오후 6시 전후로 닫아요',
      '해 뜰 때 열고 해 질 때 닫아요',
      '가게마다 달라요',
      '',
    ]) {
      strictEqual(openStatus({ hours }, jst(THU, '10:00')), null, `"${hours}" 를 판정했어요`);
    }
  });

  it('hours 가 아예 없으면 null', () => {
    strictEqual(openStatus({}, jst(THU, '10:00')), null);
  });

  it('자정을 넘는 범위는 판정하지 않는다', () => {
    // 20:00~02:00 을 그대로 계산하면 「이미 닫힘」이 되어 정반대가 된다
    strictEqual(openStatus({ hours: '20:00~02:00' }, jst(THU, '21:00')), null);
  });

  it('24시를 넘는 표기도 판정하지 않는다', () => {
    strictEqual(openStatus({ hours: '11:00~25:00' }, jst(THU, '12:00')), null);
  });
});

describe('정기휴일', () => {
  it('오늘이 휴일이면 영업시간보다 먼저 말한다', () => {
    const s = openStatus({ hours: '9:30~14:30', closed: '일요일' }, jst(SUN, '10:00'));
    strictEqual(s?.kind, 'holiday');
  });

  it('휴일이 아니면 평소대로 시간을 본다', () => {
    const s = openStatus({ hours: '9:30~14:30', closed: '일요일' }, jst(THU, '10:00'));
    strictEqual(s?.kind, 'open');
  });

  it('여러 요일 나열을 읽는다', () => {
    const local = { hours: '9:30~14:30', closed: '일요일·목요일' };
    strictEqual(openStatus(local, jst(SUN, '10:00'))?.kind, 'holiday');
    strictEqual(openStatus(local, jst(THU, '10:00'))?.kind, 'holiday');
  });

  it('끝에 붙은 괄호 보충은 나열을 무효로 만들지 않는다', () => {
    const local = { hours: '9:30~14:30', closed: '일요일 (공휴일이면 열어요)' };
    strictEqual(openStatus(local, jst(SUN, '10:00'))?.kind, 'holiday');
  });

  it('경향 서술은 특정 가게의 휴일이 아니라서 판정하지 않는다', () => {
    /* 「~에 쉬는 가게가 많아요」는 이 가게가 쉰다는 말이 아니다. 그걸
       휴일로 읽으면 열려 있는 가게를 닫혔다고 말하게 된다. */
    const local = { hours: '9:30~14:30', closed: '일요일·수요일에 쉬는 가게가 많아요' };
    strictEqual(openStatus(local, jst(SUN, '10:00'))?.kind, 'open');
  });

  it('공휴일만 적혀 있으면 요일 판정에 영향이 없다', () => {
    const local = { hours: '9:30~14:30', closed: '공휴일' };
    strictEqual(openStatus(local, jst(SUN, '10:00'))?.kind, 'open');
  });
});

describe('시각은 일본 기준', () => {
  it('폰이 어느 시간대든 같은 답을 준다', () => {
    /* 한국 로밍이면 폰이 KST 로 남아 있을 수 있다. 둘 다 UTC+9 라 우연히
       같지만, 계산이 기기 시간에 기대고 있으면 언젠가 어긋난다. */
    const local = { hours: '9:30~14:30' };
    const sameMoment = [
      jst(THU, '10:00'), // +09:00 표기
      new Date('2026-08-20T01:00:00Z'), // 같은 순간, UTC 표기
      new Date('2026-08-19T20:00:00-05:00'), // 같은 순간, 뉴욕 표기
    ];
    const results = sameMoment.map((d) => openStatus(local, d));
    deepStrictEqual(results[1], results[0]);
    deepStrictEqual(results[2], results[0]);
  });
});
