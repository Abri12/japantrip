import { Palette, ThemeColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * 팔레트가 `as const` 라 라이트/다크의 리터럴 타입이 서로 다르다.
 * 색 이름만 고정하고 값은 문자열로 넓혀서 두 모드를 같은 타입으로 다룬다.
 */
export type Theme = Record<ThemeColor, string>;

/** 현재 모드의 색 팔레트. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Palette.dark : Palette.light;
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}
