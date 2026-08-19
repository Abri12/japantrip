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
import { placesByCity } from '@/data/places';
import { passesForCity } from '@/data/transit';

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

/*
 * 결과를 도시별로 기억한다.
 *
 * 도시 선택 화면은 카드 하나마다 이걸 부르고, 안에서 장소·패스·공항을 각각
 * 훑는다. 데이터가 정적이라 같은 도시는 언제 불러도 답이 같으므로, 처음 한
 * 번만 계산하면 된다. (data/places/index.ts 의 색인과 같은 이유다)
 */
const CACHE = new Map<string, CityCoverage>();

export function cityCoverage(cityId: string, airportIds: string[]): CityCoverage {
  const hit = CACHE.get(cityId);
  if (hit) return hit;
  const result = compute(cityId, airportIds);
  CACHE.set(cityId, result);
  return result;
}

function compute(cityId: string, airportIds: string[]): CityCoverage {
  // 근교 여행지도 그 도시를 고른 사람에게 보이므로 함께 센다.
  // 색인이 이미 그 규칙으로 묶어 두었으므로 그대로 쓴다.
  const places = placesByCity(cityId).length;
  const passes = passesForCity(cityId).length;
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
