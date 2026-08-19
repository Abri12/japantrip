/**
 * 저장한 장소 — 「내가 갈 곳」 목록.
 *
 * ## 왜 필요한가
 *
 * 여행자의 실제 동작은 ① 훑어보며 관심 가는 곳을 모으고 ② 현장에서 그
 * 목록을 다시 여는 것이다. 지금까지는 ①이 막혀 있었다 — 좋아 보이는 곳을
 * 봐도 다시 찾으려면 검색부터 다시 해야 했다.
 *
 * ## 왜 컨텍스트인가
 *
 * 상세 화면의 저장 버튼과 목록의 「저장한 곳」 필터가 **같은 상태**를 봐야
 * 한다. 각자 AsyncStorage 를 읽으면 상세에서 저장한 직후 목록으로 돌아왔을 때
 * 반영이 안 된다. 도시 선택(selected-city)과 같은 패턴이다.
 *
 * ## 기기에만 저장한다
 *
 * 서버로 보낼 이유가 없는 데이터다 — 순전히 이 기기, 이 여행을 위한 목록이다.
 * 앱을 지우면 함께 사라진다. (개인정보처리방침의 「폰에만 저장되는 것」)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { findPlace } from '@/data/places';

const KEY = 'savedPlaces:v1';

interface SavedPlacesValue {
  /** 저장한 장소 id. 순서는 저장한 순서다 */
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}

const Ctx = createContext<SavedPlacesValue>({
  ids: [],
  has: () => false,
  toggle: () => {},
});

export function SavedPlacesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: string[] = JSON.parse(raw);
        /*
         * 지금 데이터에 없는 id 는 버린다.
         *
         * 장소를 합치거나 지우면 예전 id 가 저장소에 남는다. 그대로 두면
         * 「저장한 곳 3곳」이라는데 목록에는 2곳만 보이는 어긋남이 생긴다.
         * (준비물 체크리스트에서 실제로 겪은 문제와 같은 유형이다)
         */
        setIds(saved.filter((id) => findPlace(id) !== undefined));
      })
      .catch(() => {
        // 저장소를 못 읽어도 빈 목록으로 시작하면 된다
      });
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ ids, has, toggle }}>{children}</Ctx.Provider>;
}

export function useSavedPlaces(): SavedPlacesValue {
  return useContext(Ctx);
}
