import { View } from 'react-native';

import { Chip, Txt } from '@/components/ui';
import { CityHub, TransitRoute } from '@/data/airports';

import { styles } from './styles';
import { TransitCard } from './transit-card';

/**
 * 「어디까지 가세요」 — 거점을 고르면 그 거점까지 가는 법만 보여준다.
 *
 * 거점 이름을 칩으로 늘어놓는다. 드롭다운으로 접으면 어떤 선택지가 있는지
 * 자체가 안 보여서, 자기 숙소가 어느 거점에 드는지 모르는 사람이 못 고른다.
 */
export function HubPicker({
  hubs,
  selected,
  onSelect,
  routes,
}: {
  hubs: CityHub[];
  selected: CityHub;
  onSelect: (id: string) => void;
  routes: TransitRoute[];
}) {
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
  const compare = selected.ways.length > 1;
  const fastest = Math.min(...selected.ways.map((w) => w.minutes));
  const cheapest = Math.min(...selected.ways.map((w) => w.yen));

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

      {selected.ways.map((way, i) => (
        <TransitCard
          key={i}
          way={way}
          route={routes.find((r) => r.id === way.routeId)}
          isFastest={compare && way.minutes === fastest}
          isCheapest={compare && way.yen === cheapest}
        />
      ))}
    </View>
  );
}
