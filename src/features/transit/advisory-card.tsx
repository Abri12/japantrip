import { View } from 'react-native';

import { Badge, Card, Txt } from '@/components/ui';
import { PassAdvisory } from '@/data/transit';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/**
 * 「그래서 나는 사야 하나」에 대한 도시 단위의 답.
 *
 * 패스 카드와 **다르게 생겨야 한다.** 같은 모양이면 여섯 번째 패스처럼 보여서
 * 그냥 넘긴다. 그래서 색 띠를 넣고 결론을 뱃지로 먼저 박는다.
 */
export function AdvisoryCard({ advisory }: { advisory: PassAdvisory }) {
  const theme = useTheme();
  const worth = advisory.tone === 'worth';

  return (
    <Card accent={worth ? theme.success : theme.warning} style={styles.spaced}>
      <View style={styles.advisoryHead}>
        <Badge label={worth ? '사는 게 이득' : '따져보고 사세요'} tone={worth ? 'success' : 'warning'} />
      </View>
      <Txt variant="subtitle" style={styles.gap}>
        {advisory.headline}
      </Txt>
      <Txt variant="body" color="textSecondary" style={styles.gap}>
        {advisory.body}
      </Txt>
    </Card>
  );
}
