/**
 * 원장 — 잔액이 되는 계산 전부.
 *
 * 이 파일이 지키려는 것은 하나다. **크레딧은 금전적 가치가 있는 잔액이고,
 * 그 값을 내는 계산이 여기밖에 없다.** 소멸·FIFO·숙려·발행한도가 전부
 * `lotsOf` 한 함수를 거쳐 나오므로, 그 함수가 틀리면 모든 화면이 같이 틀린다.
 *
 * 시각에 기대는 계산이라 실제 시계로는 못 짠다. 원장 파일을 **날짜를 직접
 * 박아** 심어 두고 읽는 방식으로 확인한다.
 */

import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { daysAgo, entry, freshLedger, hoursAgo } from './helpers.mjs';

describe('post — 원장에 쌓기', () => {
  it('지급하면 잔액이 는다', async () => {
    const L = await freshLedger();
    await L.post({ key: 'a1', userId: 'u1', delta: 30, reason: 'closure' });
    strictEqual(await L.balanceOf('u1'), 30);
  });

  it('같은 키는 두 번 반영하지 않는다', async () => {
    const L = await freshLedger();
    const first = await L.post({ key: 'same', userId: 'u1', delta: 30, reason: 'x' });
    const again = await L.post({ key: 'same', userId: 'u1', delta: 30, reason: 'x' });

    strictEqual(first.duplicated, false);
    strictEqual(again.duplicated, true);
    // 재시도가 이중 지급이 되지 않는다는 것이 이 기능의 핵심 성질이다
    strictEqual(again.entry.id, first.entry.id);
    strictEqual(await L.balanceOf('u1'), 30);
  });

  it('잔액보다 많이 차감할 수 없다', async () => {
    const L = await freshLedger();
    await L.post({ key: 'a', userId: 'u1', delta: 10, reason: 'x' });
    const res = await L.post({ key: 'b', userId: 'u1', delta: -50, reason: 'redeem' });

    strictEqual(res.error, 'insufficient');
    strictEqual(await L.balanceOf('u1'), 10);
  });

  it('사용자끼리 섞이지 않는다', async () => {
    const L = await freshLedger();
    await L.post({ key: 'a', userId: 'u1', delta: 40, reason: 'x' });
    await L.post({ key: 'b', userId: 'u2', delta: 7, reason: 'x' });

    strictEqual(await L.balanceOf('u1'), 40);
    strictEqual(await L.balanceOf('u2'), 7);
  });
});

describe('소멸 — 적립일로부터 5년', () => {
  it('5년이 지난 로트는 잔액에서 빠진다', async () => {
    const L = await freshLedger([
      entry('u1', 100, daysAgo(1826)), // 하루 지났다
      entry('u1', 50, daysAgo(10)),
    ]);
    strictEqual(await L.balanceOf('u1'), 50);
  });

  it('경계 하루 전은 아직 살아 있다', async () => {
    const L = await freshLedger([entry('u1', 100, daysAgo(1824))]);
    strictEqual(await L.balanceOf('u1'), 100);
  });

  it('소멸해도 누적 적립은 줄지 않는다 — 등급이 내려가면 안 된다', async () => {
    const L = await freshLedger([
      entry('u1', 100, daysAgo(1826)),
      entry('u1', 50, daysAgo(10)),
    ]);
    strictEqual(await L.balanceOf('u1'), 50);
    strictEqual(await L.lifetimeEarnedOf('u1'), 150);
  });

  it('써서 잔액이 줄어도 누적 적립은 그대로다', async () => {
    const L = await freshLedger([
      entry('u1', 100, daysAgo(10)),
      entry('u1', -60, daysAgo(1)),
    ]);
    strictEqual(await L.balanceOf('u1'), 40);
    strictEqual(await L.lifetimeEarnedOf('u1'), 100);
  });
});

describe('FIFO — 오래된 것부터 쓴다', () => {
  it('차감은 먼저 받은 로트를 먼저 먹는다', async () => {
    const L = await freshLedger([
      entry('u1', 100, daysAgo(1800)), // 곧 소멸할 것
      entry('u1', 100, daysAgo(10)), // 새것
      entry('u1', -100, daysAgo(1)),
    ]);

    strictEqual(await L.balanceOf('u1'), 100);

    /* 남은 100 은 **새 로트**여야 한다. 새것부터 썼다면 곧 소멸할 옛 로트가
       남아서 사용자가 손해를 본다 — 소비자에게 불리한 쪽을 기본값으로 두지
       않는다는 규칙이 지켜지는지 보는 자리다. */
    const soon = await L.expiringSoon('u1', 40 * 86_400_000);
    deepStrictEqual(soon, []);
  });

  it('한 번의 차감이 여러 로트에 걸친다', async () => {
    const L = await freshLedger([
      entry('u1', 30, daysAgo(20)),
      entry('u1', 30, daysAgo(15)),
      entry('u1', 30, daysAgo(10)),
      entry('u1', -70, daysAgo(1)),
    ]);
    strictEqual(await L.balanceOf('u1'), 20);
  });

  it('이미 소멸한 로트는 차감이 먹을 수 없다', async () => {
    /* 차감 시점(1일 전)에 첫 로트는 이미 소멸해 있다. 그걸 먹었다고 치면
       살아 있는 로트가 그대로 남아 잔액이 부풀려진다. */
    const L = await freshLedger([
      entry('u1', 100, daysAgo(1830)),
      entry('u1', 100, daysAgo(10)),
      entry('u1', -100, daysAgo(1)),
    ]);
    strictEqual(await L.balanceOf('u1'), 0);
  });
});

