import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import {
  Badge,
  Card,
  Chip,
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
  CityHub,
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

  // 추천을 맨 위에, 나머지는 빠른 순으로. 초행자는 첫 항목을 고르는 경우가 많다.
  const routes = [...airport.routes].sort((a, b) => {
    if (!!a.recommended !== !!b.recommended) return a.recommended ? -1 : 1;
    return a.minutes - b.minutes;
  });

  // 아무것도 안 골랐으면 첫 거점 — 가장 많이 묵는 곳이 먼저 열린다.
  const hub = airport.hubs?.find((h) => h.id === hubId) ?? airport.hubs?.[0];

  const fastest = Math.min(...routes.map((r) => r.minutes));
  const cheapest = Math.min(...routes.filter((r) => r.yen > 0).map((r) => r.yen));

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
        <Section
          title="시내 가는 방법"
          caption={
            hasApproxLastTrain
              ? `${routes.length}개 노선 · ${FARE_BASELINE} · 막차 시간은 참고용, 출발 전 재확인하세요`
              : `${routes.length}개 노선 · ${FARE_BASELINE}`
          }>
          {/* 노선을 먼저 나열하는 건 공항 쪽에서 본 그림이다. 여행자가 들고
              있는 건 숙소 주소 하나라, 「어디까지 가세요」를 먼저 묻고 노선을
              역산해 주는 편이 답에 가깝다. 노선 카드는 그 아래 그대로 둔다 —
              막차·타는 순서처럼 거점과 무관한 정보가 거기 있다. */}
          {airport.hubs && hub ? (
            <HubPicker
              hubs={airport.hubs}
              selected={hub}
              onSelect={setHubId}
            />
          ) : null}

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

/**
 * 「어디까지 가세요」 — 거점을 고르면 그 거점까지 가는 법만 보여준다.
 *
 * 거점 이름을 칩으로 늘어놓는다. 드롭다운으로 접으면 어떤 선택지가 있는지
 * 자체가 안 보여서, 자기 숙소가 어느 거점에 드는지 모르는 사람이 못 고른다.
 */
function HubPicker({
  hubs,
  selected,
  onSelect,
}: {
  hubs: CityHub[];
  selected: CityHub;
  onSelect: (id: string) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.hubBlock}>
      <Txt variant="bodyBold">어디까지 가세요?</Txt>
      <View style={styles.hubChips}>
        {hubs.map((hub) => (
          <Chip
            key={hub.id}
            label={hub.name}
            active={hub.id === selected.id}
            onPress={() => onSelect(hub.id)}
          />
        ))}
      </View>

      <Card accent={theme.primary}>
        <Txt variant="caption" color="textTertiary">
          {selected.nameJa} · {selected.blurb}
        </Txt>
        {selected.ways.map((way, i) => (
          <View
            key={i}
            style={[
              styles.hubWay,
              i > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
            ]}>
            <View style={styles.head}>
              <Txt variant="subtitle" style={styles.flex}>
                {way.label}
              </Txt>
              {way.recommended ? <Badge label="추천" tone="primary" /> : null}
            </View>

            <View style={styles.hubNumbers}>
              <Txt variant="bodyBold">{way.minutes}분</Txt>
              <Txt variant="body" color="textTertiary">
                ·
              </Txt>
              <Txt variant="bodyBold">¥{way.yen.toLocaleString()}</Txt>
              <KrwEstimate yen={way.yen} />
              <Txt variant="body" color="textTertiary">
                ·
              </Txt>
              {/* 환승 횟수가 값·시간만큼 중요하다. 짐을 들고 계단을 오르내리는
                  횟수라서, 20분 빠른 길보다 직통을 고르는 사람이 많다. */}
              <Txt variant="body" color="textSecondary">
                {way.transfers === 0 ? '직통' : `환승 ${way.transfers}회`}
              </Txt>
            </View>

            {way.note ? (
              <Txt variant="caption" color="textSecondary" style={styles.hubNote}>
                {way.note}
              </Txt>
            ) : null}
          </View>
        ))}
      </Card>
    </View>
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
/**
 * 타는 순서.
 *
 * ── 왜 간략·자세히로 나눴나 ──────────────────────────
 *
 * 단계마다 위치·표지판·요금·주의·복구 방법이 다 붙어 있어서, 10단계짜리 노선은
 * 펼치는 순간 화면이 글로 가득 찼다. 「번잡해서 못 보겠다」는 말이 그 얘기였다.
 *
 * 그렇다고 설명을 줄일 수는 없다. 이 화면은 **처음 가는 사람이 인터넷 없이**
 * 보는 것이라, 현장에서 필요한 건 오히려 그 세부다. 줄이면 정작 필요할 때
 * 찾을 곳이 없어진다.
 *
 * 그래서 지우는 대신 **두 가지 읽는 방식**을 뒀다.
 *
 * - **간략히** — **갈림길만.** 「1층엔 역이 없으니 2층으로」, 「JR 말고 난카이
 *   개찰구로」처럼 모르면 틀리는 지점만 남긴다(`step.key`). 사이의 걷는 구간은
 *   눈앞에 길이 하나뿐이라 안 적어도 알아서 간다.
 * - **자세히** — 위치·표지판·요금·복구 방법까지. 「지금 이 자리에서 무엇을
 *   봐야 하는지」를 묻는 순간에 켠다.
 *
 * 둘 다 이미 받아 둔 것이라 **전환에 인터넷이 필요 없다.** 자세히가 서버에서
 * 더 받아오는 방식이었다면 정작 필요한 현장에서 못 열렸을 것이다.
 *
 * ── 다만 경고는 접지 않는다 ─────────────────────────
 *
 * `caution` 은 간략히에서도 그대로 보인다. 나머지는 몰라도 헤매기만 하지만
 * 경고는 모르면 **틀린 열차를 탄다.** 화면을 줄이자고 위험을 숨기는 건
 * 다른 종류의 결정이다.
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
  const [detailed, setDetailed] = useState(false);
  const shown = alwaysOpen || open;
  // 컨택리스 사용법처럼 이미 펼쳐 둔 짧은 순서는 나눌 것이 없다.
  const detail = alwaysOpen || detailed;

  /*
   * 간략히에서 무엇을 그릴지.
   *
   * 갈림길을 아직 고르지 않은 노선은 전부 그린다. 표시가 없다고 화면이 텅 비면
   * 그 노선만 순서가 없는 것처럼 보인다.
   *
   * 번호는 보이는 것만 1부터 다시 센다.
   *
   * 처음에는 원래 번호를 그대로 써서 2 · 4 · 7 · 9 로 나갔다. 「빈 번호가
   * 곧 걷기만 하는 구간」이라는 뜻이라고 봤는데, 실제로는 **번호가 깨진
   * 것처럼** 읽혔다. 화면에 1부터 세지 않는 목록이 있으면 사람은 먼저
   * 고장을 의심하지, 숨은 뜻을 찾지 않는다.
   *
   * 몇 개 중 몇 개인지는 바로 아래 안내 줄이 말해 주므로, 번호까지 그 일을
   * 맡을 필요가 없다.
   */
  const keyOnly = steps.filter((step) => step.key);
  const visible = detail || keyOnly.length === 0 ? steps : keyOnly;

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

      {shown && !alwaysOpen ? (
        <View style={styles.stepsModes}>
          <Chip label="간략히" active={!detailed} onPress={() => setDetailed(false)} />
          <Chip label="자세히" active={detailed} onPress={() => setDetailed(true)} />
        </View>
      ) : null}

      {/* 몇 개 중 몇 개를 보고 있는지는 여기서만 말한다. 번호가 대신
          말하게 했더니 번호가 깨진 것처럼 읽혔다. */}
      {shown && !alwaysOpen && !detailed && keyOnly.length > 0 ? (
        <Txt variant="caption" color="textTertiary" style={styles.stepsHint}>
          헷갈리기 쉬운 {keyOnly.length}단계만 보여드려요. 사이는 걷기만 하면 돼요 · 전체{' '}
          {steps.length}단계는 「자세히」에서
        </Txt>
      ) : null}

      {shown ? (
        <View style={styles.steps}>
          {visible.map((step, i) => (
            <View key={i} style={styles.step}>
              {/* 번호와 세로선으로 흐름을 만든다. 마지막 단계는 선을 그리지
                  않아야 다음에 뭔가 더 있는 것처럼 보이지 않는다. */}
              <View style={styles.stepRail}>
                <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                  <Txt variant="label" tint={theme.onPrimary}>
                    {i + 1}
                  </Txt>
                </View>
                {i < visible.length - 1 ? (
                  <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
                ) : null}
              </View>

              <View style={styles.stepBody}>
                <Txt variant="bodyBold">{step.action}</Txt>
                {/* 「지금 몇 층에서 어느 쪽으로」가 실제로 발을 움직이게 한다.
                    할 일만 적혀 있으면 초행자는 그 자리에서 두리번거린다. */}
                {detail && step.where ? (
                  <Txt variant="body" color="textSecondary" style={styles.stepMeta}>
                    📍 {step.where}
                  </Txt>
                ) : null}
                {/* 「이 표시」라고만 적으면 카드에서 뭘 찾아야 하는지 모른다.
                    실제 모양을 바로 아래 그려 둬야 대조가 된다. */}
                {detail && step.icon === 'contactless' ? (
                  <View style={styles.stepIcon}>
                    <ContactlessMark size={44} />
                  </View>
                ) : null}
                {detail && step.signJa ? (
                  <View style={[styles.signBox, { backgroundColor: theme.surfaceStrong }]}>
                    <Txt variant="caption" color="textSecondary">
                      표지판 · {step.signJa}
                    </Txt>
                  </View>
                ) : null}
                {detail && step.minutes ? (
                  <Txt variant="caption" color="textTertiary" style={styles.stepMeta}>
                    약 {step.minutes}분
                  </Txt>
                ) : null}
                {detail && step.cost ? (
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
                {detail && step.recover ? (
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
  /** 간략히 · 자세히 고르는 줄 */
  stepsModes: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  stepsHint: {
    marginTop: Spacing.two,
  },
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
  reverseFirst: {
    marginTop: Spacing.four,
  },
  reverseNote: {
    marginTop: Spacing.three,
  },
  hubBlock: {
    marginBottom: Spacing.five,
    gap: Spacing.three,
  },
  hubChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  hubWay: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
  },
  hubNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  hubNote: {
    marginTop: Spacing.two,
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
