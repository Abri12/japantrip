import { Txt } from '@/components/ui';

import { styles } from './styles';

/** 정보 줄 왼쪽에 붙는 이모지. 줄마다 크기가 달라지지 않게 한 곳에서 그린다. */
export function RowEmoji({ emoji }: { emoji: string }) {
  return <Txt style={styles.rowEmoji}>{emoji}</Txt>;
}
