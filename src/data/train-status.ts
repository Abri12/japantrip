/**
 * 교통 운행정보 — 어디를 봐야 하나.
 *
 * ## 왜 도시마다 다른가
 *
 * 지진·기상특보는 전국을 한 API 가 답하지만(P2PQuake · 기상청), 철도는
 * **회사마다 따로**다. 그리고 회사마다 공개 정도가 다르다.
 *
 *   JR서일본   지역별 JSON 을 키 없이 준다 → 앱이 직접 확인할 수 있다
 *   JR동일본   외부 접근을 막아 뒀다(403)
 *   그 외      공개 API 가 없거나 등록이 필요하다
 *
 * 그래서 전 도시에 같은 수준을 약속하지 않는다. **확인할 수 있는 곳은
 * 확인해서 알려주고, 아닌 곳은 공식 페이지로 보낸다.** 없는 것을 있는 척
 * 하느니 어디를 봐야 하는지라도 정확히 아는 편이 낫다.
 *
 * ## 왜 링크만 있는 도시도 값지다
 *
 * 태풍·폭설이 오면 여행자가 가장 급하게 찾는 것이 「지금 전철이 다니나」인데,
 * 그때 일본어로 회사 이름부터 찾아 헤맨다. 도시를 고르면 그 도시를 담당하는
 * 회사의 운행정보 페이지가 바로 나오는 것만으로도 그 시간이 사라진다.
 */

export interface TrainStatusSource {
  /** 화면에 적는 회사 이름 */
  operator: string;
  /** 공식 운행정보 페이지 — 자동 확인 여부와 상관없이 항상 준다 */
  url: string;
  /**
   * 서버가 자동으로 확인할 수 있는 곳의 지역 코드.
   *
   * 지금은 JR서일본만 가능하다(`area_{code}_trafficinfo.json`).
   * 비어 있으면 링크만 준다 — 그게 우리가 아는 전부라는 뜻이다.
   */
  westjrArea?: string;
}

/**
 * 도시별 운행정보 출처.
 *
 * 한 도시에 여러 회사가 걸린다(도쿄는 JR·메트로·도에이). 여행자가 실제로
 * 타는 순서로 적는다 — 앞의 것이 막히면 대개 여행이 막힌다.
 */
export const TRAIN_STATUS: Record<string, TrainStatusSource[]> = {
  osaka: [
    { operator: 'JR 서일본 (간사이)', url: 'https://trafficinfo.westjr.co.jp/kinki.html', westjrArea: 'kinki' },
    { operator: '오사카 메트로', url: 'https://subway.osakametro.co.jp/guide/subway_information.php' },
  ],
  kyoto: [
    { operator: 'JR 서일본 (간사이)', url: 'https://trafficinfo.westjr.co.jp/kinki.html', westjrArea: 'kinki' },
    { operator: '교토 시영지하철', url: 'https://www.city.kyoto.lg.jp/kotsu/' },
  ],
  tokyo: [
    // JR동일본은 외부 접근을 막아 두어 자동 확인이 안 된다. 링크만 준다.
    { operator: 'JR 동일본 (간토)', url: 'https://traininfo.jreast.co.jp/train_info/kanto.aspx' },
    { operator: '도쿄메트로', url: 'https://www.tokyometro.jp/unkou/' },
    { operator: '도에이 지하철', url: 'https://www.kotsu.metro.tokyo.jp/subway/schedule/' },
  ],
  fukuoka: [
    { operator: 'JR 규슈', url: 'https://www.jrkyushu.co.jp/unkou/' },
    { operator: '후쿠오카시 지하철', url: 'https://subway.city.fukuoka.lg.jp/' },
    { operator: '니시테츠', url: 'https://www.nishitetsu.jp/train/' },
  ],
  sapporo: [
    // 겨울 폭설로 이 앱에서 가장 자주 필요해지는 도시다.
    { operator: 'JR 홋카이도', url: 'https://www3.jrhokkaido.co.jp/webunkou/' },
    { operator: '삿포로 시영지하철·시전', url: 'https://www.city.sapporo.jp/st/' },
  ],
  nagoya: [
    { operator: 'JR 도카이', url: 'https://traininfo.jr-central.co.jp/' },
    { operator: '메이테츠', url: 'https://top.meitetsu.co.jp/unko/' },
  ],
  okinawa: [
    // 태풍이 오면 유이레일보다 항공편이 먼저 멈춘다. 그 사실도 화면에 적는다.
    { operator: '유이레일', url: 'https://www.yui-rail.co.jp/' },
  ],
  matsuyama: [
    { operator: '이요테츠', url: 'https://www.iyotetsu.co.jp/' },
    { operator: 'JR 시코쿠', url: 'https://www.jr-shikoku.co.jp/info/' },
  ],
  takamatsu: [
    { operator: '코토덴', url: 'https://www.kotoden.co.jp/' },
    { operator: 'JR 시코쿠', url: 'https://www.jr-shikoku.co.jp/info/' },
  ],
  shizuoka: [{ operator: 'JR 도카이', url: 'https://traininfo.jr-central.co.jp/' }],
};

export function trainStatusFor(cityId: string): TrainStatusSource[] {
  return TRAIN_STATUS[cityId] ?? [];
}

/** 그 도시에 서버가 자동으로 확인할 수 있는 출처가 있는지 */
export function autoCheckableArea(cityId: string): string | undefined {
  return trainStatusFor(cityId).find((s) => s.westjrArea)?.westjrArea;
}
