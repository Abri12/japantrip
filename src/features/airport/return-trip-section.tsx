import { View } from 'react-native';

import { Card, IconCircle, Row, RowGroup, Section, Txt } from '@/components/ui';
import { FirstTrain, TransitRoute } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/** 첫차가 확인된 노선 하나 */
export interface FirstTrainEntry {
  route: TransitRoute;
  firstTrain: FirstTrain;
}

export interface ReturnTripSectionProps {
  /**
   * 공항 이름의 일본어 원문.
   *
   * 시내에서 열차를 고르는 근거가 전광판에 뜬 행선지라, 대조할 글자를
   * 그대로 줘야 한다.
   */
  airportNameJa: string;
  /** 위에서 고른 거점 이름. 첫차가 어느 동네 기준인지 제목에 밝힌다 */
  hubName?: string;
  /** 좌석 지정 노선이 있는지 — 있으면 전날 예약하라고 덧붙인다 */
  hasReservedRoute: boolean;
  /**
   * 첫차가 **확인된** 노선만.
   *
   * 없는 노선을 「정보 없음」으로 줄 세우면 그 노선에 첫차가 없다는 뜻으로
   * 읽혀서, 아예 목록에서 뺀다.
   */
  firstTrains: FirstTrainEntry[];
  /** 출발 시각 계산 화면으로 보내기 */
  onOpenDeparture: () => void;
}

/**
 * 「공항 갈 때는」 — 이 화면에서 유일하게 방향이 반대인 구역.
 *
 * 여기까지는 전부 「공항 → 시내」다. 그런데 여행은 공항에서 시작해 공항에서
 * 끝나고, 되돌릴 수 없는 쪽은 오히려 돌아가는 날이다 — 비행기는 놓치면
 * 그만이다. 그런데도 반대 방향을 다루는 자리가 아예 없어서, 귀국일 아침에
 * 이 화면을 열면 쓸 말이 없었다.
 *
 * 방향별 데이터를 새로 지어내지는 않는다. 정차역·요금·소요시간을 반대 방향
 * 값인 척 뒤집어 보여주면 확인하지 않은 숫자를 확인한 것처럼 말하는 셈이다.
 * 대신 **확실히 아는 것만** 적는다 — 같은 노선이 양방향으로 다닌다는 것,
 * 열차를 고르는 기준은 행선지 표기라는 것, 좌석 지정 노선은 미리 잡아야
 * 한다는 것. 시각 계산은 이미 그 일을 하는 화면(/departure)으로 보낸다.
 */
export function ReturnTripSection({
  airportNameJa,
  hubName,
  hasReservedRoute,
  firstTrains,
  onOpenDeparture,
}: ReturnTripSectionProps) {
  const theme = useTheme();

  return (
    <Section title="공항 갈 때는" caption="귀국일에 시내에서 공항으로 가는 길이에요">
      <Card accent={theme.primary} style={styles.spaced}>
        <Txt variant="subtitle">같은 노선을 반대로 타면 돼요</Txt>
        <Txt variant="body" color="textSecondary" style={styles.reverseLine}>
          위 노선들은 양방향으로 다녀요. 시내에서 탈 때는 행선지가{' '}
          <Txt variant="bodyBold">{airportNameJa}</Txt> 인 열차를 고르세요 — 승강장 전광판과
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
            {/* 위에서 고른 거점의 첫차만 나온다(use-airport-detail). 제목에도
                그 거점 이름을 박아, 이 시각이 누구 기준인지 헷갈리지 않게 한다. */}
            <Txt variant="bodyBold">
              {hubName ? `${hubName}에서 나설 때 첫차` : '시내에서 타는 첫차'}
            </Txt>
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
        ) : (
          /* 이 거점 기준으로 확인된 첫차가 없다.

             말없이 비우면 「첫차 걱정은 없다」로 읽힌다 — 새벽 비행기에서
             그건 틀린 안심이다. 확인 못 했다는 사실 자체를 적는다. */
          <View style={styles.reverseFirst}>
            <Txt variant="bodyBold">
              {hubName ? `${hubName} 기준 첫차` : '시내에서 타는 첫차'}
            </Txt>
            <Txt variant="body" color="textSecondary" style={styles.reverseLine}>
              이 거점 기준 첫차 시각은 아직 확인하지 못했어요. 아침 일찍 나서야 한다면
              전날 공식 시각표를 꼭 확인해두세요.
            </Txt>
          </View>
        )}

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
          onPress={onOpenDeparture}
        />
      </RowGroup>
    </Section>
  );
}
