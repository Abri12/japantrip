import { Stack, useLocalSearchParams } from 'expo-router';

import { Screen, Txt } from '@/components/ui';
import { findPlace } from '@/data/places';
import {
  AccessSection,
  LocalCaveats,
  PassSection,
  RatingSection,
  ReviewFormSection,
  ReviewListSection,
  SummarySection,
  TipSection,
  usePlaceReviews,
} from '@/features/place';

/**
 * 장소 상세 — 조립만 한다.
 *
 * 순서에는 뜻이 있다. 위 넷은 **가기 전에** 읽는 것이고, 아래 셋은 **다녀와서**
 * 쓰는 것이다. 그 경계에 「현장 인증 평점」이 놓인다 — 남이 다녀온 결과를
 * 읽는 자리라 양쪽 다에 걸친다.
 */
export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = findPlace(id);

  /* 훅은 이른 return 보다 위에서 부른다. 아래로 내리면 「장소를 못 찾음」
     경로에서 훅 개수가 달라진다. */
  const r = usePlaceReviews(place);

  if (!place) {
    return (
      <Screen back backFallback="/places" title="장소를 찾을 수 없어요">
        <Txt variant="body" color="textTertiary">
          잘못된 주소예요.
        </Txt>
      </Screen>
    );
  }

  return (
    <>
      {/* 헤더는 숨겨져 있고, 이 title 은 웹 브라우저 탭 제목으로만 쓰인다.
          장소 이름을 넣어 여러 탭을 열어 두고 비교할 때 구분되게 한다. */}
      <Stack.Screen options={{ title: `${place.name} · ${place.city}` }} />
      <Screen back backFallback="/places" title={place.name} subtitle={place.nameJa}>
        <SummarySection place={place} />

        {/* 모르면 문 앞에서 돌아서는 정보다. 산문에 묻어두면 훑을 때 안 보인다 —
            「오후 5시면 닫아요」가 세 문장 가운데 있으면 4시 반에 나서는 사람은
            그 문장을 못 읽는다. */}
        {place.local ? <LocalCaveats local={place.local} /> : null}

        <AccessSection place={place} />
        <TipSection tip={place.tip} />
        <PassSection passes={place.passes} />

        <RatingSection agg={r.agg} />

        <ReviewFormSection
          proximity={r.proximity}
          checking={r.checking}
          locError={r.locError}
          rating={r.rating}
          onRating={r.setRating}
          text={r.text}
          onText={r.setText}
          onVerify={r.verify}
          onSubmit={r.submit}
        />

        <ReviewListSection reviews={r.reviews} />
      </Screen>
    </>
  );
}
