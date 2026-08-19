import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chipRowGap: {
    marginTop: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.three,
  },
  dice: {
    fontSize: 44,
    lineHeight: 52,
  },
  pickName: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  pickSummary: {
    marginTop: Spacing.three,
  },
  openHint: {
    alignSelf: 'flex-start',
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  note: {
    marginTop: Spacing.three,
  },
  wheelFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  inputRowGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    fontSize: 15,
  },
  addRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  ladderRow: {
    flexDirection: 'row',
  },
  ladderCell: {
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  ladderLabel: {
    textAlign: 'center',
  },
  ladderBoard: {
    position: 'relative',
    marginVertical: Spacing.three,
  },
  vline: {
    position: 'absolute',
    top: 0,
  },
  hline: {
    position: 'absolute',
    height: 2,
  },
  prize: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  ladderResult: {
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  ladderHint: {
    marginTop: Spacing.four,
  },
});
