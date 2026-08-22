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
  pushHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  /* 스위치가 오른쪽 끝에 붙고 글은 남는 자리를 다 쓴다 — 안 그러면 긴
     설명이 스위치를 화면 밖으로 밀어낸다 */
  pushText: {
    flex: 1,
  },
  pushNotice: {
    marginTop: Spacing.three,
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
