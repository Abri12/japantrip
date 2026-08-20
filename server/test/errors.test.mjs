/**
 * 오류 접수 — 「아무도 모른다」에서 벗어나는 장치.
 *
 * 이 모듈에서 정말로 중요한 건 저장이 아니라 **넘치지 않는 것**이다.
 * 인증 없는 엔드포인트인 데다(앱이 죽은 시점에 인증할 방법이 없다),
 * 크래시는 보통 연속으로 난다 — 화면이 죽고 다시 그리려다 또 죽는다.
 * 묶기와 상한이 없으면 파일이 몇 초 만에 못 쓰게 된다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { tempFile } from './helpers.mjs';

process.env.ERRORS_FILE = tempFile('errors');
process.env.ERRORS_MAX_KINDS = '5';
const E = await import('../errors.mjs');

const report = (over = {}) =>
  E.record({
    message: 'boom',
    stack: 'at Foo\nat Bar',
    where: 'render:Screen',
    platform: 'web',
    version: '1.0.0',
    ...over,
  });

describe('접수', () => {
  it('한 건 받으면 목록에 뜬다', async () => {
    strictEqual((await report()).ok, true);
    const list = await E.list();
    strictEqual(list.length, 1);
    strictEqual(list[0].message, 'boom');
    strictEqual(list[0].count, 1);
  });

  it('메시지가 없으면 안 받는다 — 셀 수 없는 줄은 자리만 차지한다', async () => {
    strictEqual((await report({ message: '' })).error, 'message');
  });

  it('같은 화면·같은 메시지는 한 줄로 묶고 횟수만 센다', async () => {
    await report();
    await report();
    const found = (await E.list()).find((k) => k.message === 'boom');
    strictEqual(found.count, 3, '연속 크래시가 줄로 쌓이면 안 된다');
    strictEqual((await E.list()).length, 1);
  });

  it('화면이 다르면 다른 줄이다 — 같은 메시지라도 고칠 곳이 다르다', async () => {
    await report({ where: 'render:Other' });
    strictEqual((await E.list()).length, 2);
  });

  it('아주 긴 메시지·스택은 잘라서 담는다', async () => {
    await report({ message: 'x'.repeat(1000), stack: 'y'.repeat(9000), where: 'long' });
    const found = (await E.list()).find((k) => k.where === 'long');
    ok(found.message.length <= 300, `메시지가 ${found.message.length}자`);
    ok(found.stack.length <= 2000, `스택이 ${found.stack.length}자`);
  });
});

describe('넘치지 않는다', () => {
  it('상한을 넘으면 오래 조용한 것부터 버린다', async () => {
    /* 횟수가 적은 것부터 버리면 **방금 생긴 새 오류**가 먼저 사라진다.
       정작 가장 알고 싶은 게 그건데. */
    for (let i = 0; i < 20; i++) await report({ where: `flood-${i}`, message: `m${i}` });

    const list = await E.list();
    strictEqual(list.length, 5, '상한이 안 지켜졌어요');
    // 마지막에 넣은 것이 남아 있어야 한다
    ok(list.some((k) => k.where === 'flood-19'), '가장 최근 오류가 밀려났어요');
  });

  it('목록은 최근에 일어난 순서 — 같은 밀리초여도 어긋나지 않는다', async () => {
    const list = await E.list();
    strictEqual(list[0].where, 'flood-19', '가장 최근 것이 맨 앞이어야 해요');
    for (let i = 1; i < list.length; i++) {
      ok(list[i - 1].lastAt >= list[i].lastAt, '시각 순서가 어긋났어요');
    }
  });
});

describe('사용자를 가리키는 값이 없다', () => {
  it('보낸 적 없는 필드는 저장되지도 않는다', async () => {
    /* 기기 id 를 얹으면 「누가 어느 화면에서 언제 무엇을 했나」가 쌓인다.
       그건 오류 추적이 아니라 행동 기록이다. */
    await E.record({
      message: 'with-extras',
      stack: '',
      where: 'x',
      platform: 'ios',
      version: '1',
      // 호출부가 실수로 얹더라도 모듈이 받지 않는다
      authorId: 'device-123',
      lat: 34.66,
      ip: '203.0.113.7',
    });
    const found = (await E.list()).find((k) => k.message === 'with-extras');
    ok(found);
    for (const banned of ['authorId', 'lat', 'lng', 'ip', 'userId']) {
      ok(!(banned in found), `${banned} 가 저장됐어요`);
    }
  });
});
