import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Card, Screen, Section, Txt } from '@/components/ui';
import { courseParams } from '@/data/static-routes';
import { findCourse } from '@/data/courses';
import { DayBlock, styles } from '@/features/course';

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
 * 미리 그릴 주소 목록.
 *
 * 이게 없으면 이 화면은 내보내기에 안 들어가고, 정적 호스팅이 404.html 을
 * 준다 — 리액트가 붙일 것이 없어 하이드레이션이 어긋난다(React #418).
 * 무엇을 그릴지 정하는 정책은 `data/static-routes.ts` 한곳에 있다.
 */
export function generateStaticParams() {
  return courseParams();
}
