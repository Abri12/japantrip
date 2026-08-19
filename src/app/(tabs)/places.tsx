import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CityScopeBar } from '@/components/city-scope';

import {
  Badge,
  Card,
  Chip,
  Empty,
  IconCircle,
  Row,
  RowGroup,
  Screen,
  Section,
  Txt,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { CITIES, openCities } from '@/data/cities';
import { PLACES, Place, PlaceCategory, placesByCity } from '@/data/places';
import { passShortName } from '@/data/transit';
import { useTheme } from '@/hooks/use-theme';
import { accessSummary } from '@/lib/access';
import { cityCoverage } from '@/lib/coverage';
import { withEunNeun } from '@/lib/korean';
import { useSelectedCity } from '@/lib/selected-city';

/**
 * 이름 옆에 붙는 패스 뱃지.
 *
 * 패스를 살지 말지는 목록을 훑으면서 정한다. 그 판단에 필요한 정보를
 * 상세 화면 안쪽에 숨겨두면 하나씩 열어봐야 하므로 여기로 끌어올렸다.
 * 조건이 붙은 경우는 색을 달리해 "그냥 되는 것"과 구분한다.
 */
/**
 * 이름 옆에 붙는 뱃지 묶음.
 *
 * 근교 여행지는 이동 시간을 함께 보여준다. "다자이후"만 적혀 있으면 시내
 * 어딘가로 착각하는데, 실제로는 왕복 한 시간을 쓰는 결정이다. 하루 일정을
 * 짜는 사람에게는 입장료보다 이 시간이 먼저 걸린다.
 */
function PlaceBadges({ place }: { place: Place }) {
  if (!place.dayTrip && !place.passes?.length) return null;

  return (
    <>
      {place.dayTrip ? (
        <Badge label={`근교 · ${place.dayTrip.travel}`} tone="neutral" />
      ) : null}
      {place.passes?.map((cov) => {
        const short = passShortName(cov.passId);
        if (!short) return null;
        return (
          <Badge
            key={cov.passId}
            label={cov.condition ? `${short} 조건부` : `${short} 가능`}
            tone={cov.condition ? 'warning' : 'success'}
          />
        );
      })}
    </>
  );
}

type Filter = 'all' | PlaceCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'sight', label: '관광지' },
  { id: 'food', label: '맛집' },
];

