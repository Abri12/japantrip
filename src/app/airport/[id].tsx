import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, IconCircle, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { FARE_BASELINE, findAirport, hubForCity } from '@/data/airports';
import {
  ContactlessCard,
  HubPicker,
  OtherOptionCard,
  TransitCard,
} from '@/features/airport';
import { useTheme } from '@/hooks/use-theme';
import { useSelectedCity } from '@/lib/selected-city';

export default function AirportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const airport = findAirport(id);
  const theme = useTheme();
  const router = useRouter();
  const { city } = useSelectedCity();

  /* 고른 거점. 초기값을 `airport` 에서 읽지 않고 null 로 두는 이유는, 아래에
     「공항을 못 찾음」 이른 return 이 있어서다. 훅을 그 뒤로 내리면 렌더마다
     훅 개수가 달라진다. */
  const [hubId, setHubId] = useState<string | null>(null);

  if (!airport) {
    return (
      <Screen back backFallback="/airports" title="공항을 찾을 수 없어요">
        <Txt variant="body" color="textTertiary">
          잘못된 주소예요.
        </Txt>
      </Screen>
    );
  }

  /* 아직 안 골랐으면 **고른 도시**의 거점을 편다. 간사이공항은 오사카와
     교토가 같이 쓰는데 늘 난바가 먼저 열려서, 교토에 묵는 사람은 자기와
     상관없는 답(45분 970엔)을 먼저 보고 있었다. 도시를 모르면 첫 거점 —
     가장 많이 묵는 곳으로 떨어진다. */
  const hub = airport.hubs?.find((h) => h.id === hubId) ?? hubForCity(airport, city?.id);

  /*
   * 어느 거점에도 안 걸리는 노선.
   *
   * 나하의 렌터카 셔틀이 그렇다 — 시내가 아니라 렌터카 영업소로 간다. 거점
   * 목록에 억지로 끼워 넣으면 「고쿠사이도리 가는 법」인 척하게 되고, 그냥
   * 빼면 북부로 갈 사람이 셔틀이 있다는 걸 모른다. 그래서 따로 둔다.
   */
  const usedRouteIds = new Set(
    (airport.hubs ?? []).flatMap((h) => h.ways.map((w) => w.routeId)).filter(Boolean),
  );
  const orphanRoutes = airport.routes.filter((r) => !usedRouteIds.has(r.id));

  const routes = airport.routes;
  const hasApproxLastTrain = routes.some((r) => r.lastTrain?.confidence === 'approx');

  // 좌석 지정 노선이 있으면 귀국일에는 예약을 미리 하라고 알려야 한다.
  // 도착일에는 아무 때나 타면 되지만, 돌아가는 날은 놓칠 수 없는 시각이 있다.
  const hasReservedRoute = routes.some((r) => r.reserved);

  // 첫차가 확인된 노선만 추린다. 없는 노선을 「정보 없음」으로 줄 세우면,
  // 그 노선에 첫차가 없다는 뜻으로 읽힌다.
  const firstTrains = routes.flatMap((route) =>
    route.firstTrain ? [{ route, firstTrain: route.firstTrain }] : [],
  );

  return (
    <>
      {/* 헤더는 숨겨져 있고, 이 title 은 웹 브라우저 탭 제목으로만 쓰인다. */}
      <Stack.Screen options={{ title: `${airport.name} (${airport.code})` }} />
      <Screen
        back
        backFallback="/airports"
        title={airport.name}
        subtitle={`${airport.nameJa} · ${airport.city}`}>
        {/*
         * 목록은 **하나만** 둔다.
         *
         * 「어디까지 가세요」를 넣으면서 거점 칸과 노선 칸을 따로 뒀더니, 같은
         * 탈것이 한 화면에 두 번 나왔다. 위에서는 「JR 하루카 80분 ¥3,640」,
         * 아래에서는 「JR 하루카 50분 ¥3,110」. 기준점이 달라 둘 다 맞는 값인데,
         * 읽는 사람에게는 앱이 두 소리를 하는 것이었다. 생김새도 갈렸다 —
         * 한쪽에만 이모지가 있고 뱃지 규칙도 달랐다.
         *
         * 역할을 나누는 것만으로는 부족했다. 고르는 단위가 「노선」이 아니라
         * **「내 숙소까지 가는 한 가지 방법」**이라서, 카드도 그 단위여야 한다.
         * 거점을 고르면 거기까지 가는 방법이 카드로 늘어서고, 막차·정차역·
         * 타는 순서처럼 거점과 무관한 것은 그 카드 **안에** 들어간다.
         */}
        <Section
          title="시내 가는 방법"
          caption={
            airport.hubs
              ? '숙소가 어느 동네인지부터 고르세요'
              : hasApproxLastTrain
                ? '막차는 참고용이니 출발 전 재확인하세요'
                : undefined
          }>
          {airport.hubs && hub ? (
            <HubPicker
              hubs={airport.hubs}
              selected={hub}
              onSelect={setHubId}
              routes={airport.routes}
            />
          ) : (
            routes.map((route) => <TransitCard key={route.id} route={route} />)
          )}
        </Section>

        {orphanRoutes.length > 0 ? (
          <Section title="이 공항의 다른 노선" caption="시내 거점으로 가는 길은 아니에요">
            {orphanRoutes.map((route) => (
              <TransitCard key={route.id} route={route} />
            ))}
          </Section>
        ) : null}

        {/* 여기까지는 전부 「공항 → 시내」다. 그런데 여행은 공항에서 시작해
            공항에서 끝나고, 되돌릴 수 없는 쪽은 오히려 돌아가는 날이다 —
            비행기는 놓치면 그만이다. 그런데도 반대 방향을 다루는 자리가
            아예 없어서, 귀국일 아침에 이 화면을 열면 쓸 말이 없었다.

            방향별 데이터를 새로 지어내지는 않는다. 정차역·요금·소요시간을
            반대 방향 값인 척 뒤집어 보여주면 확인하지 않은 숫자를 확인한 것처럼
            말하는 셈이다. 대신 **확실히 아는 것만** 적는다 — 같은 노선이
            양방향으로 다닌다는 것, 열차를 고르는 기준은 행선지 표기라는 것,
            좌석 지정 노선은 미리 잡아야 한다는 것. 시각 계산은 이미 그 일을
            하는 화면(/departure)으로 보낸다. */}
        <Section title="공항 갈 때는" caption="귀국일에 시내에서 공항으로 가는 길이에요">
          <Card accent={theme.primary} style={styles.spaced}>
            <Txt variant="subtitle">같은 노선을 반대로 타면 돼요</Txt>
            <Txt variant="body" color="textSecondary" style={styles.reverseLine}>
              위 노선들은 양방향으로 다녀요. 시내에서 탈 때는 행선지가{' '}
              <Txt variant="bodyBold">{airport.nameJa}</Txt> 인 열차를 고르세요 — 승강장 전광판과
              열차 앞면에 이 글자가 떠요. 어느 역에서 탈 수 있는지는 위 노선 카드에 적힌
              정차역이 그대로예요.
            </Txt>
            {hasReservedRoute ? (
              <Txt variant="body" color="textSecondary" style={styles.reverseLine}>
                좌석을 지정하는 노선은 귀국일 아침에 자리가 없을 수 있어요. 전날 미리
                잡아두세요.
              </Txt>
            ) : null}
            {/* 첫차는 새벽 비행기를 타는 사람에게 가장 급한 값이다. 「05:15」만
                적으면 어디서 타는 기준인지 알 수 없어 자기 숙소와 못 맞춰보므로
                역 이름을 함께 적는다. */}
            {firstTrains.length > 0 ? (
              <View style={styles.reverseFirst}>
                <Txt variant="bodyBold">시내에서 타는 첫차</Txt>
                {firstTrains.map(({ route, firstTrain }) => (
                  <Txt
                    key={route.id}
                    variant="body"
                    color="textSecondary"
                    style={styles.reverseLine}>
                    {route.name} · {firstTrain.from} {firstTrain.confidence === 'approx' ? '약 ' : ''}
                    {firstTrain.time} 출발
                  </Txt>
                ))}
                <Txt variant="caption" color="textTertiary" style={styles.reverseLine}>
                  평일 기준이에요. 이보다 일찍 나서야 하면 공항버스나 택시를 알아보세요.
                </Txt>
              </View>
            ) : null}

            <Txt variant="caption" color="textTertiary" style={styles.reverseNote}>
              소요시간은 방향이 반대여도 비슷하지만, 출퇴근 시간대에는 더 걸릴 수 있어요.
            </Txt>
          </Card>
          <RowGroup>
            <Row
              leading={<IconCircle emoji="🛫" tone={theme.primarySoft} />}
              title="몇 시에 숙소를 나서야 하나요"
              subtitle="비행기 시각에서 얼마나 거꾸로 세면 되는지 알려드려요"
              chevron
              last
              onPress={() => router.push('/departure')}
            />
          </RowGroup>
        </Section>

        {/* 컨택리스는 「몰라서 못 쓰는」 대표적인 것이다. 카드에 ))) 표시만
            있으면 충전도 보증금도 없이 바로 타는데, 대부분 IC카드를 사러 줄을
            선다. 그래서 노선을 고르는 화면 바로 아래에 둔다 — 표를 사기 전에
            봐야 의미가 있다. */}
        {airport.contactless ? (
          <Section title="컨택리스 카드 사용법" caption="가진 카드로 그냥 타는 방법이에요">
            <ContactlessCard info={airport.contactless} />
          </Section>
        ) : null}

        {airport.otherOptions?.length ? (
          <Section title="다른 방법도 있어요" caption="시간표에 없는 대안이에요">
            {airport.otherOptions.map((opt) => (
              <OtherOptionCard key={opt.id} option={opt} />
            ))}
          </Section>
        ) : null}

        <Section title="이 공항에서 조심할 점">
          {airport.tips.map((tip, i) => (
            <Card
              key={i}
              style={i < airport.tips.length - 1 ? styles.spaced : undefined}
              accent={tip.startsWith('⚠️') ? theme.warning : undefined}>
              <Txt variant="body" color="textSecondary">
                {tip}
              </Txt>
            </Card>
          ))}
        </Section>

        <Txt variant="caption" color="textTertiary">
          요금과 소요시간은 {FARE_BASELINE}이에요. 시기나 구간에 따라 달라질 수 있어요.
          원화 환산은 실시간 환율을 반영한 참고용이에요.
        </Txt>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  spaced: {
    marginBottom: Spacing.three,
  },
  reverseLine: {
    marginTop: Spacing.two,
  },
  reverseFirst: {
    marginTop: Spacing.four,
  },
  reverseNote: {
    marginTop: Spacing.three,
  },
});
