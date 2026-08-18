/**
 * 엔화 → 원화 환율.
 *
 * 앱 루트에서 한 번만 불러와 화면 전체가 공유한다 — 요금이 나오는 자리마다 각자
 * API를 부르면 화면 하나에서 수십 번 호출된다.
 *
 * ## 소스를 두 개 두는 이유
 *
 * 원래는 ECB(Frankfurter) 하나만 썼는데, ECB 는 **평일에 하루 한 번만** 고시한다.
 * 토·일에 여행을 시작하면 금요일 값이 월요일까지 그대로다. 한국 사용자는 네이버
 * 환율에 익숙해서 숫자가 며칠째 같으면 앱이 고장난 줄 안다.
 *
 * 그래서 **주말에도 갱신되는 소스를 먼저** 부르고, 실패하면 ECB 로 떨어진다.
 *
 * ## 한국 소스를 쓰지 않은 이유
 *
 * 네이버가 보여주는 하나은행 매매기준율은 공개 API 가 없고, 화면을 긁는 건
 * 이용약관 위반이다. 한국수출입은행 API 는 공식이지만 **인증키가 필요하고
 * 영업일 11시에 하루 한 번**이라 지금보다 나을 게 없다. 즉 키 없이 하루 여러 번
 * 갱신되는 무료 소스는 사실상 없다.
 *
 * 대신 화면에서 환율 배지를 누르면 네이버 환율로 넘어가게 해 두었다 — 정확한
 * 실시간 숫자가 필요한 사람은 익숙한 곳에서 한 번에 확인하는 편이 낫다.
 *
 * ## 실패 시 처리
 *
 * **에러를 보여주지 않고 그 영역을 조용히 숨긴다.** 여행 중 로밍이 불안정한 상황을
 * 고려한 결정이다 — 환율 하나 때문에 에러 배너가 뜨면 정작 필요한 요금·시간
 * 정보에서 시선을 뺏는다.
 */

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** 화면에 적는 출처 이름. 실제로 어느 쪽에서 왔는지에 따라 바뀐다 */
export const FX_SOURCE = '환율';

/** 정확한 실시간 값을 확인하고 싶을 때 보낼 곳 */
export const FX_REFERENCE_URL = 'https://m.search.naver.com/search.naver?query=엔화환율';

interface FxValue {
  /** 1엔당 원화. 못 가져왔으면 null */
  rate: number | null;
  /** 이 값을 앱이 실제로 불러온 시각 */
  fetchedAt: Date | null;
  /**
   * 이 환율이 **실제로 고시된 날짜**(API의 date 필드).
   *
   * fetchedAt 과 구분해야 한다. 환율은 유럽중앙은행이 평일에만 고시하므로,
   * 토·일·공휴일에는 앱이 방금 불러왔더라도(fetchedAt=오늘) 값은 마지막
   * 영업일 것(rateDate=지난 금요일)이다. 이 둘을 구분하지 않고 "오늘 기준"으로
   * 표시하면, 값이 며칠째 안 바뀌는 걸 본 사용자가 앱이 고장난 줄로 여긴다.
   */
  rateDate: Date | null;
  /** 이 값이 어느 소스에서 왔는지 */
  source: string | null;
}

const FxCtx = createContext<FxValue>({
  rate: null,
  fetchedAt: null,
  rateDate: null,
  source: null,
});

interface CachedFx {
  rate: number;
  fetchedAt: Date;
  rateDate: Date;
  /** 어느 소스에서 왔는지 — 화면에 그대로 적는다 */
  source: string;
}

/** 하루 정도는 환율이 크게 안 바뀐다. 매 화면 진입마다 다시 부르지 않도록 캐시한다. */
let cached: CachedFx | null = null;
const CACHE_MS = 60 * 60 * 1000;

/**
 * HTTP 캐시를 우회해 부른다.
 *
 * 두 API 모두 `cache-control: public, max-age=...` 를 준다 — 한 번 받은 응답을
 * 브라우저·앱이 그 시간 동안 그대로 재사용한다는 뜻이다. ECB 쪽은 24시간이라,
 * 토요일에 받아 둔 「금요일 고시」 응답이 화요일까지 남아 있었다. 앱 안의 1시간
 * 캐시를 고쳐도 소용이 없었던 게 이 층이 하나 더 있었기 때문이다.
 *
 * `cache: 'no-store'` 는 웹에서 통하고, 네이티브 fetch 는 이 옵션을 무시하는
 * 경우가 있어 쿼리스트링에 날짜를 붙여 URL 자체를 다르게 만든다. 환율은 하루
 * 단위로 바뀌므로 날짜만 붙여도 충분하고, 같은 날 여러 번 열어도 서버에 부담이 없다.
 */
async function fetchJson(url: string): Promise<unknown | null> {
  const bust = new Date().toISOString().slice(0, 10);
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url}${sep}_d=${bust}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

/** "2026-08-14" 를 정오 기준 Date 로. 시간대 해석이 어긋나 하루가 밀리지 않게 한다 */
function parseRateDate(text: string | undefined): Date {
  return text ? new Date(`${text}T12:00:00`) : new Date();
}

