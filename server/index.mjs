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

// 다른 무엇보다 먼저 — .env 를 환경변수로 올린다 (server/env.mjs 주석 참고)
import './env.mjs';

import { createServer } from 'node:http';

import { cached, getJson, secondsLeft } from './cache.mjs';
import { getFx, secondsUntilStale } from './fx.mjs';
import { watchQuakes } from './quake-watch.mjs';
import { register, size as subscriberCount, unregister } from './subscribers.mjs';
import { create as createReview, listFor, remove as removeReview, summary } from './reviews.mjs';
import {
  balanceOf,
  expiringSoon,
  historyOf,
  issuedLastYear,
  lifetimeEarnedOf,
  maturedBalanceOf,
  outstandingTotal,
  post,
} from './ledger.mjs';
import { report as issuanceReport } from './issuance.mjs';
import {
  confirm as confirmContribution,
  listHeld,
  listMine,
  listPending,
  reject as rejectContribution,
  release as releaseContribution,
  submit as submitContribution,
} from './contributions.mjs';
import { clientIp, networkTag } from './anti-collusion.mjs';
import { flushAll } from './store.mjs';
import { costOf, list as listRewards } from './rewards.mjs';
import { count as errorCount, list as listErrors, record as recordError } from './errors.mjs';
import * as payout from './payout.mjs';

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

/**
 * 운영자 요청인가.
 *
 * `ADMIN_TOKEN` 이 없으면 **항상 거짓**이다. 토큰을 안 정했는데 열려 있으면
 * 그건 기능이 아니라 사고다. 호출부는 403 이 아니라 404 를 돌려준다 —
 * 없는 척하는 편이 「여기 관리자 API 가 있다」를 알려주는 것보다 낫다.
 */
