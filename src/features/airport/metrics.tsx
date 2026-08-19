import { View } from 'react-native';

import { KrwEstimate, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/**
 * 소요시간과 요금 두 칸. 이 두 숫자가 선택의 거의 전부다.
 *
 * `anchor` 는 **그 숫자가 어디까지인지**다. 노선 카드에서만 붙는다 — 노선의
 * 시간·요금은 목적지를 정해야 뜻이 생기기 때문이다. 거점 쪽은 이미 거점을
 * 고르고 들어온 자리라 다시 적을 필요가 없다.
 */
export interface MetricsProps {
  minutes: number;
  yen: number;
  /**
   * 그 숫자가 **어디까지**인지.
   *
   * 노선 카드에서만 붙는다 — 노선의 시간·요금은 목적지를 정해야 뜻이 생긴다.
   * 거점 쪽은 이미 거점을 고르고 들어온 자리라 다시 적을 필요가 없다.
   */
  anchor?: string;
}

export function Metrics({ minutes, yen, anchor }: MetricsProps) {
  const theme = useTheme();

  return (
    <View style={[styles.metrics, { backgroundColor: theme.background }]}>
      {anchor ? (
        <Txt variant="caption" color="textTertiary" style={styles.metricsAnchor}>
          {anchor}까지 기준
        </Txt>
      ) : null}
      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Txt variant="caption" color="textTertiary">
            소요시간
          </Txt>
          <Txt variant="numeric">
            {minutes}
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
          <Txt variant="numeric">{yen === 0 ? '무료' : `¥${yen.toLocaleString()}`}</Txt>
          {yen > 0 ? <KrwEstimate yen={yen} /> : null}
        </View>
      </View>
    </View>
  );
}
