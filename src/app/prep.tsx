import { useRouter } from 'expo-router';

import { IconCircle, Row, RowGroup, Screen, Section } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

/**
 * 여행 준비 — 도시와 상관없는 안내를 한곳에 모았다.
 *
 * 원래는 이 항목들이 도시 홈 안에 있었다. 그런데 입국 심사·면세·준비물·예절은
 * 오사카를 가든 후쿠오카를 가든 내용이 같다. 도시 홈에 두면 두 가지가 어긋난다:
 *
 * 1. **도시를 고르기 전에는 볼 수 없었다.** 정작 준비물과 입국 절차는 도시를
 *    정하기 전, 항공권만 끊은 시점에 가장 많이 찾아보는 내용이다.
 * 2. 도시별 화면인데 도시와 무관한 줄이 절반을 차지했다.
 *
 * 그래서 별도 화면으로 빼고, 도시 선택 화면과 도시 홈 양쪽에서 들어오게 했다.
 */
export default function PrepScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen
      back
      title="여행 준비"
      subtitle="어느 도시로 가든 똑같이 챙길 것들이에요">
      <Section title="떠나기 전에" caption="출발 전에 끝내두면 공항에서 헤매지 않아요">
        <RowGroup>
          <Row
            leading={<IconCircle emoji="🧳" tone={theme.primarySoft} />}
            title="여행 준비물"
            subtitle="일본이라서 특히 챙길 것들"
            chevron
            onPress={() => router.push('/packing')}
          />
          <Row
            leading={<IconCircle emoji="🛂" tone={theme.primarySoft} />}
            title="입국 심사 · 세관 신고"
            subtitle="비짓 재팬 웹 QR 하나로 끝내는 법"
            chevron
            last
            onPress={() => router.push('/entry-guide')}
          />
        </RowGroup>
      </Section>

      <Section title="현지에서" caption="가서 바로 쓰는 내용이에요">
        <RowGroup>
          <Row
            leading={<IconCircle emoji="💬" tone={theme.primarySoft} />}
            title="현지 예절 · 생존 회화"
            subtitle="식당 필수어부터 대중교통 매너까지"
            chevron
            onPress={() => router.push('/etiquette')}
          />
          <Row
            leading={<IconCircle emoji="🛍️" tone={theme.primarySoft} />}
            title="면세 계산기"
            subtitle="2026.11.1부터 환급 방식이 바뀌어요"
            chevron
            last
            onPress={() => router.push('/tax-free')}
          />
        </RowGroup>
      </Section>
    </Screen>
  );
}
