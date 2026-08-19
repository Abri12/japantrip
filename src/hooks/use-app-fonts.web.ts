/**
 * 본문 서체(Pretendard) 로딩 — 웹용. **아무것도 하지 않는다.**
 *
 * ## 왜 웹만 다른가
 *
 * 네이티브는 폰트를 앱 번들에 안고 설치되지만, 웹은 **첫 화면을 그리기 전에
 * 내려받는다.** expo-font 로 TTF 3종을 걸어 두면 `<link rel="preload">` 로
 * 승격돼서, 사용자가 아무것도 보기 전에 **8MB** 를 받는다.
 *
 *   Pretendard-Regular.ttf   2.7MB
 *   Pretendard-SemiBold.ttf  2.6MB
 *   Pretendard-Bold.ttf      2.7MB
 *
 * 여행지에서 로밍으로 여는 앱이다. 공항에서 첫 화면을 8MB 기다려야 한다면
 * 그건 앱이 없는 것과 비슷하다.
 *
 * ## 대신 무엇을 하나
 *
 * `+html.tsx` 가 Pretendard **동적 서브셋** CSS 를 건다. 한글을 유니코드
 * 구간별로 쪼갠 조각(하나에 12~18KB)으로 나눠 두고, 브라우저가 화면에 실제로
 * 나온 글자에 해당하는 조각만 받는다. 한국어 화면 하나를 그리는 데 보통
 * 100~300KB 면 끝난다 — 8MB 와 견줄 수 없다.
 *
 * 그러니 여기서는 로딩할 것이 없다. 「이미 준비됨」으로 답해서 스플래시를
 * 바로 걷는다. CSS 가 늦게 오면 브라우저가 시스템 폰트로 먼저 그리고
 * (font-display: swap) 나중에 바꿔 끼운다 — 글자가 안 보이는 구간이 없다.
 *
 * ⚠ 이 파일이 TTF 를 `require` 하지 않는 것 자체가 중요하다. 한 줄이라도
 * 남으면 번들러가 그 파일을 웹 빌드에 그대로 끌고 들어온다.
 */
export function useAppFonts(): [boolean, Error | null] {
  return [true, null];
}
