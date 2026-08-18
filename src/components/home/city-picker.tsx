import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Badge, Card, IconCircle, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { City } from '@/data/cities';
import { placesByCity } from '@/data/places';
import { PASSES } from '@/data/transit';
import { useTheme } from '@/hooks/use-theme';
import { cityCoverage } from '@/lib/coverage';
import { selectableCities } from '@/lib/selected-city';
import { styles } from './styles';

/**
 * 첫 화면 — 어느 도시로 가는지부터 묻는다.
 *
 * Klook·Trip.com 류 "목적지 선택" 화면의 구조를 따른다: 콘텐츠가 실제로
 * 꽉 찬 도시(1단계 — 오사카·교토·후쿠오카)는 큰 히어로 카드로 먼저 보여주고,
 * 아직 얇은 도시는 아래 축소된 목록으로 뺀다. 10개 도시를 전부 같은 무게로
 * 나열하면 콘텐츠가 없는 도시까지 골라볼 만해 보이는 문제가 있었다.
 */
export function CityPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const theme = useTheme();
  const router = useRouter();
  const cities = selectableCities();
  const hero = cities.filter((c) => c.phase === 1);
  const rest = cities.filter((c) => c.phase !== 1);

  return (
    <Screen title="어디로 가세요?" subtitle="도시를 고르면 그 도시 정보만 모아서 보여드릴게요">
      <Section title="지금 갈 수 있는 도시" caption="여행 정보를 가장 꼼꼼히 준비한 곳이에요">
        <HeroCityList cities={hero} onSelect={onSelect} />
      </Section>

      {rest.length > 0 ? (
        <Section title="곧 열려요" caption="지금도 볼 수 있어요">
          <View style={styles.pillRow}>
            {rest.map((c) => (
              <SecondaryCityPill key={c.id} city={c} onPress={() => onSelect(c.id)} />
            ))}
          </View>
        </Section>
      ) : null}

      {/* 도시를 정하기 전에도 준비는 시작한다 — 항공권만 끊은 시점에 가장 많이
          찾는 게 준비물과 입국 절차다. 도시 선택 뒤에만 보이면 그 시점에
          앱에서 할 수 있는 일이 「도시 고르기」밖에 없다. */}
      <Section title="아직 도시를 못 정했어도" caption="이건 지금 봐도 돼요">
        <RowGroup>
          <Row
            leading={<IconCircle emoji="🧳" tone={theme.primarySoft} />}
            title="여행 준비물 · 입국 · 면세"
            subtitle="어느 도시로 가든 똑같이 챙길 것들"
            chevron
            onPress={() => router.push('/prep')}
          />
          {/* 귀국일은 되돌릴 수 없는 일이 몰린 날인데, 정작 그 정보가 면세·짐·공항
              화면에 흩어져 있었다. 그날 아침 한 화면에서 훑을 자리를 만든다. */}
          <Row
            leading={<IconCircle emoji="🛫" tone={theme.primarySoft} />}
            title="귀국하는 날"
            subtitle="몇 시에 나설지 · 면세 환급 · 짐 맡기기"
            chevron
            last
            onPress={() => router.push('/departure')}
          />
        </RowGroup>
      </Section>

      <Card style={{ backgroundColor: theme.primarySoft }}>
        <Txt variant="body" tint={theme.primary}>
          나중에 언제든 바꿀 수 있어요. 홈 위쪽의 「다른 도시 보기」를 누르면 돼요.
        </Txt>
      </Card>
    </Screen>
  );
}

/**
 * 도시 목록 — 세로로 쌓는다.
 *
 * 원래 가로 스크롤 캐러셀이었는데, 앱으로 쓸 때는 세로가 낫다:
 * 화면에 몇 개가 있는지 한눈에 들어오고, 앱의 다른 화면이 전부 세로 스크롤이라
 * 여기만 손가락 방향이 달라지지 않는다. 가로는 오른쪽에 더 있다는 걸
 * 놓치기도 쉽다.
 */
function HeroCityList({ cities, onSelect }: { cities: City[]; onSelect: (id: string) => void }) {
  return (
    <View>
      {cities.map((city, i) => (
        <HeroCityCard
          key={city.id}
          city={city}
          onPress={() => onSelect(city.id)}
          last={i === cities.length - 1}
        />
      ))}
    </View>
  );
}

function HeroCityCard({
  city,
  onPress,
  last,
}: {
  city: City;
  onPress: () => void;
  last: boolean;
}) {
  const theme = useTheme();
  const placeCount = placesByCity(city.id).length;
  const passCount = PASSES.filter((p) => p.cityIds.includes(city.id)).length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [!last && styles.heroSpaced, pressed && styles.pressed]}>
      <View style={[styles.heroCard, { backgroundColor: city.landmark.tint }]}>
        {/* 배경에 같은 이모지를 옅게 한 번 더 깔아 색면이 비어 보이지 않게 채운다.
            사진이 없을 때 카드에 밀도를 주는 가장 저렴한 방법이다. */}
        <Txt style={styles.heroEmojiGhost}>{city.landmark.emoji}</Txt>

        <View style={styles.heroRow}>
          <View style={[styles.heroIcon, { backgroundColor: theme.background }]}>
            <Txt style={styles.heroEmoji}>{city.landmark.emoji}</Txt>
          </View>

          <View style={styles.flex}>
            <Txt variant="title">{city.name}</Txt>
            {/* 전에는 대표 관광지 이름(「오사카성」)만 있었는데, 그건 이미 아는
                사람에게나 뜻이 있다. 처음 보는 사람에게는 이 도시가 어떤 곳인지가
                먼저다. 관광지 개수는 아래 meta 줄에 이미 있어 여기서 또 하나를
                짚을 필요는 없다. */}
            <Txt variant="caption" color="textSecondary" style={styles.heroSub}>
              {city.blurb}
            </Txt>
            <Txt variant="caption" color="textSecondary" style={styles.heroMeta}>
              관광지 {placeCount}곳 · 패스 {passCount}종
            </Txt>
          </View>

          <Txt variant="body" color="textTertiary" style={styles.heroChevron}>
            ›
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}

/** 아직 얇은 도시. 히어로 카드보다 훨씬 가볍게 — 존재는 알리되 무게를 안 준다. */
function SecondaryCityPill({ city, onPress }: { city: City; onPress: () => void }) {
  const theme = useTheme();
  const coverage = cityCoverage(city.id, city.airportIds);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {/* 뱃지를 status 가 아니라 실제 장소 수에서 만든다. status 는 손으로 적는
          값이라 데이터가 늘고 줄 때 따라오지 못했다 — 나고야는 「준비 중」인데
          장소가 0개였고, 그 사실은 눌러서 열어봐야 알 수 있었다. */}
      <View style={[styles.pill, { backgroundColor: theme.surface }]}>
        <Txt variant="body">{city.landmark.emoji}</Txt>
        <Txt variant="bodyBold">{city.name}</Txt>
        <Badge
          label={coverage.level === 'empty' ? '장소 없음' : coverage.label}
          tone={coverage.level === 'rich' ? 'success' : 'warning'}
        />
      </View>
    </Pressable>
  );
}

/** 도시를 고른 뒤의 홈 — 모든 항목이 그 도시로 좁혀진다. */
