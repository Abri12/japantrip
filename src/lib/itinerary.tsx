/**
 * 내 일정 — 저장한 곳을 날짜별로 배치한다.
 *
 * ## 저장과 무엇이 다른가
 *
 * 저장(`saved-places`)은 「가고 싶다」이고, 일정은 「언제 간다」다. 순서가
 * 그렇다 — 훑으며 모으고(저장), 며칠에 나눠 담는다(일정). 그래서 일정의
 * 재료는 저장한 곳이고, 저장 없이 일정부터 짜게 만들지 않는다.
 *
 * ## 왜 「1일차」이고 날짜가 아닌가
 *
 * 달력을 붙이면 출발일을 먼저 정하게 되는데, 여행 계획은 대개 날짜보다
 * 「며칠 갈지」가 먼저 정해진다. 그리고 날짜를 넣는 순간 **여행이 끝나면
 * 데이터가 쓸모없어진다** — 다음 여행에 다시 쓰려면 전부 옮겨야 한다.
 * 추천 코스도 같은 이유로 「1일차 · 도착」을 쓴다(`data/courses/types.ts`).
 *
 * ## 한 곳이 여러 날에 들어갈 수 있나
 *
 * 없다. 같은 곳을 이틀에 넣는 일정은 실수인 경우가 훨씬 많고, 허용하면
 * 「이 장소가 지금 몇 일차에 있나」에 답이 둘이 된다. 다른 날로 옮기면
 * 원래 날에서 빠진다.
 *
 * ## 기기에만 저장한다
 *
 * 서버로 보낼 이유가 없다 — 이 기기, 이 여행을 위한 목록이다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { findPlace } from '@/data/places';

const KEY = 'itinerary:v1';

/** 며칠짜리 일정까지 허용할지. 넘기면 하루에 담기지 않는 여행이 된다 */
export const MAX_DAYS = 10;

/** `{ 장소 id: 몇 일차(1부터) }` — 배열이 아니라 맵인 이유는 아래 참고 */
export type DayMap = Record<string, number>;

interface ItineraryValue {
  /** 장소 id → 일차. 안 들어간 곳은 키가 없다 */
  days: DayMap;
  /** 지금 일정이 며칠짜리인가. 배치된 것 중 가장 큰 일차 */
  dayCount: number;
  /** 그 날에 배치된 장소 id (저장 순서 유지) */
  placesOn: (day: number) => string[];
  /** 배치하거나 옮긴다. 같은 날을 다시 고르면 뺀다 */
  assign: (placeId: string, day: number) => void;
  remove: (placeId: string) => void;
}

const Ctx = createContext<ItineraryValue>({
  days: {},
  dayCount: 0,
  placesOn: () => [],
  assign: () => {},
  remove: () => {},
});

export function ItineraryProvider({ children }: { children: ReactNode }) {
  /*
   * 배열이 아니라 맵으로 둔다.
   *
   * 화면이 가장 자주 묻는 것은 「이 장소가 몇 일차에 있나」다(장소 상세의
   * 일차 선택, 목록의 뱃지). 배열이면 매번 훑어야 하고, 맵이면 한 번에 답한다.
   * 「그 날에 뭐가 있나」는 반대로 훑어야 하지만 그건 일정 화면에서 하루에
   * 한 번씩만 필요하다.
   */
  const [days, setDays] = useState<DayMap>({});

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: DayMap = JSON.parse(raw);
        /* 지금 데이터에 없는 장소는 버린다 — 저장한 곳·준비물과 같은 이유다.
           유령 id 가 남으면 「3곳」이라는데 2곳만 보이는 어긋남이 생긴다. */
        const clean: DayMap = {};
        for (const [id, day] of Object.entries(saved)) {
          if (findPlace(id) && day >= 1 && day <= MAX_DAYS) clean[id] = day;
        }
        setDays(clean);
      })
      .catch(() => {
        // 저장소를 못 읽어도 빈 일정으로 시작하면 된다
      });
  }, []);

  const persist = (next: DayMap) => {
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    return next;
  };

  const assign = useCallback((placeId: string, day: number) => {
    setDays((prev) => {
      // 같은 날을 다시 고르면 뺀다 — 토글로 쓰이는 쪽이 자연스럽다
      if (prev[placeId] === day) {
        const { [placeId]: _, ...rest } = prev;
        return persist(rest);
      }
      return persist({ ...prev, [placeId]: day });
    });
  }, []);

  const remove = useCallback((placeId: string) => {
    setDays((prev) => {
      const { [placeId]: _, ...rest } = prev;
      return persist(rest);
    });
  }, []);

  const dayCount = Object.values(days).reduce((max, d) => Math.max(max, d), 0);

  const placesOn = useCallback(
    (day: number) =>
      Object.entries(days)
        .filter(([, d]) => d === day)
        .map(([id]) => id),
    [days],
  );

  return (
    <Ctx.Provider value={{ days, dayCount, placesOn, assign, remove }}>{children}</Ctx.Provider>
  );
}

export function useItinerary(): ItineraryValue {
  return useContext(Ctx);
}
