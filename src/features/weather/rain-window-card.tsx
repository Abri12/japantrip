import { View } from 'react-native';

import { Card, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { RainWindow } from '@/lib/weather';

import { styles } from './styles';

export function RainWindowCard({ window }: { window: RainWindow }) {
  const theme = useTheme();
  const label =
    window.startHour === window.endHour
      ? `${window.startHour}시`
      : `${window.startHour}~${window.endHour + 1}시`;

  return (
    <Card accent={theme.warning} style={styles.rainCard}>
      <View style={styles.rainRow}>
        <Txt variant="subtitle">☔ {label}</Txt>
        <Txt variant="caption" color="textTertiary">
          강수확률 최대 {window.maxProbability}%
        </Txt>
      </View>
    </Card>
  );
}
