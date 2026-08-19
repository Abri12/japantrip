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
  /*
   * 위험 등급이 붙은 날의 체감온도만 조금 키운다.
   *
   * 타이포 스케일에 단계를 새로 만들지 않았다 — 「크기가 많아지면 위계가
   * 아니라 소음이 된다」가 이 앱의 규칙이고(constants/theme.ts), 여기 필요한
   * 것은 새 단계가 아니라 **세 칸 중 한 칸만 눈에 먼저 들어오게** 하는 것이다.
   * display(26) 에서 30 이면 나란히 놓았을 때 한눈에 구분되면서도 칸 높이가
   * 흔들리지 않는다.
   */
  feelsEmphasis: {
    fontSize: 30,
    lineHeight: 38,
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
