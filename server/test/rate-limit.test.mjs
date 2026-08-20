/**
 * 요청 제한 — 정상 사용자를 막지 않으면서 폭주를 막는다.
 *
 * 이 모듈은 **틀리는 방향이 둘**이라 양쪽을 다 봐야 한다.
 *
 *   너무 느슨하면   기계가 제보를 쏟아부어도 그냥 들어온다
 *   너무 빡빡하면   화면 하나가 API 를 서너 개 부르는 것만으로 막힌다
 *
 * 특히 뒤쪽이 무섭다. 여행 중에 앱이 「잠시 뒤에 다시」만 반복하면 그건
 * 고장난 앱이고, 사용자는 왜 그런지 알 수 없다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { budgetFor, reset, size, take } from '../rate-limit.mjs';

const IP = '203.0.113.7';

beforeEach(() => reset());

describe('무리 나누기', () => {
  it('읽기와 쓰기를 가른다', () => {
    strictEqual(budgetFor('/api/weather', 'GET'), 'read');
    strictEqual(budgetFor('/api/reviews', 'GET'), 'read');
    strictEqual(budgetFor('/api/reviews', 'POST'), 'write');
    strictEqual(budgetFor('/api/contributions', 'POST'), 'write');
  });

  it('크래시 보고는 따로 본다 — 앱이 죽는 중이라 몰려 온다', () => {
    strictEqual(budgetFor('/api/errors', 'POST'), 'errors');
  });

  it('관리자 경로와 health 는 세지 않는다', () => {
    /* 관리자 경로는 토큰으로 막혀 있다. 운영자가 목록을 훑다가 자기 서버에
       막히면 그게 더 나쁘다. */
    strictEqual(budgetFor('/api/admin/errors', 'GET'), null);
    strictEqual(budgetFor('/api/admin/release', 'POST'), null);
    strictEqual(budgetFor('/health', 'GET'), null);
  });
});

describe('정상 사용자를 막지 않는다', () => {
  it('화면 하나가 API 를 여러 개 불러도 통과한다', () => {
    /* 안전 화면 하나가 지진·경보·운행정보·날씨를 한꺼번에 부른다. 그런
       묶음이 막히면 앱이 고장난 것처럼 보인다. */
    for (let i = 0; i < 20; i++) {
      strictEqual(take(IP, '/api/weather', 'GET').ok, true, `${i}번째에서 막혔어요`);
    }
  });

  it('사람이 손으로 하는 쓰기는 통과한다', () => {
    // 리뷰를 잇달아 남기는 정도(다섯 번)는 막지 않는다
    for (let i = 0; i < 5; i++) {
      strictEqual(take(IP, '/api/reviews', 'POST').ok, true, `${i}번째에서 막혔어요`);
    }
  });
});

describe('폭주를 막는다', () => {
  it('쓰기를 몰아붓면 막히고, 언제 다시 오면 되는지 알려준다', () => {
    let blocked = null;
    for (let i = 0; i < 50; i++) {
      const r = take(IP, '/api/reviews', 'POST');
      if (!r.ok) {
        blocked = r;
        break;
      }
    }
    ok(blocked, '쓰기가 50번을 그냥 통과했어요');
    ok(blocked.retryAfter >= 1, '「잠시 뒤」보다 정확한 답을 줘야 한다');
    ok(blocked.retryAfter <= 60, `${blocked.retryAfter}초는 너무 길어요`);
  });

  it('읽기도 결국 막힌다', () => {
    let blocked = false;
    for (let i = 0; i < 500; i++) {
      if (!take(IP, '/api/weather', 'GET').ok) {
        blocked = true;
        break;
      }
    }
    ok(blocked, '읽기가 500번을 그냥 통과했어요');
  });
});

describe('무리끼리 섞이지 않는다', () => {
  it('읽기를 많이 했다고 제보가 막히지 않는다', () => {
    /* 통을 하나로 두면 화면을 많이 넘긴 사람이 정작 제보를 못 하게 된다.
       실제로 쓰는 쪽이 막히는 셈이라 정반대다. */
    while (take(IP, '/api/weather', 'GET').ok) {
      /* 읽기 예산을 바닥낸다 */
    }
    strictEqual(take(IP, '/api/reviews', 'POST').ok, true, '읽기가 쓰기를 막았어요');
  });
});

describe('회선끼리 섞이지 않는다', () => {
  it('한 사람이 막혀도 다른 사람은 통과한다', () => {
    while (take(IP, '/api/reviews', 'POST').ok) {
      /* 이 회선의 쓰기 예산을 바닥낸다 */
    }
    strictEqual(take('198.51.100.9', '/api/reviews', 'POST').ok, true);
  });

  it('IP 가 없어도 던지지 않는다', () => {
    /* 프록시 설정이 이상하면 IP 가 안 올 수 있다. 그때 서버가 죽으면
       제한 장치가 장애 원인이 된다. */
    strictEqual(take(null, '/api/weather', 'GET').ok, true);
    strictEqual(take(undefined, '/api/weather', 'GET').ok, true);
  });
});

describe('메모리가 무한히 늘지 않는다', () => {
  it('IP 를 바꿔 가며 두드려도 상한 안에 머문다', () => {
    /* 이게 없으면 제한 장치 자체가 공격 수단이 된다 — 주소만 바꿔 가며
       두드리면 서버 메모리가 늘어난다. */
    for (let i = 0; i < 12_000; i++) {
      take(`10.0.${(i >> 8) & 255}.${i & 255}`, '/api/weather', 'GET');
    }
    ok(size() <= 11_000, `${size()}개나 들고 있어요`);
  });
});
