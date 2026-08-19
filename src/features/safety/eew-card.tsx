import { View } from 'react-native';

import { Badge, Card, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { withEunNeun } from '@/lib/korean';
import { areaLabel, regionLabel } from '@/lib/place-names';
import { EewEvent, actionGuide, eewScaleForPrefecture, parseJst, scaleLabel, severityOf, timeAgo } from '@/lib/quake';

import { styles } from './styles';
import { useSeverityColor } from './use-severity-color';

export function EewCard({
  event,
  pref,
  cityName,
}: {
  event: EewEvent;
  pref?: string;
  cityName?: string;
}) {
  const theme = useTheme();
  const colorOf = useSeverityColor();

  const maxScale = event.areas.reduce<number>((m, a) => Math.max(m, a.scaleTo), -1);

  // 내 도시가 대상인지부터 본다. 대상이 아니면 색과 문구의 강도를 낮춘다.
  const myScale = pref ? eewScaleForPrefecture(event, pref) : null;
  const affectsMe = myScale !== null;
  const shown = affectsMe ? myScale! : maxScale;

  const color = affectsMe ? colorOf(severityOf(shown)) : theme.textTertiary;
  const at = parseJst(event.earthquake.originTime);

  return (
    <Card accent={color} style={styles.card}>
      <View style={styles.head}>
        <Txt variant="subtitle" tint={color}>
          긴급지진속보 (경보)
        </Txt>
        <Txt variant="caption" color="textTertiary">
          {timeAgo(at)}
        </Txt>
      </View>

      {cityName ? (
        <View style={styles.gap}>
          <Badge
            label={
              affectsMe
                ? `${cityName} 대상 · 예상 ${scaleLabel(shown)}`
                : `${withEunNeun(cityName)} 대상 아님`
            }
            tone={affectsMe ? 'danger' : 'neutral'}
          />
        </View>
      ) : null}

      <Txt variant="title" style={styles.gap}>
        {regionLabel(event.earthquake.hypocenter.name)}
      </Txt>
      <Txt variant="body" color="textSecondary">
        규모 M{event.earthquake.hypocenter.magnitude} · 진앙 최대 {scaleLabel(maxScale)} 예상
      </Txt>

      {affectsMe || !cityName ? (
        <View style={[styles.guide, { backgroundColor: theme.dangerSoft }]}>
          <Txt variant="body" tint={color}>
            {actionGuide(shown)}
          </Txt>
        </View>
      ) : null}

      {event.areas.length > 0 ? (
        <Txt variant="caption" color="textTertiary" style={styles.gap}>
          대상 지역 · {event.areas.slice(0, 5).map((a) => areaLabel(a.name)).join(', ')}
          {event.areas.length > 5 ? ` 외 ${event.areas.length - 5}곳` : ''}
        </Txt>
      ) : null}
    </Card>
  );
}
