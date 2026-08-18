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
  spaced: {
    marginBottom: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
});
