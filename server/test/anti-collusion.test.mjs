/**
 * 담합 방어 — 계정 없이 「이 확인을 믿어도 되나」를 재는 계산.
 *
 * 이 모듈은 **틀리는 방향이 둘**이라 양쪽을 다 봐야 한다.
 *
 *   너무 느슨하면   기기 두 대로 서로 확인해 주는 것이 그대로 통과한다
 *   너무 빡빡하면   같이 여행 온 친구 둘이 정상적으로 막힌다
 *
 * 특히 **같은 회선 하나로는 0점을 주지 않는다**는 규칙을 지킨다. 일본
 * 통신사는 CGNAT 를 크게 써서 여행자 다수가 같은 대역으로 보인다 — 그
 * 신호만으로 자르면 정상 사용자가 먼저 다친다.
 */

import { notStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HOLD_CREDITS_WITHOUT_ON_SITE,
  WEIGHT_ON_SITE,
  WEIGHT_REMOTE,
  WEIGHT_SUSPECT,
  clientIp,
  networkTag,
  shouldHold,
  weighConfirmation,
} from '../anti-collusion.mjs';

/** a 가 b 의 기여를 n 번 확인해 준 상태를 만든다 */
function confirmedBy(authorId, byIds) {
  return { authorId, confirms: byIds.map((by) => ({ by })) };
}

describe('networkTag — 회선만 알아보고 사람은 못 알아본다', () => {
  it('IPv4 는 /24 까지만 본다 — 같은 대역이면 같은 값', () => {
    strictEqual(networkTag('203.0.113.7'), networkTag('203.0.113.200'));
    notStrictEqual(networkTag('203.0.113.7'), networkTag('203.0.114.7'));
  });

  it('IPv6 는 /48 까지만 본다', () => {
    strictEqual(networkTag('2001:db8:1234:5678::1'), networkTag('2001:db8:1234:ffff::9'));
    notStrictEqual(networkTag('2001:db8:1234::1'), networkTag('2001:db8:9999::1'));
  });

  it('IPv4-매핑 IPv6 를 IPv4 로 본다', () => {
    strictEqual(networkTag('::ffff:203.0.113.7'), networkTag('203.0.113.7'));
  });

  it('원본 IP 가 값 안에 남지 않는다', () => {
    const tag = networkTag('203.0.113.7');
    ok(!tag.includes('203'));
    ok(!tag.includes('113'));
    strictEqual(tag.length, 16);
  });

  it('IP 가 없으면 null — 없는 것을 있는 척하지 않는다', () => {
    strictEqual(networkTag(null), null);
    strictEqual(networkTag(''), null);
  });
});

describe('clientIp — 프록시 뒤', () => {
  it('x-forwarded-for 의 맨 앞을 쓴다', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }, socket: {} };
    strictEqual(clientIp(req), '203.0.113.7');
  });

  it('헤더가 없으면 소켓 주소', () => {
    strictEqual(clientIp({ headers: {}, socket: { remoteAddress: '10.0.0.5' } }), '10.0.0.5');
  });
});

