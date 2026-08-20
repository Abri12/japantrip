/**
 * 보상 가격표 — 교환 금액을 정하는 유일한 자리.
 *
 * 여기가 뚫리면 앞의 방어가 전부 무의미해진다. 원장을 서버로 옮긴 것도,
 * 출금 게이트도, 발행 한도도 전부 「잔액을 못 만들게」 하는 장치인데,
 * **값을 1로 부를 수 있으면** 잔액을 만들 필요가 없다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { REWARDS, costOf, list, nameOf } from '../rewards.mjs';

describe('costOf', () => {
  it('아는 보상은 표에 적힌 값을 준다', () => {
    strictEqual(costOf('starbucks'), REWARDS.starbucks.cost);
    strictEqual(costOf('esim-1gb'), REWARDS['esim-1gb'].cost);
  });

  it('모르는 id 는 null — 값을 지어내지 않는다', () => {
    /* 0이나 기본값을 돌려주면 없는 상품을 공짜로 교환하게 된다. */
    strictEqual(costOf('없는상품'), null);
    strictEqual(costOf(''), null);
    strictEqual(costOf(null), null);
    strictEqual(costOf(undefined), null);
  });

  it('객체나 배열을 넣어도 값이 안 나온다', () => {
    // 요청 본문은 무엇이든 올 수 있다. 문자열로 강제해도 표에 없으면 null 이다.
    strictEqual(costOf({}), null);
    strictEqual(costOf(['starbucks']), null);
    strictEqual(costOf({ toString: () => 'starbucks' }), null);
  });

  it('프로토타입에 있는 이름으로 값을 얻을 수 없다', () => {
    /* JSON.parse 로 만든 객체라 프로토타입 오염은 없지만, `constructor` 같은
       상속 속성이 값처럼 읽히면 안 된다. */
    for (const name of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
      strictEqual(costOf(name), null, `${name} 가 값을 돌려줬어요`);
    }
  });
});

describe('표 자체', () => {
  it('모든 보상에 양의 정수 가격이 있다', () => {
    for (const [id, r] of Object.entries(REWARDS)) {
      ok(Number.isInteger(r.cost), `${id} 가격이 정수가 아니에요`);
      ok(r.cost > 0, `${id} 가격이 0 이하예요`);
    }
  });

  it('발행 주체가 적혀 있다 — 규제 판단의 근거다', () => {
    /* 제3자가 발행하는 상품인지 우리가 발행하는지에 따라 선불전자지급수단
       해당 여부가 갈린다(docs/CREDITS.md). */
    for (const [id, r] of Object.entries(REWARDS)) {
      ok(r.issuer === 'partner' || r.issuer === 'self', `${id} 발행 주체가 이상해요`);
    }
  });

  it('list 는 id 를 포함해서 준다', () => {
    const rows = list();
    strictEqual(rows.length, Object.keys(REWARDS).length);
    for (const r of rows) ok(r.id && r.cost > 0);
  });

  it('nameOf 도 모르면 null', () => {
    ok(nameOf('starbucks'));
    strictEqual(nameOf('없는상품'), null);
  });
});
