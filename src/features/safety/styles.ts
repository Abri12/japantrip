import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    marginBottom: Spacing.three,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  gap: {
    marginTop: Spacing.two,
  },
  tiny: {
    marginTop: Spacing.half,
  },
  scaleBox: {
    alignItems: 'flex-end',
  },
  trainCard: {
    marginBottom: Spacing.three,
  },
  trainHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  trainBody: {
    marginTop: Spacing.two,
  },
  trainNote: {
    marginTop: Spacing.three,
  },
  guide: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
