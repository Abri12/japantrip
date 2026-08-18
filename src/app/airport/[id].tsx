import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import {
  Badge,
  Card,
  ContactlessMark,
  IconCircle,
  KrwEstimate,
  Row,
  RowGroup,
  Screen,
  Section,
  Txt,
} from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import {
  CONTACTLESS_HOWTO,
  ContactlessInfo,
  FARE_BASELINE,
  OtherOption,
  RouteStep,
  RouteStop,
  RouteType,
  TransitRoute,
  findAirport,
} from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';
import { formatWonRangeApprox, useFxRate, yenToWon } from '@/lib/fx';
import { LastTrainState, lastTrainState } from '@/lib/last-train';

const ROUTE_EMOJI: Record<RouteType, string> = {
  train: '🚃',
  monorail: '🚝',
  bus: '🚌',
  taxi: '🚕',
};

const OTHER_EMOJI: Record<OtherOption['type'], string> = {
  taxi: '🚕',
  rentalcar: '🚗',
};

export default function AirportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const airport = findAirport(id);
  const theme = useTheme();
  const router = useRouter();

  if (!airport) {
    return (
      <Screen back backFallback="/airports" title="공항을 찾을 수 없어요">
        <Txt variant="body" color="textTertiary">
          잘못된 주소예요.
        </Txt>
      </Screen>
    );
  }

  // 추천을 맨 위에, 나머지는 빠른 순으로. 초행자는 첫 항목을 고르는 경우가 많다.
  const routes = [...airport.routes].sort((a, b) => {
    if (!!a.recommended !== !!b.recommended) return a.recommended ? -1 : 1;
    return a.minutes - b.minutes;
  });

  const fastest = Math.min(...routes.map((r) => r.minutes));
  const cheapest = Math.min(...routes.filter((r) => r.yen > 0).map((r) => r.yen));

  const hasApproxLastTrain = routes.some((r) => r.lastTrain?.confidence === 'approx');

  // 좌석 지정 노선이 있으면 귀국일에는 예약을 미리 하라고 알려야 한다.
  // 도착일에는 아무 때나 타면 되지만, 돌아가는 날은 놓칠 수 없는 시각이 있다.
  const hasReservedRoute = routes.some((r) => r.reserved);

  return (
    <>
      {/* 헤더는 숨겨져 있고, 이 title 은 웹 브라우저 탭 제목으로만 쓰인다. */}
      <Stack.Screen options={{ title: `${airport.name} (${airport.code})` }} />
      <Screen
        back
        backFallback="/airports"
        title={airport.name}
        subtitle={`${airport.nameJa} · ${airport.city}`}>
        <Section
          title="시내 가는 방법"
          caption={
            hasApproxLastTrain
              ? `${routes.length}개 노선 · ${FARE_BASELINE} · 막차 시간은 참고용, 출발 전 재확인하세요`
              : `${routes.length}개 노선 · ${FARE_BASELINE}`
          }>
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              isFastest={route.minutes === fastest}
              isCheapest={route.yen === cheapest}
            />
          ))}
        </Section>

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
            <Txt variant="caption" color="textTertiary" style={styles.reverseNote}>
              소요시간은 방향이 반대여도 비슷하지만, 출퇴근 시간대에는 더 걸릴 수 있어요.
            </Txt>
          </Card>
          <RowGroup>
            <Row
              leading={<IconCircle emoji="🛫" tone={theme.primarySoft} />}
              title="몇 시에 숙소를 나서야 하나요"
              subtitle="비행기 시각을 고르면 계산해 드려요"
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
          요금과 소요시간은 {FARE_BASELINE} 기준이에요. 시기나 구간에 따라 달라질 수 있어요.
          원화 환산은 실시간 환율을 반영한 참고용이에요.
        </Txt>
      </Screen>
    </>
  );
}

/**
 * 막차 정보. 1분마다 다시 계산한다.
 *
 * 시간이 넉넉히 남았을 때(status: normal)도 **막차 자체는 항상 보여야 한다.**
 * 색깔 뱃지만 조건부로 띄우고 평소엔 아무것도 안 보이면, 사용자는 이 노선에
 * 막차가 있다는 사실조차 알 길이 없다. 그래서 시간 표시는 항상 그리고,
 * 임박·종료일 때만 눈에 띄는 뱃지를 추가로 얹는다.
 */
