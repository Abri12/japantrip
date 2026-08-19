import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  breakdown: {
    marginTop: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    gap: Spacing.two,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  taxFree: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.md,
  },
  resultNote: {
    marginTop: Spacing.two,
  },
  hint: {
    marginTop: Spacing.three,
  },
  caveat: {
    marginTop: Spacing.four,
  },
  leadLabel: {
    marginBottom: Spacing.one,
  },
  gap: {
    marginTop: Spacing.three,
  },
});
