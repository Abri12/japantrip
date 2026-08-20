import { Component, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Txt } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { reportError } from '@/lib/error-report';

/**
 * 화면 하나가 죽어도 앱 전체가 흰 화면이 되지 않게.
 *
 * ## 무엇이 문제였나
 *
 * 리액트는 그리는 도중에 오류가 나면 **화면 트리를 통째로 버린다.** 잡아 주는
 * 것이 없으면 남는 것은 빈 화면이고, 사용자에게는 앱이 「안 켜지는」 것으로
 * 보인다. 여행 중에 그건 앱이 없는 것과 같다.
 *
 * 게다가 그 사실이 밖으로 나오지도 않았다. 사용자는 앱을 지우고, 우리는 왜
 * 지웠는지 모른다.
 *
 * ## 무엇을 하나
 *
 * 오류를 잡아 **되돌릴 방법이 있는 화면**을 대신 그리고, 같은 오류를 서버로
 * 한 번 보고한다. 사용자는 다시 시도하거나 처음으로 돌아갈 수 있다.
 *
 * ## 왜 클래스인가
 *
 * 오류를 잡는 기능은 리액트가 클래스 컴포넌트에만 열어 뒀다. 이 앱에서 클래스가
 * 여기 하나뿐인 이유이고, 다른 방법이 없어서 그렇다.
 *
 * ## 어디에 두나
 *
 * 최상위(`app/_layout.tsx`)의 **제공자들 바깥쪽**에 둔다. 안쪽에 두면 도시
 * 선택이나 환율 제공자가 죽었을 때 잡지 못한다 — 그 둘은 저장소와 네트워크를
 * 만지는 자리라 오히려 죽을 가능성이 있는 쪽이다.
 *
 * 그래서 이 화면은 **어떤 제공자도 쓰지 않는다.** 테마 훅만 쓰는데 그건
 * 시스템 설정을 읽을 뿐 제공자가 필요 없다.
 */

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    reportError(error, `render:${componentName(info.componentStack)}`);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return <Fallback error={this.state.error} onRetry={this.reset} />;
  }
}

/**
 * 오류가 난 컴포넌트 이름만 뽑는다.
 *
 * 여기서는 라우터를 읽을 수 없다 — 라우터가 죽어서 여기 온 것일 수도 있기
 * 때문이다. 대신 리액트가 준 컴포넌트 스택의 첫 줄을 쓴다.
 *
 * 그 줄에는 번들 주소가 붙어 온다:
 * `at WeatherBody (http://.../entry-8ad842198f.js:1097:144)`
 *
 * 그대로 두면 두 가지가 나빠진다 — **빌드할 때마다 해시가 바뀌어 같은 오류가
 * 매번 새 줄로 쌓이고**, 서버에 사용자가 접속한 주소가 남는다. 괄호 앞에서
 * 자르면 둘 다 사라지고 묶기도 제대로 된다.
 */
function componentName(componentStack?: string | null): string {
  const lines = (componentStack ?? '').trim().split(/\r?\n/);
  const first = lines[0]?.trim() ?? '';
  const name = first.replace(/^at\s+/, '').split(' (')[0].trim();
  return name || 'unknown';
}

/**
 * 죽었을 때 대신 보여 주는 화면.
 *
 * 사과문만 띄우고 끝내지 않는다. **여행 중에 이 화면을 본 사람에게 필요한 건
 * 위로가 아니라 다음 동작**이라, 되돌릴 방법을 먼저 놓는다.
 */
function Fallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Txt variant="display">화면을 그리지 못했어요</Txt>
        <Txt variant="body" color="textSecondary" style={styles.line}>
          앱이 잘못돼서 이 화면만 멈췄어요. 아래 버튼으로 다시 열어 보세요.
          그래도 안 되면 앱을 완전히 껐다 켜면 대개 돌아옵니다.
        </Txt>

        {/*
          여행 정보는 대부분 앱 안에 들어 있어서 인터넷이 없어도 열린다.
          그 사실을 여기서 알려 준다 — 화면이 죽었다고 정보까지 사라진 줄
          알고 앱을 지우는 편이 훨씬 나쁜 결과다.
        */}
        <Txt variant="body" color="textSecondary" style={styles.line}>
          공항 가는 법·교통패스 같은 정보는 앱 안에 저장돼 있어서, 이 화면이
          멈춰도 다른 화면은 그대로 볼 수 있어요.
        </Txt>

        <View style={styles.actions}>
          <Button label="다시 열어보기" onPress={onRetry} />
        </View>

        {/*
          오류 원문을 접어 두지 않고 그냥 보여 준다. 어차피 한국어로 옮길 수
          없는 글이고, 문의를 받을 때 이 한 줄이 있으면 원인을 훨씬 빨리
          찾는다. 사용자가 읽을 필요는 없다는 것만 분명히 적어 둔다.
        */}
        <Card style={styles.detail}>
          <Txt variant="caption" color="textTertiary">
            아래는 개발자용 기록이에요. 읽지 않으셔도 돼요.
          </Txt>
          <Txt variant="caption" color="textTertiary" style={styles.line}>
            {error.message}
          </Txt>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: Spacing.five,
    paddingTop: Spacing.nine,
    gap: Spacing.three,
    // 다른 화면과 같은 폭으로 묶는다. 넓은 창에서 버튼이 화면 끝까지
    // 늘어나면 이 화면만 다른 앱처럼 보인다.
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  line: { marginTop: Spacing.two },
  actions: { marginTop: Spacing.four },
  detail: { marginTop: Spacing.five },
});
