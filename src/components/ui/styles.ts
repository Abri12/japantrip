import { StyleSheet } from 'react-native';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  contactlessMark: {
    // 바깥 호가 아이콘 밖으로 나가는 부분은 잘라 낸다.
    overflow: 'hidden',
  },
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    // 큰 제목과 붙지 않게 띄우되, 화면 맨 위 여백은 Screen 이 이미 잡아 둔다.
    marginBottom: Spacing.four,
    paddingVertical: Spacing.one,
    paddingRight: Spacing.two,
  },
  backChevron: {
    // 「‹」 는 글꼴 기준선이 글자보다 위에 있어서 그냥 두면 「뒤로」와 어긋난다.
    lineHeight: 22,
  },
  header: {
    marginBottom: Spacing.six,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerSub: {
    marginTop: Spacing.two,
  },
  section: {
    marginBottom: Spacing.seven,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  sectionCaption: {
    marginTop: Spacing.half,
  },
  /** 제목 + 곁다리(금액 등) 한 줄 */
  sectionTitleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    flexShrink: 1,
  },
  /** 섹션 제목 왼쪽 색 막대. 제목 글자 높이에 맞춰 눈에 걸릴 만큼만. */
  sectionBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginTop: 3,
  },
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cardPadded: {
    padding: Spacing.four,
  },
  pressed: {
    opacity: 0.6,
  },
  rowGroup: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    overflow: 'hidden',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  rowLeading: {
    justifyContent: 'center',
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  rowSub: {
    marginTop: Spacing.half,
  },
  rowTrailing: {
    alignItems: 'flex-end',
  },
  chevron: {
    fontSize: 20,
    marginLeft: Spacing.one,
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half + 1,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  chip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  button: {
    paddingVertical: Spacing.four,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  statUnit: {
    marginLeft: Spacing.half,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 19,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    alignItems: 'center',
  },
});