export default function PlacesScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { city: selectedCity } = useSelectedCity();
  const [filter, setFilter] = useState<Filter>('all');
  const [showAll, setShowAll] = useState(false);
  const [manualCityId, setManualCityId] = useState<string | null>(null);

  const cities = openCities();

  // 고른 도시에 장소가 있으면 그 도시로 좁힌다. 없으면 빈 화면이 되니 전체를 연다.
  const selectedHasPlaces = selectedCity ? placesByCity(selectedCity.id).length > 0 : false;
  const scoped = !showAll && selectedHasPlaces && selectedCity !== null;

  const cityId = scoped ? selectedCity!.id : manualCityId;
  const selected = cityId ? CITIES.find((c) => c.id === cityId) : null;
  const selectedCoverage = selected ? cityCoverage(selected.id, selected.airportIds) : null;

  // 1단계 도시를 앞으로 — 정보가 촘촘한 곳이 먼저 보여야 한다.
  const visible = useMemo(() => {
    // 도시를 좁힌 경우엔 placesByCity 가 근교까지 포함하고 시내를 앞으로
    // 정렬해 주므로 그 순서를 그대로 살린다. 전 도시일 때만 단계순으로 세운다.
    const pool = cityId === null ? [...PLACES] : placesByCity(cityId);
    const matched = pool.filter((p) => filter === 'all' || p.category === filter);
    if (cityId !== null) return matched;

    return matched.sort((a, b) => {
      const pa = CITIES.find((c) => c.id === a.cityId)?.phase ?? 9;
      const pb = CITIES.find((c) => c.id === b.cityId)?.phase ?? 9;
      return pa - pb;
    });
  }, [filter, cityId]);

  /*
   * 줄 하나를 여는 동작을 **한 번만** 만든다.
   *
   * 예전에는 줄마다 `onPress={() => router.push(...)}` 로 새 함수를 만들었다.
   * 그러면 필터 칩을 누를 때마다 108개 줄이 전부 새 props 를 받아 다시
   * 그려진다 — 목록 내용이 그대로여도 그렇다. 함수를 고정하고 장소 id 만
   * 넘기면 `PlaceRow` 의 memo 가 실제로 걸린다.
   */
  const open = useCallback((id: string) => router.push(`/place/${id}`), [router]);

  return (
    <Screen title="관광 · 맛집" subtitle="어떻게 가는지, 얼마인지까지 같이 정리해뒀어요">
      {selectedHasPlaces ? (
        <CityScopeBar
          city={selectedCity}
          showAll={showAll}
          onToggle={() => setShowAll((v) => !v)}
        />
      ) : null}

      <Section>
        <View style={styles.chipRow}>
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              active={filter === f.id}
              onPress={() => setFilter(f.id)}
            />
          ))}
        </View>
        {!scoped ? (
          <View style={[styles.chipRow, styles.chipRowGap]}>
            <Chip
              label="전 도시"
              active={manualCityId === null}
              onPress={() => setManualCityId(null)}
            />
            {cities.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                active={manualCityId === c.id}
                onPress={() => setManualCityId(c.id)}
              />
            ))}
          </View>
        ) : null}
      </Section>

      {/* 안내 문구를 status 가 아니라 실제 장소 수에서 만든다. 예전에는 손으로
          적은 status 를 봤는데, 도쿄·삿포로는 status 가 'live' 라 장소가 2~4곳뿐인데도
          아무 안내가 없었다. 세는 일은 코드가 해야 어긋나지 않는다. */}
      {selectedCoverage?.caveat ? (
        <Section>
          <Card accent={theme.warning}>
            <Txt variant="subtitle">아직 채우는 중인 도시예요</Txt>
            <Txt variant="body" color="textSecondary" style={styles.noticeBody}>
              {withEunNeun(selected!.name)} {selectedCoverage.caveat}
            </Txt>
          </Card>
        </Section>
      ) : null}

      <Section title={`${visible.length}곳`}>
        {visible.length === 0 ? (
          <Empty text="조건에 맞는 곳이 없어요." />
        ) : (
          <RowGroup>
            {visible.map((place, i) => (
              <PlaceRow
                key={place.id}
                place={place}
                last={i === visible.length - 1}
                onOpen={open}
              />
            ))}
          </RowGroup>
        )}
      </Section>
    </Screen>
  );
}

/**
 * 목록의 한 줄.
 *
 * `memo` 를 씌운 이유 — 필터·도시 칩을 누르면 `visible` 배열은 새로 만들어지지만
 * 그 안의 장소 **객체는 정적 데이터라 참조가 그대로**다. 그래서 목록에 계속
 * 남아 있는 줄은 다시 그릴 이유가 없다. 「음식만」을 눌러 108개가 60개로 줄 때,
 * 남은 60개를 그대로 두고 사라진 것만 걷어내면 된다.
 *
 * memo 가 효과를 내려면 props 가 렌더마다 새로 만들어지면 안 된다. 그래서
 * `onOpen` 은 화면에서 useCallback 으로 고정하고, 여기서 장소 id 를 붙여
 * 부른다. 뱃지도 이 안에서 만들어야 부모가 다시 그릴 때 딸려 오지 않는다.
 *
 * 지금은 108곳이라 이것으로 충분하다. `FlatList` 로 옮기는 건 화면 밖 줄까지
 * 걷어내는 일인데, 지금 구조에서는 `Screen` 이 전체를 ScrollView 로 감싸고
 * 있어서 목록만 가상화하려면 그 컴포넌트를 함께 손봐야 한다. 장소가 300곳을
 * 넘어가면 그때 하는 게 맞다.
 */
const PlaceRow = memo(function PlaceRow({
  place,
  last,
  onOpen,
}: {
  place: Place;
  last: boolean;
  onOpen: (id: string) => void;
}) {
  const theme = useTheme();
  const isFood = place.category === 'food';

  return (
    <Row
      leading={
        <IconCircle emoji={isFood ? '🍜' : '📸'} tone={isFood ? theme.warningSoft : theme.primarySoft} />
      }
      title={place.name}
      titleBadge={<PlaceBadges place={place} />}
      subtitle={place.access ? accessSummary(place.access) : place.summary}
      trailing={place.city}
      trailingSub={place.admission}
      chevron
      last={last}
      onPress={() => onOpen(place.id)}
    />
  );
});

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chipRowGap: {
    marginTop: Spacing.three,
  },
  noticeBody: {
    marginTop: Spacing.two,
  },
});
