import { useTheme } from '@/hooks/use-theme';
import { Severity } from '@/lib/quake';

/** 심각도를 팔레트 색으로 옮긴다. */
export function useSeverityColor() {
  const theme = useTheme();
  return (s: Severity): string => {
    switch (s) {
      case 'danger':
        return theme.danger;
      case 'warning':
      case 'caution':
        return theme.warning;
      case 'info':
        return theme.success;
      default:
        return theme.textTertiary;
    }
  };
}
