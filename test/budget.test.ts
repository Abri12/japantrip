/**
 * 예상 비용 — **모르는 것을 0 으로 세지 않는가.**
 *
 * 이 계산에서 사고가 나는 방향은 하나로 정해져 있다. 값을 모르는 곳을 0 으로
 * 세면 합계가 조용히 작아지고, 화면은 그걸 「최소 ¥3,000」이라고 자신 있게
 * 말한다. 사용자는 그 숫자를 믿고 현금을 덜 챙긴다.
 *
 * 그래서 여기서 지키는 것은 금액이 아니라 **빠진 것을 세어 돌려주는가**다.
 */

import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { budgetCaveat, budgetFor, sumBudgets } from '@/lib/budget';

/* 실제 데이터로 부른다. 가짜를 넣으면 데이터와 계산이 어긋나는 걸 못 잡는다.
   kinkakuji 500엔 · kiyomizu 500엔 · mizuno 1,500~2,500엔 · dotonbori 무료 ·
   kushikatsu-daruma 는 값이 여러 개라 priceYen 이 없다. */

describe('예상 비용', () => {
  it('금액을 아는 곳만 더한다', () => {
    const b = budgetFor(['kinkakuji', 'kiyomizu']);
    strictEqual(b.yen, 1000);
    strictEqual(b.counted, 2);
    strictEqual(b.unknown, 0);
  });

  it('금액대는 낮은 쪽으로 센다', () => {
    /* 「최소」라고 말할 것이라 높은 쪽으로 세면 이름과 어긋난다. */
    const b = budgetFor(['mizuno']);
    strictEqual(b.yen, 1500);
  });

  it('무료인 곳은 금액이 아니라 개수로 센다', () => {
    const b = budgetFor(['dotonbori', 'kinkakuji']);
    strictEqual(b.yen, 500);
    strictEqual(b.free, 1);
    strictEqual(b.counted, 1);
  });

  it('값을 모르는 곳을 0 으로 세지 않는다', () => {
    /*
     * 이 시험이 이 파일의 이유다. 0 으로 세면 합계는 그대로인데 「이게
     * 전부」라는 인상만 남는다. 개수로 남겨야 화면이 밝힐 수 있다.
     */
    const b = budgetFor(['kushikatsu-daruma', 'kinkakuji']);
    strictEqual(b.yen, 500);
    strictEqual(b.counted, 1);
    strictEqual(b.unknown, 1);
  });

  it('없는 장소 id 는 조용히 무시한다', () => {
    /* 저장 목록에 남은 옛 id 때문에 화면이 죽으면 안 된다. */
    const b = budgetFor(['__없는곳__', 'kinkakuji']);
    strictEqual(b.yen, 500);
    strictEqual(b.counted, 1);
  });

  it('여러 날을 합치면 개수도 함께 합쳐진다', () => {
    const a = budgetFor(['kinkakuji', 'dotonbori']);
    const b = budgetFor(['kushikatsu-daruma']);
    const t = sumBudgets([a, b]);
    strictEqual(t.yen, 500);
    strictEqual(t.free, 1);
    strictEqual(t.unknown, 1);
  });

  it('셀 것이 없으면 단서를 만들지 않는다', () => {
    /* 「최소 ¥0」은 「공짜 여행」으로 읽히는데 사실은 「아직 모른다」다.
       그때는 화면이 금액 자체를 안 그리도록 null 을 준다. */
    strictEqual(budgetCaveat(budgetFor(['dotonbori'])), null);
    strictEqual(budgetCaveat(budgetFor([])), null);
  });

  it('단서는 빠진 것을 빠짐없이 말한다', () => {
    const c = budgetCaveat(budgetFor(['kinkakuji', 'dotonbori', 'kushikatsu-daruma']));
    strictEqual(c?.includes('값을 모르는 1곳'), true);
    strictEqual(c?.includes('무료 1곳'), true);
    strictEqual(c?.includes('식비·교통비'), true);
  });
});
