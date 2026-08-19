import { useFonts } from 'expo-font';

/**
 * 본문 서체(Pretendard) 로딩 — 네이티브용.
 *
 * 앱은 폰트 파일을 **번들에 안고** 설치되므로, 실행 중에 내려받지 않는다.
 * 그래서 여기서는 TTF 를 그대로 쓴다.
 *
 * 웹은 사정이 완전히 달라서 파일이 따로 있다(`use-app-fonts.web.ts`).
 * 그 이유는 그쪽 주석에 적었다.
 */
export function useAppFonts(): [boolean, Error | null] {
  const [loaded, error] = useFonts({
    'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold': require('@/assets/fonts/Pretendard-Bold.ttf'),
  });
  return [loaded, error];
}
