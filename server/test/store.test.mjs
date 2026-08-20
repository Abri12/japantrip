/**
 * 파일 저장 — 여기가 깨지면 잔액이 사라진다.
 *
 * 예전 방식(`writeFile` 로 바로 덮어쓰기)이 위험했던 이유가 둘이다.
 *
 *   ① 쓰는 도중에 죽으면 반쯤 쓰인 JSON 이 남는다. 다음 실행에서 파싱에
 *      실패하고, 모듈들이 「첫 실행이다」로 넘어가 **잔액이 0이 된다.**
 *   ② 1초 미뤄서 몰아 쓰는데, 그 안에 서버를 끄면 마지막 변경이 사라진다.
 *
 * 두 가지를 그대로 재현해서 지금은 안 나는지 본다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { describe, it } from 'node:test';

import { tempFile } from './helpers.mjs';

/* 테스트가 1초씩 기다리지 않게 몰아 쓰는 간격을 줄인다 */
process.env.STORE_SAVE_DELAY_MS = '20';
const { flushAll, saver } = await import('../store.mjs');

describe('안전하게 쓴다', () => {
  it('예약하면 잠시 뒤에 쓰인다', async () => {
    const file = tempFile('store');
    let data = { n: 1 };
    const s = saver('t', file, () => data);

    s.schedule();
    await sleep(60);
    strictEqual(JSON.parse(readFileSync(file, 'utf8')).n, 1);
  });

  it('저장할 값을 함수로 읽는다 — 예약한 뒤에 바뀐 값이 쓰인다', async () => {
    /* 값으로 받으면 예약 시점의 객체에 묶여서, 모듈이 db 를 통째로 교체할
       때(파일에서 불러올 때가 그렇다) 옛 객체가 쓰인다. */
    const file = tempFile('store');
    let data = { n: 1 };
    const s = saver('t', file, () => data);

    s.schedule();
    data = { n: 2 };
    await sleep(60);
    strictEqual(JSON.parse(readFileSync(file, 'utf8')).n, 2);
  });

  it('여러 번 예약해도 한 번만 쓴다', async () => {
    const file = tempFile('store');
    let writes = 0;
    const s = saver('t', file, () => {
      writes += 1;
      return { n: writes };
    });

    for (let i = 0; i < 10; i++) s.schedule();
    await sleep(60);
    strictEqual(writes, 1, '요청마다 디스크를 때리면 안 된다');
  });

  it('임시 파일을 남기지 않는다', async () => {
    const file = tempFile('store');
    const s = saver('t', file, () => ({ n: 1 }));
    await s.flush();

    const leftovers = readdirSync(dirname(file)).filter((f) => f.endsWith('.tmp'));
    strictEqual(leftovers.length, 0, `임시 파일이 남았어요: ${leftovers.join(', ')}`);
  });

  it('덮어쓸 때 옛 파일이 사라지는 순간이 없다', async () => {
    /*
     * 이름 바꾸기로 갈아끼우므로, 어느 시점에 읽어도 **옛 내용이 온전하거나
     * 새 내용이 온전하거나** 둘 중 하나여야 한다. 빈 파일이나 반쪽 JSON 이
     * 보이면 안 된다.
     */
    const file = tempFile('store');
    writeFileSync(file, JSON.stringify({ n: 'old' }), 'utf8');

    let data = { n: 'new'.repeat(20_000) }; // 한 번에 안 써질 만큼 크게
    const s = saver('t', file, () => data);

    const flushing = s.flush();
    // 쓰는 동안 계속 읽어 본다
    for (let i = 0; i < 50; i++) {
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      ok(parsed.n === 'old' || parsed.n === data.n, '반쯤 쓰인 파일이 보였어요');
    }
    await flushing;
    strictEqual(JSON.parse(readFileSync(file, 'utf8')).n, data.n);
  });
});

describe('끝날 때 마저 쓴다', () => {
  it('flushAll 이 밀린 저장을 전부 끝낸다', async () => {
    const a = tempFile('store-a');
    const b = tempFile('store-b');
    const sa = saver('a', a, () => ({ who: 'a' }));
    const sb = saver('b', b, () => ({ who: 'b' }));

    sa.schedule();
    sb.schedule();
    // 몰아 쓰는 시간이 지나기 전에 끈다
    const n = await flushAll();

    strictEqual(n, 2);
    strictEqual(JSON.parse(readFileSync(a, 'utf8')).who, 'a');
    strictEqual(JSON.parse(readFileSync(b, 'utf8')).who, 'b');
  });

  it('밀린 게 없으면 아무것도 안 한다', async () => {
    strictEqual(await flushAll(), 0);
  });

  it('flush 뒤에는 예약이 남아 있지 않다 — 두 번 쓰지 않는다', async () => {
    const file = tempFile('store');
    let writes = 0;
    const s = saver('t', file, () => {
      writes += 1;
      return { writes };
    });

    s.schedule();
    await s.flush();
    await sleep(60); // 예약이 살아 있었다면 여기서 한 번 더 썼을 것이다
    strictEqual(writes, 1);
  });
});
