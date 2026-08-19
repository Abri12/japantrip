import { View } from 'react-native';

import { Badge, Card, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { DailyRisk } from '@/lib/weather';

import { styles } from './styles';

/** 자외선·바람 카드 — 둘 다 같은 {emoji, headline, advice, shortLabel} 모양이라 공유한다. */
export function RiskCard({ risk }: { risk: DailyRisk }) {
  const theme = useTheme();
  const color =
    risk.level === 'extreme' || risk.level === 'veryHigh'
      ? theme.danger
      : risk.level === 'high'
        ? theme.warning
        : theme.success;
  const tone = risk.level === 'extreme' || risk.level === 'veryHigh'
    ? 'danger'
    : risk.level === 'high'
      ? 'warning'
      : 'success';

  return (
    <Card accent={color}>
      <View style={styles.heatRow}>
        <Txt style={styles.adviceEmoji}>{risk.emoji}</Txt>
        <Badge label={risk.shortLabel} tone={tone} />
      </View>
      <Txt variant="title" style={styles.gap}>
        {risk.headline}
      </Txt>
      <Txt variant="body" color="textSecondary" style={styles.tipGap}>
        {risk.advice}
      </Txt>
    </Card>
  );
}
