import { View } from 'react-native';

import { Txt } from '@/components/ui';

import { durationLabel } from './duration';
import { styles } from './styles';

/** 합계를 이루는 한 줄. 항목 이름은 왼쪽, 시간은 오른쪽 끝에 붙여 세로로 읽힌다 */
export function BreakdownRow({ label, minutes }: { label: string; minutes: number }) {
  return (
    <View style={styles.breakdownRow}>
      <Txt variant="body" color="textSecondary" style={styles.flex}>
        {label}
      </Txt>
      <Txt variant="bodyBold">{durationLabel(minutes)}</Txt>
    </View>
  );
}
