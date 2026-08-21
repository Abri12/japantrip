import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { MAX_DAYS } from './itinerary';

/**
 * 쓴 돈 — **하루에 한 줄.**
 *
 * ## 왜 이렇게 얇은가
 *
 * 이 앱은 지금까지 **읽는 앱**이었다. 입력이라곤 저장 한 번, 일차 한 번이
 * 전부다. 가계부는 그 성질을 정면으로 거스른다 — 여행 내내 매번 적어야 하고,
 * 지치고 바쁜 상태에서 그걸 계속하는 사람은 드물다. 수동 가계부가 사흘째에
 * 버려지는 게 그 때문이다.
 *
 * 그래서 **분류도 결제수단도 두지 않았다.** 하루에 숫자 하나다.
 * 「식비/교통/쇼핑」을 나누게 하는 순간 입력이 서너 배가 되고, 그 순간
 * 이 기능은 안 쓰이게 된다. 나눠 적고 싶은 사람에게는 전용 앱이 훨씬 낫다
 * (Trabee Pocket 등) — 거기서 이기려 들 이유가 없다.
 *
 * ## 왜 엔화로 적나
 *
 * 실제로 내는 돈이 엔화다. 원화로 적게 하면 카드 수수료·환율이 사람마다
 * 달라서 같은 지출이 다른 숫자가 되고, 예상 비용(엔)과도 단위가 어긋나
 * 나란히 놓을 수 없다. 원화는 화면이 환산해서 함께 보여준다.
 *
 * ## 기기에만 저장한다
 *
 * 서버로 보낼 이유가 없다. 오히려 **보내면 안 되는 쪽에 가깝다** — 「며칠에
 * 어디서 얼마 썼나」는 이 앱이 지금까지 만들지 않으려고 애써 온 종류의
 * 기록이다. 계정도 사용 기록도 없앤 앱이 지출 내역을 서버에 쌓으면 앞뒤가
 * 안 맞는다.
 *
 * ## 여행이 끝나면
 *
 * 일정과 같은 자리에 있으므로 다음 여행을 시작할 때 함께 지운다. 지우는
 * 방법은 `clear()` 하나다 — 「1일차만 지우기」는 0 을 적는 것과 같아서
 * 따로 두지 않는다.
 */

const KEY = 'spending:v1';

/** `{ 며칠째: 그날 쓴 엔화 }`. 안 적은 날은 키가 없다 */
export type SpendMap = Record<number, number>;

/**
 * 하루 지출 상한(엔).
 *
 * 실수로 0 을 더 붙이는 걸 막는다 — 12,000 을 120,000 으로 적으면 합계가
 * 통째로 망가지는데, 화면에는 그냥 큰 숫자로 보여서 알아채기 어렵다.
 * 하루 100만 엔이면 어떤 여행도 넘지 않는다.
 */
export const MAX_SPEND_YEN = 1_000_000;

interface SpendingValue {
  /** 며칠째 → 그날 쓴 엔화 */
  spent: SpendMap;
  /** 적은 날들의 합계(엔) */
  total: number;
  /** 실제로 적은 날이 며칠인가 — 「아직 안 적었다」와 「0원 썼다」를 가른다 */
  recordedDays: number;
  /** 그날 지출을 적는다. 0 이나 빈 값이면 지운다 */
  set: (day: number, yen: number | null) => void;
  /** 전부 지운다 (다음 여행 준비) */
  clear: () => void;
}

const Ctx = createContext<SpendingValue>({
  spent: {},
  total: 0,
  recordedDays: 0,
  set: () => {},
  clear: () => {},
});

export function SpendingProvider({ children }: { children: ReactNode }) {
  const [spent, setSpent] = useState<SpendMap>({});

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: SpendMap = JSON.parse(raw);
        /*
         * 읽을 때도 거른다. 저장소는 앱 바깥에서도 바뀔 수 있고(예전 버전이
         * 남긴 값, 손으로 고친 값), 여기서 안 거르면 NaN 하나가 합계 전체를
         * NaN 으로 만든다 — 화면에는 「NaN원」이 뜬다.
         */
        const clean: SpendMap = {};
        for (const [day, yen] of Object.entries(saved)) {
          const d = Number(day);
          if (!Number.isInteger(d) || d < 1 || d > MAX_DAYS) continue;
          if (!Number.isFinite(yen) || yen <= 0 || yen > MAX_SPEND_YEN) continue;
          clean[d] = Math.round(yen);
        }
        setSpent(clean);
      })
      .catch(() => {
        // 못 읽으면 빈 기록으로 시작한다. 다른 기능은 그대로 돈다
      });
  }, []);

  const persist = (next: SpendMap) => {
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    return next;
  };

  const set = useCallback((day: number, yen: number | null) => {
    setSpent((prev) => {
      /* 0 과 빈 값은 「안 적음」으로 되돌린다. 「0엔 쓴 날」을 따로 세면
         평균이나 「며칠 적었나」가 이상해지는데, 실제로 0엔 쓰는 날은 없다. */
      if (yen === null || !Number.isFinite(yen) || yen <= 0) {
        const { [day]: _, ...rest } = prev;
        return persist(rest);
      }
      return persist({ ...prev, [day]: Math.min(Math.round(yen), MAX_SPEND_YEN) });
    });
  }, []);

  const clear = useCallback(() => setSpent(() => persist({})), []);

  const values = Object.values(spent);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <Ctx.Provider value={{ spent, total, recordedDays: values.length, set, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSpending(): SpendingValue {
  return useContext(Ctx);
}

/**
 * 입력칸에 친 글자를 엔화 숫자로.
 *
 * 사람은 「12,000」이나 「12000엔」처럼 친다. 숫자만 남기고 읽되, 남은 게
 * 없으면 null 이다 — 0 으로 바꾸면 「지우려고 다 지운 것」과 「0 을 친 것」이
 * 구분되지 않는다.
 */
export function parseYen(text: string): number | null {
  const digits = text.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_SPEND_YEN) : null;
}
