/**
 * 입국 심사 · 세관 신고 — 비짓 재팬 웹 + 통합 키오스크.
 *
 * 확인한 사실 (2026년 8월 기준):
 * 간사이공항과 하네다 T2에 2025년 4월 1일 통합 키오스크가 먼저 도입됐고,
 * 나리타 T3도 뒤이어 도입되어 2026년 현재 하네다·나리타·간사이 3개 공항에서
 * 운영 중이다. 여권 + QR 하나로 입국심사·세관신고를 한 기계에서 끝내
 * 20~30분을 아낀다는 점까지 복수 출처로 확인했다.
 *
 * 다만 이 3개 공항 밖(신치토세·후쿠오카 등)은 통합 키오스크가 없을 수 있어
 * 그 사실도 함께 적어 둔다 — 없는 공항에서 있는 것처럼 안내하면 헤매게 된다.
 */

import { StyleSheet, View } from 'react-native';

import { Badge, Card, Screen, Section, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const JOINT_KIOSK_AIRPORTS = ['간사이공항(KIX)', '하네다공항(HND) T2', '나리타공항(NRT) T3'];

interface Step {
  emoji: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    emoji: '📝',
    title: '한국 출발 전 — 비짓 재팬 웹 작성',
    body: '입국심사·세관신고·검역 정보를 미리 웹에서 입력해요(visitjapanweb.digital.go.jp). 완료하면 통합 QR 코드 하나가 발급돼요.',
  },
  {
    emoji: '📸',
    title: 'QR을 스크린샷으로 저장해두세요',
    body: '⚠️ 공항 와이파이가 느리거나 안 터질 수 있어요. 화면을 캡처해서 사진첩에 저장해두면 인터넷 없이도 바로 꺼내 보여줄 수 있어요.',
    // 팁이 아니라 경고이므로 emoji 자체에 넣었다
  },
  {
    emoji: '🛂',
    title: '입국 심사대 — 통합 키오스크로',
    body: '간사이·하네다·나리타 세 공항은 여권과 QR 코드를 기계 하나에 스캔하면 입국심사와 세관신고가 동시에 끝나요. 지문·안면 촬영이 함께 진행돼요.',
  },
  {
    emoji: '✅',
    title: '완료 — 별도 세관 줄 없이 바로 출구로',
    body: '예전처럼 세관신고서를 따로 내거나 줄을 서지 않아도 돼요. 통합 키오스크를 통과하면 그대로 입국장을 빠져나가면 끝이에요.',
  },
];

export default function EntryGuideScreen() {
  const theme = useTheme();

  return (
    <Screen
      back
      title="입국 심사 · 세관 신고"
      subtitle="비짓 재팬 웹 하나로 두 절차가 한 번에 끝나요">
      <Section title="순서">
        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepDot, { backgroundColor: theme.primarySoft }]}>
                <Txt style={styles.stepEmoji}>{step.emoji}</Txt>
              </View>
              {i < STEPS.length - 1 ? (
                <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
              ) : null}
            </View>
            <Card
              style={styles.stepCard}
              accent={step.title.includes('스크린샷') ? theme.warning : undefined}>
              <Txt variant="subtitle">{step.title}</Txt>
              <Txt variant="body" color="textSecondary" style={styles.stepBody}>
                {step.body}
              </Txt>
            </Card>
          </View>
        ))}
      </Section>

      <Section title="통합 키오스크가 있는 공항" caption="이 셋 말고는 예전처럼 따로 처리해요">
        <Card>
          <View style={styles.airportRow}>
            {JOINT_KIOSK_AIRPORTS.map((a) => (
              <Badge key={a} label={a} tone="primary" />
            ))}
          </View>
          <Txt variant="body" color="textSecondary" style={styles.stepBody}>
            신치토세·후쿠오카 등 다른 공항은 아직 통합 키오스크가 없어요. 입국심사와 세관신고를
            각각 따로 거치되, 비짓 재팬 웹 QR은 그대로 쓸 수 있어요.
          </Txt>
        </Card>
      </Section>

      <Txt variant="caption" color="textTertiary">
        절차는 계속 바뀔 수 있어요. 출발 전 비짓 재팬 웹 공식 안내를 한 번 더 확인하는 걸
        추천해요.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stepLeft: {
    alignItems: 'center',
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepEmoji: {
    fontSize: 18,
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: Spacing.one,
  },
  stepCard: {
    flex: 1,
    marginBottom: Spacing.four,
  },
  stepBody: {
    marginTop: Spacing.two,
  },
  airportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
