import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  dayPicker: {
    marginBottom: Spacing.three,
  },
  dayPickerLabel: {
    marginBottom: Spacing.two,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  dayClear: {
    marginTop: Spacing.two,
    textDecorationLine: 'underline',
  },
  statusRow: {
    marginBottom: Spacing.three,
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  statusDetail: {
    marginTop: Spacing.half,
  },
  saveBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  caveatRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  caveatRowGap: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  caveatEmoji: {
    fontSize: 17,
    lineHeight: 24,
    width: 22,
  },
  rowEmoji: {
    fontSize: 19,
    lineHeight: 26,
    // 이모지 폭이 제각각이라 그냥 두면 제목 시작점이 줄마다 어긋난다.
    width: 24,
    textAlign: 'center',
  },
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  tipEmoji: {
    fontSize: 19,
    lineHeight: 24,
  },
  flex: { flex: 1 },
  passCard: {
    marginBottom: Spacing.three,
  },
  passHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  passBody: {
    marginTop: Spacing.two,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  buttonGap: {
    marginTop: Spacing.four,
  },
  msg: {
    marginTop: Spacing.three,
  },
  msgText: {
    marginTop: Spacing.two,
  },
  form: {
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  starRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    minHeight: 88,
    textAlignVertical: 'top',
    fontFamily: 'Pretendard-Regular',
    fontSize: 15,
  },
  formError: {
    marginTop: Spacing.two,
  },
  formNotice: {
    marginTop: Spacing.two,
  },
  reviewDelete: {
    marginTop: Spacing.two,
    textDecorationLine: 'underline',
  },
  reviewCard: {
    marginBottom: Spacing.three,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewText: {
    marginTop: Spacing.two,
  },
  reviewMeta: {
    marginTop: Spacing.two,
  },
  checkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  reportReasons: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  reportReason: {
    // 손가락으로 누르는 줄이다. 글자만 두면 목표가 너무 작다.
    paddingVertical: Spacing.one,
  },
});
