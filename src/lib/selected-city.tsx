/**
 * 지금 보고 있는 도시.
 *
 * 여행자는 보통 한 번에 한 도시만 간다. 그런데 앱이 전국 정보를 한꺼번에 보여주면
 * 오사카에 있는 사람이 삿포로 공항과 후쿠오카 패스를 계속 지나쳐야 한다.
 * 그래서 도시를 먼저 고르게 하고, 그 아래 모든 화면을 그 도시로 좁힌다.
 *
 * 고른 도시는 기기에 저장한다. 여행 중에는 며칠씩 같은 도시를 보게 되므로
 * 앱을 다시 열 때마다 고르게 하면 번거롭다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { CITIES, City, findCity } from '@/data/cities';
import { refreshQuakePush } from '@/lib/push';

const KEY = 'selectedCity:v1';
const HUB_KEY = 'selectedHub:v1';

interface SelectedCityValue {
  /** 고른 도시. 아직 안 골랐으면 null */
  city: City | null;
  /** 저장소에서 읽어오는 중인지 — 깜빡임을 막는 데 쓴다 */
  loading: boolean;
  select: (cityId: string) => void;
  clear: () => void;
  /**
   * 공항 화면에서 고른 도착 거점(`CityHub.id`). 아직 안 골랐으면 null.
   *
   * ── 왜 도시 컨텍스트 안에 두나 ──────────────────────────
   *
   * 거점은 도시에 매달린 값이라, 도시가 바뀌면 반드시 같이 지워져야 한다.
   * 따로 두면 오사카에서 「우메다」를 고른 채 교토로 옮겼을 때 교토 화면이
   * 남의 거점 id 를 들고 있게 된다. 지우는 규칙을 한 곳에 두려고 여기 붙였다.
   *
   * 전역으로 올린 이유 — 예전에는 공항 화면의 `useState` 였다. 그래서
   * 거점을 「텐노지」로 골라 놓고 귀국일 계산으로 넘어가면 조용히 난바로
   * 되돌아갔다. 두 화면이 같은 질문(어디서 공항으로 가나)에 다른 답을
   * 하고 있었던 셈이다.
   */
  hubId: string | null;
  selectHub: (hubId: string) => void;
}

const Ctx = createContext<SelectedCityValue>({
  city: null,
  loading: true,
  select: () => {},
  clear: () => {},
  hubId: null,
  selectHub: () => {},
});

export function SelectedCityProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState<City | null>(null);
  const [hubId, setHubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet([KEY, HUB_KEY])
      .then(([[, id], [, savedHub]]) => {
        if (savedHub) setHubId(savedHub);
        const found = id ? findCity(id) : undefined;
        // 저장된 도시가 그새 목록에서 빠졌을 수도 있으므로 확인 후에 넣는다
        if (found && found.status !== 'coming') setCity(found);
      })
      .catch(() => {
        // 저장소를 못 읽어도 앱은 도시 선택 화면부터 시작하면 된다
      })
      .finally(() => setLoading(false));
  }, []);

  const select = useCallback((cityId: string) => {
    const found = findCity(cityId);
    if (!found) return;
    setCity(found);
    // 도시가 바뀌면 거점은 남의 값이 된다. 같이 지운다.
    setHubId(null);
    AsyncStorage.setItem(KEY, cityId).catch(() => {});
    AsyncStorage.removeItem(HUB_KEY).catch(() => {});
  }, []);

  const clear = useCallback(() => {
    setCity(null);
    setHubId(null);
    AsyncStorage.removeItem(KEY).catch(() => {});
    AsyncStorage.removeItem(HUB_KEY).catch(() => {});
  }, []);

  const selectHub = useCallback((id: string) => {
    setHubId(id);
    AsyncStorage.setItem(HUB_KEY, id).catch(() => {});
  }, []);

  /*
   * 도시가 정해지면 지진 푸시의 **체류 현을 갱신한다.**
   *
   * 여기서 하는 이유 — 서버가 대상자를 고르는 기준이 **체류 도도부현**이고,
   * 그 값이 정해지는 유일한 자리가 도시 선택이다. 화면 어딘가에서 따로
   * 등록하면 도시를 바꿨을 때 갱신을 빠뜨리게 되고, 그러면 오사카로 옮긴
   * 사람에게 홋카이도 지진이 간다.
   *
   * **알림을 켜 둔 사람에게만** 일어난다. 여기서 권한을 묻지 않는다 —
   * 도시를 고르다가 갑자기 알림 권한 창이 뜨면 사용자는 왜 뜨는지 모른다.
   * 묻는 자리는 안전 화면의 스위치 하나다(`features/safety/push-section.tsx`).
   *
   * 실패는 무시한다. 웹이거나 서버를 안 띄웠거나 — 어느 쪽이든 알림만 없을
   * 뿐 앱은 그대로 돌아가야 한다.
   */
  useEffect(() => {
    if (!city) return;
    refreshQuakePush(city.prefecture);
  }, [city]);

  return (
    <Ctx.Provider value={{ city, loading, select, clear, hubId, selectHub }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSelectedCity(): SelectedCityValue {
  return useContext(Ctx);
}

/** 고를 수 있는 도시 — 아직 안 연 곳은 제외한다. */
export function selectableCities(): City[] {
  return CITIES.filter((c) => c.status !== 'coming').sort((a, b) => a.phase - b.phase);
}
