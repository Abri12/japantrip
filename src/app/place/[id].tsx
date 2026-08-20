import { Stack, useLocalSearchParams } from 'expo-router';

import { Screen, Txt } from '@/components/ui';
import { placeParams } from '@/data/static-routes';
import { findPlace } from '@/data/places';
import {
  AccessSection,
  LocalCaveats,
  PassSection,
  RatingSection,
  SaveButton,
  DayPicker,
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
        {/* 저장은 이 화면의 첫 동작이다 — 읽고 「가고 싶다」가 된 마음을
            담아 둘 자리가 요약보다 위에 있어야 스크롤 없이 닿는다. */}
        <SaveButton placeId={place.id} />
        {/* 저장한 곳에만 나타난다 — 「가고 싶다」 다음이 「언제 간다」다 */}
        <DayPicker placeId={place.id} />

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
          submitError={r.submitError}
          rating={r.rating}
          onRating={r.setRating}
          text={r.text}
          onText={r.setText}
          onVerify={r.verify}
          onSubmit={r.submit}
        />

        <ReviewListSection reviews={r.reviews} onRemove={r.remove} />
      </Screen>
    </>
  );
}

/**
 * 미리 그릴 주소 목록.
 *
 * 이게 없으면 이 화면은 내보내기에 안 들어가고, 정적 호스팅이 404.html 을
 * 준다 — 리액트가 붙일 것이 없어 하이드레이션이 어긋난다(React #418).
 * 무엇을 그릴지 정하는 정책은 `data/static-routes.ts` 한곳에 있다.
 */
export function generateStaticParams() {
  return placeParams();
}
