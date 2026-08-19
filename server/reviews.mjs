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

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

const FILE = process.env.REVIEWS_FILE ?? join(process.cwd(), '.data', 'reviews.json');

/** 서버가 가진 장소 좌표 — 판정의 기준이다 (scripts/gen-places-geo.mjs) */
const GEO = JSON.parse(
  readFileSync(new URL('./places-geo.json', import.meta.url), 'utf8'),
);

/** 앱과 같은 값을 쓴다 — 다르면 앱은 통과인데 서버는 거부하는 상태가 된다 */
const MAX_ACCEPTABLE_ACCURACY_M = 65;

/** 사람이 낼 수 있는 속도의 상한(m/s). 신칸센이 시속 320km ≒ 89m/s 다 */
const MAX_SPEED_MPS = 100;

/** 한 사람이 한 장소에 남길 수 있는 리뷰 수 */
const MAX_PER_PLACE = 1;

/** @type {{reviews: object[], lastFix: Record<string, {lat:number,lng:number,at:number}>}} */
let db = { reviews: [], lastFix: {} };
let loaded = false;
let saveTimer = null;

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

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try {
      await mkdir(dirname(FILE), { recursive: true });
      await writeFile(FILE, JSON.stringify(db), 'utf8');
    } catch (err) {
      console.warn('[reviews] 저장 실패:', err.message);
    }
  }, 1000);
}

/** 두 좌표 사이 거리(m). 앱의 distanceMeters 와 같은 Haversine 이다 */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

/**
 * 현장 인증 판정.
 *
 * @returns `{ ok, reason, distanceM }` — 거부해도 이유를 준다. 「안 됩니다」만
 *   돌려주면 사용자가 무엇을 고쳐야 하는지 모른다.
 */
function verify(placeId, lat, lng, accuracyM, authorId) {
  const geo = GEO[placeId];
  if (!geo) return { ok: false, reason: 'unknown-place', distanceM: null };

  if (accuracyM !== null && accuracyM > MAX_ACCEPTABLE_ACCURACY_M) {
    return { ok: false, reason: 'accuracy', distanceM: null };
  }

  const distanceM = distanceMeters(lat, lng, geo.lat, geo.lng);
  const effective = geo.radiusM + (accuracyM ?? 0);
  if (distanceM > effective) return { ok: false, reason: 'too-far', distanceM };

  /*
   * 물리적으로 불가능한 이동인지.
   *
   * 위치 위조를 잡는 가장 값싼 신호다 — 오사카에서 인증하고 3분 뒤 삿포로에서
   * 인증하는 일은 없다. 모의 위치 앱을 막지는 못하지만, 좌표를 찍어 여러
   * 장소를 훑는 가장 흔한 수법에는 걸린다.
   */
  const last = db.lastFix[authorId];
  if (last) {
    const seconds = (Date.now() - last.at) / 1000;
    const moved = distanceMeters(lat, lng, last.lat, last.lng);
    if (seconds > 0 && moved / seconds > MAX_SPEED_MPS) {
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

/** 작성자 id 를 떼고 내보낸다 — 누가 썼는지는 남에게 보일 이유가 없다 */
function strip(r) {
  const { authorId: _drop, ...rest } = r;
  return rest;
}

export async function listFor(placeId, authorId) {
  await load();
  const list = db.reviews
    .filter((r) => r.placeId === placeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return list.map((r) => ({
    ...strip(r),
    // 자기 리뷰만 지울 수 있으므로, 어느 것이 내 것인지는 알려줘야 한다
    mine: authorId ? r.authorId === authorId : false,
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

/** 장소별 집계 — 인증 리뷰만 센다. 이 앱 평점의 존재 이유다 */
export async function summary(placeIds) {
  await load();
  const out = {};
  for (const id of placeIds) {
    const list = db.reviews.filter((r) => r.placeId === id && r.verified);
    out[id] = list.length
      ? {
          count: list.length,
          average: Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10,
        }
      : { count: 0, average: 0 };
  }
  return out;
}
