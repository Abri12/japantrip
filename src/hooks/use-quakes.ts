import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { EewEvent, QuakeEvent, fetchEew, fetchQuakes } from '@/lib/quake';

/** 폴링 주기. P2PQuake는 IP당 60회/분을 허용하므로 60초면 충분히 여유롭다. */
const POLL_MS = 60_000;

export interface QuakeState {
  quakes: QuakeEvent[];
  eew: EewEvent[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  updatedAt: Date | null;
  refresh: () => void;
}

/**
 * 지진정보와 긴급지진속보를 주기적으로 가져온다.
 *
 * 앱이 백그라운드로 가면 폴링을 멈춘다 — 배터리 때문이기도 하고,
 * 실제 위급 상황 전달은 폴링이 아니라 푸시가 맡아야 하기 때문이다.
 */
export function useQuakes(): QuakeState {
  const [quakes, setQuakes] = useState<QuakeEvent[]>([]);
  const [eew, setEew] = useState<EewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    if (isRefresh) setRefreshing(true);

    try {
      const [q, e] = await Promise.all([
        fetchQuakes(30, ctrl.signal),
        fetchEew(3, ctrl.signal),
      ]);
      if (ctrl.signal.aborted) return;
      setQuakes(q);
      setEew(e);
      setUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      // 네트워크가 끊겨도 이전 데이터는 그대로 둔다. 빈 화면보다 낫다.
      setError(err instanceof Error ? err.message : '지진 정보를 불러오지 못했습니다');
    } finally {
      if (!ctrl.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    /*
     * 이 규칙은 여기서 끈다 — app/rewards.tsx 와 같은 이유다.
     *
     * `load` 는 async 이고, `isRefresh` 가 false 라 동기 구간에서 setState 를
     * 하지 않는다. 나머지는 전부 `await Promise.all` 뒤에서 일어난다. 린트는
     * 호출만 보고 판단해서 그 차이를 못 본다.
     *
     * 화면에 들어오자마자 지진 정보를 받아야 하는 화면이라 첫 요청을 미룰 수도
     * 없다. 「최근 지진은 없어요」를 확인 없이 먼저 보여주는 편이 훨씬 나쁘다.
     */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(false);

    let timer: ReturnType<typeof setInterval> | null = setInterval(() => load(false), POLL_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (!timer) {
          load(false);
          timer = setInterval(() => load(false), POLL_MS);
        }
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });

    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
      abortRef.current?.abort();
    };
  }, [load]);

  const refresh = useCallback(() => {
    load(true);
  }, [load]);

  return { quakes, eew, loading, refreshing, error, updatedAt, refresh };
}
