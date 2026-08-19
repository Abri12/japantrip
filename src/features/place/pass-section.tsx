import { View } from 'react-native';

import { Badge, Card, Section, Txt } from '@/components/ui';
import { Place } from '@/data/places';
import { findPass } from '@/data/transit';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

export interface PassSectionProps {
  /** 그 장소를 커버하는 패스. 없으면 구역째 그리지 않는다 */
  passes?: Place['passes'];
}

export function PassSection({ passes }: PassSectionProps) {
  const theme = useTheme();

  if (!passes?.length) return null;

  return (
    <Section title="교통패스로 되나요" caption="조건이 붙는 경우가 많으니 미리 보고 가세요">
      {passes.map((cov) => {
        const pass = findPass(cov.passId);
        if (!pass) return null;

        return (
          <Card
            key={cov.passId}
            accent={cov.condition ? theme.warning : theme.success}
            style={styles.passCard}>
            <View style={styles.passHead}>
              <Txt variant="subtitle">{pass.name}</Txt>
              <Badge
                label={cov.condition ? '조건부' : '그냥 돼요'}
                tone={cov.condition ? 'warning' : 'success'}
              />
            </View>
            <Txt variant="body" color="textSecondary" style={styles.passBody}>
              {cov.condition ?? '패스만 보여주면 무료로 들어갈 수 있어요.'}
            </Txt>
          </Card>
        );
      })}
    </Section>
  );
}
