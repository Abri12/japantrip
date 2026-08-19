import { TextStyle } from 'react-native';

/**
 * 서체 굵기 — 웹용. **한 패밀리 + 굵기**로 쓴다.
 *
 * 웹에서는 Pretendard 를 동적 서브셋 CSS 로 받는데(`app/+html.tsx`), 그 CSS 가
 * 선언하는 패밀리 이름은 굵기별로 나뉘지 않고 `Pretendard` 하나다. 굵기는
 * `font-weight` 로 고른다.
 *
 * 그래서 네이티브처럼 `Pretendard-Bold` 를 찾으면 **일치하는 패밀리가 없어**
 * 시스템 폰트로 떨어진다. 화면이 깨지진 않지만 서체를 바꾼 의미가 없어진다.
 *
 * 굵기 값은 서브셋 CSS 가 선언한 것과 맞춘다 — 400 / 600 / 700.
 */
export const face = {
  regular: { fontFamily: 'Pretendard', fontWeight: '400' },
  semibold: { fontFamily: 'Pretendard', fontWeight: '600' },
  bold: { fontFamily: 'Pretendard', fontWeight: '700' },
} as const satisfies Record<string, TextStyle>;
