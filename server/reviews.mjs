/**
 * 리뷰 — 저장과 **현장 인증 재판정**.
 *
 * ## 세 가지 결정
 *
 * ### ① 계정을 만들지 않는다
 *
 * 이 앱은 「회원가입이 없다」를 지켜 왔다. 리뷰를 쓰려고 로그인시키면 그게
 * 무너진다. 대신 기기가 처음 실행될 때 만든 **임의의 id 와 비밀값**으로
 * 본인을 확인한다 — 자기가 쓴 리뷰를 지우는 데만 쓰이고, 그 값으로 사람을
 * 식별하거나 다른 서비스와 이을 수는 없다.
 *
 * 담합(계정 여러 개로 서로 밀어주기)은 이 구조로 못 막는다. 다만 리뷰는
 * **현장에 가야 쓸 수 있으므로** 크레딧과 달리 그 비용이 실제 이동이다.
 *
 * ### ② 위치는 판정에만 쓰고 저장하지 않는다
 *
 * 좌표를 받아 판정한 **뒤 버린다.** 리뷰에 남는 것은 「인증됨」과 거리뿐이다.
 * 위치 이력이 서버에 쌓이면 그건 리뷰 기능이 아니라 이동 추적이 된다.
 *
 * 예외가 하나 있다. 같은 사람이 물리적으로 불가능한 이동을 했는지 보려면
 * **직전 인증 한 건의 좌표와 시각**이 필요하다. 그것만 사람별로 한 건 들고
 * 있고, 다음 인증이 오면 덮어쓴다 — 이력이 아니라 마지막 한 점이다.
 *
 * ### ③ 판정은 서버가 다시 한다
 *
 * 클라이언트가 「인증됨」이라고 보내온 값을 믿으면, 앱을 거치지 않고 API 를
 * 직접 부르는 것만으로 인증 리뷰를 만들 수 있다. 좌표와 반경은 **서버가 가진
 * 값**으로 다시 계산한다(`places-geo.json`).
 *
 * 서버로 옮겨도 모의 위치 앱은 못 막는다. 판정 위치를 옮기는 것은 *API 우회*를
 * 막는 것이지 *위치 위조*를 막는 게 아니다 — 둘은 다른 문제다.
 */

import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

/*
 * 좌표 판정은 `geo.mjs` 한 곳에 있다.
 *
 * 예전에는 이 파일이 장소 좌표·정확도 상한·거리 계산·반경 판정을 자기 것으로
 * 들고 있었다. 기여 확인에도 같은 판정이 필요해져서 geo.mjs 를 뽑았는데,
 * 정작 리뷰는 옮기지 않아 **같은 규칙이 두 벌**로 남아 있었다.
 *
 * 두 벌이면 반드시 갈라진다. 실제로 갈라져 있었다 — geo 쪽은 좌표가 아예
 * 없는 경우를 따로 거부하는데 이쪽은 그 값으로 거리를 계산하고 있었다.
 * 그러면 「너무 멀어요」라는 엉뚱한 이유가 나간다.
 *
 * 리뷰에만 있는 검사(이동 속도)는 아래 verify 에 남는다 — 그건 장소 판정이
 * 아니라 **그 사람의 직전 인증과의 관계**라서 geo 가 알 수 없는 값이다.
 */
import { GEO, checkAt, distanceMeters } from './geo.mjs';

import { saver } from './store.mjs';

const FILE = process.env.REVIEWS_FILE ?? join(process.cwd(), '.data', 'reviews.json');

/**
 * 몇 명이 신고하면 감추나.
 *
 * 감추는 것은 지우는 것이 아니다. 사람이 볼 때까지 **안 보이게만** 한다 —
 * 신고 몇 건으로 남의 글을 없앨 수 있으면 그게 새로운 어뷰징이 된다.
 *
 * 3으로 잡은 이유. 1이면 마음에 안 드는 리뷰 하나를 혼자 지울 수 있고,
 * 5면 신고가 그만큼 쌓일 때까지 부적절한 글이 그대로 보인다. 이 앱의 리뷰는
 * **현장 인증을 통과한 사람만** 쓸 수 있어서 애초에 양이 적고, 그래서 문턱을
 * 낮게 잡아도 정상 리뷰가 휩쓸릴 위험이 작다.
 */
const HIDE_AFTER_REPORTS = Number(process.env.REVIEW_HIDE_AFTER_REPORTS ?? 3);

/** 사람이 낼 수 있는 속도의 상한(m/s). 신칸센이 시속 320km ≒ 89m/s 다 */
const MAX_SPEED_MPS = 100;

