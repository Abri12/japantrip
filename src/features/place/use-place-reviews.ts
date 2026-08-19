import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import { FEATURES } from '@/constants/features';
import { Place } from '@/data/places';
import { submitContribution } from '@/lib/contributions';
import {
  PlaceRating,
  ProximityResult,
  Review,
  aggregate,
  checkProximity,
  deleteReview,
  loadReviews,
  saveReview,
  submitErrorMessage,
  submitToServer,
} from '@/lib/reviews';

export interface PlaceReviews {
  reviews: Review[];
  /** 인증 리뷰만 반영한 평점 요약 */
  agg: PlaceRating;
  rating: number;
  setRating: (n: number) => void;
  text: string;
  setText: (t: string) => void;
  /** 위치 확인 결과. 아직 안 눌렀으면 null */
  proximity: ProximityResult | null;
  /** 위치를 확인하는 중 — 버튼을 잠근다 */
  checking: boolean;
  /** 권한 거부·측위 실패처럼 사용자가 손쓸 수 있는 오류 */
  locError: string | null;
  /** 등록이 거부된 이유. 서버가 다시 판정해 돌려준다 */
  submitError: string | null;
  verify: () => Promise<void>;
  submit: () => Promise<void>;
  /** 내가 쓴 리뷰 지우기. 서버가 있을 때만 동작한다 */
  remove: (id: string) => Promise<void>;
}

/**
 * 현장 인증 리뷰의 상태와 동작.
 *
 * 화면에서 떼어낸 이유는 크기보다 **엉킴** 때문이다. 상태 여섯 개와 비동기
 * 흐름 둘(위치 확인·등록)이 JSX 사이에 흩어져 있어서, 리뷰와 상관없는
 * 「가는 방법」을 고치려 해도 이걸 먼저 넘어가야 했다.
 *
 * `place` 를 선택 인자로 받는다. 화면에 「장소를 못 찾음」 이른 return 이
 * 있어서, 훅을 그 뒤에서 부르면 렌더마다 훅 개수가 달라진다.
 */
export function usePlaceReviews(place?: Place): PlaceReviews {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [proximity, setProximity] = useState<ProximityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /* 인증에 쓴 좌표. 서버가 다시 판정해야 해서 등록할 때까지 들고 있는다.
     기기 밖으로는 등록 요청 한 번에만 나가고, 서버도 저장하지 않는다. */
  const [fix, setFix] = useState<{ lat: number; lng: number; accuracyM: number | null } | null>(
    null,
  );

  useEffect(() => {
    if (place) loadReviews(place.id).then(setReviews);
  }, [place]);

  const verify = useCallback(async () => {
    if (!place) return;
    setChecking(true);
    setLocError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('위치 권한이 필요해요. 설정에서 허용해 주세요.');
        return;
      }

      // 반경이 좁으므로 최고 정확도를 요청한다.
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      setFix({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM: pos.coords.accuracy ?? null,
      });
      setProximity(
        checkProximity(
          place,
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy ?? null,
        ),
      );
    } catch {
      setLocError('위치를 못 가져왔어요. 밖으로 나가서 다시 시도해 주세요.');
    } finally {
      setChecking(false);
    }
  }, [place]);

  const submit = useCallback(async () => {
    if (!place || !proximity?.ok) return;
    setSubmitError(null);

    /*
     * 서버가 있으면 서버에 남긴다.
     *
     * 클라이언트 판정(`proximity`)은 **버튼을 열지 말지**만 정한다. 진짜
     * 판정은 서버가 자기 좌표로 다시 한다 — 그래야 앱을 거치지 않은 요청을
     * 막을 수 있다. 그래서 거부당할 수 있고, 그 이유를 화면에 그대로 전한다.
     */
    if (fix) {
      const result = await submitToServer({
        placeId: place.id,
        rating,
        text: text.trim(),
        ...fix,
      });

      if (result?.ok === false) {
        setSubmitError(submitErrorMessage(result.reason));
        return;
      }
      if (result?.ok) {
        setText('');
        setReviews(await loadReviews(place.id));
        return;
      }
      // result === null — 서버가 없거나 죽었다. 아래 로컬 저장으로 떨어진다.
    }

    await saveReview({
      placeId: place.id,
      rating,
      text: text.trim(),
      verified: true,
      distanceM: proximity.distanceM,
    });

    // 크레딧 기능이 꺼져 있어도 기여 기록은 남긴다. 나중에 켤 때 이어진다.
    if (FEATURES.credits) {
      await submitContribution({
        type: 'verified_review',
        placeId: place.id,
        cityId: place.cityId,
        note: text.trim(),
      });
    }

    setText('');
    setReviews(await loadReviews(place.id));
  }, [place, proximity, rating, text, fix]);

  const remove = useCallback(
    async (id: string) => {
      if (!place) return;
      if (await deleteReview(id)) setReviews(await loadReviews(place.id));
    },
    [place],
  );

  return {
    reviews,
    agg: aggregate(reviews),
    rating,
    setRating,
    text,
    setText,
    proximity,
    checking,
    locError,
    submitError,
    verify,
    submit,
    remove,
  };
}