async function fetchRate(): Promise<CachedFx | null> {
  if (cached !== null && Date.now() - cached.fetchedAt.getTime() < CACHE_MS) return cached;

  // ① 주말에도 갱신되는 쪽을 먼저 — ECB 는 평일만 고시해서 주말 여행자에게 늦다.
  try {
    const data = (await fetchJson('https://open.er-api.com/v6/latest/JPY')) as {
      rates?: { KRW?: number };
      time_last_update_utc?: string;
    } | null;
    const rate = data?.rates?.KRW;
    if (typeof rate === 'number') {
      const updated = data?.time_last_update_utc
        ? new Date(data.time_last_update_utc)
        : new Date();
      cached = { rate, fetchedAt: new Date(), rateDate: updated, source: 'ExchangeRate-API' };
      return cached;
    }
  } catch {
    // 다음 소스로 넘어간다
  }

  // ② 유럽중앙은행 공식값. 권위는 이쪽이 높지만 평일 하루 한 번이다.
  try {
    const data = (await fetchJson(
      'https://api.frankfurter.dev/v1/latest?base=JPY&symbols=KRW',
    )) as { rates?: { KRW?: number }; date?: string } | null;
    const rate = data?.rates?.KRW;
    if (typeof rate !== 'number') return null;

    const rateDate = parseRateDate(data?.date);

    cached = { rate, fetchedAt: new Date(), rateDate, source: 'ECB' };
    return cached;
  } catch {
    // 두 소스 다 실패 — 오프라인이거나 API 장애. 조용히 넘어간다.
    return null;
  }
}

export function FxProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<FxValue>(
    cached
      ? {
          rate: cached.rate,
          fetchedAt: cached.fetchedAt,
          rateDate: cached.rateDate,
          source: cached.source,
        }
      : { rate: null, fetchedAt: null, rateDate: null, source: null },
  );

  useEffect(() => {
    let alive = true;

    const load = () => {
      // 캐시가 아직 유효하면 fetchRate 안에서 그대로 돌려주므로 그냥 불러도 된다.
      fetchRate().then((r) => {
        if (alive && r) {
          setValue({
            rate: r.rate,
            fetchedAt: r.fetchedAt,
            rateDate: r.rateDate,
            source: r.source,
          });
        }
      });
    };

    load();

    /*
     * 앱이 다시 앞으로 나올 때 한 번 더 부른다.
     *
     * 예전에는 이 자리에서 딱 한 번만 불렀다. 캐시 만료가 1시간인데 그 뒤에 다시
     * 부르는 게 없어서, 앱을 켜 둔 채로 하루가 지나면 어제 환율이 그대로 남았다.
     * 실제로 8월 18일에 8월 14일 고시 환율이 표시됐다 — 앱을 완전히 종료하고
     * 다시 켜야만 갱신되는 상태였다.
     *
     * 환율은 유럽중앙은행이 평일 오후에 한 번 고시하므로, 앱을 다시 열 때
     * 확인하는 것으로 충분하다. 주기 타이머까지 두면 배터리만 쓴다.
     */
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });

    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return <FxCtx.Provider value={value}>{children}</FxCtx.Provider>;
}

/** rate 만 필요한 기존 호출부(KrwEstimate 등)를 위해 남겨 둔다. */
export function useFxRate(): number | null {
  return useContext(FxCtx).rate;
}

/** 헤더 배지처럼 rate 와 fetchedAt 을 함께 써야 하는 곳에서 쓴다. */
export function useFx(): FxValue {
  return useContext(FxCtx);
}

/**
 * 엔화 금액을 원화로 환산한다. 소수점 첫째 자리에서 버린다(내림).
 * rate 가 없으면 null — 호출부에서 null 이면 아무것도 그리지 않으면 된다.
 */
export function yenToWon(yen: number, rate: number | null): number | null {
  if (rate === null) return null;
  return Math.floor(yen * rate);
}

/**
 * 원화 표기.
 *
 * 10만원 미만은 그대로 쉼표로("13,253원") — 공항 노선 요금 같은 작은 금액에 맞다.
 * 10만원 이상은 만/천 단위로 끊어("13만 3천원") — 렌터카·택시처럼 큰 금액을
 * 쉼표로 그대로 쓰면 자릿수를 세야 해서 오히려 읽기 어렵다.
 */
export function formatWonApprox(won: number): string {
  if (won < 100_000) return `약 ${won.toLocaleString('ko-KR')}원`;

  const man = Math.floor(won / 10_000);
  const remainder = won % 10_000;
  const cheon = Math.round(remainder / 1_000);

  if (cheon === 0) return `약 ${man}만원`;
  if (cheon === 10) return `약 ${man + 1}만원`;
  return `약 ${man}만 ${cheon}천원`;
}

/** 두 값의 범위를 원화 범위 표기로 바꾼다. 택시 요금대 같은 곳에 쓴다. */
export function formatWonRangeApprox(lowWon: number, highWon: number): string {
  const low = formatWonApprox(lowWon).replace('약 ', '');
  const high = formatWonApprox(highWon);
  return `${low} ~ ${high}`;
}

/**
 * 이 환율이 며칠 전 것인지 사람 말로 설명한다.
 *
 * 환율은 평일에만 고시된다. 그래서 월요일 오전에 앱을 열면 지난 금요일 값이
 * 그대로 보이는데, 아무 설명이 없으면 "왜 며칠째 똑같지?"라는 의심을 산다.
 * 같은 날이면 null 을 반환해서 굳이 군더더기를 붙이지 않는다.
 */
export function rateFreshnessNote(rateDate: Date, now: Date = new Date()): string | null {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round(
    (startOfDay(now).getTime() - startOfDay(rateDate).getTime()) / 86_400_000,
  );

  if (days <= 0) return null;

  // 고시일이 금요일이고 지금이 주말·월요일이면 원인이 주말이라는 걸 명시한다.
  const isFriday = rateDate.getDay() === 5;
  if (isFriday && days <= 3) return '주말엔 환율이 고시되지 않아요';

  if (days === 1) return '어제 고시된 환율이에요';
  return `${days}일 전 고시된 환율이에요 · 휴일에는 갱신되지 않아요`;
}