describe('expiringSoon — 소멸 예고', () => {
  it('창 안에 드는 로트만, 가까운 순서로 준다', async () => {
    const L = await freshLedger([
      entry('u1', 10, daysAgo(1795)), // 30일 뒤 소멸
      entry('u1', 20, daysAgo(1815)), // 10일 뒤 소멸
      entry('u1', 40, daysAgo(10)), // 한참 남았다
    ]);

    const soon = await L.expiringSoon('u1', 60 * 86_400_000);
    strictEqual(soon.length, 2);
    strictEqual(soon[0].credits, 20);
    strictEqual(soon[1].credits, 10);
    ok(soon[0].daysLeft < soon[1].daysLeft);
  });

  it('일부만 쓴 로트는 남은 양으로 알린다', async () => {
    const L = await freshLedger([
      entry('u1', 100, daysAgo(1815)),
      entry('u1', -70, daysAgo(1)),
    ]);
    const soon = await L.expiringSoon('u1', 60 * 86_400_000);
    strictEqual(soon.length, 1);
    strictEqual(soon[0].credits, 30);
  });
});

describe('maturedBalanceOf — 숙려', () => {
  const MATURITY = 72 * 3600_000;

  it('받은 지 얼마 안 된 크레딧은 못 찾는다', async () => {
    const L = await freshLedger([entry('u1', 100, hoursAgo(1))]);
    strictEqual(await L.balanceOf('u1'), 100);
    strictEqual(await L.maturedBalanceOf('u1', MATURITY), 0);
  });

  it('숙려가 끝난 것만 센다', async () => {
    const L = await freshLedger([
      entry('u1', 100, hoursAgo(100)), // 끝났다
      entry('u1', 50, hoursAgo(1)), // 아직
    ]);
    strictEqual(await L.balanceOf('u1'), 150);
    strictEqual(await L.maturedBalanceOf('u1', MATURITY), 100);
  });

  it('찾을 수 있는 잔액이 전체 잔액을 넘지 않는다', async () => {
    const L = await freshLedger([
      entry('u1', 100, hoursAgo(200)),
      entry('u1', -80, hoursAgo(1)),
    ]);
    const total = await L.balanceOf('u1');
    const matured = await L.maturedBalanceOf('u1', MATURITY);
    strictEqual(total, 20);
    ok(matured <= total, `숙려 잔액(${matured})이 전체(${total})보다 크면 안 된다`);
  });
});

describe('집계 — 규제선 계산의 입력', () => {
  it('미상환 합계는 소멸분을 빼고 사람을 가로질러 더한다', async () => {
    const L = await freshLedger([
      entry('u1', 100, daysAgo(10)),
      entry('u1', 100, daysAgo(1900)), // 소멸
      entry('u2', 25, daysAgo(5)),
      entry('u2', -5, daysAgo(1)),
    ]);
    strictEqual(await L.outstandingTotal(), 120);
  });

  it('연간 발행액은 차감을 빼지 않는다 — 규제의 「총발행액」이 그렇다', async () => {
    const L = await freshLedger([
      entry('u1', 100, daysAgo(10)),
      entry('u1', -90, daysAgo(5)),
      entry('u1', 40, daysAgo(400)), // 1년 밖
    ]);
    strictEqual(await L.issuedLastYear(), 100);
    strictEqual(await L.balanceOf('u1'), 50);
  });
});

describe('historyOf', () => {
  it('최신 순으로 주고, 키와 사용자 id 는 빼고 준다', async () => {
    const L = await freshLedger([
      entry('u1', 10, daysAgo(3)),
      entry('u1', 20, daysAgo(1)),
    ]);
    const rows = await L.historyOf('u1');
    strictEqual(rows.length, 2);
    strictEqual(rows[0].delta, 20);
    // 멱등 키가 새어 나가면 남의 요청을 흉내 낼 실마리가 된다
    ok(!('key' in rows[0]));
    ok(!('userId' in rows[0]));
  });
});
