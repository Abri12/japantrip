import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import {
  Card,
  Chip,
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
import { MAX_DAYS, useItinerary } from '@/lib/itinerary';
import { parseYen, useSpending } from '@/lib/spending';
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
 *
 * ## 두 칸으로 나눈다 — 「일정」과 「쓴 돈」
 *
 * 처음에는 쓴 돈을 이 화면 **맨 아래에** 붙였다. 그랬더니 「돈 쓴 거 관리하는
 * 곳은 어디서 보나」라는 질문이 나왔다. 문에 이름이 안 적혀 있었던 것이다 —
 * 홈에서 이 화면으로 오는 줄의 제목은 「내 일정」이고, 지출이 여기 있다는
 * 힌트가 한 글자도 없었다.
 *
 * 비슷한 앱들이 어떻게 하는지 봤다. **트리플은 일정 안 상단 탭에 「가계부」**를
 * 둔다. Wanderlog 도 여행(trip) 안의 기능이다. 공통점이 분명하다 —
 * **지출은 여행에 속하되, 여행 안에서는 일정과 동등한 층위로 꺼낸다.**
 * 전역 탭으로 빼지도 않고(여행 중에만 쓰는 것이라 앱의 축이 될 수 없다),
 * 스크롤 아래 묻지도 않는다.
 *
 * 그래서 칩 두 개로 나눴다. 새 부품을 만들지 않았다 — 공항의 「어디까지
 * 가세요?」 거점 칩, 이동의 도시 필터 칩과 같은 `Chip` 이다.
 *
 * ## 쓴 돈은 일정이 없어도 적을 수 있다
 *
 * 예전에는 날짜를 배정해야(`dayCount > 0`) 지출 칸이 나왔다. 예상 비용에
 * 붙이면서 그 조건을 그대로 물려받은 건데, **일정을 안 짜도 돈은 쓴다.**
 * 이제 칸이 탭이라 일정과 무관하게 열리고, 적을수록 다음 날이 따라 나온다.
 *
 * 다만 **저장한 곳이 하나도 없으면** 이 화면 자체가 홈에 안 뜬다. 그건
 * 그대로 둔다 — 저장조차 안 한 사람은 아직 이 앱으로 여행을 계획하는
 * 단계가 아니고, 빈 화면을 열게 하는 건 기능이 아니라 실망이다.
 */

/** 화면 안에서 보고 있는 칸 */
type Pane = 'plan' | 'spend';
export default function ItineraryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { ids: savedIds } = useSavedPlaces();
  const { days, dayCount, placesOn } = useItinerary();
  const { spent, total: spentTotal, recordedDays, set: setSpent } = useSpending();

  /* 저장했지만 아직 날짜를 안 정한 곳. 일정 아래에 남겨 둔다 —
     「저장은 했는데 언제 갈지 안 정한 것」이 눈에 보여야 다음 행동이 생긴다. */
  const unplaced = savedIds.filter((id) => days[id] === undefined);

  const [pane, setPane] = useState<Pane>('plan');

  const openPlace = (id: string) => router.push(`/place/${id}`);

  /*
   * 쓴 돈 칸에서 몇 일차까지 그릴지.
   *
   * 일정이 있으면 그 일수, 없으면 1일차 하나로 시작한다. 그리고 **적을수록
   * 다음 날이 따라 나온다**(`기록한 마지막 날 + 1`) — 「하루 더」 버튼을 두지
   * 않고도 늘어나고, 여행이 계획보다 길어져도 적을 수 있다.
   *
   * 빈 칸을 미리 여러 개 깔지 않는 이유는 입력 화면이라서다. 안 쓸 칸이
   * 늘어서 있으면 채워야 할 것처럼 보인다.
   */
  const recordedMax = Object.keys(spent).reduce((m, d) => Math.max(m, Number(d)), 0);
  const spendDays = Math.min(MAX_DAYS, Math.max(dayCount, recordedMax + 1, 1));

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
      {/*
        칸 고르기. 공항의 거점 칩·이동의 도시 칩과 같은 부품이라, 이 앱을
        써 본 사람은 배울 것이 없다.
      */}
      <View style={styles.paneChips}>
        <Chip label="일정" active={pane === 'plan'} onPress={() => setPane('plan')} />
        <Chip
          label={recordedDays > 0 ? `쓴 돈 · ¥${spentTotal.toLocaleString('en-US')}` : '쓴 돈'}
          active={pane === 'spend'}
          onPress={() => setPane('spend')}
        />
      </View>

      {pane === 'plan' ? (
        <ItineraryPane />
      ) : (
        <SpendPane />
      )}
    </Screen>
  );

  function ItineraryPane() {
    return (
      <>
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
      </>
    );
  }

  function SpendPane() {
    return (
      <>
        {/*
          예상 비용 — **쓴 돈과 같은 칸에 둔다.**

          처음엔 일정 칸에 있었다. 그런데 이 숫자가 값어치를 갖는 자리는
          「얼마 쓸까」가 아니라 **「얼마 썼나」 옆**이다. 일정 칸에는 일차마다
          「최소 ¥N」이 이미 붙어 있어서 계획을 세울 때 필요한 만큼은 거기서
          보인다.

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

        {/*
          쓴 돈 — 하루에 한 줄.

          분류도 결제수단도 없다. 「식비/교통/쇼핑」을 나누게 하는 순간 입력이
          서너 배가 되고, 그러면 여행 사흘째에 안 쓰게 된다. 나눠 적고 싶은
          사람에게는 전용 앱이 훨씬 낫다 — 거기서 이기려 들 이유가 없다.

          **위의 예상과 빼서 보여주지 않는다.** 예상에는 식비·교통비가 애초에
          빠져 있어서 실제가 큰 게 정상인데, 차액을 숫자로 띄우면 「예산을
          넘겼다」로 읽힌다. 있지도 않은 잘못을 만들어 내는 셈이다. 두 값을
          나란히만 두고 판단은 사용자에게 맡긴다.
        */}
        <Section title="쓴 돈" caption="하루에 한 번, 엔화로 적어 두세요">
          <RowGroup>
            {Array.from({ length: spendDays }, (_, i) => i + 1).map((day) => {
              const b = dayBudgets[day - 1];
              return (
                <Row
                  key={day}
                  leading={<IconCircle emoji="💴" tone={theme.surfaceStrong} />}
                  title={`${day}일차`}
                  subtitle={
                    b && b.counted > 0
                      ? `최소 예상 ¥${b.yen.toLocaleString('en-US')}`
                      : undefined
                  }
                  last={day === spendDays}
                  trailing=""
                  trailingSub={
                    <View style={styles.spendCell}>
                      <TextInput
                        value={spent[day] ? String(spent[day]) : ''}
                        onChangeText={(t) => setSpent(day, parseYen(t))}
                        placeholder="0"
                        placeholderTextColor={theme.textTertiary}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        accessibilityLabel={`${day}일차에 쓴 돈 (엔)`}
                        style={[
                          styles.spendInput,
                          {
                            color: theme.text,
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                      />
                      {spent[day] ? <KrwEstimate yen={spent[day]} /> : null}
                    </View>
                  }
                />
              );
            })}
          </RowGroup>

          {recordedDays > 0 ? (
            <Card style={styles.spentTotal}>
              <View style={styles.totalRow}>
                <Txt variant="display">¥{spentTotal.toLocaleString('en-US')}</Txt>
                <KrwEstimate yen={spentTotal} />
              </View>
              <Txt variant="caption" color="textTertiary" style={styles.totalNote}>
                {recordedDays}일치 적었어요
                {totalCaveat ? ' · 위의 「최소 이만큼」에는 식비·교통비가 없어서 이 값이 더 큰 게 보통이에요' : ''}
              </Txt>
            </Card>
          ) : null}
        </Section>
      </>
    );
  }
}

const styles = StyleSheet.create({
  /* 칸 고르기 줄. 첫 구역과 붙지 않게 아래를 띄운다 */
  paneChips: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
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
  /* 입력칸과 원화를 오른쪽 끝에 세로로 쌓는다 — 다른 줄의 값 자리와 같다 */
  spendCell: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  spendInput: {
    minWidth: 96,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    textAlign: 'right',
    fontSize: 15,
  },
  spentTotal: {
    marginTop: Spacing.four,
  },
});
