import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  /** 간략히 · 자세히 고르는 줄 */
  stepsModes: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  stepsHint: {
    marginTop: Spacing.two,
  },
  stepsWrap: {
    marginTop: Spacing.four,
  },
  stepsToggle: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
  },
  steps: {
    marginTop: Spacing.four,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stepRail: {
    alignItems: 'center',
    width: 24,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: Spacing.one,
  },
  stepBody: {
    flex: 1,
    // 마지막 단계 아래는 여백이 남지 않게 아래쪽에만 간격을 준다.
    paddingBottom: Spacing.four,
  },
  signBox: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
  },
  stopsWrap: {
    marginTop: Spacing.three,
  },
  stopsBar: {
    padding: Spacing.three,
    borderRadius: Radius.sm,
  },
  stopsPreview: {
    marginTop: Spacing.one,
  },
  stopList: {
    marginTop: Spacing.three,
  },
  stopRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stopRail: {
    alignItems: 'center',
    width: 10,
    paddingTop: Spacing.one,
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stopLine: {
    width: 2,
    flex: 1,
    marginVertical: Spacing.half,
  },
  stopBody: {
    flex: 1,
    paddingBottom: Spacing.three,
  },
  stopNote: {
    marginTop: Spacing.two,
  },
  stopMeta: {
    marginTop: Spacing.half,
  },
  stepMeta: {
    marginTop: Spacing.two,
  },
  costBox: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
  },
  bookingBox: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.md,
  },
  contactlessBody: {
    marginTop: Spacing.four,
  },
  contactlessGroup: {
    marginBottom: Spacing.two,
  },
  contactlessHeading: {
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  contactlessHead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepIcon: {
    marginTop: Spacing.two,
  },
  perkBox: {
    padding: Spacing.three,
    borderRadius: Radius.sm,
    marginBottom: Spacing.two,
  },
  flex: { flex: 1 },
  reverseLine: {
    marginTop: Spacing.two,
  },
  reverseFirst: {
    marginTop: Spacing.four,
  },
  reverseNote: {
    marginTop: Spacing.three,
  },
  hubQuestion: {
    marginBottom: Spacing.three,
  },
  hubChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  hubBlurb: {
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  nearbyBox: {
    marginBottom: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  nearbyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: Spacing.two,
    rowGap: Spacing.half,
  },
  nearbyCaption: {
    marginBottom: Spacing.half,
  },
  spaced: {
    marginBottom: Spacing.three,
  },
  dimmed: {
    opacity: 0.5,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  ja: {
    marginTop: Spacing.half,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  metrics: {
    borderRadius: Radius.md,
    padding: Spacing.four,
    marginTop: Spacing.three,
  },
  metricsAnchor: {
    marginBottom: Spacing.three,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: {
    flex: 1,
    gap: Spacing.half,
  },
  vline: {
    width: 1,
    height: 32,
    marginHorizontal: Spacing.four,
  },
  dest: {
    marginTop: Spacing.three,
  },
  note: {
    marginTop: Spacing.two,
  },
});
