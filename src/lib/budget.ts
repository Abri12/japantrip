import { findPlace } from '@/data/places';

/**
 * 내 일정에 담은 곳들이 **최소 얼마나 드는가.**
 *
 * ## 왜 이 앱이 이걸 할 수 있나
 *
 * 가계부 앱들은 여행 전 가격을 모른다. 사용자가 쓴 돈을 적어야 비로소 안다.
 * 이 앱은 반대다 — **쓴 돈은 모르지만 쓸 돈은 이미 안다.** 장소마다
 * `priceYen` 이 있고, 사용자는 그걸 며칠째에 갈지까지 담아 뒀다.
 *
 * 그래서 **사용자가 아무것도 입력하지 않고** 「3박4일에 입장료만 얼마」가
 * 나온다. 이게 이 기능의 전부이자 값어치다.
 *
 * ## 「총액」이 아니라 「최소」다
 *
 * 이 숫자를 총액이라 부르면 거짓말이 된다. 셋이 빠져 있다.
 *
 *   ① **식비·교통비가 없다.** 여행 경비의 큰 쪽이 통째로 빠진다.
 *   ② **값을 모르는 곳이 있다.** 문장이 여러 상품 값을 말하거나
 *      (「목욕만 700엔 · 휴게실 1,300엔」) 하한만 말하는 곳은 `priceYen` 이
 *      없다. 그런 곳은 0 으로 세지 않고 **몇 곳인지 따로 돌려준다** —
 *      화면이 「N곳은 빼고 셌어요」라고 말할 수 있어야 한다.
 *   ③ **금액대는 낮은 쪽만 쓴다.** 「1,500~2,500엔」은 1,500 으로 센다.
 *      높은 쪽으로 세면 실제보다 비싸게 말하게 되고, 「최소」라는 말과도
 *      어긋난다.
 *
 * 빠진 것을 세어 함께 돌려주는 게 요점이다. 숫자 하나만 주면 사용자는 그게
 * 전부인 줄 안다.
 *
 * ## 왜 `admissionYen` 이 아니라 `priceYen` 인가
 *
 * `admissionYen` 은 **추천 코스**가 쓰는 값이다. 코스는 「이 정류장에서
 * 실제로 들어간다」(`pays`)를 사람이 정해 두었기 때문에 그 값을 그냥 더해도
 * 된다. 내 일정에는 그런 표시가 없다 — 사용자가 오사카성에서 공원만 걸을지
 * 천수각에 올라갈지 우리는 모른다.
 *
 * 그래서 여기서는 **문장이 말하는 금액**(`priceYen`)을 쓰고, 대신 「최소」라고
 * 이름 붙인다. 값의 성격이 다르니 출처도 다르다.
 */
export interface DayBudget {
  /** 값을 아는 곳들의 합계(엔). 금액대는 낮은 쪽 */
  yen: number;
  /** 합계에 실제로 들어간 곳 수 */
  counted: number;
  /** 무료인 곳 수 */
  free: number;
  /** 돈은 드는데 얼마인지 모르는 곳 수 — 화면이 이걸 밝혀야 한다 */
  unknown: number;
}

const EMPTY: DayBudget = { yen: 0, counted: 0, free: 0, unknown: 0 };

/** 이 장소가 공짜인가 — 문장이 「무료」로 시작하면 그렇다 */
function isFree(admission?: string): boolean {
  return !admission || admission.startsWith('무료');
}

/** 장소 id 목록의 최소 비용 */
export function budgetFor(placeIds: readonly string[]): DayBudget {
  return placeIds.reduce<DayBudget>((acc, id) => {
    const place = findPlace(id);
    if (!place) return acc;

    if (isFree(place.admission)) return { ...acc, free: acc.free + 1 };
    if (!place.priceYen) return { ...acc, unknown: acc.unknown + 1 };

    return { ...acc, yen: acc.yen + place.priceYen[0], counted: acc.counted + 1 };
  }, EMPTY);
}

/** 여러 날을 합친다 */
export function sumBudgets(days: readonly DayBudget[]): DayBudget {
  return days.reduce<DayBudget>(
    (a, b) => ({
      yen: a.yen + b.yen,
      counted: a.counted + b.counted,
      free: a.free + b.free,
      unknown: a.unknown + b.unknown,
    }),
    EMPTY,
  );
}

/**
 * 「N곳은 값을 몰라 빼고 셌어요」 같은 단서.
 *
 * 셀 것이 아무것도 없으면 null — 그때는 화면이 금액 자체를 안 그린다.
 * 「최소 ¥0」은 「공짜 여행」으로 읽히는데 사실은 「아직 모른다」다.
 */
export function budgetCaveat(b: DayBudget): string | null {
  if (b.counted === 0) return null;
  const parts: string[] = [];
  if (b.unknown > 0) parts.push(`값을 모르는 ${b.unknown}곳은 빼고 셌어요`);
  if (b.free > 0) parts.push(`무료 ${b.free}곳`);
  parts.push('식비·교통비는 안 들어가요');
  return parts.join(' · ');
}
