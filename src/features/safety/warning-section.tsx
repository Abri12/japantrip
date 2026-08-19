import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Badge, Card, Empty, Section, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { WarningReport, WarningSeverity, fetchWarnings } from '@/lib/jma-warnings';
import { withEunNeun } from '@/lib/korean';

import { styles } from './styles';

/**
 * 기상청 경보·주의보 — 태풍이 오면 이 자리에 호우·폭풍 경보가 뜬다.
 *
 * 태풍 전용 API 대신 이 경보·주의보 API를 쓴 이유는 코드 상단 주석
 * (lib/jma-warnings.ts) 참조. 여기서는 travelCriticalWarnings 로 거르지 않고
 * **전부** 보여준다 — 안전 탭은 상세를 보러 오는 곳이라 주의보 수준까지
 * 다 아는 편이 낫다(홈 화면 요약 카드와의 역할 차이다).
 */
export function WarningSection({ city }: { city: { name: string; jmaAreaCode: string } }) {
  const theme = useTheme();
  const [report, setReport] = useState<WarningReport | null>(null);

  /* 도시가 바뀌면 **리마운트**된다(라우트에서 key 를 준다). 그래서 여기서
     report 를 null 로 되돌릴 필요가 없다 — 새 인스턴스는 처음부터 null 이다.
     예전에는 이 효과 안에서 직접 되돌렸는데, 효과 안의 동기 setState 는
     렌더를 한 번 더 돌게 만든다. key 로 갈아끼우는 쪽이 React 가 권하는
     방법이고 결과도 같다. */
  useEffect(() => {
    fetchWarnings(city.jmaAreaCode).then(setReport);
  }, [city]);

  const colorOf = (s: WarningSeverity) =>
    s === 'emergency' ? theme.danger : s === 'warning' ? theme.warning : theme.textSecondary;

  return (
    <Section title="기상 경보 · 주의보" caption="태풍이 오면 호우·폭풍 경보로 알려드려요">
      {report === null ? (
        <Empty text="불러오고 있어요" />
      ) : report.active.length === 0 ? (
        <Card accent={theme.success}>
          <View style={styles.head}>
            {/* 앱 전체가 해요체다. 여기만 「발효 중인 특보 없음」처럼 명사로
                끊으면 다른 카드와 말투가 어긋난다. */}
            <Txt variant="subtitle">발효 중인 특보는 없어요</Txt>
            <Badge label="이상 없음" tone="success" />
          </View>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            {withEunNeun(city.name)} 지금 기상 경보나 주의보가 걸려 있지 않아요.
          </Txt>
        </Card>
      ) : (
        report.active.map((w) => (
          <Card key={w.code} accent={colorOf(w.severity)} style={styles.card}>
            <View style={styles.head}>
              <Txt variant="subtitle" tint={colorOf(w.severity)}>
                {w.label}
              </Txt>
              <Badge
                label={w.severity === 'emergency' ? '특별경보' : w.severity === 'warning' ? '경보' : '주의보'}
                tone={w.severity === 'emergency' ? 'danger' : w.severity === 'warning' ? 'warning' : 'neutral'}
              />
            </View>
          </Card>
        ))
      )}
    </Section>
  );
}
