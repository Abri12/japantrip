import { View } from 'react-native';

import { Card, Txt } from '@/components/ui';
import { OtherOption } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';
import { formatWonRangeApprox, useFxRate, yenToWon } from '@/lib/fx';

import { OTHER_EMOJI } from './constants';
import { styles } from './styles';

export interface OtherOptionCardProps {
  option: OtherOption;
}

export function OtherOptionCard({ option }: OtherOptionCardProps) {
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
        <View style={styles.metricRow}>
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
      </View>

      <Txt variant="body" color="textSecondary" style={styles.note}>
        {option.note}
      </Txt>
    </Card>
  );
}
