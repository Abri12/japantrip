import { StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { Route } from '@/data/places';
import { LINES } from '@/data/lines';

/**
 * 노선 색 점 + 색 이름 + 노선명.
 *
 * 색을 점과 글로 두 번 준다. 점만 있으면 색약인 사람은 구분하지 못하고,
 * 작은 화면에서는 갈색 점과 빨간 점이 비슷하게 보인다. 「빨간 미도스지선」이라고
 * 적어두면 어느 쪽이든 통하고, 그 자체가 역에서 그대로 쓰는 안내문이 된다.
 *
 * 환승역은 색 이름을 노선마다 따로 붙인다. 「빨간 미도스지선·센니치마에선」이면
 * 센니치마에선도 빨간 줄 알게 된다.
 */
export function LineLabels({ lineIds }: { lineIds: string[] }) {
  const known = lineIds.map((id) => LINES[id]).filter((l) => l !== undefined);
  if (known.length === 0) return null;

  return (
    <>
      {known.map((line, i) => (
        <View key={lineIds[i]} style={styles.linePart}>
          <View style={[styles.dot, { backgroundColor: line.color }]} />
          <Txt variant="caption" color="textTertiary">
            {line.colorLabel} {line.name}
          </Txt>
        </View>
      ))}
    </>
  );
}

/**
 * 상세 화면 오른쪽 아래에 들어가는 경로 요약.
 *
 * 색 점이 들어가야 해서 문자열로는 못 만든다. 오른쪽 정렬이라 항목이 길면
 * 아래로 흐르게 두고, 줄바꿈을 막지 않는다.
 *
 * `Route` 를 받는다 — 주 경로와 대안 경로(`access.alt`)를 **같은 함수로** 그려야
 * 한쪽에만 색 점이 붙는 일이 생기지 않는다.
 */
export function AccessDetail({ route }: { route: Route }) {
  return (
    <View style={styles.wrap}>
      {/* lineLabel 을 먼저 그린다. 하카타역처럼 JR 과 지하철이 같이 있는 역은
          mode 가 'jr' 인데 색 있는 지하철 노선이 위로 오면 무엇을 타라는
          말인지 헷갈린다. 주된 수단이 먼저 읽혀야 한다. */}
      {route.lineLabel ? (
        <Txt variant="caption" color="textTertiary">
          {route.lineLabel}
        </Txt>
      ) : null}
      {route.lineIds?.length ? <LineLabels lineIds={route.lineIds} /> : null}
      {route.leg ? (
        <Txt variant="caption" color="textTertiary">
          {route.leg}
        </Txt>
      ) : null}
    </View>
  );
}

/** 역 이름 + 일본어 원문. 주 경로와 대안이 같은 형태로 보이게 한 곳에서 만든다. */
export function stationLabel(route: Route): string | undefined {
  if (!route.station) return undefined;
  return route.stationJa ? `${route.station}(${route.stationJa})` : route.station;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  linePart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
