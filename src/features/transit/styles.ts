import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  spaced: {
    marginBottom: Spacing.three,
  },
  advisoryHead: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  gap: {
    marginTop: Spacing.two,
  },
  tiny: {
    marginTop: Spacing.half,
  },
  passHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  verdict: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    gap: Spacing.six,
    marginTop: Spacing.four,
  },
  priceItem: {
    gap: Spacing.half,
  },
  priceLabel: {
    marginTop: Spacing.half,
  },
  worth: {
    marginTop: Spacing.four,
  },
  caution: {
    marginTop: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  miniTab: {
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  detail: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  markRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  mark: {
    width: 16,
  },
  detailGap: {
    marginTop: Spacing.three,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.half,
  },
  buyBox: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  buyRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buyButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
