import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  forWho: {
    marginTop: Spacing.three,
  },
  stopRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rail: {
    alignItems: 'center',
    width: 12,
    paddingTop: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: Spacing.one,
  },
  stopBody: {
    flex: 1,
    paddingBottom: Spacing.five,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  meta: {
    marginTop: Spacing.two,
  },
  move: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
  },
  dayTip: {
    marginTop: Spacing.two,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
