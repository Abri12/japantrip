import { Pressable, View } from 'react-native';

import { Chip, Txt } from '@/components/ui';
import { MAX_DAYS, useItinerary } from '@/lib/itinerary';
import { useSavedPlaces } from '@/lib/saved-places';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/**
 * 며칠째에 갈지 고르는 줄.
 *
 * ## 저장한 곳에만 보인다
 *
 * 저장은 「가고 싶다」, 일정은 「언제 간다」다. 순서가 그래서, 저장하지 않은
 * 곳에 일차 선택이 먼저 보이면 단계를 건너뛰라는 말이 된다. 저장을 누르면
 * 그 자리에서 이어서 나타난다.
 *
 * ## 왜 칩을 다 펼쳐 두나
 *
 * 드롭다운으로 접으면 몇 일차까지 있는지 열어 봐야 안다. 여행은 대개 2~4박
 * 이라 칩 서너 개면 한 줄에 들어가고, 지금 몇 일차에 있는지가 눈에 바로
 * 들어온다. 그래서 **지금 일정의 마지막 날 + 1** 까지만 그린다 — 10일치를
 * 늘어놓으면 짧은 여행에는 소음이다.
 */
export function DayPicker({ placeId }: { placeId: string }) {
  const theme = useTheme();
  const { has } = useSavedPlaces();
  const { days, dayCount, assign } = useItinerary();

  if (!has(placeId)) return null;

  const current = days[placeId];
  // 지금까지 쓴 날 + 하루. 아직 아무것도 없으면 1일차만.
  const shown = Math.min(MAX_DAYS, Math.max(dayCount + 1, current ?? 1));

  return (
    <View style={styles.dayPicker}>
      <Txt variant="caption" color="textTertiary" style={styles.dayPickerLabel}>
        며칠째에 갈까요?
      </Txt>
      <View style={styles.dayRow}>
        {Array.from({ length: shown }, (_, i) => i + 1).map((d) => (
          <Chip
            key={d}
            label={`${d}일차`}
            active={current === d}
            onPress={() => assign(placeId, d)}
          />
        ))}
      </View>
      {current ? (
        <Pressable onPress={() => assign(placeId, current)} hitSlop={8}>
          <Txt variant="caption" tint={theme.textTertiary} style={styles.dayClear}>
            일정에서 빼기
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