/** 한 사람이 한 장소에 남길 수 있는 리뷰 수 */
const MAX_PER_PLACE = 1;

/** @type {{reviews: object[], lastFix: Record<string, {lat:number,lng:number,at:number}>}} */
let db = { reviews: [], lastFix: {} };
let loaded = false;

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    db = JSON.parse(await readFile(FILE, 'utf8'));
    db.reviews ??= [];
    db.lastFix ??= {};
    console.log(`[reviews] ${db.reviews.length}건 불러옴`);
  } catch {
    // 첫 실행이다
  }
}

const store = saver('reviews', FILE, () => db);

/** 저장은 미뤄서 몰아 쓴다. 안전하게 쓰는 방법은 store.mjs 에 있다 */
function scheduleSave() {
  store.schedule();
}

/**
 * 현장 인증 판정 — 장소 판정(geo) + 리뷰에만 있는 이동 속도 검사.
 *
 * @returns `{ ok, reason, distanceM }` — 거부해도 이유를 준다. 「안 됩니다」만
 *   돌려주면 사용자가 무엇을 고쳐야 하는지 모른다.
 */
function verify(placeId, lat, lng, accuracyM, authorId) {
  const at = checkAt(placeId, lat, lng, accuracyM);
  if (!at.ok) return at;

  const { distanceM } = at;

  /*
   * 물리적으로 불가능한 이동인지.
   *
   * 위치 위조를 잡는 가장 값싼 신호다 — 오사카에서 인증하고 3분 뒤 삿포로에서
   * 인증하는 일은 없다. 모의 위치 앱을 막지는 못하지만, 좌표를 찍어 여러
   * 장소를 훑는 가장 흔한 수법에는 걸린다.
   */
  const last = db.lastFix[authorId];
  if (last) {
    /*
     * 흐른 시간을 1ms 아래로 내려가지 않게 한다.
     *
     * 예전에는 `seconds > 0` 일 때만 검사했다. 그래서 두 요청이 **같은
     * 밀리초에** 들어오면 검사가 통째로 건너뛰어졌다 — 0으로 나누는 것을
     * 피하려던 것인데, 하필 가장 의심스러운 경우가 그냥 지나가는 조건이
     * 됐다. 사람은 같은 밀리초에 두 번 제출하지 못한다.
     */
    const seconds = Math.max((Date.now() - last.at) / 1000, 0.001);
    const moved = distanceMeters(lat, lng, last.lat, last.lng);
    if (moved / seconds > MAX_SPEED_MPS) {
      return { ok: false, reason: 'impossible-move', distanceM };
    }
  }

  return { ok: true, reason: null, distanceM };
}

/**
 * 리뷰를 남긴다.
 *
 * 좌표는 **여기서만 쓰이고 저장되지 않는다.** 남는 것은 판정 결과와 거리뿐이다.
 */
export async function create({ placeId, rating, text, lat, lng, accuracyM, authorId }) {
  await load();

  if (!GEO[placeId]) return { error: 'unknown-place' };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'rating' };
  if (typeof text !== 'string' || text.length > 500) return { error: 'text' };
  if (!authorId) return { error: 'author' };

  const mine = db.reviews.filter((r) => r.placeId === placeId && r.authorId === authorId);
  if (mine.length >= MAX_PER_PLACE) return { error: 'duplicate' };

  const v = verify(placeId, lat, lng, accuracyM ?? null, authorId);
  if (!v.ok) return { error: v.reason, distanceM: v.distanceM };

  // 판정에 쓴 마지막 한 점만 갱신한다. 이력이 아니다.
  db.lastFix[authorId] = { lat, lng, at: Date.now() };

  const review = {
    id: randomUUID(),
    placeId,
    rating,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    verified: true,
    distanceM: v.distanceM,
    authorId,
  };
  db.reviews.push(review);
  scheduleSave();

  return { review: strip(review) };
}

/**
 * 작성자 id 와 신고 내역을 떼고 내보낸다.
 *
 * 누가 썼는지는 남에게 보일 이유가 없다. 누가 신고했는지도 마찬가지고,
 * **몇 명이 신고했는지조차** 안 보낸다 — 숫자가 보이면 「신고 2건」인 리뷰에
 * 한 명만 더 붙이면 감춰진다는 걸 알게 되고, 그게 곧 사용법이 된다.
 */
function strip(r) {
  const { authorId: _drop, reports: _reports, ...rest } = r;
  return rest;
}

/** 신고가 쌓여 감춰졌나 */
function hidden(r) {
  return (r.reports?.length ?? 0) >= HIDE_AFTER_REPORTS;
}

