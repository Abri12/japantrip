import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  gap: {
    marginTop: Spacing.two,
  },
  tipGap: {
    marginTop: Spacing.one,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  conditionEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  heatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempCol: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  vline: {
    width: 1,
    height: 40,
  },
  adviceEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  rainCard: {
    marginBottom: Spacing.two,
  },
  rainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
