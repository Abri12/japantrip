import { Linking, Pressable, View } from 'react-native';

import { Badge, Card, Txt } from '@/components/ui';
import { HubWay, TransitRoute } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';
import { lastTrainState } from '@/lib/last-train';

import { ROUTE_EMOJI } from './constants';
import { LastTrainInfo } from './last-train-info';
import { Metrics } from './metrics';
import { RouteSteps } from './route-steps';
import { RouteStops } from './route-stops';
import { styles } from './styles';

/**
 * 「이걸 타면 된다」 카드 — 이 화면에 카드는 이 한 종류뿐이다.
 *
 * 예전에는 거점용 카드와 노선용 카드가 따로 있었다. 같은 탈것이 한 화면에 두
 * 번 나오고, 숫자도 생김새도 갈렸다. 고르는 단위는 **「내 숙소까지 가는 한 가지
 * 방법」**이지 「노선」이 아니라서, 카드도 그 단위여야 한다.
 *
 * 그래서 둘을 합쳤다. `way` 가 있으면 **그 거점까지의 답**이고(제목·시간·요금·
 * 환승이 거기서 온다), `route` 는 어느 거점을 골라도 달라지지 않는 것을 채운다 —
 * 이모지, 일본어 원표기, 막차, 행선지, 서는 역, 예약, 타는 순서.
 *
 * `way` 없이 `route` 만 오는 경우도 있다. 거점이 아직 없는 공항, 그리고 나하의
 * 렌터카 셔틀처럼 시내로 가지 않는 노선이다. 그때는 노선 자신의 숫자를 쓰되
 * `fareTo` 를 붙여 **어디까지의 값인지** 밝힌다.
 */
export function TransitCard({
  route,
  way,
  isFastest,
  isCheapest,
}: {
  route?: TransitRoute;
  way?: HubWay;
  isFastest?: boolean;
  isCheapest?: boolean;
}) {
  const theme = useTheme();
  const isGone = route?.lastTrain ? lastTrainState(route.lastTrain).status === 'gone' : false;

  const title = way?.label ?? route?.name ?? '';
  const minutes = way?.minutes ?? route?.minutes ?? 0;
  const yen = way?.yen ?? route?.yen ?? 0;
  const recommended = way ? way.recommended : route?.recommended;

  /* 거점을 골라 들어온 자리에서는 기준점을 다시 적지 않는다. 거점 이름이
     바로 위에 있어서다. 거점 없이 노선만 보여줄 때만 붙인다. */
  const anchor = way ? undefined : route?.fareTo;

  /*
   * 타는 순서는 **공항에서 거점까지 한 줄로** 잇는다.
   *
   * `route.steps` 는 공항에서 그 열차에 올라타기까지고, 거기서 끊으면
   * 「모노레일 + 오에도선」을 고른 사람은 하마마쓰초에서 내린 뒤에 무엇을
   * 해야 하는지 모른 채 남는다. 정작 헤매는 곳이 거기다. 이어 붙이면
   * 「간략히」가 공항 갈림길과 환승 갈림길을 같이 추려 준다.
   */
  const steps =
    way?.transferSteps?.length ? [...(route?.steps ?? []), ...way.transferSteps] : route?.steps;

  return (
    <Card
      style={[styles.spaced, isGone && styles.dimmed]}
      accent={recommended ? theme.primary : undefined}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Txt variant="subtitle">
            {route ? `${ROUTE_EMOJI[route.type]} ` : ''}
            {title}
          </Txt>
          {/* 갈아타는 조합은 제목이 「모노레일 + 오에도선」이라 노선 이름과
              다르다. 그럴 때만 노선 이름을 같이 적는다 — 같으면 같은 말을
              두 줄에 쓰는 셈이다. 일본어 원표기는 현지 표지판과 대조하는
              용도라 언제나 남긴다. */}
          {route ? (
            <Txt variant="caption" color="textTertiary" style={styles.ja}>
              {title.includes(route.name) || route.name.includes(title)
                ? route.nameJa
                : `${route.name} · ${route.nameJa}`}
            </Txt>
          ) : null}
        </View>
        {route?.lastTrain ? <LastTrainInfo lastTrain={route.lastTrain} /> : null}
      </View>

      <View style={styles.badgeRow}>
        {recommended ? <Badge label="추천" tone="primary" /> : null}
        {isFastest ? <Badge label="가장 빠름" tone="success" /> : null}
        {isCheapest ? <Badge label="가장 저렴" tone="success" /> : null}
        {/* 환승 횟수는 값·시간만큼 중요하다. 짐을 들고 계단을 오르내리는
            횟수라서, 몇 분 빠른 길보다 직통을 고르는 사람이 많다. */}
        {way ? (
          <Badge
            label={way.transfers === 0 ? '직통' : `환승 ${way.transfers}회`}
            tone={way.transfers === 0 ? 'success' : 'neutral'}
          />
        ) : null}
        {route?.reserved ? <Badge label="좌석지정" tone="neutral" /> : null}
      </View>

      <Metrics minutes={minutes} yen={yen} anchor={anchor} />

      {/* 이 거점까지 갈 때의 이야기가 먼저다. 고르는 근거가 여기 있다. */}
      {way?.note ? (
        <Txt variant="body" color="textSecondary" style={styles.note}>
          {way.note}
        </Txt>
      ) : null}

      {/* 그 다음이 탈것 자체의 이야기 — 좌석, 짐, 배차처럼 어느 거점을 골라도
          같은 것. 위와 같은 말이 되지 않도록 데이터 쪽에서 겹치는 문장을
          덜어냈다. */}
      {route?.note ? (
        <Txt variant="body" color="textSecondary" style={styles.note}>
          {route.note}
        </Txt>
      ) : null}

      {/* 행선지는 열차 전면과 전광판에서 그대로 읽는 값이라 원문을 같이 준다.
          한국어만 있으면 눈앞의 글자와 대조할 수가 없다.

          다만 **거점을 이미 고른 카드에는 안 붙인다.** 노선의 행선지는 여러
          곳을 묶어 적은 값이라(리무진은 「우메다 · 난바 · 교토 · USJ」), 교토를
          고르고 들어온 사람에게는 오히려 어디로 가는 건지 헷갈리게 만든다.
          그 자리에서 필요한 행선지는 이미 카드 제목에 있다. */}
      {route && !way ? (
        <Txt variant="caption" color="textSecondary" style={styles.dest}>
          도착 · {route.destination}
          {route.destinationJa ? ` (${route.destinationJa})` : ''}
        </Txt>
      ) : null}

      {/* 종점만 보여주면 숙소가 그 역인 사람만 쓸 수 있다. 서는 역을 다 보여줘야
          자기 숙소와 맞춰보고 고를 수 있다. */}
      {route?.stops?.length ? (
        <RouteStops stops={route.stops} complete={route.stopsComplete} />
      ) : null}

      {/* 예약이 되는 노선은 그 사실 자체가 잘 안 알려져 있다. 창구에서 두 장
          따로 사는 것보다 싼 경우가 많아서, 순서보다 먼저 눈에 띄어야 한다. */}
      {route?.booking ? (
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

      {steps?.length ? <RouteSteps steps={steps} /> : null}
    </Card>
  );
}