export async function listFor(placeId, authorId) {
  await load();
  const list = db.reviews
    .filter((r) => r.placeId === placeId)
    /*
     * 감춰진 것은 남에게 안 보인다. 다만 **쓴 사람에게는 보인다** —
     * 자기 글이 조용히 사라지면 앱이 먹은 줄 알고, 같은 글을 다시 쓴다.
     * 그러면 신고도 다시 쌓이고 아무도 이유를 모른 채 반복된다.
     */
    .filter((r) => !hidden(r) || (authorId && r.authorId === authorId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return list.map((r) => ({
    ...strip(r),
    // 자기 리뷰만 지울 수 있으므로, 어느 것이 내 것인지는 알려줘야 한다
    mine: authorId ? r.authorId === authorId : false,
    // 쓴 사람에게만 「신고로 가려졌다」를 알린다
    hidden: authorId && r.authorId === authorId ? hidden(r) : undefined,
  }));
}

export async function remove(id, authorId) {
  await load();
  const i = db.reviews.findIndex((r) => r.id === id);
  if (i < 0) return { error: 'not-found' };
  // 남의 리뷰를 지울 수 없다. 존재 여부까지 숨길 이유는 없어 not-found 와 구분한다.
  if (db.reviews[i].authorId !== authorId) return { error: 'forbidden' };
  db.reviews.splice(i, 1);
  scheduleSave();
  return { ok: true };
}

/**
 * 리뷰를 신고한다.
 *
 * 구글 플레이는 사용자가 글을 남기는 앱에 **신고 수단**을 요구한다. 그것과
 * 별개로, 현장 인증만으로는 거른 적 없는 것이 하나 있다 — 진짜로 거기 갔지만
 * 욕설이나 광고를 쓰는 경우다. 위치는 참인데 내용이 아닌 것.
 *
 * 같은 사람이 여러 번 눌러도 한 번으로 센다. 안 그러면 혼자서 문턱을 넘길 수
 * 있어 신고 자체가 남의 글을 지우는 도구가 된다.
 */
export async function report(id, reporterId, reason) {
  await load();

  const review = db.reviews.find((r) => r.id === id);
  if (!review) return { error: 'not-found' };
  if (!reporterId) return { error: 'reporter' };
  // 자기 글은 신고가 아니라 삭제다. 삭제 버튼이 이미 있다.
  if (review.authorId === reporterId) return { error: 'own-review' };

  review.reports ??= [];
  if (review.reports.some((x) => x.by === reporterId)) {
    // 이미 신고했다. 실패로 말하면 「안 됐나」 싶어 다시 누른다.
    return { ok: true, duplicated: true };
  }

  review.reports.push({
    by: reporterId,
    reason: String(reason ?? '').slice(0, 40),
    at: new Date().toISOString(),
  });
  scheduleSave();
  return { ok: true, duplicated: false, hidden: hidden(review) };
}

/** 운영자용 — 신고가 쌓인 리뷰. 지울지 되살릴지는 사람이 정한다 */
export async function listReported() {
  await load();
  return db.reviews
    .filter((r) => (r.reports?.length ?? 0) > 0)
    .sort((a, b) => (b.reports?.length ?? 0) - (a.reports?.length ?? 0))
    .map((r) => ({
      id: r.id,
      placeId: r.placeId,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
      hidden: hidden(r),
      // 누가 신고했는지는 운영자에게도 안 준다. 몇 건이고 무슨 사유인지면 된다.
      reportCount: r.reports.length,
      reasons: r.reports.map((x) => x.reason).filter(Boolean),
    }));
}

/** 운영자용 — 신고를 지우고 다시 보이게 한다 */
export async function clearReports(id) {
  await load();
  const review = db.reviews.find((r) => r.id === id);
  if (!review) return { error: 'not-found' };
  review.reports = [];
  scheduleSave();
  return { ok: true };
}

/** 장소별 집계 — 인증 리뷰만 센다. 이 앱 평점의 존재 이유다 */
export async function summary(placeIds) {
  await load();
  const out = {};
  for (const id of placeIds) {
    /* 감춰진 리뷰는 평점에서도 뺀다. 목록에서만 감추면 별점은 그대로
       끌려 내려간 채라, 신고가 반쯤만 듣는 셈이 된다. */
    const list = db.reviews.filter((r) => r.placeId === id && r.verified && !hidden(r));
    out[id] = list.length
      ? {
          count: list.length,
          average: Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10,
        }
      : { count: 0, average: 0 };
  }
  return out;
}
