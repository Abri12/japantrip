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

const KEY = 'selectedCity:v1';

interface SelectedCityValue {
  /** 고른 도시. 아직 안 골랐으면 null */
  city: City | null;
  /** 저장소에서 읽어오는 중인지 — 깜빡임을 막는 데 쓴다 */
  loading: boolean;
  select: (cityId: string) => void;
  clear: () => void;
}

const Ctx = createContext<SelectedCityValue>({
  city: null,
  loading: true,
  select: () => {},
  clear: () => {},
});

export function SelectedCityProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((id) => {
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
    AsyncStorage.setItem(KEY, cityId).catch(() => {});
  }, []);

  const clear = useCallback(() => {
    setCity(null);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  return <Ctx.Provider value={{ city, loading, select, clear }}>{children}</Ctx.Provider>;
}

export function useSelectedCity(): SelectedCityValue {
  return useContext(Ctx);
}

/** 고를 수 있는 도시 — 아직 안 연 곳은 제외한다. */
export function selectableCities(): City[] {
  return CITIES.filter((c) => c.status !== 'coming').sort((a, b) => a.phase - b.phase);
}
