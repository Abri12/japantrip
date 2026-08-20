import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import {
  Card,
  Empty,
  IconCircle,
  KrwEstimate,
  Row,
  RowGroup,
  Screen,
  Section,
  Txt,
} from '@/components/ui';
import { findPlace } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { accessSummary } from '@/lib/access';
import { budgetCaveat, budgetFor, sumBudgets } from '@/lib/budget';
import { useItinerary } from '@/lib/itinerary';
import { useSavedPlaces } from '@/lib/saved-places';

/**
 * 내 일정 — 저장한 곳을 날짜별로 본다.
 *
 * 추천 코스(`course/[id]`)와 겹쳐 보이지만 하는 일이 다르다. 코스는 **우리가
 * 짠 동선**을 읽는 화면이고, 여기는 **사용자가 고른 곳**을 날짜에 담은 것이다.
 * 그래서 코스에 있는 「이 순서로 도는 이유」가 여기엔 없다 — 순서를 정한 건
 * 우리가 아니다.
 *
 * 대신 코스가 못 하는 걸 한다. 코스는 읽고 나면 끝이지만, 이 화면은 여행
 * 중에 계속 열린다 — 오늘 어디 가기로 했는지 확인하는 자리다.
 */
export default function ItineraryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { ids: savedIds } = useSavedPlaces();
  const { days, dayCount, placesOn } = useItinerary();

  /* 저장했지만 아직 날짜를 안 정한 곳. 일정 아래에 남겨 둔다 —
     「저장은 했는데 언제 갈지 안 정한 것」이 눈에 보여야 다음 행동이 생긴다. */
  const unplaced = savedIds.filter((id) => days[id] === undefined);

  const openPlace = (id: string) => router.push(`/place/${id}`);

  /*
   * 날짜별 최소 비용.
   *
   * 사용자가 아무것도 입력하지 않는다는 게 이 기능의 전부다 — 담아 둔 장소와
   * 이미 가진 가격 데이터만으로 나온다. 대신 「총액」이라 부르지 않는다.
   * 무엇이 빠졌는지는 `budgetCaveat` 이 말한다. (lib/budget.ts)
   */
  const dayBudgets = Array.from({ length: dayCount }, (_, i) => budgetFor(placesOn(i + 1)));
  const total = sumBudgets(dayBudgets);
  const totalCaveat = budgetCaveat(total);

  if (savedIds.length === 0) {
    return (
      <Screen back backFallback="/" title="내 일정" subtitle="저장한 곳을 날짜별로 담아보세요">
        <Section>
          <Empty text="아직 저장한 곳이 없어요. 관광 · 맛집에서 마음에 드는 곳을 저장해보세요." />
        </Section>
      </Screen>
    );
  }

  return (
    <Screen
      back
      backFallback="/"
      title="내 일정"
      subtitle={dayCount > 0 ? `${dayCount}일치 · ${Object.keys(days).length}곳` : '저장한 곳을 날짜별로 담아보세요'}>
      {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
        const ids = placesOn(day);
        const b = dayBudgets[day - 1];
        return (
          <Section
            key={day}
            title={`${day}일차`}
            /* 셀 것이 없으면 금액을 안 붙인다. 「최소 ¥0」은 「공짜」로
               읽히는데 사실은 「아직 모른다」다. */
            caption={
              b.counted > 0
                ? `${ids.length}곳 · 최소 ¥${b.yen.toLocaleString('en-US')}`
                : `${ids.length}곳`
            }>
            <RowGroup>
              {ids.map((id, i) => {
                const place = findPlace(id);
                if (!place) return null;
                return (
                  <Row
                    key={id}
                    leading={
                      <IconCircle
                        emoji={place.category === 'food' ? '🍜' : '📸'}
                        tone={
                          place.category === 'food' ? theme.warningSoft : theme.primarySoft
                        }
                      />
                    }
                    title={place.name}
                    subtitle={place.access ? accessSummary(place.access) : place.summary}
                    trailing={place.city}
                    trailingSub={place.admission}
                    chevron
                    last={i === ids.length - 1}
                    onPress={() => openPlace(id)}
                  />
                );
              })}
            </RowGroup>
          </Section>
        );
      })}

      {/*
        예상 비용.

        가계부 앱이 못 하는 자리다 — 그들에겐 여행 전 가격이 없다. 이 앱은
        장소마다 값을 갖고 있고 사용자가 날짜까지 담아 뒀으니, **입력 없이**
        「이 일정에 최소 얼마」가 나온다.

        그래서 더 조심해야 한다. 공짜로 얻은 숫자일수록 사용자는 그게 전부인
        줄 안다. 제목을 「예상 비용」이 아니라 **「최소 이만큼」**으로 잡고,
        빠진 것(식비·교통비·값 모르는 곳)을 바로 아래에 붙인다.
      */}
      {totalCaveat ? (
        <Section title="이 일정, 최소 이만큼">
          <Card>
            <View style={styles.totalRow}>
              <Txt variant="display">¥{total.yen.toLocaleString('en-US')}</Txt>
              <KrwEstimate yen={total.yen} />
            </View>
            <Txt variant="caption" color="textTertiary" style={styles.totalNote}>
              {totalCaveat}
            </Txt>
          </Card>
        </Section>
      ) : null}

      {/* 순서를 우리가 짜지 않았다는 걸 밝힌다. 추천 코스와 달리 이 목록은
          동선이 검증된 순서가 아니라 사용자가 담은 순서다 — 그걸 말하지
          않으면 코스처럼 「이대로 돌면 된다」로 읽힌다. */}
      {dayCount > 0 ? (
        <Section>
          <Card>
            <Txt variant="caption" color="textTertiary">
              담은 순서대로 보여드려요. 동선까지 맞춘 순서가 필요하면 홈의 「이렇게 돌면
              돼요」에 있는 추천 코스를 참고하세요.
            </Txt>
          </Card>
        </Section>
      ) : null}

      {unplaced.length > 0 ? (
        <Section
          title="아직 날짜를 안 정한 곳"
          caption="장소를 열어 「며칠째에 갈까요」에서 고르면 위에 담겨요">
          <RowGroup>
            {unplaced.map((id, i) => {
              const place = findPlace(id);
              if (!place) return null;
              return (
                <Row
                  key={id}
                  leading={
                    <IconCircle
                      emoji={place.category === 'food' ? '🍜' : '📸'}
                      tone={theme.surfaceStrong}
                    />
                  }
                  title={place.name}
                  subtitle={place.summary}
                  trailing={place.city}
                  chevron
                  last={i === unplaced.length - 1}
                  onPress={() => openPlace(id)}
                />
              );
            })}
          </RowGroup>
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  /* 금액과 원화를 같은 줄에 두되 기준선을 맞춘다 — 큰 숫자 옆에 작은 글씨가
     떠 보이면 둘이 다른 정보처럼 읽힌다. */
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.three,
  },
  totalNote: {
    marginTop: Spacing.three,
  },
});
