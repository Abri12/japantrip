/**
 * 환율 — 서버가 대신 받아서 캐시한다.
 *
 * ## 왜 서버가 필요한가
 *
 * 클라이언트가 직접 부를 때는 **무료·무키 소스밖에 못 쓴다.** 그런데 그런
 * 소스는 전부 하루 한 번 갱신이다(open.er-api 24시간, ECB 평일 1회).
 * 환율이 하루에도 크게 움직이는 시기에는 그 값이 실제와 벌어진다.
 *
 * 서버를 두면 세 가지가 한꺼번에 풀린다.
 *
 * 1. **키를 숨길 수 있다.** 시간당 갱신되는 소스는 대부분 키를 요구하는데,
 *    앱에 넣으면 그대로 노출돼 남이 내 할당량을 쓴다.
 * 2. **호출 수가 사용자 수와 무관해진다.** 앱이 직접 부르면 사용자 1,000명이
 *    각자 부르지만, 서버가 받아 나눠 주면 **시간당 1회**로 고정된다.
 *    무료 등급(월 1,000회)에 720회/월이라 그대로 들어간다.
 * 3. **갱신 주기를 우리가 정한다.** 업스트림이 무엇이든 서버 캐시 TTL 로
 *    「최소 이 간격으로는 새로 본다」를 보장한다.
 *
 * ## 업스트림 사다리
 *
 * 키가 있으면 좋은 소스를, 없으면 무료 소스로 떨어진다. **키 없이도 지금과
 * 같은 수준으로는 동작해야 한다** — 서버를 띄웠는데 키를 아직 안 넣었다고
 * 환율이 아예 안 나오면, 있던 기능이 사라진 셈이다.
 */

/** 업스트림을 다시 볼 최소 간격. 기본 1시간 */
const TTL_MS = Number(process.env.FX_TTL_MS ?? 60 * 60 * 1000);

/** @type {{rate:number, rateDate:string, source:string, fetchedAt:number} | null} */
let cache = null;
/** 동시에 여러 요청이 와도 업스트림은 한 번만 부른다 */
let inflight = null;

async function getJson(url) {
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    // 업스트림의 HTTP 캐시에 걸려 옛 값을 받지 않게 한다. 서버가 이미
    // TTL 로 호출 수를 통제하므로 여기서 캐시를 또 탈 이유가 없다.
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

/** "2026-08-19" — 고시 날짜 표기를 한 모양으로 맞춘다 */
function isoDate(input) {
  const d = input ? new Date(input) : new Date();
  return Number.isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10);
}

/**
 * ① Open Exchange Rates — 무료 등급도 **시간당** 갱신이다.
 *
 * 무료 등급은 base 가 USD 로 고정이라 JPY→KRW 를 직접 못 받는다. USD 기준
 * 두 값으로 교차 계산한다(KRW/USD ÷ JPY/USD). 소수점 오차는 원화 표기가
 * 어차피 정수로 내림이라 문제가 되지 않는다.
 */
async function fromOpenExchangeRates() {
  const id = process.env.OPEN_EXCHANGE_RATES_APP_ID;
  if (!id) return null;

  const data = await getJson(
    `https://openexchangerates.org/api/latest.json?app_id=${id}&symbols=KRW,JPY`,
  );
  const krw = data?.rates?.KRW;
  const jpy = data?.rates?.JPY;
  if (typeof krw !== 'number' || typeof jpy !== 'number' || jpy === 0) return null;

  return {
    rate: krw / jpy,
    rateDate: isoDate(data?.timestamp ? data.timestamp * 1000 : undefined),
    source: 'Open Exchange Rates',
  };
}

/** ② ExchangeRate-API 유료 등급 — 키가 있으면 시간당 갱신되고 JPY 기준을 바로 준다 */
async function fromExchangeRateApiPro() {
  const key = process.env.EXCHANGERATE_API_KEY;
  if (!key) return null;

  const data = await getJson(`https://v6.exchangerate-api.com/v6/${key}/pair/JPY/KRW`);
  if (data?.result !== 'success' || typeof data?.conversion_rate !== 'number') return null;

  return {
    rate: data.conversion_rate,
    rateDate: isoDate(data?.time_last_update_utc),
    source: 'ExchangeRate-API',
  };
}

/** ③ 키 없이 쓰는 무료 소스. 하루 한 번이지만 아무것도 없는 것보다 낫다 */
async function fromFreeSources() {
  try {
    const data = await getJson('https://open.er-api.com/v6/latest/JPY');
    const rate = data?.rates?.KRW;
    if (typeof rate === 'number') {
      return {
        rate,
        rateDate: isoDate(data?.time_last_update_utc),
        source: 'ExchangeRate-API (무료)',
      };
    }
  } catch {
    // 다음 소스로
  }

  const data = await getJson('https://api.frankfurter.dev/v1/latest?base=JPY&symbols=KRW');
  const rate = data?.rates?.KRW;
  if (typeof rate !== 'number') return null;
  return { rate, rateDate: isoDate(data?.date), source: 'ECB' };
}

async function refresh() {
  const ladder = [fromOpenExchangeRates, fromExchangeRateApiPro, fromFreeSources];

  for (const step of ladder) {
    try {
      const got = await step();
      if (got) return { ...got, fetchedAt: Date.now() };
    } catch (err) {
      console.warn('[fx] 업스트림 실패:', err.message);
    }
  }
  return null;
}

/**
 * 지금 환율. 캐시가 살아 있으면 그대로 준다.
 *
 * 업스트림이 전부 죽었을 때 **낡은 캐시라도 돌려준다.** 환율은 조금 낡아도
 * 쓸모가 있지만, 없으면 화면에서 그 자리가 통째로 사라진다.
 */
export async function getFx() {
  const fresh = cache && Date.now() - cache.fetchedAt < TTL_MS;
  if (fresh) return { ...cache, cached: true };

  if (!inflight) {
    inflight = refresh().finally(() => {
      inflight = null;
    });
  }
  const got = await inflight;

  if (got) cache = got;
  else if (!cache) return null;

  return { ...cache, cached: false };
}

/** 다음에 업스트림을 다시 볼 시각까지 남은 초 — 클라이언트 캐시 헤더에 쓴다 */
export function secondsUntilStale() {
  if (!cache) return 0;
  const left = Math.ceil((cache.fetchedAt + TTL_MS - Date.now()) / 1000);
  return Math.max(0, left);
}
