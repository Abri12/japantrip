/**
 * 기능 플래그.
 *
 * 초기 버전은 **정보 제공에만 집중한다.** 크레딧·기여 보상은 코드와 설계를
 * 그대로 남겨 두되 화면에서만 감춘다. 이유는 두 가지다:
 *
 * 1. 보상 시스템은 채울 정보가 이미 있을 때 작동한다. 빈 앱에 보상부터 붙이면
 *    어뷰징만 먼저 들어온다.
 * 2. 크레딧은 지급 의무가 생기는 기능이라 원장이 서버로 간 뒤에 켜야 한다.
 *    (docs/SERVER.md 참조)
 *
 * `credits` 를 true 로 바꾸면 크레딧 탭과 제보 버튼이 다시 나타난다.
 * 관련 구현은 lib/credits.ts · lib/contributions.ts · app/(tabs)/rewards.tsx 에 있다.
 */
export const FEATURES = {
  /** 크레딧 적립·교환, 기여 보상 UI */
  credits: false,
  /** 현장 GPS 인증 리뷰 — 정보 신뢰도의 핵심이라 초기부터 켠다 */
  verifiedReviews: true,
  /** 오픈 로드맵 화면 */
  roadmap: true,
} as const;
