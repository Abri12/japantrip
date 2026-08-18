import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Screen, Section, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { CourseDay, CourseStop, findCourse } from '@/data/courses';
import { findPlace } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { formatWonApprox, useFxRate, yenToWon } from '@/lib/fx';

/**
 * 코스 상세 — 하루를 시간 순서로 보여준다.
 *
 * 장소 정보를 여기에 복사하지 않는다. `placeId` 로 원본을 읽어 이름·입장료를
 * 가져오고, 누르면 그 장소의 상세로 넘어간다. 코스는 **순서와 이유**만 갖는다.
 */
export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = findCourse(id);

  if (!course) {
    return (
      <Screen back backFallback="/" title="코스를 찾을 수 없어요">
        <Txt variant="body" color="textTertiary">
          잘못된 주소예요.
        </Txt>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: course.title }} />
      <Screen back title={course.title} subtitle={`${course.nights}박 ${course.nights + 1}일`}>
        <Section>
          <Card>
            <Txt variant="body">{course.summary}</Txt>
            <View style={styles.forWho}>
              <Txt variant="caption" color="textTertiary">
                이런 분께 맞아요 · {course.forWho}
              </Txt>
            </View>
          </Card>
        </Section>

        {course.days.map((day) => (
          <DayBlock key={day.label} day={day} />
        ))}

        {/* 코스는 제안이지 정답이 아니다. 그대로 따르지 않아도 된다는 걸
            분명히 해 둬야 일정이 틀어졌을 때 앱을 탓하지 않는다. */}
        <Txt variant="caption" color="textTertiary">
          순서는 동선만 맞춘 제안이에요. 체력이나 날씨에 따라 빼거나 바꿔도 괜찮아요.
          시간은 폭을 두고 적었으니 분 단위로 맞추려 하지 마세요.
          {'\n\n'}
          날짜 옆 금액은 그날 이동 요금과 들어가는 곳 입장료를 더한 값이에요(당일치기는
          왕복 기준, 도보는 0원). 식비와 쇼핑은 사람마다 달라서 빼뒀어요. 지하철은 구간제라
          타는 역과 숙소 위치에 따라 한 단계씩 달라질 수 있어요.
        </Txt>
      </Screen>
    </>
  );
}

/**
 * 그날 반드시 나가는 돈(엔) — 이동 요금 + 실제로 들어가는 곳의 입장료.
 *
 * 입장료는 `pays` 를 켠 정류장만 센다. 장소에 `admissionYen` 이 있다고 다 더하면
 * 안 걸어 들어가도 되는 곳까지 예산에 넣게 된다(신세카이의 츠텐카쿠 전망대 등).
 *
 * 교통비를 모르는 날은 합계 자체를 내지 않는다. 입장료만 더한 값을 「하루 비용」
 * 이라 부르면 실제보다 적게 말하는 셈이라, 아예 말하지 않는 편이 낫다.
 */
function dayCostYen(day: CourseDay): number | null {
  if (day.transitYen === undefined) return null;

  const admission = day.stops.reduce((sum, stop) => {
    if (!stop.pays || !stop.placeId) return sum;
    return sum + (findPlace(stop.placeId)?.admissionYen ?? 0);
  }, 0);

  return day.transitYen + admission;
}

