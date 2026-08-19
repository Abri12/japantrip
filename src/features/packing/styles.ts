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
  /* 본문을 펼치는 단추. 줄 전체는 체크 토글이라 오른쪽 끝에 따로 둔다. */
  moreBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
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
