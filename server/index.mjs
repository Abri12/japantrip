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
import { watchQuakes } from './quake-watch.mjs';
import { register, size as subscriberCount, unregister } from './subscribers.mjs';

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
const TTL = {
  quake: 60_000,
  warning: 5 * 60_000,
  weather: 10 * 60_000,
  // 운행정보는 사고가 나면 몇 분 안에 바뀐다. 다만 평상시에는 하루 종일
  // 빈 응답이라, 2분이면 급할 때 늦지 않으면서 헛호출도 줄인다.
  train: 2 * 60_000,
};

const PORT = Number(process.env.PORT ?? 8787);

/*
 * 어디서 부를 수 있게 할지.
 *
 * 이 서버가 주는 건 공개 환율뿐이라 기본은 전체 허용이다. 다만 개인 정보를
 * 다루는 엔드포인트가 생기면 그때는 반드시 좁혀야 하므로, 지금부터 환경변수로
 * 조일 수 있게 만들어 둔다.
 */
const ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';

/** POST 본문을 JSON 으로 읽는다. 등록 요청은 작아서 상한을 낮게 둔다 */
async function readJson(req, limit = 4096) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

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
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    });
    return res.end();
  }

  if (url.pathname === '/health') {
    return send(res, 200, { ok: true, subscribers: await subscriberCount() });
  }

  /*
   * 푸시 등록 — 토큰 · 체류 도도부현 · 알림 받을 진도.
   *
   * 좌표도 계정도 받지 않는다. 「어느 현에 있는가」만 알면 대상자를 고를 수
   * 있고, 그 이상은 알 이유가 없다. 도시를 바꾸면 앱이 같은 토큰으로 다시
   * 보내고 서버는 덮어쓴다 — 오사카로 옮긴 사람에게 홋카이도 지진을 보내면
   * 안 되기 때문이다.
   */
  if (url.pathname === '/api/push/register' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const token = String(body?.token ?? '');
      const pref = String(body?.pref ?? '');

      // Expo 토큰 형식만 받는다. 아무 문자열이나 명부에 쌓이면 발송할 때마다
      // 실패를 세게 되고, 명부 크기가 실제 사용자 수를 말해주지 못한다.
      if (!/^Expo(nent)?PushToken\[.+\]$/.test(token)) {
        return send(res, 400, { error: 'token' });
      }
      if (!pref) return send(res, 400, { error: 'pref' });

      // 진도 40(진도 4) 미만은 받아도 할 일이 없다. 기본값이자 하한이다.
      const minScale = Math.max(40, Number(body?.minScale ?? 40));

      const count = await register(token, pref, minScale);
      return send(res, 200, { ok: true, subscribers: count });
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  if (url.pathname === '/api/push/unregister' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      await unregister(String(body?.token ?? ''));
      return send(res, 200, { ok: true });
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
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

  /*
   * 철도 운행정보 — 지금은 JR서일본만.
   *
   * 회사마다 공개 정도가 다르다. JR서일본은 지역별 JSON 을 키 없이 주는데
   * JR동일본은 외부 접근을 막아 뒀다(403). 그래서 전 도시에 같은 수준을
   * 약속하지 않는다 — 확인되는 곳만 확인하고, 나머지는 앱이 공식 페이지로
   * 보낸다(src/data/train-status.ts).
   *
   * 응답은 평상시 `{"lines":{},"express":{}}` 이고, 이상이 생기면 그 안에
   * 노선별 항목이 들어온다. 우리는 **비어 있는지 아닌지**와 원문만 넘기고
   * 판정하지 않는다 — 일본어 원문을 우리가 요약하면 틀릴 여지가 생기고,
   * 급할 때 필요한 건 정확한 원문과 공식 페이지다.
   */
  if (url.pathname === '/api/train-status') {
    const area = url.searchParams.get('area');
    if (!area || !/^[a-z]{3,12}$/.test(area)) return send(res, 400, { error: 'area' });

    const key = `train:${area}`;
    try {
      const { value } = await cached(key, TTL.train, () =>
        getJson(`https://www.train-guide.westjr.co.jp/api/v3/area_${area}_trafficinfo.json`),
      );
      const lines = Object.entries(value?.lines ?? {});
      const express = Object.entries(value?.express ?? {});
      return send(
        res,
        200,
        {
          area,
          // 화면이 「이상 있음/없음」만으로도 판단할 수 있게 미리 센다.
          abnormal: lines.length + express.length,
          lines: lines.map(([id, v]) => ({ id, ...v })),
          express: express.map(([id, v]) => ({ id, ...v })),
        },
        { 'cache-control': `public, max-age=${Math.max(30, secondsLeft(key, TTL.train))}` },
      );
    } catch (err) {
      console.warn('[train]', err.message);
      return send(res, 502, { error: 'upstream' });
    }
  }

  /*
   * 도쿄권 운행정보 — 공공교통 오픈데이터(ODPT).
   *
   * JR동일본이 자기 페이지를 막아 둬서 도쿄는 링크만 주고 있었는데, ODPT 를
   * 통하면 받을 수 있다. 두 갈래로 나뉜다.
   *
   *   키 없음   도에이 지하철 6개 노선 (아사쿠사·미타·신주쿠·오에도 등)
   *   키 있음   도쿄메트로·JR동일본까지 — 개발자 등록은 무료고 상업 이용도 허용된다
   *
   * 키가 없어도 **도에이만으로 값지다.** 아사쿠사선은 하네다·나리타 양쪽으로
   * 이어지고 오에도선은 신주쿠를 지난다 — 이 앱의 공항 경로가 그 위에 있다.
   *
   * 「15분 이상의 지연은 없습니다」가 평상시 문구다. 그 문장 자체를 판정에
   * 쓰지 않고(문구가 바뀌면 조용히 틀린다) `odpt:trainInformationStatus` 가
   * 있는지로 가른다 — 이상이 있을 때만 들어오는 필드다.
   */
  if (url.pathname === '/api/train-status/odpt') {
    const token = process.env.ODPT_TOKEN;
    const upstream = token
      ? `https://api.odpt.org/api/v4/odpt:TrainInformation?acl:consumerKey=${token}`
      : 'https://api-public.odpt.org/api/v4/odpt:TrainInformation';

    const key = token ? 'odpt:keyed' : 'odpt:public';
    try {
      const { value } = await cached(key, TTL.train, () => getJson(upstream));
      const list = Array.isArray(value) ? value : [];

      const items = list.map((x) => ({
        railway: String(x['odpt:railway'] ?? '').replace('odpt.Railway:', ''),
        operator: String(x['odpt:operator'] ?? '').replace('odpt.Operator:', ''),
        // 이상이 있을 때만 들어오는 필드. 평상시에는 없다.
        status: x['odpt:trainInformationStatus']?.ja ?? null,
        text: x['odpt:trainInformationText']?.ja ?? '',
      }));

      return send(
        res,
        200,
        {
          keyed: !!token,
          abnormal: items.filter((i) => i.status).length,
          items,
        },
        { 'cache-control': `public, max-age=${Math.max(30, secondsLeft(key, TTL.train))}` },
      );
    } catch (err) {
      console.warn('[odpt]', err.message);
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
  console.log(`JapanTrip 서버 :${PORT}`);
  console.log(
    keyed
      ? '  업스트림: 키 있음 — 시간당 갱신'
      : '  업스트림: 키 없음 — 무료 소스(하루 1회 갱신)로 동작해요.\n' +
          '  시간당 갱신을 쓰려면 OPEN_EXCHANGE_RATES_APP_ID 를 넣고 다시 실행하세요.',
  );

  /*
   * 지진 감시를 켠다.
   *
   * 환경변수로 끌 수 있게 해 뒀다. 개발 중에 서버를 여러 개 띄우면 P2PQuake
   * 의 **IP당 동시 2연결** 제한에 걸리기 때문이다 — 그때 감시만 끄면 나머지
   * 프록시는 그대로 쓸 수 있다.
   */
  if (process.env.QUAKE_WATCH === 'off') {
    console.log('  지진 감시: 꺼짐 (QUAKE_WATCH=off)');
  } else {
    watchQuakes();
  }
});
