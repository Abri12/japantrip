import { StyleSheet } from 'react-native';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  /* `minWidth: 0` 이 있어야 이 칸이 내용보다 작게 줄어든다. 없으면 긴 역
     이름이 칸을 밀어내서 `flex: 1` 이 아무 일도 못 한다(웹에서 특히). */
  flexShrink: { flex: 1, minWidth: 0 },
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
    /*
     * 위를 기준으로 세운다.
     *
     * 가운데 정렬은 줄이 한 줄일 때만 맞다. 왼쪽 글이 세 줄로 늘어나면
     * 오른쪽 값이 **가운데 줄 옆**에 가서 붙는데, 그러면 「다니마치욘초메역」
     * 과 「공원 무료 · 천수각 1,200엔」이 한 문장처럼 읽힌다.
     *
     * 오른쪽 값이 짝지어야 하는 것은 **제목**이다. 그래서 둘 다 위에 세운다.
     */
    alignItems: 'flex-start',
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  rowLeading: {
    justifyContent: 'center',
    // 아이콘은 줄이 길어져도 가운데가 자연스럽다 — 짝지을 글이 없어서다
    alignSelf: 'center',
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
    /*
     * 오른쪽 칸에 **상한을 준다.**
     *
     * 없으면 「공원 무료 · 천수각 1,200엔」처럼 긴 값이 제 폭을 다 가져가고,
     * 왼쪽은 남는 자리에 밀려 들어가 역 이름이 세 줄로 쪼개진다. 폰 폭에서만
     * 벌어지는 일이라 넓은 화면으로 보면 멀쩡해 보인다.
     *
     * 왼쪽이 주인공이다 — 목록에서 고르는 것은 **장소**지 요금이 아니다.
     */
    flexShrink: 1,
    maxWidth: '34%',
  },
  chevron: {
    fontSize: 20,
    marginLeft: Spacing.one,
    alignSelf: 'center',
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
