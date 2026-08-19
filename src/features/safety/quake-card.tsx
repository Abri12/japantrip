import { View } from 'react-native';

import { Badge, Card, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { regionLabel } from '@/lib/place-names';
import { QuakeEvent, actionGuide, parseJst, scaleInPrefecture, scaleLabel, severityOf, timeAgo, tsunamiLabel } from '@/lib/quake';

import { styles } from './styles';
import { useSeverityColor } from './use-severity-color';

export function QuakeCard({ quake, pref }: { quake: QuakeEvent; pref?: string }) {
  const theme = useTheme();
  const colorOf = useSeverityColor();

  const { earthquake } = quake;

  // 내 지역에서 실제로 얼마나 흔들렸는지 — 진앙 최대진도와 다를 수 있다.
  const localScale = pref ? scaleInPrefecture(quake, pref) : null;

  // 색과 행동 지침은 **사용자가 실제로 겪은 진도**를 따라야 한다.
  // 진앙 최대진도로 칠하면, 멀리서 크게 난 지진이 내 지역에서는 거의 안 느껴졌는데도
  // 빨간 카드와 "탁자 밑으로" 안내가 뜬다. 그건 겁만 주고 판단을 흐린다.
  const shownScale = localScale ?? earthquake.maxScale;
  const severity = severityOf(shownScale);
  const color = colorOf(severity);
  const at = parseJst(earthquake.time);
  const tsunami = tsunamiLabel(earthquake.domesticTsunami);

  const notable = severity === 'warning' || severity === 'danger';

  return (
    <Card accent={color} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Txt variant="subtitle">{regionLabel(earthquake.hypocenter.name)}</Txt>
          <Txt variant="caption" color="textTertiary" style={styles.tiny}>
            M{earthquake.hypocenter.magnitude} · 깊이 {earthquake.hypocenter.depth}km ·{' '}
            {timeAgo(at)}
          </Txt>
        </View>
        <View style={styles.scaleBox}>
          <Txt variant="bodyBold" tint={color}>
            {scaleLabel(shownScale)}
          </Txt>
          {localScale !== null && localScale !== earthquake.maxScale ? (
            <Txt variant="caption" color="textTertiary">
              내 지역 기준
            </Txt>
          ) : null}
        </View>
      </View>

      {tsunami.alarming ? (
        <View style={styles.gap}>
          <Badge label={`🌊 ${tsunami.text}`} tone="danger" />
        </View>
      ) : null}

      {notable ? (
        <View style={[styles.guide, { backgroundColor: theme.warningSoft }]}>
          <Txt variant="caption" tint={color}>
            {actionGuide(shownScale)}
          </Txt>
        </View>
      ) : null}
    </Card>
  );
}
