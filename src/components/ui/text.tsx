import { Text, TextProps } from 'react-native';
import { ThemeColor, Type, TypeVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ── 텍스트 ─────────────────────────────────────────────

export interface TxtProps extends TextProps {
  variant?: TypeVariant;
  color?: ThemeColor;
  /** 팔레트에 없는 색을 직접 줄 때 (상태색 계산 결과 등) */
  tint?: string;
}

export function Txt({ variant = 'body', color = 'text', tint, style, ...rest }: TxtProps) {
  const theme = useTheme();
  return (
    <Text
      // 안드로이드 기본값은 'highQuality' 로, 한글을 글자 단위로 끊어
      // "없어요"가 "없 / 어요" 로 쪼개진다. 'simple' 은 공백 단위로만 끊는다.
      // (웹은 global.css 의 word-break: keep-all 이, iOS 는 기본 동작이 담당한다)
      textBreakStrategy="simple"
      style={[Type[variant], { color: tint ?? theme[color] }, style]}
      {...rest}
    />
  );
}

