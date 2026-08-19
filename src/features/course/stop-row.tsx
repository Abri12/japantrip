import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui';
import { CourseStop } from '@/data/courses';
import { findPlace } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

export function StopRow({ stop, last }: { stop: CourseStop; last: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const place = stop.placeId ? findPlace(stop.placeId) : undefined;

  const title = place?.name ?? stop.custom ?? '';
  const canOpen = !!place;

  const body = (
    <View style={styles.stopRow}>
      {/* 세로선으로 하루의 흐름을 만든다. 마지막 항목은 선을 그리지 않아야
          뒤에 뭔가 더 있는 것처럼 보이지 않는다. */}
      <View style={styles.rail}>
        <View
          style={[
            styles.dot,
            { backgroundColor: canOpen ? theme.primary : theme.textTertiary },
          ]}
        />
        {!last ? <View style={[styles.line, { backgroundColor: theme.border }]} /> : null}
      </View>

      <View style={styles.stopBody}>
        <Txt variant="caption" color="textTertiary">
          {stop.when}
        </Txt>
        <View style={styles.titleRow}>
          <Txt variant="subtitle" style={styles.flex}>
            {title}
          </Txt>
          {canOpen ? (
            <Txt variant="body" color="textTertiary">
              ›
            </Txt>
          ) : null}
        </View>

        {/* 장소 상세를 그대로 읽어 온다. 여기에 값을 복사해 두면 원본이 바뀔 때
            두 곳이 어긋난다. */}
        {place?.admission ? (
          <Txt variant="caption" color="textTertiary" style={styles.meta}>
            {place.admission}
            {place.duration ? ` · ${place.duration}` : ''}
          </Txt>
        ) : null}

        {stop.move ? (
          <View style={[styles.move, { backgroundColor: theme.background }]}>
            <Txt variant="caption" color="textSecondary">
              🚃 {stop.move}
            </Txt>
          </View>
        ) : null}

        {stop.note ? (
          <Txt
            variant="caption"
            tint={stop.note.startsWith('⚠') ? theme.warning : theme.textSecondary}
            style={styles.meta}>
            {stop.note}
          </Txt>
        ) : null}
      </View>
    </View>
  );

  if (!canOpen) return body;

  return (
    <Pressable
      onPress={() => router.push(`/place/${stop.placeId}`)}
      style={({ pressed }) => [pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}
