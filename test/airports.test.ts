/**
 * 공항 → 시내 — **추천이 눈에 보이는 자리에 있는가.**
 *
 * 화면은 거점의 `ways` 배열을 **순서 그대로** 카드로 그린다(정렬하지 않는다,
 * `features/airport/hub-picker.tsx`). 그래서 배열 순서가 곧 화면 순서다.
 *
 * 그 사실을 잊고 추천이 아닌 것을 위에 올린 적이 있다. 첫 카드에는 추천
 * 표시가 없고 두 번째 카드에 붙어 있으니, 화면만 보면 **「그래서 뭘 추천한다는
 * 거냐」**가 된다. 실제로 세 거점이 그 상태였다 — 신치토세 스스키노와 마쓰야마
 * 두 곳이다.
 *
 * 눈으로는 못 잡는다. 데이터 파일에서 두 항목은 몇 줄 떨어져 있을 뿐이고,
 * 어느 쪽이 위인지가 문제라는 걸 화면을 열어 봐야 안다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AIRPORTS } from '@/data/airports';

/** 모든 공항 × 거점을 한 줄로 편다 — 시험마다 두 겹 반복을 쓰지 않으려고 */
const HUBS = AIRPORTS.flatMap((a) => (a.hubs ?? []).map((h) => ({ airport: a, hub: h })));

describe('공항 거점의 가는 방법', () => {
  it('추천은 거점마다 하나다', () => {
    /* 둘이면 화면에 「추천」 뱃지가 두 개 떠서 고르라는 건지 아닌지 모른다. */
    for (const { airport, hub } of HUBS) {
      const n = hub.ways.filter((w) => w.recommended).length;
      strictEqual(n, 1, `${airport.name} ${hub.name}: 추천이 ${n}개예요`);
    }
  });

  it('추천이 맨 위에 있다', () => {
    /*
     * 화면이 배열 순서대로 그리므로, 추천이 두 번째면 사용자는 추천 없는
     * 카드를 먼저 만난다. 「위에 있는 게 추천이겠지」와 실제가 어긋난다.
     */
    for (const { airport, hub } of HUBS) {
      const i = hub.ways.findIndex((w) => w.recommended);
      strictEqual(i, 0, `${airport.name} ${hub.name}: 추천이 ${i + 1}번째예요`);
    }
  });

  it('거점의 일부에만 가는 방법을 추천하지 않는다', () => {
    /*
     * `skips` 가 있는 방법은 그 거점의 한쪽에 안 간다(하네다 케이큐는
     * 도쿄역에 안 간다). 거점 이름을 보고 고른 사람에게 「거기 안 가는 것」을
     * 추천하면 안 된다.
     */
    for (const { airport, hub } of HUBS) {
      const rec = hub.ways.find((w) => w.recommended);
      ok(
        !rec?.skips,
        `${airport.name} ${hub.name}: 추천이 ${rec?.skips}에 안 가는 방법이에요`,
      );
    }
  });

  it('거점 전체에 가는 방법이 적어도 하나 있다', () => {
    /*
     * 전부 `skips` 면 그 거점은 이름이 잘못된 것이다 — 아무도 「도쿄역」에
     * 가지 않는데 거점 이름이 「도쿄역 · 긴자」일 수는 없다. 「가장 빠름 ·
     * 가장 저렴」 비교도 성립하지 않는다.
     */
    for (const { airport, hub } of HUBS) {
      ok(
        hub.ways.some((w) => !w.skips),
        `${airport.name} ${hub.name}: 모든 방법이 거점의 일부에만 가요`,
      );
    }
  });

  it('가는 방법이 가리키는 노선이 실제로 있다', () => {
    /*
     * `routeId` 오타는 카드에서 노선 이름과 타는 순서가 통째로 빠지는 걸로
     * 나타나는데, 카드 자체는 그려져서 훑을 때 안 보인다.
     *
     * **비어 있는 것은 정상이다.** 어느 노선에도 걸리지 않는 방법이 있다 —
     * 리무진이 없는 도시의 택시 같은 것. 그건 건너뛰고 **적혀 있는데 없는
     * 노선을 가리키는 경우**만 잡는다.
     */
    for (const { airport, hub } of HUBS) {
      const ids = new Set(airport.routes.map((r) => r.id));
      for (const w of hub.ways) {
        if (w.routeId === undefined) continue;
        ok(ids.has(w.routeId), `${airport.name} ${hub.name}: ${w.routeId} 노선이 없어요`);
      }
    }
  });

  it('같은 노선을 두 번 쓰면 라벨이 다르다', () => {
    /*
     * 한 노선으로 여러 조합을 만드는 건 정상이다 — 사카에는 가나야마 환승과
     * 나고야역 환승이 둘 다 메이테츠 특급이다. 다만 **라벨이 같으면** 카드
     * 두 장이 똑같아 보여서 왜 둘인지 알 수 없다.
     */
    for (const { airport, hub } of HUBS) {
      const labels = hub.ways.map((w, i) => w.label ?? w.routeId ?? `#${i}`);
      strictEqual(
        new Set(labels).size,
        labels.length,
        `${airport.name} ${hub.name}: 같은 이름의 방법이 둘이에요`,
      );
    }
  });

  it('시간과 요금이 말이 되는 값이다', () => {
    /* 0분이나 음수 요금이 들어가면 「가장 빠름 · 가장 저렴」 뱃지가 그쪽으로
       쏠려서, 한 칸이 틀렸는데 다른 카드까지 이상해진다. */
    for (const { airport, hub } of HUBS) {
      for (const w of hub.ways) {
        ok(w.minutes > 0, `${airport.name} ${hub.name} ${w.routeId}: 소요시간이 ${w.minutes}분이에요`);
        ok(w.yen >= 0, `${airport.name} ${hub.name} ${w.routeId}: 요금이 ${w.yen}엔이에요`);
        ok(w.transfers >= 0, `${airport.name} ${hub.name} ${w.routeId}: 환승이 ${w.transfers}회예요`);
      }
    }
  });
});
