import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FxCorner } from './fx';
import { Txt } from './text';
import { styles } from './styles';

// ── 화면 골격 ──────────────────────────────────────────

export interface ScreenProps {
  /** 비워 두면 빈 화면이 된다 — 로딩 중 자리를 잡아 둘 때 쓴다 */
  children?: ReactNode;
  /** 큰 제목. 스크롤과 함께 밀려 올라간다 */
  title?: string;
  /**
   * 제목 앞에 붙는 이모지 (도시 랜드마크 등).
   *
   * 제목과 같은 Txt 안에 넣는다. 따로 View 로 빼면 큰 글씨의 기준선과 어긋나
   * 이모지가 살짝 떠 보이고, 제목이 길어 줄바꿈될 때 흐름도 끊긴다.
   */
  titleEmoji?: string;
  subtitle?: string;
  /**
   * 뒤로 가기 버튼을 제목 위에 그린다. 탭이 아닌, 밀어서 들어온 화면은 전부 켠다.
   *
   * 내비게이터가 그려 주는 헤더에 맡기지 않고 앱이 직접 그린다. 헤더는 스택에
   * 쌓인 화면이 둘 이상일 때만 뒤로 버튼을 내주는데, 웹에서는 주소를 직접 열거나
   * 새로고침하면 스택이 이 화면 하나로 시작해서 버튼이 사라진다. 그러면 사용자가
   * 그 화면에 갇힌다. 앱이 직접 그리면 어떤 경로로 들어와도 나갈 길이 있다.
   */
  back?: boolean;
  /**
   * 히스토리가 없을 때 돌아갈 곳. 기본은 홈이다.
   *
   * 「원래 눌러서 들어왔을 화면」을 넣는다. 장소 상세라면 목록(/places)이지
   * 홈이 아니다.
   */
  backFallback?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** 하단 고정 영역 (주요 행동 버튼) */
  footer?: ReactNode;
}

/**
 * 뒤로 가기 줄.
 *
 * `router.back()` 만 쓰면 안 된다 — 갈 곳이 없을 때 아무 일도 일어나지 않아서
 * 사용자는 버튼이 고장난 것처럼 느낀다. 그래서 갈 곳이 있는지 먼저 확인하고,
 * 없으면 들어왔을 화면으로 바꿔치기해 보낸다.
 */
function BackBar({ fallback }: { fallback: string }) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  };

  return (
    <Pressable
      onPress={goBack}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="뒤로 가기"
      style={({ pressed }) => [styles.backBar, pressed && styles.pressed]}>
      <Txt variant="title" color="textSecondary" style={styles.backChevron}>
        ‹
      </Txt>
      <Txt variant="body" color="textSecondary">
        뒤로
      </Txt>
    </Pressable>
  );
}

export function Screen({
  children,
  title,
  titleEmoji,
  subtitle,
  back,
  backFallback = '/',
  footer,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: BottomTabInset + Spacing.nine,
          },
        ]}>
        <View style={styles.column}>
          {back ? <BackBar fallback={backFallback} /> : null}
          {title ? (
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View style={styles.headerTitleCol}>
                  <Txt variant="display">
                    {titleEmoji ? `${titleEmoji} ` : ''}
                    {title}
                  </Txt>
                  {subtitle ? (
                    <Txt variant="body" color="textSecondary" style={styles.headerSub}>
                      {subtitle}
                    </Txt>
                  ) : null}
                </View>
                <FxCorner />
              </View>
            </View>
          ) : null}
          {children}
        </View>
      </ScrollView>

      {footer ? (
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.four },
          ]}>
          <View style={styles.column}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * 구역. 여백과 제목으로 나누되, 제목 옆 색 막대로 시작점을 눈에 띄게 한다.
 * `action` 은 오른쪽 끝에 놓이는 보조 링크다.
 */
export function Section({
  title,
  caption,
  action,
  children,
}: {
  title?: string;
  caption?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      {title ? (
        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleWrap}>
            {/* 제목 왼쪽의 색 막대.
                구역이 여백만으로 나뉘어 있어서, 스크롤하다 보면 어디서 새 구역이
                시작하는지 눈에 걸리는 지점이 없었다. 짧은 색 막대 하나면 훑을 때
                시선이 걸린다 — 글을 늘리지 않고 구조만 드러내는 방법이다. */}
            <View style={[styles.sectionBar, { backgroundColor: theme.primary }]} />
            <View style={styles.flexShrink}>
              <Txt variant="title">{title}</Txt>
              {caption ? (
                <Txt variant="caption" color="textTertiary" style={styles.sectionCaption}>
                  {caption}
                </Txt>
              ) : null}
            </View>
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

