/**
 * 도시별 정보 깊이 — 손으로 적지 않고 **실제 데이터에서 계산한다.**
 *
 * 예전에는 `City.status` 를 손으로 적어 두고 그걸 화면에 보여줬다. 그러다 보니
 * 데이터가 늘고 줄 때마다 라벨이 따라오지 못해 실제와 어긋났다:
 *
 * - 나고야는 「데이터 모으는 중」인데 장소가 **0개**였다. 고를 수는 있는데
 *   열면 빈 화면이 나온다.
 * - 삿포로(2곳)·도쿄(4곳)가 오사카(15곳)와 똑같이 「live」로 보였다. 라벨만
 *   보고 오사카만큼 준비돼 있다고 기대하게 된다.
 *
 * 손으로 적는 값은 언젠가 반드시 어긋난다. 그래서 세는 일은 코드가 하고,
 * `status` 는 「이 도시를 열기로 했는가」라는 의도만 남긴다.
 */
import { AIRPORTS } from '@/data/airports';
import { PLACES } from '@/data/places';
import { PASSES } from '@/data/transit';

export type CoverageLevel = 'rich' | 'basic' | 'thin' | 'empty';

export interface CityCoverage {
  level: CoverageLevel;
  places: number;
  passes: number;
  airports: number;
  /** 사용자에게 보여줄 한 줄. 기대치를 실제에 맞춘다 */
  label: string;
  /** 고르기 전에 알아야 할 것. 충분히 채워진 도시는 없다 */
  caveat?: string;
}

export function cityCoverage(cityId: string, airportIds: string[]): CityCoverage {
  // 근교 여행지도 그 도시를 고른 사람에게 보이므로 함께 센다.
  const places = PLACES.filter(
    (p) => p.cityId === cityId || p.dayTrip?.from.includes(cityId),
  ).length;
  const passes = PASSES.filter((p) => p.cityIds.includes(cityId)).length;
  const airports = AIRPORTS.filter((a) => airportIds.includes(a.id)).length;

  if (places === 0) {
    return {
      level: 'empty',
      places,
      passes,
      airports,
      label: '아직 장소가 없어요',
      caveat: '공항과 교통 정보만 있어요. 관광지·맛집은 준비 중이에요.',
    };
  }
  if (places < 5) {
    return {
      level: 'thin',
      places,
      passes,
      airports,
      label: `장소 ${places}곳`,
      caveat: `대표 장소 ${places}곳만 있어요. 오사카·도쿄·교토·후쿠오카가 가장 촘촘해요.`,
    };
  }
  if (places < 12) {
    return {
      level: 'basic',
      places,
      passes,
      airports,
      label: `장소 ${places}곳`,
      caveat: '주요 장소는 있지만 아직 채우는 중이에요.',
    };
  }
  return {
    level: 'rich',
    places,
    passes,
    airports,
    label: `장소 ${places}곳 · 패스 ${passes}종`,
  };
}
