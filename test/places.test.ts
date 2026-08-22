/**
 * 장소 데이터가 **스스로 어긋나지 않는가.**
 *
 * 여기서 지키는 것은 하나다 — 화면에 원화로 그릴 금액(`priceYen`)이 **사람이
 * 읽는 문장(`admission`) 안에 실제로 있는 숫자인가.**
 *
 * 이 시험이 없으면 조용히 틀린다. 문장을 고치는 일(「500엔」 → 「600엔」)은
 * 자주 있고, 그때 옆에 있는 숫자를 같이 고치는 것은 잊기 쉽다. 잊으면 화면에
 * 「600엔 (약 4,400원)」이 나온다 — 두 값이 서로 다른 말을 하는데 둘 다
 * 그럴듯해 보여서, 사람이 눌러 보기 전까지 아무도 모른다.
 *
 * 타입 검사도 린트도 이걸 못 본다. 둘 다 형식만 볼 뿐 「이 숫자가 저 문장에
 * 있나」는 모른다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PLACES, Place } from '@/data/places';
import { accessSummary } from '@/lib/access';
import { shortPrice } from '@/lib/price';

/** 1500 → 「1,500」과 「1500」 둘 다 문장에 있을 수 있다 */
function appearsIn(text: string, yen: number): boolean {
  const plain = String(yen);
  const comma = yen.toLocaleString('en-US');
  return text.includes(plain) || text.includes(comma);
}

describe('장소 금액', () => {
  it('priceYen 은 admission 문장에 실제로 있는 숫자다', () => {
    for (const p of PLACES) {
      if (!p.priceYen) continue;
      ok(p.admission, `${p.id}: priceYen 이 있는데 admission 이 없어요`);
      for (const yen of p.priceYen) {
        ok(
          appearsIn(p.admission!, yen),
          `${p.id}: ${yen} 이 문장에 없어요 — "${p.admission}"`,
        );
      }
    }
  });

  it('금액대는 낮은 값이 앞이다', () => {
    /* 뒤바뀌면 화면이 「약 22,000원 ~ 약 13,000원」처럼 그린다. */
    for (const p of PLACES) {
      if (p.priceYen?.length !== 2) continue;
      const [low, high] = p.priceYen;
      ok(low < high, `${p.id}: ${low} ~ ${high} 는 순서가 뒤바뀌었어요`);
    }
  });

  it('무료인 곳에는 금액을 달지 않는다', () => {
    /*
     * 답이 「무료」인데 유료 부분에 원화를 붙이면 돈을 내야 하는 것처럼
     * 읽힌다. 「무료 (전시관 300엔)」 같은 곳이 그렇다.
     */
    for (const p of PLACES) {
      if (!p.priceYen) continue;
      ok(
        !p.admission!.startsWith('무료'),
        `${p.id}: 무료인데 금액이 달려 있어요 — "${p.admission}"`,
      );
    }
  });

  it('코스가 더하는 값과 화면에 그리는 값은 서로 다른 일을 한다', () => {
    /*
     * `admissionYen` 은 그날 반드시 나가는 돈이고 `priceYen` 은 문장이 말하는
     * 금액이다. 둘이 항상 같지는 않다 — 마쓰야마성은 admissionYen 이 1040
     * (천수 520 + 로프웨이 520)인데 문장에는 1040 이 없어서 priceYen 이 없다.
     *
     * 그래도 **둘 다 단일 값으로 있으면서 서로 다르면** 대개 실수다. 한쪽만
     * 고친 흔적이기 때문이다.
     */
    for (const p of PLACES) {
      if (p.admissionYen === undefined || p.priceYen?.length !== 1) continue;
      strictEqual(
        p.priceYen[0],
        p.admissionYen,
        `${p.id}: 코스는 ${p.admissionYen}엔, 화면은 ${p.priceYen[0]}엔 — 한쪽만 고친 것 같아요`,
      );
    }
  });

  it('좌표와 인증 반경이 쓸 수 있는 값이다', () => {
    /* 반경이 0 이면 아무도 인증하지 못하고, 일본 밖 좌표는 오타다. */
    for (const p of PLACES) {
      ok(p.lat > 24 && p.lat < 46, `${p.id}: 위도 ${p.lat} 는 일본이 아니에요`);
      ok(p.lng > 122 && p.lng < 154, `${p.id}: 경도 ${p.lng} 는 일본이 아니에요`);
      ok((p.radiusM ?? 10) > 0, `${p.id}: 인증 반경이 0 이에요`);
    }
  });

  it('id 가 겹치지 않는다', () => {
    /* 겹치면 뒤엣것이 화면에서 안 보이고, 서버 좌표도 한쪽만 남는다. */
    const seen = new Set<string>();
    for (const p of PLACES) {
      ok(!seen.has(p.id), `${p.id}: id 가 두 번 쓰였어요`);
      seen.add(p.id);
    }
  });
});

