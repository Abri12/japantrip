/**
 * 도시별 화면이 공유하는 머리말.
 *
 * 탭 화면들이 「지금 어느 도시를 보고 있는지」와 「전체로 넓히는 법」을 똑같은
 * 모양으로 보여주게 한다. 화면마다 다르게 만들면 사용자가 매번 다시 찾아야 한다.
 */

import { Pressable, StyleSheet, View } from 'react-native';

import { Section, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { City } from '@/data/cities';
import { useTheme } from '@/hooks/use-theme';

export function CityScopeBar({
  city,
  showAll,
  onToggle,
}: {
  city: City | null;
  /** 지금 전체를 보고 있는지 */
  showAll: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  if (!city) return null;

  return (
    <Section>
      <Pressable onPress={onToggle} style={({ pressed }) => [pressed && styles.pressed]}>
        <View style={[styles.bar, { backgroundColor: theme.surface }]}>
          <Txt variant="caption" color="textSecondary">
            {showAll ? '일본 전체를 보고 있어요' : `${city.name} 정보만 보고 있어요`}
          </Txt>
          <Txt variant="label" tint={theme.primary}>
            {showAll ? `${city.name}만 보기` : '전체 보기'}
          </Txt>
        </View>
      </Pressable>
    </Section>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
  },
  pressed: {
    opacity: 0.6,
  },
});
