import { Card, Section, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

export interface TipsSectionProps {
  /** 그 공항에서만 통하는 주의사항. 「⚠️」로 시작하면 경고색 띠가 붙는다 */
  tips: string[];
}

export function TipsSection({ tips }: TipsSectionProps) {
  const theme = useTheme();

  return (
    <Section title="이 공항에서 조심할 점">
      {tips.map((tip, i) => (
        <Card
          key={i}
          style={i < tips.length - 1 ? styles.spaced : undefined}
          accent={tip.startsWith('⚠️') ? theme.warning : undefined}>
          <Txt variant="body" color="textSecondary">
            {tip}
          </Txt>
        </Card>
      ))}
    </Section>
  );
}
