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
   * 체크 표적 — 왼쪽 끝을 통째로 먹는다.
   *
   * 마크 사각형(32)만 표적으로 두면 조준해야 한다. 줄 높이만큼 세로로 펴고
   * (마크 32 + 상하 여백 24 = 56) 카드 안쪽 여백(16)까지 음수 마진으로
   * 밀어서, 줄 왼쪽 가장자리 어디를 눌러도 체크되게 한다.
   *
   * ⚠ `hitSlop` 에 기대지 않는다. **React Native Web 은 hitSlop 을 무시한다.**
   * 웹에서 통하는 크기는 여기 적힌 실제 패딩이 전부다.
   */
  checkHit: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.three,
    marginLeft: -Spacing.four,
    marginVertical: -Spacing.three,
  },
  /* 펼침 표시. 표적이 아니라 줄의 일부라 패딩이 필요 없다 */
  chevron: {
    marginLeft: Spacing.two,
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
