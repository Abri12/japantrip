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
   * JR서일본 지역 코드 — 서버가 `area_{code}_trafficinfo.json` 으로 확인한다.
   * 비어 있으면 이 회사는 자동 확인 대상이 아니다.
   */
  westjrArea?: string;
  /**
   * 공공교통 오픈데이터(ODPT)의 사업자 코드.
   *
   * 서버가 `/api/train-status/odpt` 로 받은 목록에서 이 값으로 골라낸다.
   * **키 없이 받을 수 있는 건 도에이(`Toei`)뿐이다** — 도쿄메트로·JR동일본은
   * 개발자 등록으로 받은 키가 서버에 있어야 나온다(무료·상업 이용 허용).
   * 그래서 코드를 적어 두되, 값이 실제로 오는지는 화면이 확인하고 판단한다.
   */
  odptOperator?: string;
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
    /*
     * 도에이를 맨 앞에 둔다. 세 회사 중 **지금 자동으로 확인되는 유일한 곳**
     * 이기도 하고, 이 앱의 공항 경로가 그 위에 있다 — 아사쿠사선은 하네다·
     * 나리타 양쪽으로 이어지고 오에도선은 신주쿠를 지난다.
     */
    { operator: '도에이 지하철', url: 'https://www.kotsu.metro.tokyo.jp/subway/schedule/', odptOperator: 'Toei' },
    // 아래 둘은 ODPT 키가 서버에 있어야 자동 확인된다. 없으면 링크만 쓴다.
    { operator: '도쿄메트로', url: 'https://www.tokyometro.jp/unkou/', odptOperator: 'TokyoMetro' },
    { operator: 'JR 동일본 (간토)', url: 'https://traininfo.jreast.co.jp/train_info/kanto.aspx', odptOperator: 'JR-East' },
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

/** JR서일본으로 확인할 수 있는 지역 코드 */
export function autoCheckableArea(cityId: string): string | undefined {
  return trainStatusFor(cityId).find((s) => s.westjrArea)?.westjrArea;
}

/** ODPT 로 확인할 수 있는 사업자 코드들 */
export function odptOperators(cityId: string): string[] {
  return trainStatusFor(cityId)
    .map((s) => s.odptOperator)
    .filter((o): o is string => !!o);
}
