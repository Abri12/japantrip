import { Pressable, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Txt } from './text';
import { styles } from './styles';

// ── 뱃지 · 칩 ──────────────────────────────────────────

export function Badge({
  label,
  tone = 'primary',
}: {
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const theme = useTheme();

  const map = {
    primary: { bg: theme.primarySoft, fg: theme.primary },
    success: { bg: theme.successSoft, fg: theme.success },
    warning: { bg: theme.warningSoft, fg: theme.warning },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
    neutral: { bg: theme.surfaceStrong, fg: theme.textSecondary },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Txt variant="label" tint={map.fg}>
        {label}
      </Txt>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View
        style={[
          styles.chip,
          {
            backgroundColor: active ? theme.text : theme.surface,
          },
        ]}>
        <Txt variant="label" tint={active ? theme.background : theme.textSecondary}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