describe('weighConfirmation — 몇 점을 줄까', () => {
  const item = { authorId: 'author', authorNet: 'netA', confirms: [] };

  it('아무 신호가 없으면 원격 1점', () => {
    const r = weighConfirmation({ items: [item], item, viewerId: 'v', onSite: false, net: 'netB' });
    strictEqual(r.weight, WEIGHT_REMOTE);
    strictEqual(r.flags.length, 0);
  });

  it('현장 인증이면 3점', () => {
    const r = weighConfirmation({ items: [item], item, viewerId: 'v', onSite: true, net: 'netB' });
    strictEqual(r.weight, WEIGHT_ON_SITE);
    strictEqual(r.onSite, true);
  });

  it('같은 회선 하나로는 점수를 깎지 않는다', () => {
    /* 이 규칙이 이 모듈에서 제일 중요하다. 일본 통신사 CGNAT 와 호텔·공항
       와이파이 때문에 여행자 다수가 같은 대역으로 보인다. */
    const r = weighConfirmation({ items: [item], item, viewerId: 'v', onSite: false, net: 'netA' });
    strictEqual(r.weight, WEIGHT_REMOTE);
    ok(r.flags.includes('same-network'), '깃발은 남겨서 보류 판정이 보게 한다');
  });

  it('상호성이 반복되면 0점', () => {
    // v 가 author 것을 2번, author 가 v 것을 2번 확인해 줬다
    const items = [
      confirmedBy('author', ['v', 'v']),
      confirmedBy('v', ['author', 'author']),
      item,
    ];
    const r = weighConfirmation({ items, item, viewerId: 'v', onSite: false, net: 'netB' });
    strictEqual(r.weight, WEIGHT_SUSPECT);
    ok(r.flags.includes('reciprocal'));
  });

  it('서로 한 번씩은 우연히 일어난다 — 자르지 않는다', () => {
    const items = [confirmedBy('author', ['v']), confirmedBy('v', ['author']), item];
    const r = weighConfirmation({ items, item, viewerId: 'v', onSite: false, net: 'netB' });
    strictEqual(r.weight, WEIGHT_REMOTE);
    ok(!r.flags.includes('reciprocal'));
  });

  it('한 사람에게 쏠린 확인은 0점', () => {
    // author 가 받은 확인 4건 중 3건이 v 에게서 왔다
    const items = [confirmedBy('author', ['v', 'v', 'v', 'x']), item];
    const r = weighConfirmation({ items, item, viewerId: 'v', onSite: false, net: 'netB' });
    strictEqual(r.weight, WEIGHT_SUSPECT);
    ok(r.flags.includes('concentrated'));
  });

  it('표본이 적을 때는 쏠림을 보지 않는다 — 초기 몇 건은 쏠릴 수밖에 없다', () => {
    const items = [confirmedBy('author', ['v', 'v']), item];
    const r = weighConfirmation({ items, item, viewerId: 'v', onSite: false, net: 'netB' });
    ok(!r.flags.includes('concentrated'));
    strictEqual(r.weight, WEIGHT_REMOTE);
  });

  it('현장 인증은 관계 신호를 덮는다', () => {
    /* 같이 여행 온 친구 둘은 같은 회선을 쓰고 서로를 확인한다. 둘 다 실제로
       그 가게 앞에 있었다면 그 확인은 참이다. */
    const items = [
      confirmedBy('author', ['v', 'v']),
      confirmedBy('v', ['author', 'author']),
      item,
    ];
    const r = weighConfirmation({ items, item, viewerId: 'v', onSite: true, net: 'netA' });
    strictEqual(r.weight, WEIGHT_ON_SITE);
  });
});

describe('shouldHold — 확정 직전 마지막 검사', () => {
  it('깨끗하면 보류하지 않는다', () => {
    const item = {
      pendingCredits: 10,
      confirms: [{ onSite: true, flags: [] }, { onSite: false, flags: [] }],
    };
    strictEqual(shouldHold(item), null);
  });

  it('절반 넘게 깃발이 붙으면 사람이 본다', () => {
    const item = {
      pendingCredits: 10,
      confirms: [
        { onSite: false, flags: ['same-network'] },
        { onSite: false, flags: ['reciprocal'] },
        { onSite: false, flags: [] },
      ],
    };
    strictEqual(shouldHold(item), 'mostly-flagged');
  });

  it('현장 확인에 붙은 깃발은 세지 않는다', () => {
    /* 현장 인증이 관계 신호를 덮기로 한 이상, 덮인 깃발이 보류 사유로 다시
       살아나면 앞의 결정이 무의미해진다. */
    const item = {
      pendingCredits: 10,
      confirms: [
        { onSite: true, flags: ['same-network', 'reciprocal'] },
        { onSite: true, flags: ['same-network'] },
      ],
    };
    strictEqual(shouldHold(item), null);
  });

  it('현장 확인 없이 큰 금액이면 사람이 본다', () => {
    const item = {
      pendingCredits: HOLD_CREDITS_WITHOUT_ON_SITE,
      confirms: [{ onSite: false, flags: [] }, { onSite: false, flags: [] }],
    };
    strictEqual(shouldHold(item), 'high-value-remote');
  });

  it('작은 금액은 현장 확인이 없어도 지나간다', () => {
    const item = {
      pendingCredits: HOLD_CREDITS_WITHOUT_ON_SITE - 1,
      confirms: [{ onSite: false, flags: [] }, { onSite: false, flags: [] }],
    };
    strictEqual(shouldHold(item), null);
  });

  it('현장 확인이 하나라도 있으면 금액이 커도 지나간다', () => {
    const item = {
      pendingCredits: 100,
      confirms: [{ onSite: true, flags: [] }, { onSite: false, flags: [] }],
    };
    strictEqual(shouldHold(item), null);
  });

  it('문턱은 기여 난이도와 맞아떨어져야 한다', () => {
    // 폐업 신고(10)·메뉴판(30)은 지나가고, 실시간 제보(80)·인증 리뷰(100)는 걸린다
    ok(HOLD_CREDITS_WITHOUT_ON_SITE > 30);
    ok(HOLD_CREDITS_WITHOUT_ON_SITE <= 80);
  });
});
