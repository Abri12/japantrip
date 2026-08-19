/**
 * 추천 코스 — 「그래서 어떻게 도냐」에 대한 답.
 *
 * 장소를 53곳 모아 두는 것과 「오사카 2박 3일이면 이 순서로 도세요」를 주는 것은
 * 전혀 다른 물건이다. 앞은 데이터베이스고 뒤가 가이드다. 처음 가는 사람이
 * 목록에서 스스로 동선을 짜는 건 어렵고, 그 일을 대신해 주는 게 이 앱의 자리다.
 *
 * ## 설계에서 지킨 것
 *
 * **1. 동선이 실제로 맞아야 한다.** 도톤보리 → 오사카성 → 신세카이처럼 지도에서
 * 왔다 갔다 하는 순서를 넣으면 코스가 아니라 목록일 뿐이다. 같은 방향끼리 묶고,
 * 이동은 `move` 로 명시한다.
 *
 * **2. 시간을 적되 분 단위로 짜지 않는다.** 「13:00 도착」처럼 못 박으면 조금만
 * 틀어져도 코스 전체가 쓸모없어진다. 「점심 무렵」 같은 폭이 있는 표현을 쓴다.
 *
 * **3. places.ts 를 참조한다.** 장소 정보를 여기 복사하면 두 곳이 어긋난다.
 * `placeId` 만 들고 있고, 이름·가는 법·입장료는 화면에서 원본을 읽는다.
 *
 * **4. 도착일과 귀국일을 코스에 넣는다.** 여행은 공항에서 시작해 공항에서 끝나는데,
 * 대부분의 코스 안내가 「1일차 도톤보리」부터 시작해 그 두 날을 비워 둔다.
 * 실제로는 그 이틀이 가장 헤매는 날이다.
 */

import { Course } from './types';
import { OSAKA_COURSES } from './osaka';
import { FUKUOKA_COURSES } from './fukuoka';
import { TOKYO_COURSES } from './tokyo';
import { SAPPORO_COURSES } from './sapporo';
import { MATSUYAMA_COURSES } from './matsuyama';
import { TAKAMATSU_COURSES } from './takamatsu';

export * from './types';

/*
 * 도시별 파일을 여기서 합친다. `places/` 와 같은 모양이다.
 *
 * 한 파일에 몰아 두면 도시가 늘 때마다 같은 파일 한가운데를 열게 되고,
 * 여러 도시를 동시에 손볼 때 서로 부딪힌다. 도시를 추가하는 일이 「파일 하나
 * 만들고 여기 한 줄 더하기」로 끝나야 한다.
 *
 * 순서는 바꾸지 않는다. 화면은 `coursesForCity` 로 걸러 쓰지만, 한 도시 안의
 * 순서는 그대로 화면 순서가 된다.
 */
export const COURSES: Course[] = [
  ...OSAKA_COURSES,
  ...FUKUOKA_COURSES,
  ...TOKYO_COURSES,
  ...SAPPORO_COURSES,
  ...MATSUYAMA_COURSES,
  ...TAKAMATSU_COURSES,
];

export function coursesForCity(cityId: string): Course[] {
  return COURSES.filter((c) => c.cityId === cityId);
}

export function findCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}
