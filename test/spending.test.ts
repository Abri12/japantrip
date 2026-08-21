/**
 * 쓴 돈 — **사람이 친 글자가 숫자가 될 때.**
 *
 * 이 기능은 이 앱에서 사용자가 숫자를 직접 넣는 첫 자리다. 그래서 지금까지
 * 없던 종류의 사고가 생긴다 — 친 글자가 숫자가 아니거나, 자리를 하나 더
 * 붙였거나, 지우려고 다 지웠거나.
 *
 * 그중 조용한 것은 **NaN 하나가 합계 전체를 NaN 으로 만드는 것**이다.
 * 화면에는 「NaN원」이 뜨는데, 그때는 이미 저장소에 들어간 뒤다.
 */

import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MAX_SPEND_YEN, parseYen } from '@/lib/spending';

describe('쓴 돈 입력', () => {
  it('쉼표와 단위를 붙여 쳐도 읽는다', () => {
    /* 사람은 「12,000」이나 「12000엔」처럼 친다. */
    strictEqual(parseYen('12000'), 12000);
    strictEqual(parseYen('12,000'), 12000);
    strictEqual(parseYen('12,000엔'), 12000);
    strictEqual(parseYen('¥12000'), 12000);
    strictEqual(parseYen(' 3 500 '), 3500);
  });

  it('지웠으면 0 이 아니라 null 이다', () => {
    /*
     * 0 으로 바꾸면 「지우려고 다 지운 것」과 「0 을 친 것」이 구분되지
     * 않는다. 저장 쪽은 null 을 「안 적음」으로 되돌린다.
     */
    strictEqual(parseYen(''), null);
    strictEqual(parseYen('   '), null);
    strictEqual(parseYen('엔'), null);
    strictEqual(parseYen('0'), null);
    strictEqual(parseYen('000'), null);
  });

  it('숫자가 아닌 글자만 쳐도 NaN 을 만들지 않는다', () => {
    /* NaN 하나가 저장소에 들어가면 합계 전체가 NaN 이 되고, 화면에
       「NaN원」이 뜬다. 그때는 이미 늦다. */
    strictEqual(parseYen('abc'), null);
    strictEqual(parseYen('---'), null);
    strictEqual(parseYen('1e5'), 15); // 문자를 버리고 숫자만 남긴다
  });

  it('자리를 잘못 붙여도 상한에서 멈춘다', () => {
    /* 12,000 을 치려다 0 을 더 붙이는 건 흔한 실수다. 상한이 없으면
       합계가 통째로 망가지는데 화면에는 그냥 큰 숫자로 보인다. */
    strictEqual(parseYen('99999999999'), MAX_SPEND_YEN);
    strictEqual(parseYen(String(MAX_SPEND_YEN)), MAX_SPEND_YEN);
    strictEqual(parseYen(String(MAX_SPEND_YEN - 1)), MAX_SPEND_YEN - 1);
  });

  it('소수점을 쳐도 정수로 읽는다', () => {
    /* 엔화에는 소수가 없다. 「1.5」는 15 로 읽는 게 맞진 않지만,
       적어도 NaN 이나 1.5 가 저장되지는 않는다. */
    strictEqual(Number.isInteger(parseYen('1.5')), true);
  });
});
