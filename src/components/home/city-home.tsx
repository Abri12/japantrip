import { Link, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Badge, Card, IconCircle, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { FEATURES } from '@/constants/features';
import { AIRPORTS } from '@/data/airports';
import { City } from '@/data/cities';
import { coursesForCity } from '@/data/courses';
import { placesByCity } from '@/data/places';
import { PASSES } from '@/data/transit';
import { useQuakes } from '@/hooks/use-quakes';
import { useTheme } from '@/hooks/use-theme';
import { cityCoverage } from '@/lib/coverage';
import { withEunNeun } from '@/lib/korean';
import { regionLabel } from '@/lib/place-names';
import { eewScaleForPrefecture, parseJst, scaleLabel, severityOf, timeAgo } from '@/lib/quake';
import { styles } from './styles';
import { WeatherHazardCard } from './weather-hazard';

export function CityHome({ city, onChangeCity }: { city: City; onChangeCity: () => void }) {
  const router = useRouter();
  const theme = useTheme();
  const { quakes, eew, loading } = useQuakes();

  const activeEew = eew.filter((e) => !e.cancelled);

  // 「일본 어딘가에 경보」와 「내가 있는 곳에 경보」는 완전히 다른 정보다.
  // 규슈 지진에 도쿄 여행자가 놀라면 정작 진짜 위험할 때의 경고도 무뎌진다.
  const myEew = activeEew.find((e) => eewScaleForPrefecture(e, city.prefecture) !== null);
  const otherEew = myEew ? null : (activeEew[0] ?? null);
  const myEewScale = myEew ? eewScaleForPrefecture(myEew, city.prefecture) : null;

  // 이 도시가 속한 도도부현이 최근에 흔들린 적 있는지 본다.
  const localQuake = quakes.find((q) => q.points.some((p) => p.pref === city.prefecture));
  const latest = quakes[0];

  const status = myEew ? 'danger' : otherEew ? 'info' : 'safe';

  const airports = AIRPORTS.filter((a) => city.airportIds.includes(a.id));
  const passes = PASSES.filter((p) => p.cityIds.includes(city.id));
  const places = placesByCity(city.id);
  const coverage = cityCoverage(city.id, city.airportIds);
  const courses = coursesForCity(city.id);

  const severityTone = (scale: number) => {
    switch (severityOf(scale)) {
      case 'danger':
        return theme.danger;
      case 'warning':
      case 'caution':
        return theme.warning;
      default:
        return theme.success;
    }
  };

  return (
    <Screen
      title={city.name}
      titleEmoji={city.landmark.emoji}
      subtitle="이 도시 정보만 모아서 보여드릴게요">
      <Section>
        <Pressable onPress={onChangeCity} style={({ pressed }) => [pressed && styles.pressed]}>
          <View style={[styles.switcher, { borderColor: theme.border }]}>
            <Txt variant="caption" color="textSecondary">
              다른 도시 보기
            </Txt>
            <Txt variant="caption" color="textTertiary">
              ›
            </Txt>
          </View>
        </Pressable>
      </Section>

      <Section title="지금 상황">
        <Link href="/safety" asChild>
          <Card
            style={styles.spaced}
            accent={
              status === 'danger'
                ? theme.danger
                : status === 'info'
                  ? theme.warning
                  : theme.success
            }>
            <View style={styles.statusHead}>
              <Txt variant="subtitle">
                {status === 'danger'
                  ? `${city.name}에 긴급지진속보가 내렸어요`
                  : status === 'info'
                    ? '다른 지역에 지진 속보가 있어요'
                    : `${city.name}에 지진 걱정은 없어요`}
              </Txt>
              <Badge
                label={status === 'danger' ? '위험' : status === 'info' ? '참고' : '이상 없음'}
                tone={status === 'danger' ? 'danger' : status === 'info' ? 'warning' : 'success'}
              />
            </View>

            {myEew ? (
              <Txt variant="body" color="textSecondary" style={styles.statusBody}>
                {regionLabel(myEew.earthquake.hypocenter.name)} · M
                {myEew.earthquake.hypocenter.magnitude}
                {myEewScale !== null ? ` · 예상 ${scaleLabel(myEewScale)}` : ''}
              </Txt>
            ) : otherEew ? (
              <Txt variant="body" color="textSecondary" style={styles.statusBody}>
                {regionLabel(otherEew.earthquake.hypocenter.name)}에 지진 경보가 떴어요.{' '}
                {withEunNeun(city.name)} 대상 지역이 아니에요.
              </Txt>
            ) : localQuake ? (
              <Txt variant="body" color="textSecondary" style={styles.statusBody}>
                {city.name} 근처 · {regionLabel(localQuake.earthquake.hypocenter.name)}{' '}
                <Txt variant="body" tint={severityTone(localQuake.earthquake.maxScale)}>
                  {scaleLabel(localQuake.earthquake.maxScale)}
                </Txt>{' '}
                · {timeAgo(parseJst(localQuake.earthquake.time))}
              </Txt>
            ) : latest ? (
              <Txt variant="body" color="textSecondary" style={styles.statusBody}>
                최근 {city.name} 주변에서 느껴진 지진이 없어요.
              </Txt>
            ) : (
              <Txt variant="body" color="textTertiary" style={styles.statusBody}>
                {loading ? '기상청 정보를 가져오고 있어요' : '보여드릴 지진 정보가 없어요'}
              </Txt>
            )}
          </Card>
        </Link>

        <WeatherHazardCard city={city} />
      </Section>

      {/* 준비물·입국·면세·예절은 어느 도시를 가든 내용이 같다. 도시별 화면에
          펼쳐 두면 도시와 무관한 줄이 절반을 차지하므로 한 줄로 접고, 내용은
          도시 선택과 무관한 /prep 으로 옮겼다. */}
      <Section title="여행 준비">
        <RowGroup>
          <Row
            leading={<IconCircle emoji="🧳" tone={theme.primarySoft} />}
            title="여행 준비물 · 입국 · 면세"
            subtitle="어느 도시로 가든 똑같이 챙길 것들"
            chevron
            last
            onPress={() => router.push('/prep')}
          />
        </RowGroup>
      </Section>

      {/* 아직 얇은 도시는 고른 직후에 알려준다. 탭을 눌러 빈 목록을 만나고 나서
          알게 되면, 앱이 고장난 것처럼 느껴진다. */}
      {coverage.caveat ? (
        <Section>
          <Card accent={theme.warning}>
            <View style={styles.statusHead}>
              <Txt variant="subtitle">{withEunNeun(city.name)} 아직 채우는 중이에요</Txt>
              <Badge label={coverage.label} tone="warning" />
            </View>
            <Txt variant="body" color="textSecondary" style={styles.statusBody}>
              {coverage.caveat}
            </Txt>
          </Card>
        </Section>
      ) : null}

      {/* 코스를 가장 위에 둔다. 목록만 주면 사용자가 스스로 동선을 짜야 하는데,
          처음 가는 사람에게 그건 어려운 일이다. 「그래서 어떻게 도냐」에 답하는
          것이 이 앱이 가이드로서 하는 일이다. */}
      {courses.length > 0 ? (
        <Section title="이렇게 돌면 돼요" caption="동선까지 맞춰 둔 추천 코스예요">
          <RowGroup>
            {courses.map((course, i) => (
              <Row
                key={course.id}
                leading={<IconCircle emoji="🧭" tone={theme.primarySoft} />}
                title={course.title}
                subtitle={course.forWho}
                trailing={`${course.nights}박`}
                chevron
                last={i === courses.length - 1}
                onPress={() => router.push(`/course/${course.id}` as never)}
              />
            ))}
          </RowGroup>
        </Section>
      ) : null}

      {/* 이 목록의 절반은 아래 탭으로 넘어간다(공항·이동·관광·안전). 탭은 앱의
          최상위라 뒤로 가기 버튼이 없는데, 그걸 모르면 「눌러 들어왔는데 나갈
          길이 없다」고 느낀다. 그래서 탭이라는 사실을 캡션으로 미리 알려준다. */}
      <Section
        title={`${city.name}에서 뭐부터 볼까요`}
        caption="아래 탭에서도 언제든 다시 볼 수 있어요">
        <RowGroup>
          <Row
            leading={<IconCircle emoji="🌤️" tone={theme.primarySoft} />}
            title="오늘 날씨 · 옷차림"
            subtitle="체감온도로 뭘 입을지까지 알려드려요"
            chevron
            onPress={() => router.push('/weather')}
          />
          <Row
            leading={<IconCircle emoji="✈️" tone={theme.primarySoft} />}
            title={
              airports.length === 1 ? `${airports[0].name}에서 시내까지` : '공항에서 시내까지'
            }
            subtitle={
              airports.length > 0
                ? `${airports.length}개 공항 · 인터넷 없어도 열려요`
                : '공항 정보를 준비하고 있어요'
            }
            chevron
            onPress={() =>
              airports.length === 1
                ? router.push(`/airport/${airports[0].id}`)
                : router.push('/airports')
            }
          />
          <Row
            leading={<IconCircle emoji="🚃" tone={theme.primarySoft} />}
            title="교통패스 고르기"
            subtitle={
              passes.length > 0
                ? `${passes.length}종 · 어떤 게 이득인지 알려드려요`
                : '패스 정보를 준비하고 있어요'
            }
            chevron
            onPress={() => router.push('/transit')}
          />
          <Row
            leading={<IconCircle emoji="🗺️" tone={theme.primarySoft} />}
            title="관광지 · 맛집"
            subtitle={
              places.length > 0
                ? `${places.length}곳 · 가는 법과 입장료까지`
                : '장소를 채우고 있어요'
            }
            chevron
            onPress={() => router.push('/places')}
          />
          {/* 현지 예절·생존 회화는 도시와 무관하므로 이 목록에서 뺐다.
              「오사카에서 뭐부터 볼까요」 아래에 있으면 오사카에만 해당하는
              이야기로 읽힌다. 지금은 여행 준비 화면에 있다. */}
          <Row
            leading={<IconCircle emoji="🔔" tone={theme.primarySoft} />}
            title="실시간 안전 정보"
            subtitle="지진과 쓰나미, 비상 연락처까지"
            chevron
            last
            onPress={() => router.push('/safety')}
          />
        </RowGroup>
      </Section>

      {/* 여행 중 결정을 못 내리고 멈추는 순간을 위한 자리. 정보를 더 주는 게
          아니라 골라 주는 게 목적이라, 정보 섹션이 아니라 따로 둔다. */}
      <Section title="못 정하겠을 때">
        <RowGroup>
          <Row
            leading={<IconCircle emoji="🎲" tone={theme.primarySoft} />}
            title="여행지 랜덤 뽑기"
            subtitle="고민이 길어지면 그냥 뽑아버려요"
            chevron
            onPress={() => router.push('/pick')}
          />
          <Row
            leading={<IconCircle emoji="🪜" tone={theme.primarySoft} />}
            title="메뉴 사다리타기"
            subtitle="후보를 이 도시 맛집으로 채울 수도 있어요"
            chevron
            last
            onPress={() => router.push('/pick')}
          />
        </RowGroup>
      </Section>

      <Section title="이 도시 여행 팁">
        <Card>
          <Txt variant="body" color="textSecondary">
            {city.travelTip}
          </Txt>
        </Card>
      </Section>

      {/* 누르면 넘어가는 줄에는 아이콘을 붙인다. 이 섹션만 아이콘이 없어서
          같은 화면 안에서 두 종류의 줄처럼 보였다. */}
      <Section title="정보">
        <RowGroup>
          {FEATURES.roadmap ? (
            <Row
              leading={<IconCircle emoji="🧭" tone={theme.primarySoft} />}
              title="오픈 로드맵"
              subtitle="어느 도시부터 채우고 있는지 보여드려요"
              chevron
              onPress={() => router.push('/roadmap')}
            />
          ) : null}
          <Row
            leading={<IconCircle emoji="📊" tone={theme.primarySoft} />}
            title="내 사용 기록"
            subtitle="무엇이 모였는지 보고 지울 수 있어요"
            chevron
            onPress={() => router.push('/stats')}
          />
          <Row
            leading={<IconCircle emoji="🔒" tone={theme.primarySoft} />}
            title="개인정보처리방침"
            subtitle="서버로 보내는 정보가 없어요"
            chevron
            onPress={() => router.push('/privacy')}
          />
          <Row
            leading={<IconCircle emoji="📄" tone={theme.primarySoft} />}
            title="오픈소스 라이선스"
            subtitle="이 앱이 쓰고 있는 서체 · 라이브러리 · 데이터 출처"
            chevron
            last
            onPress={() => router.push('/licenses')}
          />
        </RowGroup>
      </Section>
    </Screen>
  );
}

