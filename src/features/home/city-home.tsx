import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Badge, Card, IconCircle, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { FEATURES } from '@/constants/features';
import { AIRPORTS } from '@/data/airports';
import { City } from '@/data/cities';
import { coursesForCity } from '@/data/courses';
import { placesByCity } from '@/data/places';
import { useItinerary } from '@/lib/itinerary';
import { useSavedPlaces } from '@/lib/saved-places';
import { useSpending } from '@/lib/spending';
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
  const { ids: savedIds } = useSavedPlaces();
  const { total: spentTotal } = useSpending();
  const { dayCount } = useItinerary();

  return (
    <Screen
      title={city.name}
      titleEmoji={city.landmark.emoji}
      // 부제는 **이 도시가 어떤 곳인지**를 말한다.
      //
      // 원래 여기엔 「이 도시 정보만 모아서 보여드릴게요」가 있었는데, 화면을
      // 보면 이미 아는 사실이라 한 줄을 쓰고도 알려주는 것이 없었다. 도시
      // 이름 바로 아래는 「여기가 무슨 도시냐」에 답하는 자리이고, 그 답은
      // 이미 blurb 에 있다 — 도시 고르는 화면에서 쓰는 것과 같은 문장이라
      // 고르고 들어온 사람에게 앞뒤가 이어진다.
      //
      // 팁(travelTip)은 설명이 아니라 조언이라 여기 두지 않는다. 아래
      // 「뭐부터 볼까요」 캡션으로 내려가 있다.
      subtitle={city.blurb}
      // 도시를 바꾸는 길을 왼쪽 위 「뒤로」로 통일했다.
      //
      // 전에는 제목 아래에 「다른 도시 보기」 알약이 따로 있었다. 앱의 다른
      // 화면은 전부 왼쪽 위 화살표로 나가는데 이 화면만 나가는 방법이 달라서,
      // 같은 동작에 두 가지 모양을 외워야 했다.
      //
      // 도시 선택은 라우트가 아니라 상태라 router.back() 으로는 못 돌아간다.
      // 그래서 Screen 에 onBack 을 넘겨, 「뒤로」가 이 화면에서는 고른 도시를
      // 지우는 일이 되게 한다 — 실제로 앞 화면이 도시 선택 화면이므로
      // 사용자가 보기에도 그냥 뒤로 가는 것이 맞다.
      back
      onBack={onChangeCity}>

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
      {/* 캡션에 도시 팁을 쓴다.
          팁 10개 중 9개가 「어떻게 돌아다니느냐」에 대한 조언이라(미도스지선
          위에 숙소를 잡아라 · 교토는 버스가 많아 1일권이 이득이다 · 오키나와
          북부는 렌터카가 필요하다), 관광지·교통패스·공항 세 줄 바로 위가
          그 조언을 실제로 써먹는 자리다.

          전에 있던 「아래 탭에서도 언제든 다시 볼 수 있어요」를 내줬다. 탭이
          늘 화면 아래에 보이는 데다 줄이 셋으로 줄어서, 이제는 도시마다 다른
          조언 쪽이 이 자리를 더 값지게 쓴다. */}
      <Section title={`${city.name}에서 뭐부터 볼까요`} caption={city.travelTip}>
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
          {/*
            공항이 없는 도시는 **육로로 어떻게 오는지**를 대신 말한다.

            시즈오카가 그렇다 — 한국에서 가는 방법은 도쿄나 나고야로 날아가
            신칸센을 타는 것이지 시즈오카 공항이 아니다. 여기서 「공항 정보를
            준비하고 있어요」라고만 하면, 실제로는 준비할 것이 없는데 빠진
            것처럼 보이고 정작 필요한 답은 어디에도 없다.

            누를 곳이 없으므로 chevron 도 onPress 도 달지 않는다. 눌리지 않는
            줄에 화살표가 있으면 눌러 보고 나서야 알게 된다.
          */}
          {airports.length === 0 && city.landAccess ? (
            <Row
              leading={<IconCircle emoji="🚄" tone={theme.primarySoft} />}
              title="여기까지 오는 법"
              subtitle={city.landAccess.summary}
              subtitleProminent
              last
            />
          ) : (
            <Row
              leading={<IconCircle emoji="✈️" tone={theme.primarySoft} />}
              title={
                // 화면이 이제 양방향을 다룬다. 「공항에서 시내까지」로만 적으면
                // 귀국일에는 여기 들어올 이유가 없어 보인다.
                airports.length === 1 ? `${airports[0].name} 오가는 법` : '공항 오가는 법'
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
          )}
        </RowGroup>
      </Section>

      {/* 여행 중 결정을 못 내리고 멈추는 순간을 위한 자리. 정보를 더 주는 게
          아니라 골라 주는 게 목적이라, 정보 섹션이 아니라 따로 둔다.

          랜덤 뽑기와 사다리타기를 한 줄로 합쳤다. 둘 다 /pick 한 화면으로
          가는데 줄만 둘이라, 홈에서는 같은 곳으로 가는 문이 두 개 있는
          셈이었다. 무엇을 고를지는 그 화면에 들어가서 정하면 된다. */}
      {/* 저장한 곳이 생긴 뒤에만 보인다. 아무것도 없을 때 「내 일정」이 있으면
          눌러서 빈 화면을 만나게 되고, 그건 기능이 아니라 실망이다. */}
      {savedIds.length > 0 ? (
        <Section title="내가 갈 곳">
          <RowGroup>
            <Row
              leading={<IconCircle emoji="📌" tone={theme.primarySoft} />}
              title="내 일정"
              /*
               * 쓴 돈을 적었으면 그것도 여기 적는다.
               *
               * 지출은 이 화면 안의 칸이라 홈에서는 안 보인다. 그래서
               * 「돈 쓴 거 관리하는 곳은 어디서 보나」라는 질문이 나왔다 —
               * 문에 이름이 안 적혀 있었던 것이다. 적은 게 있으면 금액을
               * 보여줘서, 여기가 그 문이라는 걸 홈에서도 알 수 있게 한다.
               *
               * 안 적었을 때는 굳이 「쓴 돈 0원」이라 하지 않는다. 아직
               * 없는 것을 광고하는 셈이고, 이 줄의 본래 주제는 일정이다.
               */
              subtitle={[
                dayCount > 0 ? `${dayCount}일치로 담아뒀어요` : '아직 날짜를 안 정했어요',
                `저장 ${savedIds.length}곳`,
                spentTotal > 0 ? `쓴 돈 ¥${spentTotal.toLocaleString('en-US')}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              chevron
              last
              onPress={() => router.push('/itinerary')}
            />
          </RowGroup>
        </Section>
      ) : null}

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
            leading={<IconCircle emoji="🔒" tone={theme.primarySoft} />}
            title="개인정보처리방침"
            subtitle="회원가입이 없고, 나가는 건 셋뿐이에요"
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

