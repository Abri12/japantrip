import { View } from 'react-native';

import { Badge, Card, Section, Txt } from '@/components/ui';
import { Place } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { openStatus } from '@/lib/open-status';

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

  /*
   * 지금 시각과 대조한 판정. 확실할 때만 값이 오고, 아니면 null 이라
   * 화면은 지금까지처럼 원문만 보여준다. (판정 규칙은 lib/open-status.ts)
   *
   * 렌더 시점에 한 번 계산한다 — 상세 화면에 머무는 시간은 짧아서 분 단위
   * 갱신 타이머까지 둘 이유가 없다.
   */
  const status = openStatus(local);

  const rows: { emoji: string; text: string; warn?: boolean }[] = [];
  if (local.hours) rows.push({ emoji: '🕐', text: local.hours });
  if (local.closed) rows.push({ emoji: '📅', text: local.closed, warn: true });
  if (local.cashOnly) rows.push({ emoji: '💴', text: '카드가 안 돼요. 현금을 챙기세요', warn: true });
  if (local.reservation) rows.push({ emoji: '📞', text: local.reservation, warn: true });
  if (local.waiting) rows.push({ emoji: '🧍', text: local.waiting });

  if (rows.length === 0) return null;

  return (
    <Section title="가기 전에 알아두세요">
      <Card
        accent={
          status?.kind === 'holiday'
            ? theme.danger
            : rows.some((r) => r.warn)
              ? theme.warning
              : undefined
        }>
        {/* 판정이 있으면 맨 위에 — 「오늘 휴일」은 아래 정보를 다 무의미하게
            만드는 사실이라 가장 먼저 보여야 한다. 원문(영업시간·휴일)은 그대로
            아래 남는다. 판정의 근거가 그 원문이다. */}
        {status ? (
          <View style={styles.statusRow}>
            <Badge
              label={status.label}
              tone={
                status.kind === 'holiday' || status.kind === 'closed'
                  ? 'danger'
                  : status.kind === 'closingSoon'
                    ? 'warning'
                    : 'success'
              }
            />
            {status.detail ? (
              <Txt variant="caption" color="textSecondary" style={styles.statusDetail}>
                {status.detail}
              </Txt>
            ) : null}
          </View>
        ) : null}
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
