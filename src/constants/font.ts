import { TextStyle } from 'react-native';

/**
 * 서체 굵기 — 네이티브용.
 *
 * 네이티브는 굵기마다 **다른 패밀리 이름**으로 등록한다. 안드로이드가
 * `fontWeight` 로 합성 굵기를 만들어 버리는 일이 있어서(진짜 Bold 대신 억지로
 * 굵힌 글자), 파일을 직접 가리키는 쪽이 결과가 일정하다.
 *
 * 웹은 반대다 — 이유는 `font.web.ts` 에 적었다.
 */
export const face = {
  regular: { fontFamily: 'Pretendard-Regular' },
  semibold: { fontFamily: 'Pretendard-SemiBold' },
  bold: { fontFamily: 'Pretendard-Bold' },
} as const satisfies Record<string, TextStyle>;
