/**
 * 앱 서버 — 지금은 환율 하나만 맡는다.
 *
 * ## 이 서버가 존재하는 이유
 *
 * 앱이 외부 API 를 **기기에서 직접** 부르면 세 가지가 동시에 막힌다.
 * 키를 앱에 넣을 수 없어 무료·무키 소스만 쓰게 되고, 호출 수가 사용자 수만큼
 * 늘어나 무료 한도가 금방 터지고, 소스를 바꾸려면 앱을 새로 배포해야 한다.
 *
 * 그래서 **운영자가 서버에서 한 번 부르고 모두에게 나눠 준다.** 호출 수가
 * 사용자 수가 아니라 **시간**에 비례하게 되는 것이 핵심이다 — 사용자가
 * 10명이든 10만명이든 시간당 1회다.
 *
 * ## 의존성이 없다
 *
 * Node 22 의 내장 `http` 와 `fetch` 만 쓴다. 이 서버가 하는 일이 「받아서
 * 캐시하고 JSON 으로 준다」뿐이라 프레임워크를 얹을 이유가 없다. 나중에
 * 리뷰·크레딧처럼 상태를 다루기 시작하면 그때 골라도 늦지 않다.
 *
 * ## 실행
 *
 *   node server/index.mjs                  키 없이 (무료 소스, 하루 1회 갱신)
 *   OPEN_EXCHANGE_RATES_APP_ID=... node server/index.mjs    시간당 갱신
 */

import { createServer } from 'node:http';

import { cached, getJson, secondsLeft } from './cache.mjs';
import { getFx, secondsUntilStale } from './fx.mjs';

/*
 * 얼마나 자주 다시 볼지.
 *
 * 업스트림이 실제로 바뀌는 주기에 맞춘다. 더 짧게 잡으면 같은 값을 다시
 * 받을 뿐이고, 더 길게 잡으면 사용자가 낡은 값을 본다.
 *
 *   지진   1분   — 위급 정보다. 늦으면 알릴 이유가 없다
 *   기상특보 5분  — 기상청이 수시로 갱신하지만 분 단위로 바뀌진 않는다
 *   날씨   10분  — 기온·강수확률은 그보다 자주 안 바뀐다
 */
const TTL = { quake: 60_000, warning: 5 * 60_000, weather: 10 * 60_000 };

const PORT = Number(process.env.PORT ?? 8787);

/*
 * 어디서 부를 수 있게 할지.
 *
 * 이 서버가 주는 건 공개 환율뿐이라 기본은 전체 허용이다. 다만 개인 정보를
 * 다루는 엔드포인트가 생기면 그때는 반드시 좁혀야 하므로, 지금부터 환경변수로
 * 조일 수 있게 만들어 둔다.
 */
const ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';

