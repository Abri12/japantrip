import { ReactNode } from 'react';
import { Text, TextProps } from 'react-native';
import { face } from '@/constants/font';
import { ThemeColor, Type, TypeVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ── 텍스트 ─────────────────────────────────────────────

/**
 * 문장 안의 강조 — `**이렇게**`.
 *
 * 이 앱의 설명글은 길다. 요금 하나를 말하려고 「왜 그런지」와 「대신 무엇을
 * 잃는지」를 같이 적기 때문인데, 그러다 보니 **한 문단에서 정작 판단을 가르는
 * 한 구절이 나머지에 묻힌다.** 여행 중에 서서 읽는 글이라 더 그렇다.
 *
 * 그래서 굵기 하나만 쓴다. 색을 같이 바꾸면 링크처럼 보여서 누르려 들고,
 * 배경을 깔면 카드 안에 카드가 생긴다. 굵기는 훑는 눈에만 걸리고 읽는
 * 흐름은 건드리지 않는다.
 *
 * 크기는 그대로 두고 **서체 굵기만** 바꾼다. 그래야 어느 variant 안에서 써도
 * 줄 높이가 흔들리지 않는다.
 *
 * ── 왜 마크다운 표기를 쓰나 ──────────────────────────
 *
 * 데이터가 이미 그렇게 쓰여 있었다. 화면에 렌더러가 없어서 별표가 글자 그대로
 * 나가고 있었을 뿐이라, 표기를 새로 정하는 대신 원래 의도대로 그려 준다.
 * 데이터 파일은 그냥 문자열이라 JSX 를 담을 수 없다는 사정도 있다.
 *
 * 짝이 안 맞는 별표는 손대지 않고 그대로 내보낸다 — 「**」 하나가 섞였다고
 * 뒤쪽 문장을 통째로 굵게 만들면, 오타 하나가 화면 절반을 바꾼다.
 */
const EMPHASIS = /\*\*(.+?)\*\*/g;

function emphasize(text: string): ReactNode {
  // 대부분의 문자열에는 별표가 없다. 정규식을 돌리기 전에 먼저 걸러낸다.
  if (!text.includes('**')) return text;

  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(EMPHASIS)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <Text key={m.index} style={face.semibold}>
        {m[1]}
      </Text>,
    );
    last = m.index + m[0].length;
  }
  if (last === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** 문자열(과 문자열만 담긴 배열)에만 적용한다. 그 밖은 손대지 않는다 */
function withEmphasis(children: ReactNode): ReactNode {
  if (typeof children === 'string') return emphasize(children);
  if (Array.isArray(children) && children.every((c) => typeof c === 'string')) {
    return emphasize(children.join(''));
  }
  return children;
}

export interface TxtProps extends TextProps {
  variant?: TypeVariant;
  color?: ThemeColor;
  /** 팔레트에 없는 색을 직접 줄 때 (상태색 계산 결과 등) */
  tint?: string;
}

export function Txt({
  variant = 'body',
  color = 'text',
  tint,
  style,
  children,
  ...rest
}: TxtProps) {
  const theme = useTheme();
  return (
    <Text
      // 안드로이드 기본값은 'highQuality' 로, 한글을 글자 단위로 끊어
      // "없어요"가 "없 / 어요" 로 쪼개진다. 'simple' 은 공백 단위로만 끊는다.
      // (웹은 global.css 의 word-break: keep-all 이, iOS 는 기본 동작이 담당한다)
      textBreakStrategy="simple"
      style={[Type[variant], { color: tint ?? theme[color] }, style]}
      {...rest}>
      {withEmphasis(children)}
    </Text>
  );
}
