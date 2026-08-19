import { View } from 'react-native';
import {
  Badge,
  Card,
  Empty,
  IconCircle,
  Row,
  RowGroup,
  Screen,
  Section,
  Txt,
} from '@/components/ui';
import {
  EMERGENCY_CONTACTS,
  EewCard,
  HeatSection,
  QuakeCard,
  WarningSection,
  call,
  hhmm,
  styles,
} from '@/features/safety';
import { useQuakes } from '@/hooks/use-quakes';
import { useTheme } from '@/hooks/use-theme';
import { useSelectedCity } from '@/lib/selected-city';
export default function SafetyScreen() {
  const { quakes, eew, loading, error, updatedAt } = useQuakes();
  const { city } = useSelectedCity();
  const theme = useTheme();

  const activeEew = eew.filter((e) => !e.cancelled);

  // 고른 도시가 실제로 흔들린 지진만 따로 앞에 뽑는다.
  // 일본 전역 목록에서 내 지역을 눈으로 찾는 건 급할 때 할 일이 아니다.
  const nearby = city
    ? quakes.filter((q) => q.points.some((p) => p.pref === city.prefecture))
    : [];

  return (
    <Screen
      title="안전"
      subtitle={
        updatedAt
          ? `일본 기상청(JMA) 발표 · ${hhmm(updatedAt)} 기준`
          : '일본 기상청 발표를 실시간으로 받아오고 있어요'
      }>
      {error ? (
        <Section>
          <Card accent={theme.warning}>
            <Txt variant="subtitle">정보를 못 가져왔어요</Txt>
            <Txt variant="body" color="textSecondary" style={styles.gap}>
              {error}
            </Txt>
          </Card>
        </Section>
      ) : null}

      {activeEew.length > 0 ? (
        <Section title="긴급지진속보" caption="흔들림이 오기 전에 미리 알려주는 정보예요">
          {activeEew.map((e) => (
            <EewCard key={e.id} event={e} pref={city?.prefecture} cityName={city?.name} />
          ))}
        </Section>
      ) : city ? (
        <Section title="긴급지진속보">
          <Card accent={theme.success}>
            <View style={styles.head}>
              <Txt variant="subtitle">{city.name}에 지진 걱정은 없어요</Txt>
              <Badge label="이상 없음" tone="success" />
            </View>
            <Txt variant="body" color="textSecondary" style={styles.gap}>
              발령 중인 지진 경보가 없어요. 경보가 뜨면 여기 바로 알려드릴게요.
            </Txt>
          </Card>
        </Section>
      ) : null}

      {city ? <WarningSection city={city} /> : null}
      {city ? <HeatSection city={city} /> : null}

      {city && nearby.length > 0 ? (
        <Section
          title={`${city.name} 근처에서 있었던 지진`}
          caption="이 근처에서 실제로 느껴진 것만 골랐어요">
          {nearby.slice(0, 5).map((q) => (
            <QuakeCard key={`near-${q.id}`} quake={q} pref={city.prefecture} />
          ))}
        </Section>
      ) : city ? (
        <Section title={`${city.name} 근처`}>
          <Empty text={`최근 ${city.name} 주변에서 느껴진 지진이 없어요.`} />
        </Section>
      ) : null}

      <Section title="일본 전체 최근 지진">
        {loading && quakes.length === 0 ? (
          <Empty text="불러오고 있어요" />
        ) : quakes.length === 0 ? (
          <Empty text="보여드릴 지진 정보가 없어요." />
        ) : (
          quakes.slice(0, 15).map((q) => <QuakeCard key={q.id} quake={q} />)
        )}
      </Section>

      <Section title="비상 연락처" caption="눌러서 바로 걸 수 있어요">
        <RowGroup>
          {EMERGENCY_CONTACTS.map((c, i) => (
            <Row
              key={c.number}
              leading={<IconCircle emoji={c.emoji} tone={theme.primarySoft} />}
              title={c.name}
              subtitle={c.note}
              trailing={c.number}
              last={i === EMERGENCY_CONTACTS.length - 1}
              onPress={() => call(c.number)}
            />
          ))}
        </RowGroup>
      </Section>
    </Screen>
  );
}
