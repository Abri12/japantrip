import { View } from 'react-native';

import { Card, Section, Txt } from '@/components/ui';

import { styles } from './styles';

export interface TipSectionProps {
  /** 없는 장소가 더 많다. 없으면 구역째 그리지 않는다 */
  tip?: string;
}

/**
 * 팁은 행 안의 작은 캡션으로 두기엔 너무 길다. 읽어야 하는 문장이라 본문
 * 크기로 올리고, 요금·시간처럼 훑는 값들과 자리를 분리한다.
 */
export function TipSection({ tip }: TipSectionProps) {
  if (!tip) return null;

  return (
    <Section title="알아둘 점">
      <Card>
        <View style={styles.tipRow}>
          <Txt style={styles.tipEmoji}>💡</Txt>
          <Txt variant="body" color="textSecondary" style={styles.flex}>
            {tip}
          </Txt>
        </View>
      </Card>
    </Section>
  );
}
