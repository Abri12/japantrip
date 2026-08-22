import { Fragment } from 'react';
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
  PushSection,
  QuakeCard,
  TrainSection,
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

      {/* 알림 스위치를 긴급지진속보 **바로 아래**에 둔다.

          이 알림이 실어 나르는 것이 바로 위 구역의 내용이라, 「지금은 조용해요」를
          읽은 사람이 이어서 「흔들리면 알림으로 받을까」를 생각한다. 설정 화면을
          따로 만들어 넣으면 그 생각이 난 자리와 스위치가 있는 자리가 갈라진다.

          경보가 떴을 때는 경보 카드들이 위에 있으므로 급한 것이 먼저다. */}
      {city ? <PushSection prefecture={city.prefecture} cityName={city.name} /> : null}

      {/* 도시가 바뀌면 이 두 구역을 통째로 새로 만든다. 같은 인스턴스를
          재사용하면 이전 도시의 경보가 새 도시 제목 아래 잠깐 남는다. 자식이
          효과 안에서 상태를 되돌리는 것보다 확실하다.

          key 를 **Fragment 하나에만** 단다. 두 구역에 각각 달았더니 둘 다
          `city.id` 라 형제끼리 key 가 겹쳤고, React 가 둘을 한 자리로 보고
          같은 구역을 화면에 두 번 그렸다. 접두사를 붙여 고칠 수도 있지만,
          그러면 여기에 구역을 하나 더 넣는 사람이 같은 실수를 또 한다.
          묶는 자리를 하나로 두면 겹칠 key 자체가 없다. */}
      {city ? (
        <Fragment key={city.id}>
          {/* 교통이 멈추는 것도 재난 정보다. 기상특보보다 위에 둔다 —
              특보가 떴을 때 다음 질문이 「그래서 전철은 다니나」라서다. */}
          <TrainSection city={city} />
          <WarningSection city={city} />
          <HeatSection city={city} />
        </Fragment>
      ) : null}

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