function send(res, status, body, headers = {}) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': ORIGIN,
    ...headers,
  });
  res.end(text);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // 브라우저가 본 요청 전에 보내는 사전 확인
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': ORIGIN,
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    });
    return res.end();
  }

  if (url.pathname === '/health') {
    return send(res, 200, { ok: true });
  }

  /*
   * 지진 — P2PQuake.
   *
   * 여기가 서버를 두는 효과가 가장 큰 자리다. P2PQuake 는 **IP당 60회/분**
   * 제한이 있는데, 기기가 각자 60초마다 부르면 사용자가 늘수록 각자의 IP 에서
   * 부르니 당장은 안 걸리지만 공용 와이파이·회사망처럼 IP 를 공유하는 곳에서
   * 한꺼번에 막힌다. 서버가 1분에 한 번만 부르고 나눠 주면 그 위험이 사라진다.
   *
   * 앞으로 푸시 알림을 붙일 때도 이 자리가 출발점이다 — 앱을 켜야만 지진을
   * 아는 구조로는 긴급지진속보가 쓸모가 없다. (docs/SERVER.md 5번)
   */
  if (url.pathname === '/api/quakes') {
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));
    const key = `quakes:${limit}`;
    try {
      const { value } = await cached(key, TTL.quake, () =>
        getJson(`https://api.p2pquake.net/v2/history?codes=551&codes=556&limit=${limit}`),
      );
      return send(res, 200, value, {
        'cache-control': `public, max-age=${Math.max(10, secondsLeft(key, TTL.quake))}`,
      });
    } catch (err) {
      console.warn('[quakes]', err.message);
      return send(res, 502, { error: 'upstream' });
    }
  }

  /* 기상특보 — 지역코드가 같으면 답도 같다. 도시 단위로 캐시된다 */
  if (url.pathname === '/api/warning') {
    const area = url.searchParams.get('area');
    if (!area || !/^\d{6}$/.test(area)) return send(res, 400, { error: 'area' });

    const key = `warning:${area}`;
    try {
      const { value } = await cached(key, TTL.warning, () =>
        getJson(`https://www.jma.go.jp/bosai/warning/data/warning/${area}.json`),
      );
      return send(res, 200, value, {
        'cache-control': `public, max-age=${Math.max(30, secondsLeft(key, TTL.warning))}`,
      });
    } catch (err) {
      console.warn('[warning]', err.message);
      return send(res, 502, { error: 'upstream' });
    }
  }

  /*
   * 날씨 — Open-Meteo.
   *
   * 좌표를 소수점 둘째 자리로 끊어 캐시 키를 만든다. 같은 도시 안의 사용자는
   * 좌표가 미세하게 달라도 날씨가 같은데, 그대로 키로 쓰면 캐시가 사람마다
   * 갈려서 캐시를 두는 의미가 없어진다. 둘째 자리면 약 1km 격자다.
   */
  if (url.pathname === '/api/weather') {
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return send(res, 400, { error: 'latlng' });

    const gLat = lat.toFixed(2);
    const gLng = lng.toFixed(2);
    const key = `weather:${gLat},${gLng}`;
    const upstream =
      `https://api.open-meteo.com/v1/forecast?latitude=${gLat}&longitude=${gLng}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&hourly=precipitation_probability,temperature_2m,apparent_temperature` +
      `&daily=uv_index_max,wind_gusts_10m_max,sunrise,sunset,temperature_2m_max,temperature_2m_min` +
      `&timezone=Asia%2FTokyo&forecast_days=2`;

    try {
      const { value } = await cached(key, TTL.weather, () => getJson(upstream));
      return send(res, 200, value, {
        'cache-control': `public, max-age=${Math.max(60, secondsLeft(key, TTL.weather))}`,
      });
    } catch (err) {
      console.warn('[weather]', err.message);
      return send(res, 502, { error: 'upstream' });
    }
  }

  if (url.pathname === '/api/fx') {
    const fx = await getFx();

    /*
     * 환율을 못 받았을 때 500 을 주지 않는다.
     *
     * 앱은 환율이 없으면 그 자리를 조용히 숨기게 되어 있다(lib/fx.tsx).
     * 서버가 에러를 뱉으면 앱이 「고장」으로 다루게 되는데, 실제로는 요금·시간
     * 같은 핵심 정보가 멀쩡히 나오는 상태다. 값이 없다는 사실만 정직하게 준다.
     */
    if (!fx) return send(res, 200, { rate: null });

    /*
     * 다음 갱신까지 남은 만큼만 캐시하게 한다.
     *
     * 고정값(예: 3600)을 주면 서버가 방금 새로 받은 값을 클라이언트가 1시간
     * 더 묵히게 되어, 최악의 경우 2시간 묵은 값을 보게 된다. 남은 시간을
     * 그대로 주면 서버가 새로 받는 시점에 클라이언트도 같이 새로워진다.
     */
    const maxAge = Math.max(60, secondsUntilStale());

    return send(
      res,
      200,
      {
        rate: fx.rate,
        rateDate: fx.rateDate,
        source: fx.source,
        fetchedAt: new Date(fx.fetchedAt).toISOString(),
      },
      { 'cache-control': `public, max-age=${maxAge}` },
    );
  }

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  const keyed = !!(process.env.OPEN_EXCHANGE_RATES_APP_ID || process.env.EXCHANGERATE_API_KEY);
  console.log(`환율 서버 :${PORT}`);
  console.log(
    keyed
      ? '  업스트림: 키 있음 — 시간당 갱신'
      : '  업스트림: 키 없음 — 무료 소스(하루 1회 갱신)로 동작해요.\n' +
          '  시간당 갱신을 쓰려면 OPEN_EXCHANGE_RATES_APP_ID 를 넣고 다시 실행하세요.',
  );
});