function DayBlock({ day }: { day: CourseDay }) {
  const theme = useTheme();
  const rate = useFxRate();

  /*
   * 제목 옆에 그날 깔고 들어가는 돈을 붙인다.
   *
   * 코스를 보는 사람이 다음에 묻는 것은 「그래서 하루에 얼마 드냐」다. 교통비만
   * 적으면 그 질문에 반만 답한 것이 된다 — 오사카 둘째 날은 지하철이 910엔인데
   * 천수각과 공중정원 입장료가 2,600엔이라, 교통비만 보고 예산을 잡으면 실제와
   * 네 배 가까이 벌어진다.
   *
   * 원화는 환율을 못 받아왔으면 빼고 엔만 적는다. 「약 0원」처럼 틀린 값을
   * 잠깐이라도 띄우지 않기 위해서다(KrwEstimate 와 같은 정책).
   *
   * 「약」은 한 줄에 한 번만 쓴다. 엔에도 원에도 붙이면 읽기가 걸린다. 엔 금액도
   * 정확한 값을 약속하는 건 아니지만(지하철이 구간제다) 그 사실은 화면 맨 아래에
   * 한 번 적어 둔다 — 제목마다 반복할 이야기가 아니다.
   *
   * 제목과 **같은 줄에 두되 같은 글씨로 두지 않는다.** 「1일차 · 도착」과 금액을
   * 한 문자열로 이으면 굵기·크기가 같아 훑을 때 한 덩어리로 보인다. 날짜가 먼저
   * 읽히고 금액이 따라 읽히도록, 금액만 작고 흐린 글씨로 내보낸다.
   */
  const yen = dayCostYen(day);
  const won = yen === null ? null : yenToWon(yen, rate);
  const cost =
    yen === null ? null : (
      <Txt variant="caption" color="textTertiary">
        {yen.toLocaleString()}엔{won === null ? '' : ` · ${formatWonApprox(won)}`}
      </Txt>
    );

  return (
    <Section title={day.label} titleSuffix={cost} caption={day.theme}>
      <Card>
        {day.stops.map((stop, i) => (
          <StopRow key={i} stop={stop} last={i === day.stops.length - 1} />
        ))}

        {day.tip ? (
          <View style={[styles.dayTip, { borderTopColor: theme.border }]}>
            <Txt variant="caption" tint={theme.primary}>
              💡 {day.tip}
            </Txt>
          </View>
        ) : null}
      </Card>
    </Section>
  );
}

function StopRow({ stop, last }: { stop: CourseStop; last: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const place = stop.placeId ? findPlace(stop.placeId) : undefined;

  const title = place?.name ?? stop.custom ?? '';
  const canOpen = !!place;

  const body = (
    <View style={styles.stopRow}>
      {/* 세로선으로 하루의 흐름을 만든다. 마지막 항목은 선을 그리지 않아야
          뒤에 뭔가 더 있는 것처럼 보이지 않는다. */}
      <View style={styles.rail}>
        <View
          style={[
            styles.dot,
            { backgroundColor: canOpen ? theme.primary : theme.textTertiary },
          ]}
        />
        {!last ? <View style={[styles.line, { backgroundColor: theme.border }]} /> : null}
      </View>

      <View style={styles.stopBody}>
        <Txt variant="caption" color="textTertiary">
          {stop.when}
        </Txt>
        <View style={styles.titleRow}>
          <Txt variant="subtitle" style={styles.flex}>
            {title}
          </Txt>
          {canOpen ? (
            <Txt variant="body" color="textTertiary">
              ›
            </Txt>
          ) : null}
        </View>

        {/* 장소 상세를 그대로 읽어 온다. 여기에 값을 복사해 두면 원본이 바뀔 때
            두 곳이 어긋난다. */}
        {place?.admission ? (
          <Txt variant="caption" color="textTertiary" style={styles.meta}>
            {place.admission}
            {place.duration ? ` · ${place.duration}` : ''}
          </Txt>
        ) : null}

        {stop.move ? (
          <View style={[styles.move, { backgroundColor: theme.background }]}>
            <Txt variant="caption" color="textSecondary">
              🚃 {stop.move}
            </Txt>
          </View>
        ) : null}

        {stop.note ? (
          <Txt
            variant="caption"
            tint={stop.note.startsWith('⚠') ? theme.warning : theme.textSecondary}
            style={styles.meta}>
            {stop.note}
          </Txt>
        ) : null}
      </View>
    </View>
  );

  if (!canOpen) return body;

  return (
    <Pressable
      onPress={() => router.push(`/place/${stop.placeId}`)}
      style={({ pressed }) => [pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  forWho: {
    marginTop: Spacing.three,
  },
  stopRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rail: {
    alignItems: 'center',
    width: 12,
    paddingTop: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: Spacing.one,
  },
  stopBody: {
    flex: 1,
    paddingBottom: Spacing.five,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  meta: {
    marginTop: Spacing.two,
  },
  move: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
  },
  dayTip: {
    marginTop: Spacing.two,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
