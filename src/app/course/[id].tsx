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
          교통비는 코스대로 다닐 때 나가는 이동 요금만 더한 값이에요(당일치기는 왕복 기준,
          도보는 0원, 입장료·식비는 빼고). 지하철은 구간제라 타는 역과 숙소 위치에 따라
          한 단계씩 달라질 수 있어요.
        </Txt>
      </Screen>
    </>
  );
}

function DayBlock({ day }: { day: CourseDay }) {
  const theme = useTheme();
  const rate = useFxRate();

  /*
   * 제목 끝에 그날 교통비를 붙인다.
   *
   * 코스를 보는 사람이 다음에 묻는 것은 「그래서 하루에 얼마 드냐」다. 그리고
   * 이 앱은 교통패스를 함께 다루는데, 1일권이 이득인지는 **그날 교통비가
   * 패스값을 넘는지**로 갈린다 — 그 숫자가 제목에 있어야 두 화면이 이어진다.
   *
   * 원화는 환율을 못 받아왔으면 빼고 엔만 적는다. 「약 0원」처럼 틀린 값을
   * 잠깐이라도 띄우지 않기 위해서다(KrwEstimate 와 같은 정책).
   *
   * 제목에는 「약」을 한 번만 쓴다. 엔에도 원에도 붙이면 한 줄에 「약」이 두 번
   * 나와 읽기가 걸린다. 엔 금액도 정확한 값을 약속하는 건 아니라서(지하철이
   * 구간제라 타는 역에 따라 한 단계씩 달라진다) 그 사실은 화면 맨 아래에
   * 한 번 적어 둔다 — 제목마다 반복할 이야기가 아니다.
   */
  const won = day.transitYen === undefined ? null : yenToWon(day.transitYen, rate);
  const cost =
    day.transitYen === undefined
      ? ''
      : won === null
        ? ` (교통비 ${day.transitYen.toLocaleString()}엔)`
        : ` (교통비 ${day.transitYen.toLocaleString()}엔 · ${formatWonApprox(won)})`;

  return (
    <Section title={`${day.label}${cost}`} caption={day.theme}>
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
