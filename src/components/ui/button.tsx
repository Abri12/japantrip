import { Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Txt } from './text';
import { styles } from './styles';

// ── 버튼 ───────────────────────────────────────────────

export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled,
}: {
  label: string;
  onPress?: () => void;
  tone?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  const theme = useTheme();
  const isPrimary = tone === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.primary : theme.surface,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
      ]}>
      <Txt variant="bodyBold" tint={isPrimary ? theme.onPrimary : theme.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

