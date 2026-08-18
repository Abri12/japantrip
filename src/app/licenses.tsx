/**
 * 오픈소스 라이선스 고지.
 *
 * Pretendard 는 SIL Open Font License 1.1 로 배포된다. OFL 은 저작권 고지와
 * 라이선스 전문을 함께 배포할 것을 요구하므로, 파일(assets/fonts)로 넣는 것에
 * 더해 앱 안에서도 볼 수 있게 둔다. 심사나 문의가 들어왔을 때 근거가 된다.
 */

import { Card, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

interface Dependency {
  name: string;
  license: string;
  holder: string;
  note?: string;
}

const FONTS: Dependency[] = [
  {
    name: 'Pretendard',
    license: 'SIL Open Font License 1.1',
    holder: 'Copyright (c) 2021, Kil Hyung-jin',
    note: '상업 이용을 포함해 자유롭게 쓸 수 있어요. 라이선스 전문은 앱에 함께 담겨 있어요.',
  },
];

const LIBRARIES: Dependency[] = [
  { name: 'React Native', license: 'MIT', holder: 'Meta Platforms, Inc.' },
  { name: 'Expo', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'React', license: 'MIT', holder: 'Meta Platforms, Inc.' },
];

const DATA_SOURCES: Dependency[] = [
  {
    name: 'P2P지진정보 (P2PQuake)',
    license: '무료 · 상업 이용 허용',
    holder: '원본 발표: 일본 기상청(JMA)',
    note: '지진·긴급지진속보 정보를 여기서 받아와요.',
  },
];

export default function LicensesScreen() {
  return (
    <Screen back title="오픈소스 라이선스" subtitle="이 앱이 쓰고 있는 것들이에요">
      <Section title="서체">
        {FONTS.map((d) => (
          <Card key={d.name} style={styles.card}>
            <Txt variant="subtitle">{d.name}</Txt>
            <Txt variant="caption" color="textTertiary" style={styles.gap}>
              {d.license}
            </Txt>
            <Txt variant="caption" color="textTertiary">
              {d.holder}
            </Txt>
            {d.note ? (
              <Txt variant="body" color="textSecondary" style={styles.gap}>
                {d.note}
              </Txt>
            ) : null}
          </Card>
        ))}
      </Section>

      <Section title="라이브러리">
        <RowGroup>
          {LIBRARIES.map((d, i) => (
            <Row
              key={d.name}
              title={d.name}
              subtitle={d.holder}
              trailing={d.license}
              last={i === LIBRARIES.length - 1}
            />
          ))}
        </RowGroup>
      </Section>

      <Section title="데이터 출처">
        {DATA_SOURCES.map((d) => (
          <Card key={d.name} style={styles.card}>
            <Txt variant="subtitle">{d.name}</Txt>
            <Txt variant="caption" color="textTertiary" style={styles.gap}>
              {d.license} · {d.holder}
            </Txt>
            {d.note ? (
              <Txt variant="body" color="textSecondary" style={styles.gap}>
                {d.note}
              </Txt>
            ) : null}
          </Card>
        ))}
      </Section>

      <Txt variant="caption" color="textTertiary">
        교통·관광 정보는 직접 조사해 정리한 내용이에요. 요금과 운영 방식은 바뀔 수 있으니
        중요한 결정은 판매처나 공식 안내를 함께 확인해 주세요.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.three,
  },
  gap: {
    marginTop: Spacing.two,
  },
});
