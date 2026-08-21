import { View } from 'react-native';

import { Chip, Txt } from '@/components/ui';
import { LineLabels } from '@/components/line-badge';
import { CityHub, TransitRoute } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';
import { TransitCard } from './transit-card';

/**
 * 「어디까지 가세요」 — 거점을 고르면 그 거점까지 가는 법만 보여준다.
 *
 * 거점 이름을 칩으로 늘어놓는다. 드롭다운으로 접으면 어떤 선택지가 있는지
 * 자체가 안 보여서, 자기 숙소가 어느 거점에 드는지 모르는 사람이 못 고른다.
 */
export interface HubPickerProps {
  /** 고를 수 있는 거점. 묵는 사람이 많은 순으로 정렬돼 있다 */
  hubs: CityHub[];
  /** 지금 펼쳐 둔 거점 */
  selected: CityHub;
  onSelect: (hubId: string) => void;
  /** 공항의 전체 노선. 각 방법이 `routeId` 로 상세를 끌어다 쓴다 */
  routes: TransitRoute[];
}

export function HubPicker({ hubs, selected, onSelect, routes }: HubPickerProps) {
  const theme = useTheme();

  /*
   * 「가장 빠름 · 가장 저렴」을 여기서만 계산한다.
   *
   * 견줄 수 있는 유일한 자리라서다 — 도착지가 같아야 시간과 요금이 같은 뜻을
   * 갖는다. 공항의 노선 전체를 놓고 재면 시나가와까지의 15분과 신주쿠까지의
   * 44분을 나란히 놓고 앞의 것을 「가장 빠름」이라 부르게 된다.
   *
   * 방법이 하나뿐이면 뱃지를 달지 않는다. 비교 대상이 없는데 「가장 빠름」이라
   * 적으면 다른 선택지가 있는 것처럼 읽힌다.
   */
  /*
   * **거점 전체에 가는 방법끼리만** 견준다.
   *
   * 거점 하나가 두 곳을 묶을 때가 있다(「도쿄역 · 긴자」). 그 안의 한쪽에만
   * 가는 방법(`skips`)을 같이 재면 위 규칙이 그대로 깨진다 — 도착지가 다른데
   * 시간과 요금을 나란히 놓게 된다.
   *
   * 실제로 하네다 도쿄역 거점이 그랬다. 도쿄역에 가지도 않는 케이큐가
   * 「가장 빠름 · 가장 저렴」을 다 가져가고, 정작 추천 카드에는 장점 뱃지가
   * 하나도 없었다. 뱃지만 훑으면 왜 위가 추천인지 알 수 없다.
   */
  const comparable = selected.ways.filter((w) => !w.skips);
  const compare = comparable.length > 1;
  const fastest = compare ? Math.min(...comparable.map((w) => w.minutes)) : -1;
  const cheapest = compare ? Math.min(...comparable.map((w) => w.yen)) : -1;

  return (
    <View>
      <Txt variant="bodyBold" style={styles.hubQuestion}>
        어디까지 가세요?
      </Txt>
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

      {/* 일본어 원표기를 붙이지 않는다. 이 앱이 일본어를 같이 내는 건 **눈앞의
          글자와 대조해야 할 때**뿐이다 — 열차 앞면의 행선지, 승강장 전광판의
          노선명, 역 이름표. 거점은 「내가 어디 묵는지」를 고르는 자리라 대조할
          글자가 없다. 「なんば・心斎橋 · 도톤보리가 걸어서 닿는 거리」처럼
          붙여 두면 읽는 데 걸리기만 한다. */}
      <Txt variant="caption" color="textTertiary" style={styles.hubBlurb}>
        {selected.blurb}
      </Txt>

      {/* 거점 근처의 동네·역 — 노선 카드보다 **먼저** 그린다.

          처음에는 이동 순서(공항 → 거점 → 동네)를 따라 카드 뒤에 뒀는데,
          카드가 서너 장이면 화면 한참 아래로 밀려서 있는 줄도 모르게 됐다.
          그런데 이 정보의 첫 번째 쓸모는 마지막 구간 안내가 아니라
          **거점을 맞게 골랐는지 확인**이다 — 숙소가 신사이바시인 사람은
          「난바 · 신사이바시」 칩을 누르고 나서 자기 동네가 정말 여기
          걸리는지부터 보고 싶어 한다. 선택에 영향을 주는 정보는 선택의
          결과(노선 카드)보다 위에 있어야 한다.

          바탕색을 깔아 노선 카드와 결이 다른 「곁가지」로 읽히게 한다.
          요금·소요시간을 싣지 않는 이유는 HubSpot 타입 주석에 있다. */}
      {selected.nearby?.length ? (
        <View style={[styles.nearbyBox, { backgroundColor: theme.surface }]}>
          <View>
            <Txt variant="bodyBold">숙소가 이 근처 다른 역이에요?</Txt>
            <Txt variant="caption" color="textTertiary" style={styles.nearbyCaption}>
              거점에 내려서 이렇게 이어가면 돼요
            </Txt>
          </View>
          {selected.nearby.map((spot) => (
            <View key={spot.name} style={styles.nearbyRow}>
              <Txt variant="bodyBold">
                {spot.name}
                {spot.nameJa ? (
                  <Txt variant="caption" color="textTertiary">
                    {' '}
                    ({spot.nameJa})
                  </Txt>
                ) : null}
              </Txt>
              {spot.lineIds?.length ? <LineLabels lineIds={spot.lineIds} /> : null}
              <Txt variant="caption" color="textSecondary">
                {spot.how}
              </Txt>
            </View>
          ))}
        </View>
      ) : null}

      {selected.ways.map((way, i) => (
        <TransitCard
          key={i}
          way={way}
          route={routes.find((r) => r.id === way.routeId)}
          isFastest={compare && !way.skips && way.minutes === fastest}
          isCheapest={compare && !way.skips && way.yen === cheapest}
        />
      ))}
    </View>
  );
}
