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
 * 들어온다.
 *
 * ## 처음부터 나흘을 보여준다
 *
 * 전에는 「지금 일정의 마지막 날 + 1」까지만 그렸다. 일정이 비어 있으면
 * 그게 **1일차 하나**가 되는데, 그러면 고를 것이 없는 선택지가 된다. 게다가
 * 더 보려면 눌러야 하고 **누르면 실제로 배치까지 돼서**, 둘러보려던 행동이
 * 일정을 바꿔 버렸다. 2일차를 누르면 다시 3일차가 나타나는 식으로 계속
 * 밀렸다.
 *
 * 그래서 기본으로 나흘을 편다. 한국에서 가는 일본 여행은 2박3일·3박4일이
 * 가장 흔해서 그 안에서 대개 끝난다. 더 긴 여행이면 마지막 날을 고르는
 * 순간 그 다음 날이 따라 나온다 — 늘어나는 것은 그대로 두되, **시작점이
 * 선택지 하나인 상태를 없앤다.**
 */
/**
 * 일정이 비어 있어도 이만큼은 편다.
 *
 * 한국에서 가는 일본 여행은 2박3일·3박4일이 가장 흔하다. 나흘이면 그 대부분이
 * 첫 화면에서 끝나고, 칩 넷은 좁은 화면에서도 한 줄에 들어간다.
 */
const DEFAULT_DAYS = 4;

export function DayPicker({ placeId }: { placeId: string }) {
  const theme = useTheme();
  const { has } = useSavedPlaces();
  const { days, dayCount, assign } = useItinerary();

  if (!has(placeId)) return null;

  const current = days[placeId];
  /*
   * 기본 나흘 · 쓴 날이 더 많으면 그 다음 날까지.
   *
   * dayCount 만 쓰면 일정이 비었을 때 칩이 하나뿐이라 고를 것이 없다.
   * DEFAULT_DAYS 가 그 바닥을 만든다.
   */
  const shown = Math.min(MAX_DAYS, Math.max(DEFAULT_DAYS, dayCount + 1, current ?? 1));

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
