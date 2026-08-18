import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Badge, Card, IconCircle, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { FEATURES } from '@/constants/features';
import { AIRPORTS } from '@/data/airports';
import { City } from '@/data/cities';
import { coursesForCity } from '@/data/courses';
import { placesByCity } from '@/data/places';
import { PASSES } from '@/data/transit';
import { useTheme } from '@/hooks/use-theme';
import { cityCoverage } from '@/lib/coverage';
import { withEunNeun } from '@/lib/korean';
import { NowStatusCard } from './now-status';
import { styles } from './styles';

export function CityHome({ city, onChangeCity }: { city: City; onChangeCity: () => void }) {
  const router = useRouter();
  const theme = useTheme();
  const airports = AIRPORTS.filter((a) => city.airportIds.includes(a.id));
  const passes = PASSES.filter((p) => p.cityIds.includes(city.id));
  const places = placesByCity(city.id);
  const coverage = cityCoverage(city.id, city.airportIds);
  const courses = coursesForCity(city.id);

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

      {/* 날씨·기상특보·지진을 한 카드로 묶었다. 비중은 실제 쓰임을 따른다 —
          날씨는 매일 보고, 지진은 가끔 있는 일이라 한 줄이다. 자세한 이유는
          NowStatusCard 주석에 적어 뒀다. */}
      <Section title="날씨 · 안전">
        <NowStatusCard city={city} />
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

      {/* 이 목록은 아래 탭으로 넘어간다(공항·이동·관광). 탭은 앱의 최상위라
          뒤로 가기 버튼이 없는데, 그걸 모르면 「눌러 들어왔는데 나갈 길이
          없다」고 느낀다. 그래서 탭이라는 사실을 캡션으로 미리 알려준다.

          날씨와 안전은 여기서 뺐다. 맨 위 카드의 날씨 구역이 /weather 로,
          지진 줄이 /safety 로 이미 가고 있어서, 같은 화면으로 가는 줄이 한
          화면에 두 번 나오는 셈이었다. 「항목이 너무 많다」는 피드백에서
          가장 먼저 지울 수 있는 종류의 중복이다. */}
      <Section
        title={`${city.name}에서 뭐부터 볼까요`}
        caption="아래 탭에서도 언제든 다시 볼 수 있어요">
        {/* 줄 순서도 「몇 번 보느냐」를 따른다. 관광지·맛집은 하루에도 몇 번
            열고, 패스는 여행 초반에 한 번 정하면 끝이며, 공항은 도착일과
            귀국일 딱 두 번이다. 시간 순서(공항 → 이동 → 관광)로 놓으면
            여행 내내 가장 자주 쓰는 줄이 맨 아래에 있게 된다. */}
        <RowGroup>
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
            last
            onPress={() =>
              airports.length === 1
                ? router.push(`/airport/${airports[0].id}`)
                : router.push('/airports')
            }
          />
        </RowGroup>
      </Section>

      {/* 여행 중 결정을 못 내리고 멈추는 순간을 위한 자리. 정보를 더 주는 게
          아니라 골라 주는 게 목적이라, 정보 섹션이 아니라 따로 둔다.

          랜덤 뽑기와 사다리타기를 한 줄로 합쳤다. 둘 다 /pick 한 화면으로
          가는데 줄만 둘이라, 홈에서는 같은 곳으로 가는 문이 두 개 있는
          셈이었다. 무엇을 고를지는 그 화면에 들어가서 정하면 된다. */}
      <Section title="못 정하겠을 때">
        <RowGroup>
          <Row
            leading={<IconCircle emoji="🎲" tone={theme.primarySoft} />}
            title="랜덤 뽑기 · 사다리타기"
            subtitle="고민이 길어지면 그냥 뽑아버려요"
            chevron
            last
            onPress={() => router.push('/pick')}
          />
        </RowGroup>
      </Section>

      {/* 코스는 한 번 정하면 다시 열지 않는다. 여행 전이나 첫날에 훑고
          그다음부터는 그 코스대로 다니기 때문이다. 처음 오는 사람에게
          「그래서 어떻게 도냐」에 답하는 중요한 자리지만, **자주 보는**
          자리는 아니라서 매일 쓰는 것들 아래로 내렸다. */}
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

      {/* 준비물·입국·면세는 어느 도시를 가든 내용이 같아서 도시 이야기 뒤로
          내렸다. 다만 여행 팁보다는 위다 — 체크리스트는 짐 쌀 때마다 켜고
          면세 계산기는 쇼핑할 때 켜지만, 팁은 한 번 읽으면 끝이다. */}
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

