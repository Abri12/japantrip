import { CourseDay } from '@/data/courses';
import { findPlace } from '@/data/places';

/**
 * 그날 반드시 나가는 돈(엔) — 이동 요금 + 실제로 들어가는 곳의 입장료.
 *
 * 입장료는 `pays` 를 켠 정류장만 센다. 장소에 `admissionYen` 이 있다고 다 더하면
 * 안 걸어 들어가도 되는 곳까지 예산에 넣게 된다(신세카이의 츠텐카쿠 전망대 등).
 *
 * 교통비를 모르는 날은 합계 자체를 내지 않는다. 입장료만 더한 값을 「하루 비용」
 * 이라 부르면 실제보다 적게 말하는 셈이라, 아예 말하지 않는 편이 낫다.
 */
export function dayCostYen(day: CourseDay): number | null {
  if (day.transitYen === undefined) return null;

  const admission = day.stops.reduce((sum, stop) => {
    if (!stop.pays || !stop.placeId) return sum;
    return sum + (findPlace(stop.placeId)?.admissionYen ?? 0);
  }, 0);

  return day.transitYen + admission;
}
