import { ReactNode } from 'react';
import { Pressable, PressableProps, View, ViewProps, ViewStyle } from 'react-native';
import { AccentBarWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Txt } from './text';
import { styles } from './styles';

// ── 카드 ───────────────────────────────────────────────

export interface CardProps extends ViewProps {
  children: ReactNode;
  /** 왼쪽 색 띠 — 상태를 나타낼 때만 쓴다 */
  accent?: string;
  padded?: boolean;
}

export function Card({ children, accent, padded = true, style, ...rest }: CardProps) {
  const theme = useTheme();

  /*
   * 테두리 굵기를 **네 방향 모두 항상 명시한다.**
   *
   * 예전에는 `accent` 가 있을 때만 `{ borderLeftWidth, borderLeftColor }` 객체를
   * 스타일 배열에 끼워 넣었다. 그러면 accent 가 사라질 때 속성 자체가 스타일에서
   * 빠지는데, 안드로이드는 그때 배경 드로어블을 다시 만들면서 자식 뷰를 덮어
   * 버린다 — 카드 배경만 남고 이모지와 글자가 사라진다.
   *
   * 준비물 체크리스트에서 체크를 풀 때 재현됐다(체크 시 success → 해제 시
   * accent 없음). 경고 항목은 두 상태 모두 accent 가 있어서 멀쩡했던 것이
   * 원인을 가리키는 단서였다.
   *
   * 값만 바뀌고 속성 목록의 모양이 바뀌지 않으면 이 문제가 생기지 않는다.
   *
   * ── 이제는 항상 1 이다 ──────────────────────────
   *
   * 예전에는 배경색 차이만으로 카드를 띄우고 테두리는 특수한 경우에만 그렸다.
   * 그 차이가 너무 작아 실제로는 경계가 보이지 않았고, 「박스도 치고」라는
   * 피드백이 그 얘기였다. 이제 모든 카드가 테두리를 갖는다 — 위 불변식은
   * 그대로다(네 방향 모두 항상 명시).
   */
  const edge = 1;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderTopWidth: edge,
          borderRightWidth: edge,
          borderBottomWidth: edge,
          borderLeftWidth: accent ? AccentBarWidth : edge,
          borderTopColor: theme.border,
          borderRightColor: theme.border,
          borderBottomColor: theme.border,
          borderLeftColor: accent ?? theme.border,
        },
        padded && styles.cardPadded,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

/** 눌리는 카드. 목록 항목에 쓴다. */
export function PressCard({
  children,
  accent,
  style,
  ...rest
}: PressableProps & { children: ReactNode; accent?: string; style?: ViewStyle }) {
  return (
    <Pressable {...rest} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card accent={accent} style={style}>
        {children}
      </Card>
    </Pressable>
  );
}

/**
 * 리스트 한 줄. 왼쪽에 아이콘/이모지, 가운데 제목·설명, 오른쪽에 값과 화살표.
 * 앱 전반의 목록이 전부 이 모양이라 여기 하나만 손보면 다 같이 바뀐다.
 */
export function Row({
  leading,
  title,
  titleBadge,
  subtitle,
  subtitleProminent,
  trailing,
  trailingSub,
  chevron,
  onPress,
  last,
}: {
  leading?: ReactNode;
  title: string;
  /** 이름 바로 옆에 붙는 뱃지 — 패스 적용 여부처럼 한눈에 봐야 하는 것만 */
  titleBadge?: ReactNode;
  subtitle?: string;
  /**
   * 부제를 본문 크기로 키운다.
   *
   * 기본 캡션 크기는 「난바역 도보 5분」처럼 훑고 지나가는 짧은 값에 맞춘
   * 것이다. 읽어야 하는 문장이 들어갈 때는 작은 회색 글씨가 그대로 부담이
   * 되므로 본문 크기로 올린다.
   */
  subtitleProminent?: boolean;
  trailing?: string;
  /**
   * 오른쪽 아래 보조 문구.
   *
   * 문자열이면 캡션으로 그려 준다. 노선 색 점처럼 글자만으로는 안 되는 게
   * 들어갈 때는 노드를 그대로 넘긴다.
   */
  trailingSub?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  /** 마지막 줄이면 구분선을 그리지 않는다 */
  last?: boolean;
}) {
  const theme = useTheme();

  const content = (
    /* Card 와 같은 이유로 굵기를 항상 명시한다. `last` 는 고정처럼 보이지만
       목록을 필터링하면 마지막 항목이 바뀌어서(관광·맛집 화면) 실제로 토글된다. */
    <View
      style={[
        styles.row,
        { borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.border },
      ]}>
      {leading ? <View style={styles.rowLeading}>{leading}</View> : null}

      <View style={styles.flexShrink}>
        {/* 이름이 길면 줄바꿈되고 뱃지는 그 아래로 흐른다 */}
        <View style={styles.rowTitleLine}>
          <Txt variant="subtitle">{title}</Txt>
          {titleBadge}
        </View>
        {subtitle ? (
          <Txt
            variant={subtitleProminent ? 'body' : 'caption'}
            color={subtitleProminent ? 'textSecondary' : 'textTertiary'}
            style={styles.rowSub}>
            {subtitle}
          </Txt>
        ) : null}
      </View>

      {/* 두 줄에서 자른다. 왼쪽이 보통 두 줄(이름 + 역)이라 오른쪽도 거기
          맞춰야 줄 높이가 고르고, 값 하나가 길다고 줄 전체가 늘어나지 않는다.
          잘린 값의 전문은 열면 있다. */}
      <View style={styles.rowTrailing}>
        {trailing ? (
          <Txt variant="bodyBold" numberOfLines={2}>
            {trailing}
          </Txt>
        ) : null}
        {typeof trailingSub === 'string' ? (
          <Txt variant="caption" color="textTertiary" numberOfLines={2}>
            {trailingSub}
          </Txt>
        ) : (
          trailingSub
        )}
      </View>

      {chevron ? (
        <Txt variant="body" color="textTertiary" style={styles.chevron}>
          ›
        </Txt>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

/** Row 여러 개를 감싸는 그룹. 카드 하나처럼 보이게 한다. */
export function RowGroup({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    // 카드와 같은 테두리를 준다. 「카드 하나처럼」이 목적인데 한쪽만 경계가
    // 있으면 같은 화면에서 두 종류의 상자처럼 보인다.
    <View
      style={[styles.rowGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {children}
    </View>
  );
}

