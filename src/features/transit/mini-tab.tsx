import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

export function MiniTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.flex, pressed && styles.pressed]}>
      <View style={[styles.miniTab, { backgroundColor: active ? theme.text : theme.background }]}>
        <Txt variant="label" tint={active ? theme.background : theme.textSecondary}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}