describe('목록에 보일 값', () => {
  it('priceYen 이 있으면 그 값으로 줄인다', () => {
    /* 문장 앞부분을 잘라 쓰면 「공원 무료 · 천수각 1,200엔」이 「공원 무료」가
       된다. 싸 보이는 쪽으로 틀리는 것이라, 이 앱이 정한 방향과 반대다. */
    const castle = PLACES.find((p) => p.id === 'osaka-castle');
    strictEqual(shortPrice(castle!), '1,200엔');
  });

  it('금액대는 양쪽을 다 보인다', () => {
    const usj = PLACES.find((p) => p.id === 'usj');
    strictEqual(shortPrice(usj!), '8,400~11,900엔');
  });

  it('괄호로 덧붙인 단서는 뗀다', () => {
    /* 「무료 (전시관 300엔)」의 괄호는 본값이 아니라 설명이라, 떼어도 앞의
       값이 말하는 바가 달라지지 않는다. */
    const fake = { admission: '무료 (전시관 300엔)' } as Place;
    strictEqual(shortPrice(fake), '무료');
  });

  it('줄일 수 없는 값은 문장 그대로 준다', () => {
    /* 하나의 숫자로 못 줄이는 값이 있다. 억지로 대표값을 만드는 것보다
       잘린 문장이 정직하다 — 자르는 일은 화면이 한다. */
    const fake = { admission: '커피 600엔대 · 아침 세트 1,500엔 안팎' } as Place;
    strictEqual(shortPrice(fake), '커피 600엔대 · 아침 세트 1,500엔 안팎');
  });

  it('목록의 역 이름에는 일본어 원문이 없다', () => {
    /* 원문이 필요한 순간은 역에 서서 안내판과 대조할 때다. 목록에 붙으면
       줄 길이가 두 배가 되면서 폰 폭에서 세 줄로 쪼개진다. */
    const castle = PLACES.find((p) => p.id === 'osaka-castle');
    const short = accessSummary(castle!.access!, { ja: false });
    strictEqual(short.includes('谷町'), false);
    strictEqual(accessSummary(castle!.access!).includes('谷町'), true);
  });
});

describe('확인한 날짜', () => {
  it('local 이 없는 곳에는 날짜를 두지 않는다', () => {
    /*
     * 화면에서 이 날짜를 그리는 자리는 `features/place/local-caveats.tsx`
     * 하나뿐이고, 그 구역은 `local` 이 있을 때만 그려진다. 그러니 `local`
     * 없는 `checkedAt` 은 **어디에도 안 나오는 값**이다.
     *
     * 안 나오는 값은 조용히 늘어난다. 실제로 열넷이 그렇게 쌓여 있었다 —
     * 데이터를 채우면서 날짜만 같이 적어 둔 것이다. 파일만 보면 확인이 잘
     * 되어 있는 것처럼 보이는데 화면에는 아무것도 없다.
     */
    for (const p of PLACES) {
      ok(
        !(p.checkedAt && !p.local),
        `${p.name}: local 없이 checkedAt 만 있어요 — 화면에 안 나오는 값이에요`,
      );
    }
  });

  it('날짜 형식이 YYYY-MM 이다', () => {
    /* `checkedLabel` 이 이 형식만 읽는다. 어긋나면 조용히 null 이 되어
       「기록이 없어요」로 떨어지는데, 적어 둔 사람은 적었다고 생각한다. */
    for (const p of PLACES) {
      if (!p.checkedAt) continue;
      ok(/^\d{4}-(0[1-9]|1[0-2])$/.test(p.checkedAt), `${p.name}: ${p.checkedAt}`);
    }
  });

  it('미래 날짜가 아니다', () => {
    /* 「2027년 3월에 확인한 정보예요」는 확인한 적 없다는 뜻이다. */
    const now = new Date();
    const cap = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    for (const p of PLACES) {
      if (!p.checkedAt) continue;
      ok(p.checkedAt <= cap, `${p.name}: ${p.checkedAt} 은 아직 오지 않았어요`);
    }
  });
});

describe('원본이 없는 곳', () => {
  it('approx 와 checkedAt 은 함께 있지 않는다', () => {
    /*
     * `approx` 는 「대조할 원본이 아예 없다」는 뜻이고 `checkedAt` 은
     * 「원본과 대조한 날」이다. 둘이 함께 있으면 없는 것을 대조했다는 말이 된다.
     *
     * 화면도 둘을 다르게 말한다 — 날짜가 있으면 날짜를, 없고 approx 면
     * 「정해진 시간표가 없어요」를 띄운다. 섞이면 어느 쪽도 못 믿는다.
     */
    for (const p of PLACES) {
      ok(
        !(p.local?.approx && p.checkedAt),
        `${p.name}: 원본이 없다면서 확인 날짜가 있어요`,
      );
    }
  });

  it('approx 는 시간을 말하는 곳에만 붙인다', () => {
    /* 시간 이야기가 없는데 「정해진 시간표가 없어요」를 띄우면 무슨 말인지
       알 수 없다. 웨이팅·현금만 같은 것은 원본과 상관없는 관찰이다. */
    for (const p of PLACES) {
      if (!p.local?.approx) continue;
      ok(
        p.local.hours || p.local.closed,
        `${p.name}: 시간 이야기가 없는데 approx 가 붙어 있어요`,
      );
    }
  });

  it('확인한 날짜가 있으면 무엇을 보고 확인했는지도 남긴다', () => {
    /*
     * 아직 쉰셋은 출처를 모른다 — `checkedVia` 를 만들기 전에 찍힌 것들이라
     * 되짚을 방법이 없다. 그래서 지금은 **줄어드는지만** 본다.
     *
     * 이 숫자를 올리는 방향으로 고치면 안 된다. 내리는 쪽으로만 움직인다.
     */
    const missing = PLACES.filter((p) => p.checkedAt && !p.checkedVia);
    ok(
      missing.length <= 53,
      `출처 없는 확인이 ${missing.length}건으로 늘었어요 (기준 53). ` +
        `새로 확인할 때는 checkedVia 를 함께 남겨주세요`,
    );
  });
});
