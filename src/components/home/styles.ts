import { StyleSheet } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  heroSpaced: {
    marginBottom: Spacing.three,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  /** 카드 오른쪽 위에 옅게 깔리는 배경 장식 */
  heroEmojiGhost: {
    position: 'absolute',
    opacity: 0.14,
    fontSize: 64,
    lineHeight: 70,
    top: -12,
    right: -8,
    transform: [{ rotate: '12deg' }],
  },
  heroSub: {
    marginTop: Spacing.half,
  },
  heroMeta: {
    marginTop: Spacing.two,
  },
  heroChevron: {
    fontSize: 20,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  statusHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  statusBody: {
    marginTop: Spacing.two,
  },
  hazardLine: {
    marginTop: Spacing.one,
  },
  /**
   * 「지금 상황」 카드 안에서 따로 눌리는 한 구역.
   *
   * 카드의 padding 을 끄고 구역마다 여백을 갖는다. 구분선이 카드 폭을 꽉
   * 채워야 「누르는 경계」로 읽히기 때문이다.
   */
  zone: {
    padding: Spacing.four,
  },
  zoneDivider: {
    height: 1,
  },
  /** 한 줄짜리 구역 — 글과 화살표를 양끝으로 민다 */
  zoneLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  /** 오른쪽 끝의 뱃지 + 화살표 묶음 */
  zoneTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  /** 날씨 위젯 — 이모지 · 기온 · 뱃지 한 줄 */
  widget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  widgetEmoji: {
    fontSize: 40,
    lineHeight: 46,
  },
  /** 기온 칸이 남는 폭을 다 먹어야 뱃지와 화살표가 오른쪽 끝에 붙는다 */
  widgetBody: {
    flex: 1,
  },
  /** 큰 기온 옆에 날씨 이름을 붙인다. 아래선을 맞춰야 나란히 읽힌다. */
  widgetTempLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  quietLine: {
    marginTop: Spacing.three,
  },
  flexShrink: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
