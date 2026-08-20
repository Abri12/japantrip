/**
 * 파일에 안전하게 쓰는 장치 — 여섯 모듈이 같이 쓴다.
 *
 * ## 무엇이 위험했나
 *
 * 여태 저장은 이랬다.
 *
 *     await writeFile(FILE, JSON.stringify(db), 'utf8');
 *
 * 이 한 줄에 문제가 둘 있다.
 *
 * **① 쓰는 도중에 죽으면 파일이 깨진다.** `writeFile` 은 파일을 먼저 비우고
 * 새 내용을 채운다. 그 사이에 프로세스가 끝나면 반쯤 쓰인 JSON 이 남고,
 * 다음 실행에서 파싱에 실패한다. 그러면 모듈들이 「첫 실행이다」로 넘어가서
 * **잔액이 통째로 0이 된다.** 원장은 돈에 해당하는 값이라 이건 사고다.
 *
 * **② 1초를 못 넘기면 사라진다.** 저장은 1초 미뤄서 몰아 쓴다(그래야 요청
 * 하나마다 디스크를 때리지 않는다). 그런데 그 1초 안에 서버를 끄면 마지막
 * 변경이 그냥 없어진다. Ctrl+C 로 끄는 것이 일상이라 드문 일도 아니다.
 *
 * ## 어떻게 고치나
 *
 * **임시 파일에 다 쓰고 나서 이름을 바꾼다.** 이름 바꾸기는 파일 시스템이
 * 쪼갤 수 없는 한 동작으로 처리하므로, 어느 시점에 죽든 파일은 **옛 내용이
 * 온전하거나 새 내용이 온전하거나** 둘 중 하나다. 반쯤 쓰인 상태가 존재하지
 * 않는다.
 *
 * 그리고 **끝날 때 남은 것을 마저 쓴다.** 종료 신호를 받으면 미뤄 둔 저장을
 * 먼저 끝내고 나간다.
 *
 * ## 왜 모듈마다 안 두고 여기 모았나
 *
 * 같은 저장 코드가 여섯 벌 있었다(원장·출금·기여·리뷰·구독자·오류). 여섯
 * 벌이면 이 수정도 여섯 번 해야 하고, 다음에 하나를 빠뜨린다. 이 저장소에서
 * 같은 규칙이 두 벌로 갈라져 사고가 난 적이 이미 두 번 있었다.
 */

import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** 저장이 밀려 있는 것들. 끝날 때 이걸 훑어 마저 쓴다 */
const pending = new Set();

/** 몇 초 몰아서 쓸지. 요청 하나마다 디스크를 때리지 않기 위한 값이다 */
const DELAY_MS = Number(process.env.STORE_SAVE_DELAY_MS ?? 1000);

/**
 * 파일 하나를 맡는 저장기를 만든다.
 *
 * @param name  로그에 찍을 이름
 * @param file  저장할 경로
 * @param read  지금 저장할 내용을 돌려주는 함수. 모듈이 자기 `db` 를 그대로
 *   들고 있게 하려고 값이 아니라 함수를 받는다 — 값으로 받으면 저장기를
 *   만든 시점의 객체에 묶여서, 모듈이 `db` 를 통째로 교체할 때(파일에서
 *   불러올 때가 그렇다) 옛 객체를 쓰게 된다.
 */
export function saver(name, file, read) {
  let timer = null;

  async function writeNow() {
    const tmp = `${file}.tmp`;
    await mkdir(dirname(file), { recursive: true });
    await writeFile(tmp, JSON.stringify(read()), 'utf8');
    /*
     * 이름 바꾸기가 이 함수의 전부다.
     *
     * 윈도우에서도 대상 파일이 있으면 덮어쓴다(Node 가 MOVEFILE_REPLACE_EXISTING
     * 으로 부른다). 그래서 미리 지울 필요가 없고, 지우면 오히려 「지워졌는데
     * 아직 안 옮겨진」 순간이 생긴다.
     */
    await rename(tmp, file);
  }

  const api = {
    /** 나중에 몰아서 쓴다 */
    schedule() {
      pending.add(api);
      if (timer) return;
      timer = setTimeout(async () => {
        timer = null;
        pending.delete(api);
        try {
          await writeNow();
        } catch (err) {
          console.warn(`[${name}] 저장 실패:`, err.message);
        }
      }, DELAY_MS);
      /* 저장 하나 때문에 프로세스가 살아 있을 이유는 없다. 다른 할 일이
         없으면 그냥 끝나야 하고, 밀린 저장은 종료 처리가 챙긴다. */
      timer.unref?.();
    },

    /** 지금 당장 쓴다. 종료 직전에 부른다 */
    async flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      pending.delete(api);
      try {
        await writeNow();
      } catch (err) {
        console.warn(`[${name}] 저장 실패:`, err.message);
      }
    },
  };

  return api;
}

/**
 * 밀려 있는 저장을 전부 끝낸다.
 *
 * 종료 신호와 잡히지 않은 오류 둘 다에서 부른다. **죽더라도 쓴 것은 남겨야
 * 한다** — 특히 원장은 마지막 1초를 잃는 것이 곧 누군가의 크레딧을 잃는 것이다.
 */
export async function flushAll() {
  const jobs = [...pending].map((p) => p.flush());
  await Promise.all(jobs);
  return jobs.length;
}
