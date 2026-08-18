import AsyncStorage from '@react-native-async-storage/async-storage';

import { Place } from '@/data/places';

/**
 * 위치 기반 방문 인증 + 리뷰 저장.
 *
 * 구글 지도 평점이 신뢰를 잃는 이유는 가보지 않은 사람도 별점을 남길 수 있어서다.
 * 여기서는 리뷰를 쓰려면 그 장소 반경 안에서 GPS가 찍혀야 한다.
 * 완벽한 위조 방지는 아니지만(모의 위치 앱은 뚫는다), 광고성 대량 리뷰의
 * 비용을 실제 방문 수준으로 끌어올리는 것이 목적이다.
 *
 * 운영 단계에서는 이 판정을 서버에서 다시 해야 한다. 클라이언트 판정만으로는
 * API를 직접 호출하는 우회를 막을 수 없기 때문이다.
 */

/**
 * 기본 인증 반경.
 *
 * 10m는 "그 가게 안에 있다"에 해당하는 엄격한 값이다. 다만 이 값을 그대로
 * 거리와 비교하면 진짜 방문자가 대량으로 탈락한다 — 스마트폰 GPS 오차는
 * 개활지에서 약 5m지만, 도심 고층가에서는 20~50m, 실내에서는 그 이상으로
 * 벌어지기 때문이다. 리뷰를 쓰는 시점은 대개 가게 안이다.
 *
 * 그래서 판정은 `거리 ≤ 반경 + 기기가 보고한 정확도` 로 한다(checkProximity 참조).
 * 반경을 좁히는 것으로 위조를 막지는 못한다 — 모의 위치 앱은 좌표를 정확히
 * 찍으므로 반경이 10m든 300m든 동일하게 통과한다. 반경의 역할은 위조 차단이
 * 아니라 "근처를 지나가기만 한 사람"과 "실제로 들어간 사람"을 가르는 것이다.
 */
export const VERIFY_RADIUS_M = 10;

/**
 * 이보다 정확도가 나쁘면 판정 자체를 거부한다.
 * 정확도를 무제한으로 더해 주면 "오차 500m"를 핑계로 아무 데서나 통과하기 때문이다.
 */
export const MAX_ACCEPTABLE_ACCURACY_M = 65;

export interface Review {
  id: string;
  placeId: string;
  /** 1~5 */
  rating: number;
  text: string;
  /** 작성 시각 (ISO) */
  createdAt: string;
  /** 위치 인증을 통과했는지 */
  verified: boolean;
  /** 인증 시점의 장소까지 거리(m). 미인증이면 null */
  distanceM: number | null;
}

/**
 * 두 좌표 사이 거리(m). Haversine 공식.
 *
 * 지구를 완전한 구로 가정하므로 수백 m 규모에서 오차는 무시할 수준이다.
 */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface ProximityResult {
  ok: boolean;
  distanceM: number;
  /** 이번 판정에 적용된 반경 (장소별 반경 + 기기 정확도) */
  effectiveRadiusM: number;
  /** 기기가 보고한 위치 정확도(m). 알 수 없으면 null */
  accuracyM: number | null;
  message: string;
}

/**
 * 현재 위치가 인증 반경 안인지 판정한다.
 *
 * `accuracyM`은 expo-location의 `coords.accuracy` — 실제 위치가 그 반경 안에
 * 있을 확률이 약 68%라는 뜻이다. 실내·고층가에서는 이 값이 수십 m로 커지는데,
 * 그 상황의 사용자는 대개 진짜 방문자다. 그래서 정확도를 반경에 더해 준다.
 * 다만 정확도가 아주 나쁘면(65m 초과) 판정을 아예 거부한다 — 그러지 않으면
 * 큰 오차를 핑계로 먼 곳에서도 통과할 수 있기 때문이다.
 */
export function checkProximity(
  place: Place,
  lat: number,
  lng: number,
  accuracyM: number | null = null,
  radiusM: number = place.radiusM ?? VERIFY_RADIUS_M,
): ProximityResult {
  const d = distanceMeters(lat, lng, place.lat, place.lng);
  const distanceM = Math.round(d);

  if (accuracyM !== null && accuracyM > MAX_ACCEPTABLE_ACCURACY_M) {
    return {
      ok: false,
      distanceM,
      effectiveRadiusM: radiusM,
      accuracyM,
      message: '위치를 정확히 못 잡았어요. 창가나 실외에서 다시 눌러 주세요.',
    };
  }

  const effectiveRadiusM = Math.round(radiusM + (accuracyM ?? 0));
  const ok = d <= effectiveRadiusM;

  return {
    ok,
    distanceM,
    effectiveRadiusM,
    accuracyM,
    message: ok
      ? '방문이 확인됐어요. 리뷰를 남겨 주세요!'
      : d < 1000
        ? `조금 더 가까이 가주세요. 지금 ${distanceM}m 떨어져 있어요.`
        : `${(d / 1000).toFixed(1)}km 떨어져 있어요. 리뷰는 현장에서만 남길 수 있어요.`,
  };
}

const KEY = 'reviews:v1';

async function readAll(): Promise<Review[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Review[]) : [];
  } catch {
    // 저장소가 깨졌더라도 앱은 계속 동작해야 한다.
    return [];
  }
}

export async function loadReviews(placeId?: string): Promise<Review[]> {
  const all = await readAll();
  const list = placeId ? all.filter((r) => r.placeId === placeId) : all;
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveReview(
  review: Omit<Review, 'id' | 'createdAt'>,
): Promise<Review> {
  const all = await readAll();
  const created: Review = {
    ...review,
    id: `${review.placeId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify([created, ...all]));
  return created;
}

export interface PlaceRating {
  /** 인증 리뷰만으로 계산한 평균. 인증분이 없으면 null */
  average: number | null;
  verifiedCount: number;
  totalCount: number;
}

/**
 * 평점 집계. **인증된 리뷰만** 평균에 반영한다.
 * 미인증 리뷰는 개수만 보여주고 점수에는 넣지 않는다 — 이 앱의 평점이
 * 의미를 가지려면 그 경계가 분명해야 한다.
 */
export function aggregate(reviews: Review[]): PlaceRating {
  const verified = reviews.filter((r) => r.verified);
  const average =
    verified.length > 0
      ? verified.reduce((s, r) => s + r.rating, 0) / verified.length
      : null;

  return {
    average,
    verifiedCount: verified.length,
    totalCount: reviews.length,
  };
}

export function stars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
}
