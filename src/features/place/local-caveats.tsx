import { View } from 'react-native';

import { Card, Section, Txt } from '@/components/ui';
import { Place } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/**
 * 헛걸음 방지 정보.
 *
 * 사진·평점·리뷰 수는 구글맵과 트리플이 훨씬 잘한다. 거기서 이기려 들 필요가
 * 없다. 대신 그쪽이 잘 안 알려주는 걸 준다 — 한국인이 실제로 헛걸음하는 이유
 * 넷(정기휴일·현금만·웨이팅·예약)이다.
 *
 * 뱃지로 먼저 보여주는 게 요령이다. 문장으로 늘어놓으면 결국 안 읽는다.
 */
export function LocalCaveats({ local }: { local: NonNullable<Place['local']> }) {
  const theme = useTheme();

  const rows: { emoji: string; text: string; warn?: boolean }[] = [];
  if (local.hours) rows.push({ emoji: '🕐', text: local.hours });
  if (local.closed) rows.push({ emoji: '📅', text: local.closed, warn: true });
  if (local.cashOnly) rows.push({ emoji: '💴', text: '카드가 안 돼요. 현금을 챙기세요', warn: true });
  if (local.reservation) rows.push({ emoji: '📞', text: local.reservation, warn: true });
  if (local.waiting) rows.push({ emoji: '🧍', text: local.waiting });

  if (rows.length === 0) return null;

  return (
    <Section title="가기 전에 알아두세요">
      <Card accent={rows.some((r) => r.warn) ? theme.warning : undefined}>
        {rows.map((r, i) => (
          <View key={i} style={i === 0 ? styles.caveatRow : styles.caveatRowGap}>
            <Txt style={styles.caveatEmoji}>{r.emoji}</Txt>
            <Txt
              variant="body"
              color={r.warn ? 'text' : 'textSecondary'}
              style={styles.flex}>
              {r.text}
            </Txt>
          </View>
        ))}
      </Card>
    </Section>
  );
}