function LastTrainInfo({ lastTrain }: { lastTrain: NonNullable<TransitRoute['lastTrain']> }) {
  const [state, setState] = useState<LastTrainState>(() => lastTrainState(lastTrain));

  useEffect(() => {
    const timer = setInterval(() => setState(lastTrainState(lastTrain)), 60_000);
    return () => clearInterval(timer);
  }, [lastTrain]);

  const prefix = lastTrain.confidence === 'approx' ? '약 ' : '';

  if (state.status === 'gone') {
    return <Badge label={`운행 종료 · 막차 ${prefix}${lastTrain.time}`} tone="danger" />;
  }
  if (state.status === 'soon') {
    return <Badge label={`막차 ${prefix}${lastTrain.time} 임박`} tone="warning" />;
  }
  return (
    <Txt variant="caption" color="textTertiary">
      막차 {prefix}
      {lastTrain.time}
    </Txt>
  );
}

function RouteCard({
  route,
  isFastest,
  isCheapest,
}: {
  route: TransitRoute;
  isFastest: boolean;
  isCheapest: boolean;
}) {
  const theme = useTheme();
  const isGone = route.lastTrain ? lastTrainState(route.lastTrain).status === 'gone' : false;

  return (
    <Card
      style={[styles.spaced, isGone && styles.dimmed]}
      accent={route.recommended ? theme.primary : undefined}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Txt variant="subtitle">
            {ROUTE_EMOJI[route.type]} {route.name}
          </Txt>
          <Txt variant="caption" color="textTertiary" style={styles.ja}>
            {route.nameJa}
          </Txt>
        </View>
        {route.lastTrain ? <LastTrainInfo lastTrain={route.lastTrain} /> : null}
      </View>

      <View style={styles.badgeRow}>
        {route.recommended ? <Badge label="추천" tone="primary" /> : null}
        {isFastest ? <Badge label="가장 빠름" tone="success" /> : null}
        {isCheapest ? <Badge label="가장 저렴" tone="success" /> : null}
        {route.reserved ? <Badge label="좌석지정" tone="neutral" /> : null}
      </View>

      {/* 소요시간과 요금을 나란히. 이 두 숫자가 선택의 거의 전부다. */}
      <View style={[styles.metrics, { backgroundColor: theme.background }]}>
        <View style={styles.metric}>
          <Txt variant="caption" color="textTertiary">
            소요시간
          </Txt>
          <Txt variant="numeric">
            {route.minutes}
            <Txt variant="body" color="textTertiary">
              분
            </Txt>
          </Txt>
        </View>
        <View style={[styles.vline, { backgroundColor: theme.border }]} />
        <View style={styles.metric}>
          <Txt variant="caption" color="textTertiary">
            요금
          </Txt>
          <Txt variant="numeric">
            {route.yen === 0 ? '무료' : `¥${route.yen.toLocaleString()}`}
          </Txt>
          {route.yen > 0 ? <KrwEstimate yen={route.yen} /> : null}
        </View>
      </View>

      {/* 행선지는 열차 전면과 전광판에서 그대로 읽는 값이라 원문을 같이 준다.
          한국어만 있으면 눈앞의 글자와 대조할 수가 없다. */}
      <Txt variant="caption" color="textSecondary" style={styles.dest}>
        도착 · {route.destination}
        {route.destinationJa ? ` (${route.destinationJa})` : ''}
      </Txt>

      {/* 종점만 보여주면 숙소가 그 역인 사람만 쓸 수 있다. 서는 역을 다 보여줘야
          자기 숙소와 맞춰보고 노선을 고를 수 있다. */}
      {route.stops?.length ? (
        <RouteStops stops={route.stops} complete={route.stopsComplete} />
      ) : null}

      {route.note ? (
        <Txt variant="body" color="textSecondary" style={styles.note}>
          {route.note}
        </Txt>
      ) : null}

      {/* 예약이 되는 노선은 그 사실 자체가 잘 안 알려져 있다. 창구에서 두 장
          따로 사는 것보다 싼 경우가 많아서, 순서보다 먼저 눈에 띄어야 한다. */}
      {route.booking ? (
        <Pressable onPress={() => Linking.openURL(route.booking!.url)}>
          <View style={[styles.bookingBox, { backgroundColor: theme.primarySoft }]}>
            <Txt variant="bodyBold" tint={theme.primary}>
              🎟 {route.booking.name} 미리 사두기 →
            </Txt>
            <Txt variant="caption" color="textSecondary" style={styles.stepMeta}>
              {route.booking.note}
            </Txt>
            <Txt variant="caption" color="textTertiary" style={styles.stepMeta}>
              {route.booking.window}
            </Txt>
          </View>
        </Pressable>
      ) : null}

      {route.steps?.length ? <RouteSteps steps={route.steps} /> : null}
    </Card>
  );
}

