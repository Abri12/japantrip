/**
 * 출금 게이트 — 가치가 밖으로 나가는 한 지점.
 *
 * 여기가 뚫리면 나머지 방어(가중 확인·보류)가 전부 무의미해진다. 담합을
 * 막는 근거가 「받는 곳이 하나면 한 사람분만 나간다」 하나뿐이라, 그
 * 유일성이 실제로 지켜지는지가 이 파일의 전부다.
 *
 * 특히 **번호 표기 정규화**를 본다. 같은 번호를 다르게 적는 것만으로
 * 유일성 검사를 지나갈 수 있으면 게이트가 없는 것과 같다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { daysAgo, hoursAgo, seedLedgerFile, tempFile } from './helpers.mjs';

/*
 * 원장은 이 파일 전체가 하나를 같이 쓴다. 출금 모듈 안의 `import './ledger.mjs'`
 * 는 쿼리 없는 지정자라 캐시된 인스턴스를 보기 때문이다(helpers 주석 참고).
 * 시나리오는 사용자 id 로 가른다.
 */
seedLedgerFile([
  // 숙려가 끝난 잔액이 넉넉한 사람
  { id: 'a', key: 'a', userId: 'rich', delta: 500, reason: 'x', ref: null, at: daysAgo(10) },
  // 잔액은 있는데 방금 받아서 아직 못 쓰는 사람
  { id: 'b', key: 'b', userId: 'fresh', delta: 500, reason: 'x', ref: null, at: hoursAgo(1) },
  // 그냥 모자란 사람
  { id: 'c', key: 'c', userId: 'poor', delta: 10, reason: 'x', ref: null, at: daysAgo(10) },
]);
process.env.PAYOUT_FILE = tempFile('payout');
process.env.PAYOUT_WINDOW_LIMIT = '300';

const P = await import('../payout.mjs');

describe('bind — 수령처 유일성', () => {
  it('처음 묶는 것은 된다', async () => {
    strictEqual((await P.bind('u1', '010-1234-5678')).ok, true);
    strictEqual(await P.isBound('u1'), true);
  });

  it('같은 번호를 다시 묶어도 문제없다 — 재시도가 실패로 보이면 안 된다', async () => {
    strictEqual((await P.bind('u1', '010-1234-5678')).ok, true);
  });

  it('표기가 달라도 같은 번호로 본다', async () => {
    /* 하이픈·공백·국가번호 표기가 제각각이다. 정규화가 없으면 번호 하나로
       계정 여러 개를 통과시킬 수 있어서 게이트가 무의미해진다. */
    for (const same of ['01012345678', '+82 10-1234-5678', '82 010 1234 5678', ' 010 1234 5678 ']) {
      const res = await P.bind('attacker', same);
      strictEqual(res.error, 'target-taken', `${same} 가 같은 번호로 안 잡혔어요`);
    }
  });

  it('한 번 묶으면 다른 번호로 못 바꾼다', async () => {
    const res = await P.bind('u1', '010-9999-0000');
    strictEqual(res.error, 'already-bound');
  });

  it('이메일도 같은 규칙으로 다룬다', async () => {
    strictEqual((await P.bind('u2', 'A@Example.com ')).ok, true);
    strictEqual((await P.bind('u3', 'a@example.com')).error, 'target-taken');
  });

  it('빈 값이나 너무 짧은 값은 거부한다', async () => {
    strictEqual((await P.bind('u4', '')).error, 'invalid');
    strictEqual((await P.bind('u4', '123')).error, 'invalid');
    strictEqual((await P.bind('', '010-1111-2222')).error, 'invalid');
  });

  it('운영자가 풀어 주면 그 번호를 다시 쓸 수 있다', async () => {
    await P.bind('leaving', '010-7777-8888');
    strictEqual((await P.unbind('leaving')).ok, true);
    strictEqual(await P.isBound('leaving'), false);
    strictEqual((await P.bind('arriving', '010-7777-8888')).ok, true);
  });

  it('묶은 적 없는 사람을 풀 수는 없다', async () => {
    strictEqual((await P.unbind('nobody')).error, 'not-bound');
  });
});

describe('check — 교환해도 되는가', () => {
  it('수령처를 안 묶었으면 막는다', async () => {
    const res = await P.check('rich', 10);
    strictEqual(res.ok, false);
    strictEqual(res.error, 'not-bound');
  });

  it('묶고 잔액이 익었으면 통과한다', async () => {
    await P.bind('rich', '010-1000-0001');
    strictEqual((await P.check('rich', 100)).ok, true);
  });

  it('잔액은 있는데 숙려가 안 끝나면 이유를 구분해 준다', async () => {
    await P.bind('fresh', '010-1000-0002');
    const res = await P.check('fresh', 100);
    strictEqual(res.ok, false);
    /* 「모자람」과 「아직 못 씀」은 사용자가 할 일이 다르다 — 하나는 더
       모아야 하고 하나는 기다리면 된다. 같은 오류로 뭉치면 안 된다. */
    strictEqual(res.error, 'maturing');
    strictEqual(res.balance, 500);
    strictEqual(res.matured, 0);
  });

  it('그냥 모자라면 insufficient 다', async () => {
    await P.bind('poor', '010-1000-0003');
    const res = await P.check('poor', 100);
    strictEqual(res.error, 'insufficient');
    ok(res.balance < 100);
  });
});

describe('기간 상한 — 뚫려도 새어 나가는 양이 유한하다', () => {
  it('창 안에 이미 나간 만큼을 뺀다', async () => {
    await P.bind('spender', '010-2000-0001');
    strictEqual((await P.check('spender', 100)).ok, false); // 잔액이 없다

    // 잔액이 넉넉한 사람으로 상한만 본다
    await P.record('rich', 'gifticon', 250);
    const res = await P.check('rich', 100);
    strictEqual(res.ok, false);
    strictEqual(res.error, 'window-limit');
    strictEqual(res.spent, 250);
    strictEqual(res.limit, 300);
  });

  it('상한 안이면 통과한다', async () => {
    strictEqual((await P.check('rich', 50)).ok, true);
  });
});
