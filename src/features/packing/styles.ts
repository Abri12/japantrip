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
  itemCard: {
    marginBottom: Spacing.three,
  },
  itemRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  mark: {
    // 다른 화면의 IconCircle 과 같은 크기·모양으로 맞춘다. 이 화면만 아이콘이
    // 없어서 앱 안에서 유독 밋밋해 보였다.
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markEmoji: {
    fontSize: 20,
    lineHeight: 26,
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
