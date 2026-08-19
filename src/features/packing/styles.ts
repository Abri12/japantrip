import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.three,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  /*
   * 항목 하나가 카드였다가 **줄**이 됐다.
   *
   * 13개가 각각 테두리와 그림자를 가진 카드면, 화면이 카드 13장으로 보인다.
   * 준비물은 훑고 지나가며 체크하는 목록이라 항목 사이의 경계보다 **한 화면에
   * 몇 개가 들어오느냐**가 중요하다. 카테고리 카드 하나 안에 줄로 넣고,
   * 줄 사이는 얇은 선으로만 나눈다.
   */
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  itemDivider: {
    height: 1,
  },
  mark: {
    // 카드에서 줄로 바뀌면서 40 → 32 로 줄였다. 줄 높이를 정하는 것이
    // 이 사각형이라, 그대로 두면 압축한 만큼이 도로 늘어난다.
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markEmoji: {
    fontSize: 17,
    lineHeight: 22,
  },
  /*
   * 본문을 펼치는 단추. 줄 전체는 체크 토글이라 오른쪽 끝에 따로 둔다.
   *
   * ⚠ `hitSlop` 에 기대지 않는다. **React Native Web 은 hitSlop 을 무시한다.**
   * 이 앱은 웹으로도 배포되므로, 거기서는 글자 크기(12px)에 패딩만 더한
   * 25px 짜리 표적이 된다 — 권장 최소치(44px)의 절반이라 실제로 누르기
   * 어렵다는 제보가 나왔다.
   *
   * 그래서 진짜 패딩으로 키운다. `alignSelf: 'stretch'` 로 줄 높이를 통째로
   * 먹고(마크 32 + 상하 여백 24 = 56), 오른쪽은 음수 마진으로 카드 안쪽
   * 여백(16)까지 밀어 카드 가장자리에 닿게 한다. 여백은 어차피 빈 자리라
   * 표적으로 쓰는 편이 낫다.
   */
  moreBtn: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: Spacing.four,
    paddingRight: Spacing.four,
    marginRight: -Spacing.four,
  },
  detail: {
    paddingLeft: 32 + 12,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  itemBody: {
    marginTop: Spacing.one,
  },
  warnRow: {
    marginTop: Spacing.two,
  },
  linkWrap: {
    marginTop: Spacing.two,
  },
  routeChip: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  pressed: {
    opacity: 0.7,
  },
});
