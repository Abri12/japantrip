import { StyleSheet, View } from 'react-native';

import { Badge, Card, Screen, Section, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { AIRPORTS } from '@/data/airports';
import { CITIES, City, PHASE_GOAL, PHASE_LABEL, Phase, STATUS_LABEL } from '@/data/cities';
import { PLACES } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';

const PHASES: Phase[] = [1, 2, 3];

export default function RoadmapScreen() {
  return (
    <Screen
      back
      title="오픈 로드맵"
      subtitle="도시마다 하나씩 꼼꼼히 채워가고 있어요">
      {PHASES.map((phase) => (
        <Section key={phase} title={PHASE_LABEL[phase]} caption={PHASE_GOAL[phase]}>
          {CITIES.filter((c) => c.phase === phase).map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </Section>
      ))}
    </Screen>
  );
}

function CityCard({ city }: { city: City }) {
  const theme = useTheme();

  const tone =
    city.status === 'live' ? theme.success : city.status === 'seeding' ? theme.warning : theme.textTertiary;

  const placeCount = PLACES.filter((p) => p.cityId === city.id).length;
  const airports = AIRPORTS.filter((a) => city.airportIds.includes(a.id));

  return (
    <Card accent={tone} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Txt variant="subtitle">{city.name}</Txt>
          <Txt variant="caption" color="textTertiary" style={styles.tiny}>
            {city.nameJa}
          </Txt>
        </View>
        <Badge
          label={STATUS_LABEL[city.status]}
          tone={city.status === 'live' ? 'success' : city.status === 'seeding' ? 'warning' : 'neutral'}
        />
      </View>

      {/* rationale 은 어느 도시를 먼저 채울지 정한 내부 근거라 사용자용이 아니다.
          여기서는 "이 도시에 지금 뭐가 준비돼 있는지"만 보여준다. */}
      <Txt variant="body" color="textSecondary" style={styles.body}>
        {placeCount > 0
          ? `관광지 ${placeCount}곳을 정리해뒀어요.`
          : '관광지 정보를 준비하고 있어요.'}
        {airports.length > 0
          ? ` ${airports.map((a) => a.name).join(', ')}에서 시내 가는 길도 안내해요.`
          : ''}
      </Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    marginBottom: Spacing.three,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  tiny: {
    marginTop: Spacing.half,
  },
  body: {
    marginTop: Spacing.three,
  },
});