/**
 * 타는 순서 — 접었다 펴는 흐름도.
 *
 * 기본으로 접어 둔다. 노선이 다섯 개인 화면에서 순서까지 전부 펼쳐져 있으면
 * 정작 **어느 노선을 탈지** 고르는 일이 어려워진다. 고르고 나서 펼치는 게
 * 실제 순서다.
 *
 * 각 단계에 일본어 표지판 문구를 같이 둔다. 공항에서 눈에 들어오는 건 한국어
 * 설명이 아니라 표지판이라, 그대로 대조할 수 있어야 길을 찾는다.
 */
function RouteSteps({
  steps,
  alwaysOpen,
}: {
  steps: RouteStep[];
  /** 이미 펼쳐진 카드 안에서 쓸 때 — 접기 버튼 없이 순서만 그린다 */
  alwaysOpen?: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const shown = alwaysOpen || open;

  return (
    <View style={styles.stepsWrap}>
      {alwaysOpen ? null : (
        <Pressable onPress={() => setOpen((v) => !v)}>
          <View style={[styles.stepsToggle, { backgroundColor: theme.primarySoft }]}>
            <Txt variant="label" tint={theme.primary}>
              {open ? '순서 접기' : `타는 순서 ${steps.length}단계 보기`} {open ? '⌃' : '⌄'}
            </Txt>
          </View>
        </Pressable>
      )}

      {shown ? (
        <View style={styles.steps}>
          {steps.map((step, i) => (
            <View key={i} style={styles.step}>
              {/* 번호와 세로선으로 흐름을 만든다. 마지막 단계는 선을 그리지
                  않아야 다음에 뭔가 더 있는 것처럼 보이지 않는다. */}
              <View style={styles.stepRail}>
                <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                  <Txt variant="label" tint={theme.onPrimary}>
                    {i + 1}
                  </Txt>
                </View>
                {i < steps.length - 1 ? (
                  <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
                ) : null}
              </View>

              <View style={styles.stepBody}>
                <Txt variant="bodyBold">{step.action}</Txt>
                {/* 「지금 몇 층에서 어느 쪽으로」가 실제로 발을 움직이게 한다.
                    할 일만 적혀 있으면 초행자는 그 자리에서 두리번거린다. */}
                {step.where ? (
                  <Txt variant="body" color="textSecondary" style={styles.stepMeta}>
                    📍 {step.where}
                  </Txt>
                ) : null}
                {/* 「이 표시」라고만 적으면 카드에서 뭘 찾아야 하는지 모른다.
                    실제 모양을 바로 아래 그려 둬야 대조가 된다. */}
                {step.icon === 'contactless' ? (
                  <View style={styles.stepIcon}>
                    <ContactlessMark size={44} />
                  </View>
                ) : null}
                {step.signJa ? (
                  <View style={[styles.signBox, { backgroundColor: theme.surfaceStrong }]}>
                    <Txt variant="caption" color="textSecondary">
                      표지판 · {step.signJa}
                    </Txt>
                  </View>
                ) : null}
                {step.minutes ? (
                  <Txt variant="caption" color="textTertiary" style={styles.stepMeta}>
                    약 {step.minutes}분
                  </Txt>
                ) : null}
                {step.cost ? (
                  <View style={[styles.costBox, { backgroundColor: theme.primarySoft }]}>
                    <Txt variant="caption" tint={theme.primary}>
                      💴 {step.cost}
                    </Txt>
                  </View>
                ) : null}
                {step.caution ? (
                  <Txt variant="caption" tint={theme.warning} style={styles.stepMeta}>
                    ⚠ {step.caution}
                  </Txt>
                ) : null}
                {/* 「틀리면 어떻게 되지」가 초행자를 가장 붙잡아 둔다. 되돌릴 수
                    있다는 걸 미리 알려주면 확신이 없어도 일단 움직이게 된다. */}
                {step.recover ? (
                  <Txt variant="caption" tint={theme.success} style={styles.stepMeta}>
                    ↩ {step.recover}
                  </Txt>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * 시내 정차역 — 접었다 펴는 목록.
 *
 * 접혀 있을 때도 역 이름은 한 줄로 보여준다. 「내 숙소 근처에 서나」는 노선을
 * 고르는 기준이라, 펼치기 전에 눈에 들어와야 판단이 된다. 펼치면 각 역에서
 * 무엇으로 갈아타는지가 나온다.
 */
function RouteStops({ stops, complete }: { stops: RouteStop[]; complete?: boolean }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  /*
   * 개수를 단정하는 건 전체 목록일 때만 한다.
   *
   * 공항급행은 12개역에 서는데 여행자에게 쓸모 있는 7곳만 담았다. 그런데
   * 「서는 역 7곳」이라고 적어 두면 딱 그만큼만 선다는 뜻이 되어 사실이 틀린다.
   * 라피트는 공식 FAQ 가 8개역이라고 못 박아서 전부 나열할 수 있다.
   */
  const label = complete ? `서는 역 ${stops.length}곳` : '주요 역';

  return (
    <View style={styles.stopsWrap}>
      <Pressable onPress={() => setOpen((v) => !v)}>
        <View style={[styles.stopsBar, { backgroundColor: theme.background }]}>
          <Txt variant="caption" color="textTertiary">
            {label} {open ? '⌃' : '⌄'}
          </Txt>
          {!open ? (
            <Txt variant="caption" color="textSecondary" style={styles.stopsPreview}>
              {stops.map((x) => x.name).join(' · ')}
            </Txt>
          ) : null}
        </View>
      </Pressable>

      {open ? (
        <View style={styles.stopList}>
          {stops.map((stop, i) => (
            <View key={stop.nameJa} style={styles.stopRow}>
              <View style={styles.stopRail}>
                <View style={[styles.stopDot, { backgroundColor: theme.primary }]} />
                {i < stops.length - 1 ? (
                  <View style={[styles.stopLine, { backgroundColor: theme.border }]} />
                ) : null}
              </View>
              <View style={styles.stopBody}>
                <Txt variant="bodyBold">
                  {stop.name} ({stop.nameJa})
                </Txt>
                {stop.transfer ? (
                  <Txt variant="caption" color="textSecondary" style={styles.stopMeta}>
                    {stop.transfer}
                  </Txt>
                ) : null}
              </View>
            </View>
          ))}

          {/* 골라 담은 목록이면 그 사실을 끝에 적는다. 안 적으면 펼쳐 본 사람은
              이게 전부라고 믿고, 목록에 없는 역에서 내릴 생각을 못 한다. */}
          {complete ? null : (
            <Txt variant="caption" color="textTertiary" style={styles.stopNote}>
              이 밖에도 몇 개 역에 더 서요. 갈아타거나 걸어갈 만한 곳만 골랐어요.
            </Txt>
          )}
        </View>
      ) : null}
    </View>
  );
}

/**
 * 컨택리스 안내 — 눌러서 펼치는 카드.
 *
 * 접혀 있을 때도 **어디서 되는지**는 보여준다. 완전히 닫아 두면 이 기능이
 * 있다는 것조차 모르고 지나간다. 펼치면 쓰는 법과 안 되는 곳이 나온다.
 *
 * 「안 되는 곳」을 되는 곳만큼 크게 다룬다. 「일본은 이제 카드로 탄다」고만
 * 알고 가면 JR 개찰구 앞에서 줄을 다시 서게 된다.
 */
function ContactlessCard({ info }: { info: ContactlessInfo }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Card accent={theme.primary}>
      <Pressable onPress={() => setOpen((v) => !v)}>
        <View style={styles.head}>
          <View style={styles.contactlessHead}>
            <ContactlessMark size={40} />
            <View style={styles.flex}>
              <Txt variant="subtitle">카드만 대면 바로 타요</Txt>
              <Txt variant="caption" color="textTertiary" style={styles.ja}>
                충전도 보증금도 필요 없어요
              </Txt>
            </View>
          </View>
          <Txt variant="body" color="textTertiary">
            {open ? '⌃' : '⌄'}
          </Txt>
        </View>
      </Pressable>

      {/* 접혀 있어도 되는 노선 이름은 보인다 */}
      <View style={styles.badgeRow}>
        {info.supported.map((s) => (
          <Badge key={s.name} label={s.name} tone="success" />
        ))}
        {info.unsupported.length > 0 && !open ? (
          <Badge label={`안 되는 곳 ${info.unsupported.length}`} tone="warning" />
        ) : null}
      </View>

      {open ? (
        <View style={styles.contactlessBody}>
          {info.supported.some((s) => s.perk) ? (
            <View style={styles.contactlessGroup}>
              {info.supported
                .filter((s) => s.perk)
                .map((s) => (
                  <View
                    key={s.name}
                    style={[styles.perkBox, { backgroundColor: theme.successSoft }]}>
                    <Txt variant="bodyBold" tint={theme.success}>
                      {s.name}
                    </Txt>
                    <Txt variant="caption" color="textSecondary" style={styles.stepMeta}>
                      {s.perk}
                    </Txt>
                  </View>
                ))}
            </View>
          ) : null}

          <Txt variant="bodyBold" style={styles.contactlessHeading}>
            쓰는 법
          </Txt>
          <RouteSteps steps={CONTACTLESS_HOWTO} alwaysOpen />

          {info.unsupported.length > 0 ? (
            <>
              <Txt variant="bodyBold" style={styles.contactlessHeading}>
                여기선 안 돼요
              </Txt>
              {info.unsupported.map((u) => (
                <View
                  key={u.name}
                  style={[styles.perkBox, { backgroundColor: theme.warningSoft }]}>
                  <Txt variant="bodyBold" tint={theme.warning}>
                    {u.name}
                  </Txt>
                  <Txt variant="caption" color="textSecondary" style={styles.stepMeta}>
                    {u.reason}
                  </Txt>
                </View>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function OtherOptionCard({ option }: { option: OtherOption }) {
  const theme = useTheme();
  const rate = useFxRate();

  const lowWon = yenToWon(option.yenLow, rate);
  const highWon = yenToWon(option.yenHigh, rate);

  return (
    <Card style={styles.spaced}>
      <Txt variant="subtitle">
        {OTHER_EMOJI[option.type]} {option.name}
      </Txt>

      <View style={[styles.metrics, { backgroundColor: theme.background }]}>
        {option.minutes ? (
          <>
            <View style={styles.metric}>
              <Txt variant="caption" color="textTertiary">
                소요시간
              </Txt>
              <Txt variant="numeric">
                {option.minutes}
                <Txt variant="body" color="textTertiary">
                  분
                </Txt>
              </Txt>
            </View>
            <View style={[styles.vline, { backgroundColor: theme.border }]} />
          </>
        ) : null}
        <View style={styles.metric}>
          <Txt variant="caption" color="textTertiary">
            요금 · {option.unit}
          </Txt>
          <Txt variant="numeric">
            ¥{option.yenLow.toLocaleString()}~{option.yenHigh.toLocaleString()}
          </Txt>
          {lowWon !== null && highWon !== null ? (
            <Txt variant="caption" color="textTertiary">
              ({formatWonRangeApprox(lowWon, highWon)})
            </Txt>
          ) : null}
        </View>
      </View>

      <Txt variant="body" color="textSecondary" style={styles.note}>
        {option.note}
      </Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  stepsWrap: {
    marginTop: Spacing.four,
  },
  stepsToggle: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
  },
  steps: {
    marginTop: Spacing.four,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stepRail: {
    alignItems: 'center',
    width: 24,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: Spacing.one,
  },
  stepBody: {
    flex: 1,
    // 마지막 단계 아래는 여백이 남지 않게 아래쪽에만 간격을 준다.
    paddingBottom: Spacing.four,
  },
  signBox: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
  },
  stopsWrap: {
    marginTop: Spacing.three,
  },
  stopsBar: {
    padding: Spacing.three,
    borderRadius: Radius.sm,
  },
  stopsPreview: {
    marginTop: Spacing.one,
  },
  stopList: {
    marginTop: Spacing.three,
  },
  stopRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stopRail: {
    alignItems: 'center',
    width: 10,
    paddingTop: Spacing.one,
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stopLine: {
    width: 2,
    flex: 1,
    marginVertical: Spacing.half,
  },
  stopBody: {
    flex: 1,
    paddingBottom: Spacing.three,
  },
  stopNote: {
    marginTop: Spacing.two,
  },
  stopMeta: {
    marginTop: Spacing.half,
  },
  stepMeta: {
    marginTop: Spacing.two,
  },
  costBox: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
  },
  bookingBox: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.md,
  },
  contactlessBody: {
    marginTop: Spacing.four,
  },
  contactlessGroup: {
    marginBottom: Spacing.two,
  },
  contactlessHeading: {
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  contactlessHead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepIcon: {
    marginTop: Spacing.two,
  },
  perkBox: {
    padding: Spacing.three,
    borderRadius: Radius.sm,
    marginBottom: Spacing.two,
  },
  flex: { flex: 1 },
  reverseLine: {
    marginTop: Spacing.two,
  },
  reverseNote: {
    marginTop: Spacing.three,
  },
  spaced: {
    marginBottom: Spacing.three,
  },
  dimmed: {
    opacity: 0.5,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  ja: {
    marginTop: Spacing.half,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.four,
    marginTop: Spacing.three,
  },
  metric: {
    flex: 1,
    gap: Spacing.half,
  },
  vline: {
    width: 1,
    height: 32,
    marginHorizontal: Spacing.four,
  },
  dest: {
    marginTop: Spacing.three,
  },
  note: {
    marginTop: Spacing.two,
  },
});
