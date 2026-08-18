import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * 입력어 수집 동의를 묻는 창.
 *
 * ── 왜 이런 모양인가 ────────────────────────────────
 *
 * 동의 창은 마음만 먹으면 얼마든지 「예」를 누르게 만들 수 있다. 수락 버튼만
 * 색을 칠하거나, 거절을 흐린 작은 글씨로 두거나, 「도움을 거부할래요」처럼 죄책감을
 * 주는 문구를 쓰면 동의율은 확실히 오른다.
 *
 * 그렇게 받은 건 동의가 아니다. 나중에 문제가 되는 것도 그렇게 받은 쪽이고,
 * 무엇보다 **그 데이터는 사실이 아니다** — 사람들이 원해서 준 게 아니라 눌리도록
 * 설계돼서 눌린 것이라, 그걸 근거로 앱을 고치면 엉뚱한 방향으로 간다.
 *
 * 그래서 두 버튼의 크기·색·무게를 같게 두고, 무엇을 모으고 무엇을 안 모으는지
 * 구체적으로 적는다. 「서비스 개선을 위해」 같은 뭉뚱그린 말은 쓰지 않는다.
 *
 * 거절은 그 회차에만 적용한다. 한 번의 무심한 거절이 영원히 굳는 것도 이상하기
 * 때문이다. 대신 「오늘 하루는 묻지 않기」를 같이 둬서, 귀찮은 사람은 하루를
 * 통째로 끌 수 있게 한다. 조르지 않으면서 기회는 남기는 절충이다.
 */
export type ConsentAnswer = 'yes' | 'no' | 'snooze';

export function ConsentSheet({
  visible,
  onAnswer,
}: {
  visible: boolean;
  onAnswer: (answer: ConsentAnswer) => void;
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onAnswer('no')}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <Txt style={styles.emoji}>📝</Txt>

          <Txt variant="subtitle" style={styles.title}>
            적어주신 후보를 모아도 될까요?
          </Txt>

          <Txt variant="body" color="textSecondary" style={styles.body}>
            여기 적히는 가게·메뉴 이름이 앱에 없는 곳을 찾는 데 제일 큰 도움이 돼요.
            사람들이 실제로 찾는 곳을 채워 넣을 수 있거든요.
          </Txt>

          {/* 뭉뚱그리지 않고 항목으로 적는다. 「무엇을 안 모으는지」가 특히 중요한데,
              사다리에는 친구 이름이 적히는 일이 많아서 그 걱정이 가장 크기 때문이다. */}
          <View style={[styles.facts, { backgroundColor: theme.background }]}>
            <Fact ok text="적으신 가게 · 메뉴 이름" />
            <Fact ok={false} text="사람 이름처럼 보이는 건 저장하지 않아요" />
            <Fact ok={false} text="누가 적었는지는 알 수 없어요" />
            <Fact ok={false} text="지금은 폰 밖으로 나가지 않아요" />
          </View>

          <Txt variant="caption" color="textTertiary" style={styles.note}>
            안 하셔도 사다리타기는 그대로 쓸 수 있어요. 나중에 「내 사용 기록」에서 언제든
            바꾸거나 지울 수 있고요.
          </Txt>

          {/* 두 버튼의 무게를 같게 둔다. 한쪽만 강조하면 그건 선택지가 아니다. */}
          <View style={styles.buttons}>
            <Pressable
              onPress={() => onAnswer('no')}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: theme.background, opacity: pressed ? 0.7 : 1 },
              ]}>
              <Txt variant="bodyBold">괜찮아요</Txt>
            </Pressable>
            <Pressable
              onPress={() => onAnswer('yes')}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: theme.background, opacity: pressed ? 0.7 : 1 },
              ]}>
              <Txt variant="bodyBold" tint={theme.primary}>
                모아도 돼요
              </Txt>
            </Pressable>
          </View>

          {/* 거절은 그 회차에만 적용하고 다음에 또 묻는다. 그러면 귀찮아지는
              사람이 반드시 생기므로, 하루를 통째로 끌 수 있는 길을 같이 준다.
              작게 두되 숨기지는 않는다 — 찾기 어려우면 없는 것과 같다. */}
          <Pressable
            onPress={() => onAnswer('snooze')}
            style={({ pressed }) => [styles.snooze, { opacity: pressed ? 0.6 : 1 }]}>
            <Txt variant="caption" color="textTertiary">
              오늘 하루는 묻지 않기
            </Txt>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Fact({ ok, text }: { ok: boolean; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.factRow}>
      <Txt variant="caption" tint={ok ? theme.primary : theme.textTertiary}>
        {ok ? '모아요' : '안 모아요'}
      </Txt>
      <Txt variant="caption" color="textSecondary" style={styles.factText}>
        {text}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  sheet: {
    borderRadius: Radius.lg,
    padding: Spacing.five,
    // 폭을 안 막으면 태블릿·웹에서 가로로 꽉 차 글이 한 줄에 너무 길어진다.
    // 한 줄이 길수록 눈이 다음 줄 첫머리를 찾기 어려워 읽기가 힘들어진다.
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  emoji: {
    fontSize: 34,
    lineHeight: 40,
  },
  title: {
    marginTop: Spacing.three,
  },
  body: {
    marginTop: Spacing.three,
  },
  facts: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.md,
    gap: Spacing.three,
  },
  factRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  factText: {
    flex: 1,
  },
  note: {
    marginTop: Spacing.four,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.five,
  },
  snooze: {
    alignSelf: 'center',
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.four,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
