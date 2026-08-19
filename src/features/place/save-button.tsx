import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui';
import { useSavedPlaces } from '@/lib/saved-places';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/**
 * 저장 토글 — 「내가 갈 곳」에 넣고 빼기.
 *
 * 상세 화면 맨 위에 둔다. 장소를 읽고 「가고 싶다」가 되는 순간이 이 화면인데,
 * 그 마음을 담아 둘 곳이 지금까지 없었다 — 나중에 다시 찾으려면 검색부터
 * 다시 해야 했다.
 *
 * 저장된 상태를 문구로도 구분한다(「저장됨 ✓」). 별 아이콘 색만 바꾸면
 * 지금 눌러서 저장된 건지 원래 그랬는지 확신이 안 서고, 색약이면 아예
 * 구분이 안 된다.
 */
export function SaveButton({ placeId }: { placeId: string }) {
  const theme = useTheme();
  const { has, toggle } = useSavedPlaces();
  const saved = has(placeId);

  return (
    <Pressable
      onPress={() => toggle(placeId)}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={saved ? '저장 취소' : '내가 갈 곳에 저장'}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <View
        style={[
          styles.saveBtn,
          saved
            ? { backgroundColor: theme.primarySoft, borderColor: theme.primary }
            : { backgroundColor: theme.surface, borderColor: theme.border },
        ]}>
        <Txt variant="bodyBold" tint={saved ? theme.primary : theme.textSecondary}>
          {saved ? '⭐ 저장됨 ✓' : '☆ 내가 갈 곳에 저장'}
        </Txt>
      </View>
    </Pressable>
  );
}
