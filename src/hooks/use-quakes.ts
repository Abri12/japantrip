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