function adminOk(req) {
  const want = process.env.ADMIN_TOKEN;
  if (!want) return false;
  const got = req.headers['x-admin-token'];
  return typeof got === 'string' && got === want;
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
    /* 쌓인 오류 종류 수를 같이 낸다. 운영자가 매일 볼 화면이 여기뿐이라,
       「앱이 어디선가 죽고 있다」를 알아채는 가장 값싼 자리다. */
    return send(res, 200, {
      ok: true,
      subscribers: await subscriberCount(),
      errorKinds: await errorCount(),
    });
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

  /*
   * 리뷰 — 읽기.
   *
   * 캐시를 걸지 않는다. 방금 쓴 내 리뷰가 안 보이면 「등록이 안 됐나」 싶어
   * 다시 쓰게 되고, 그게 중복을 만든다. 장소 하나당 몇 건이라 부담도 없다.
   */
  if (url.pathname === '/api/reviews' && req.method === 'GET') {
    const placeId = url.searchParams.get('placeId');
    if (!placeId) return send(res, 400, { error: 'placeId' });
    const authorId = url.searchParams.get('authorId') ?? undefined;
    return send(res, 200, { reviews: await listFor(placeId, authorId) });
  }

  /* 여러 장소의 평점 요약 — 목록 화면이 한 번에 묻는다 */
  if (url.pathname === '/api/reviews/summary' && req.method === 'GET') {
    const ids = (url.searchParams.get('placeIds') ?? '').split(',').filter(Boolean).slice(0, 200);
    if (ids.length === 0) return send(res, 400, { error: 'placeIds' });
    return send(res, 200, { summary: await summary(ids) }, { 'cache-control': 'public, max-age=60' });
  }

  /*
   * 리뷰 — 쓰기.
   *
   * 좌표를 받지만 **저장하지 않는다.** 판정에만 쓰고 버린다(server/reviews.mjs).
   * 클라이언트가 「인증됨」이라고 보내온 값은 받지도 않는다 — 판정은 서버가
   * 자기 좌표로 다시 한다.
   */
  if (url.pathname === '/api/reviews' && req.method === 'POST') {
    try {
      const body = await readJson(req, 8192);
      const result = await createReview({
        placeId: String(body?.placeId ?? ''),
        rating: Number(body?.rating),
        text: String(body?.text ?? ''),
        lat: Number(body?.lat),
        lng: Number(body?.lng),
        accuracyM: body?.accuracyM == null ? null : Number(body.accuracyM),
        authorId: String(body?.authorId ?? ''),
      });
      // 거부해도 이유를 준다. 「안 됩니다」만 돌려주면 무엇을 고쳐야 할지 모른다.
      return send(res, result.error ? 400 : 200, result);
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  if (url.pathname === '/api/reviews/delete' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = await removeReview(String(body?.id ?? ''), String(body?.authorId ?? ''));
      return send(res, result.error ? 400 : 200, result);
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  /*
   * 크레딧 — 잔액과 원장.
   *
   * 잔액을 숫자로 저장하지 않는다. 지급·차감 줄의 합으로 낸다(server/ledger.mjs).
   * 「이 사람 잔액이 왜 이렇지」에 답할 수 있어야 하고, 잘못 지급했을 때
   * 손으로 고치는 대신 반대 줄을 쌓을 수 있어야 한다.
   */
  if (url.pathname === '/api/credits' && req.method === 'GET') {
    const userId = url.searchParams.get('userId');
    if (!userId) return send(res, 400, { error: 'userId' });
    return send(res, 200, {
      balance: await balanceOf(userId),
      lifetimeEarned: await lifetimeEarnedOf(userId),
      history: await historyOf(userId),
      // 교환 화면이 「왜 못 쓰는지」를 미리 보여줄 수 있어야 한다
      redeemable: await maturedBalanceOf(userId, payout.MATURITY_MS),
      payoutBound: await payout.isBound(userId),
      /*
       * 곧 소멸할 크레딧.
       *
       * 계정이 없어 푸시로 알릴 수 없으니 **앱을 열 때 화면으로 알린다.**
       * 공정위 개선안의 3회 고지(2개월·1개월·3일 전)를 화면이 이 값으로 낸다.
       */
      expiring: await expiringSoon(userId),
    });
  }

  /*
   * 보상 교환 — 멱등이다.
   *
   * 같은 요청이 두 번 오면(재시도·중복 클릭) 두 번 차감되면 안 된다. 요청이
   * 들고 온 키로 이미 처리했는지 보고, 처리했으면 그 결과를 그대로 돌려준다.
   * 「실패했나」 싶어 다시 누르는 것이 이 기능에서 가장 흔한 이중 차감 경로다.
   */
  if (url.pathname === '/api/credits/redeem' && req.method === 'POST') {
    try {
      const body = await readJson(req);

      /*
       * **금액은 서버가 정한다.**
       *
       * 예전에는 `body.cost` 를 그대로 믿었다. 즉 클라이언트가 자기 값을
       * 정할 수 있었고, `cost: 1` 을 보내면 1크레딧으로 3,000짜리 기프티콘이
       * 나갔다. 원장을 서버로 옮기고 출금 게이트를 세운 것이 그 한 줄로 전부
       * 무의미해지는 자리였다.
       *
       * 요청은 무엇을 바꿀지(rewardId)만 말한다. 요청이 보낸 cost 는 아예
       * 읽지 않는다 — 검사만 해도 「맞으면 통과」라는 여지가 남는다.
       */
      const rewardId = String(body?.rewardId ?? '');
      const cost = costOf(rewardId);
      /* 표가 망가졌을 때도 이상한 값이 원장에 들어가지 않게 한 번 더 본다.
         costOf 가 이미 막고 있지만, 원장에 NaN 이 들어가면 되돌릴 방법이
         없어서 이 자리만은 두 겹으로 둔다. */
      if (!Number.isInteger(cost) || cost <= 0) {
        return send(res, 400, { error: 'unknown-reward' });
      }

      const userId = String(body?.userId ?? '');

      /*
       * 원장을 건드리기 전에 출금 게이트를 통과해야 한다.
       *
       * 수령처가 묶여 있는지 · 숙려가 끝났는지 · 기간 상한 안인지. 담합을
       * 막는 실제 벽이 여기다 — 기기를 여러 개 만들어도 받는 곳이 하나면
       * 한 사람분만 나간다. (server/payout.mjs)
       */
      const gate = await payout.check(userId, cost);
      if (!gate.ok) return send(res, 400, gate);

      const result = await post({
        key: String(body?.key ?? ''),
        userId,
        delta: -cost,
        reason: 'redeem',
        ref: rewardId,
      });
      if (result.error) return send(res, 400, result);

      // 이미 처리된 요청을 다시 세면 상한이 잘못 깎인다.
      if (!result.duplicated) await payout.record(userId, rewardId, cost);

      return send(res, 200, {
        ok: true,
        duplicated: result.duplicated,
        // 실제로 깎인 값을 돌려준다. 화면이 자기가 아는 값과 다르면 그건
        // 가격표가 어긋났다는 뜻이라, 사용자에게 보여줄 수 있어야 한다.
        cost,
        balance: await balanceOf(userId),
      });
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  /*
   * 보상 목록 — 서버가 아는 가격을 그대로 준다.
   *
   * 앱에도 같은 표가 있지만(화면 문구가 거기 있다), 값이 어긋났을 때 무엇이
   * 맞는지는 이쪽이다. 화면이 이 값을 받아 확인할 수 있게 열어 둔다.
   */
  if (url.pathname === '/api/rewards' && req.method === 'GET') {
    return send(res, 200, { rewards: listRewards() });
  }

  /* 기여 — 제보 · 확인 대기 목록 */
  if (url.pathname === '/api/contributions' && req.method === 'GET') {
    const userId = url.searchParams.get('userId');
    if (!userId) return send(res, 400, { error: 'userId' });
    return send(res, 200, {
      mine: await listMine(userId),
      pending: await listPending(userId),
    });
  }

  if (url.pathname === '/api/contributions' && req.method === 'POST') {
    try {
      const b = await readJson(req);
      return send(res, 200, await submitContribution({
        authorId: String(b?.userId ?? ''),
        type: String(b?.type ?? ''),
        placeId: b?.placeId ?? null,
        cityId: b?.cityId ?? null,
        note: b?.note,
        credits: Number(b?.credits ?? 0),
        needed: Number(b?.needed ?? 0),
        // 확인자가 같은 회선인지 보는 데만 쓴다. 원본 IP 는 남기지 않는다.
        net: networkTag(clientIp(req)),
      }));
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  /*
   * 확인·반려.
   *
   * 판정을 서버가 한다는 것이 이 기능의 전부다 — 제보자 ≠ 확인자, 1인 1회.
   * 클라이언트가 「확인됨」을 보내오는 방식이면 교차검증이 아무 뜻도 없다.
   */
  if (url.pathname === '/api/contributions/confirm' && req.method === 'POST') {
    try {
      const b = await readJson(req);
      if (b?.reject) {
        const r = await rejectContribution(String(b?.id ?? ''), String(b?.userId ?? ''));
        return send(res, r.error ? 400 : 200, r);
      }

      /*
       * 좌표는 **보내면 쓰고, 없으면 그만**이다.
       *
       * 현장에서 누른 확인은 3점, 원격은 1점이다. 위치를 요구하지는 않는다 —
       * 켜야만 참여할 수 있게 만들면 그건 위치 수집의 다른 이름이 된다.
       */
      const result = await confirmContribution(String(b?.id ?? ''), String(b?.userId ?? ''), {
        lat: typeof b?.lat === 'number' ? b.lat : null,
        lng: typeof b?.lng === 'number' ? b.lng : null,
        accuracyM: typeof b?.accuracyM === 'number' ? b.accuracyM : null,
        net: networkTag(clientIp(req)),
      });
      return send(res, result.error ? 400 : 200, result);
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  /*
   * 수령처 등록.
   *
   * 「회원가입이 없다」를 지키면서 담합을 막는 유일한 자리다 — 적립·확인은
   * 익명으로 두고, **가치가 밖으로 나갈 때만** 받는 곳을 하나로 묶는다.
   * 어차피 기프티콘을 보내려면 번호가 필요하므로 새로 생기는 부담은 없다.
   *
   * 서버는 해시만 갖는다. 실제 발송은 그 순간의 값으로 한다.
   */
  if (url.pathname === '/api/payout/bind' && req.method === 'POST') {
    try {
      const b = await readJson(req);
      const r = await payout.bind(String(b?.userId ?? ''), b?.target);
      return send(res, r.error ? 400 : 200, r);
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  /*
   * 운영자용 — 보류된 기여를 보고 푼다.
   *
   * 보류는 「의심스럽다」이지 「거짓이다」가 아니다. 휴리스틱만으로 사람의
   * 노동을 떼먹지 않으려면 사람이 보는 자리가 있어야 한다.
   */
  if (url.pathname === '/api/admin/held' && req.method === 'GET') {
    if (!adminOk(req)) return send(res, 404, { error: 'not-found' });
    return send(res, 200, { held: await listHeld() });
  }

  /*
   * 발행 현황 — 규제선까지 얼마나 남았나.
   *
   * 「어차피 안 닿는다」를 믿는 대신 숫자로 본다. 발행잔액이 30억원에 가까워
   * 지면 전자금융업 등록을 준비해야 하는데, 그건 최소 반년이 걸리는 일이라
   * 닿고 나서 알면 늦다. (server/issuance.mjs)
   */
  if (url.pathname === '/api/admin/issuance' && req.method === 'GET') {
    if (!adminOk(req)) return send(res, 404, { error: 'not-found' });
    return send(res, 200, issuanceReport(await outstandingTotal(), await issuedLastYear()));
  }

  /*
   * 앱이 죽었다는 보고를 받는다.
   *
   * **인증이 없다.** 앱이 죽은 시점에 인증할 방법이 없기 때문이다. 대신
   * 저장 쪽에서 (화면 × 메시지)를 한 줄로 묶고 종류 수에 상한을 둬서,
   * 아무나 불러도 늘어나는 줄 수가 유한하게 만들어 뒀다(errors.mjs).
   *
   * 실패해도 200 을 준다. 보고가 실패했다고 앱이 다시 시도하면, 죽어 있는
   * 앱이 서버를 두드리는 고리가 생긴다.
   */
  if (url.pathname === '/api/errors' && req.method === 'POST') {
    try {
      const b = await readJson(req, 4096);
      await recordError({
        message: String(b?.message ?? ''),
        stack: String(b?.stack ?? ''),
        where: String(b?.where ?? ''),
        platform: String(b?.platform ?? ''),
        version: String(b?.version ?? ''),
      });
    } catch {
      // 본문이 크거나 깨졌다. 받는 쪽에서 할 수 있는 일이 없다.
    }
    return send(res, 200, { ok: true });
  }

  if (url.pathname === '/api/admin/errors' && req.method === 'GET') {
    if (!adminOk(req)) return send(res, 404, { error: 'not-found' });
    return send(res, 200, { errors: await listErrors() });
  }

  if (url.pathname === '/api/admin/release' && req.method === 'POST') {
    if (!adminOk(req)) return send(res, 404, { error: 'not-found' });
    try {
      const b = await readJson(req);
      const r = await releaseContribution(String(b?.id ?? ''));
      return send(res, r.error ? 400 : 200, r);
    } catch (err) {
      return send(res, 400, { error: err.message });
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

/*
 * 서버가 **조용히** 죽지 않게 한다.
 *
 * 지금까지는 어디선가 잡히지 않은 오류가 나면 Node 가 프로세스를 끝냈고,
 * 그 사실이 아무 데도 안 남았다. 재시작해 주는 것이 붙어 있으면 서버는
 * 다시 뜨는데, **무엇 때문에 죽었는지는 영원히 모른다.**
 *
 * 죽는 것을 막지는 않는다. 상태가 망가진 채로 계속 도는 편이 더 나쁘다 —
 * 원장을 다루는 서버라 특히 그렇다. 기록을 남기고 나서 죽는다.
 */
process.on('uncaughtException', async (err) => {
  console.error('[server] 잡히지 않은 오류로 종료합니다:', err?.stack ?? err);
  // 죽더라도 쓴 것은 남긴다. 원장은 마지막 1초를 잃는 것이 곧 누군가의
  // 크레딧을 잃는 것이다.
  await flushAll().catch(() => {});
  process.exit(1);
});

/*
 * 응답을 기다리다 난 오류는 죽이지 않는다.
 *
 * 이 서버의 비동기 작업은 대부분 외부 API 호출이라, 하나 실패했다고 서버를
 * 내리면 환율 API 가 끊긴 동안 앱 전체가 멈춘다. 기록만 남기고 계속 돈다.
 */
process.on('unhandledRejection', (reason) => {
  console.error('[server] 처리되지 않은 거부:', reason?.stack ?? reason);
});

/*
 * 끄기 전에 밀린 저장을 마저 쓴다.
 *
 * 저장은 1초 미뤄서 몰아 쓴다(요청 하나마다 디스크를 때리지 않으려고).
 * 그런데 그 1초 안에 Ctrl+C 를 누르면 마지막 변경이 그냥 사라진다. 개발
 * 중에도 운영 중에도 서버를 끄는 것은 일상이라 드문 일이 아니다.
 *
 * 두 신호를 다 받는다 — SIGINT 는 Ctrl+C, SIGTERM 은 도커나 프로세스
 * 관리자가 보내는 것이다.
 *
 * ⚠ 이건 **신호를 받을 수 있을 때만** 통한다. 전원이 나가거나 강제 종료(SIGKILL)
 * 되면 안 돌고, 윈도우에서는 다른 프로세스가 보낸 신호가 아예 이렇게
 * 전달되지 않는다. 그래서 원장·출금은 여기 기대지 않고 그 자리에서 쓴다
 * (ledger.mjs · payout.mjs 의 saveNow). 이 장치는 나머지 파일(리뷰·구독자·
 * 오류)이 마지막 1초를 잃지 않게 하는 몫이다.
 */
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    if (closing) return; // 두 번 누른 경우
    closing = true;
    const n = await flushAll().catch(() => 0);
    if (n) console.log(`
[server] 밀린 저장 ${n}건을 마저 썼어요.`);
    process.exit(0);
  });
}

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
  console.log(
    process.env.ODPT_TOKEN
      ? '  운행정보: ODPT 키 있음 — 도쿄메트로·JR동일본까지 확인해요'
      : '  운행정보: ODPT 키 없음 — 도에이 지하철만 확인해요 (npm run check:odpt)',
  );

  if (process.env.QUAKE_WATCH === 'off') {
    console.log('  지진 감시: 꺼짐 (QUAKE_WATCH=off)');
  } else {
    watchQuakes();
  }
});
