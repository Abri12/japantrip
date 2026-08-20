/**
 * 도시별 정보 깊이 — 기대치를 실제에 맞추는 값.
 *
 * 이 값이 존재하는 이유가 **손으로 적은 라벨이 데이터와 어긋났기 때문**이다.
 * 나고야가 「데이터 모으는 중」인데 장소가 0개였고, 삿포로(2곳)가 오사카(15곳)와
 * 같은 라벨을 달고 있었다.
 *
 * 그러니 여기서 볼 것은 계산식보다 **실제 데이터와 맞물려 돌아가는가**다.
 * 진짜 데이터로 부른다 — 가짜를 넣으면 그 어긋남을 다시 못 잡는다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CITIES } from '@/data/cities';
import { placesByCity } from '@/data/places';
import { cityCoverage } from '@/lib/coverage';

describe('실제 데이터와 맞물린다', () => {
  it('센 장소 수가 데이터와 같다', () => {
    for (const city of CITIES) {
      const c = cityCoverage(city.id, city.airportIds);
      strictEqual(c.places, placesByCity(city.id).length, city.name);
    }
  });

  it('공항 수는 그 도시에 실제로 걸린 것만 센다', () => {
    for (const city of CITIES) {
      const c = cityCoverage(city.id, city.airportIds);
      ok(c.airports <= city.airportIds.length, `${city.name} 공항 수가 부풀려졌어요`);
    }
  });

  it('열기로 한 도시에는 갈 공항이 있다', () => {
    /* 공항이 없으면 그 도시는 「어떻게 가는지」를 답할 수 없다. 고를 수 있게
       열어 두면 안 되는 상태다. */
    for (const city of CITIES.filter((c) => c.status !== 'coming')) {
      ok(cityCoverage(city.id, city.airportIds).airports > 0, `${city.name} 에 공항이 없어요`);
    }
  });
});

describe('단계와 라벨', () => {
  it('장소가 없으면 그렇다고 말하고, 무엇은 있는지도 말한다', () => {
    const c = cityCoverage('__빈도시__', []);
    strictEqual(c.level, 'empty');
    strictEqual(c.places, 0);
    // 「없어요」만 말하면 고를 이유가 없어 보인다. 공항·교통은 있다는 걸 같이 말한다.
    ok(c.caveat?.includes('공항'));
  });

  it('장소가 적으면 단서를 반드시 붙인다', () => {
    /* 라벨만 보고 오사카만큼 준비돼 있다고 기대하게 두면 안 된다는 것이
       이 모듈이 생긴 이유다. */
    for (const city of CITIES) {
      const c = cityCoverage(city.id, city.airportIds);
      if (c.level === 'rich') continue;
      ok(c.caveat, `${city.name}(${c.level}) 에 단서가 없어요`);
    }
  });

  it('가장 촘촘한 도시만 단서 없이 나간다', () => {
    const rich = CITIES.filter(
      (c) => cityCoverage(c.id, c.airportIds).level === 'rich',
    );
    ok(rich.length > 0, '촘촘한 도시가 하나도 없으면 기준이 잘못된 것이다');
    for (const city of rich) {
      strictEqual(cityCoverage(city.id, city.airportIds).caveat, undefined, city.name);
    }
  });

  it('라벨에 실제 숫자가 들어간다', () => {
    for (const city of CITIES) {
      const c = cityCoverage(city.id, city.airportIds);
      if (c.places === 0) continue;
      ok(c.label.includes(String(c.places)), `${city.name} 라벨에 장소 수가 없어요: ${c.label}`);
    }
  });
});

describe('같은 도시는 언제 불러도 같은 답', () => {
  it('두 번 불러도 같은 값을 준다', () => {
    /* 데이터가 정적이라 캐시가 맞다. 다만 캐시가 도시를 섞어 담으면
       한 도시의 값이 다른 도시로 나간다. */
    for (const city of CITIES) {
      const a = cityCoverage(city.id, city.airportIds);
      const b = cityCoverage(city.id, city.airportIds);
      strictEqual(a, b, city.name);
    }
  });

  it('도시가 다르면 다른 값을 준다', () => {
    const ids = CITIES.map((c) => c.id);
    const seen = new Set(ids.map((id) => cityCoverage(id, []) as unknown));
    strictEqual(seen.size, ids.length, '캐시가 도시를 섞어 담고 있어요');
  });
});
