/**
 * 도시 내 이동 — 교통패스 · IC카드 · 노선 요령.
 *
 * 공항에서 시내로 들어온 다음이 진짜 문제다. 패스 종류가 많고 커버 범위가 겹치는데,
 * 잘못 사면 본전을 못 뽑는다. 그래서 패스마다 네 가지를 반드시 함께 적는다:
 * **언제 이득인지 · 무엇이 안 되는지 · 어디서 사는지 · 어떻게 쓰는지.**
 * 가격만 나열한 정보는 이미 넘치고, 도움이 안 되는 이유가 이 넷이 빠져서다.
 *
 * 말투는 옆에서 알려주듯 쓴다. 여행 중에 급하게 읽는 글이라
 * 격식보다 이해 속도가 중요하다.
 *
 * 요금·운영 방식은 자주 바뀌므로 항목마다 확인 여부(`verified`)를 남긴다.
 * 확인하지 못한 값은 UI에서 금액 대신 "변동 가능"으로 표시된다.
 */

import { BuyLink } from '@/constants/affiliates';

export type PassScope = 'city' | 'wide';

export interface TransitPass {
  id: string;
  name: string;
  /** 뱃지에 쓰는 짧은 이름. 관광지 목록에서 「주유패스 가능」처럼 보인다 */
  shortName: string;
  nameJa: string;
  /** 적용 도시 (data/cities.ts 의 id) */
  cityIds: string[];
  scope: PassScope;
  tiers: { label: string; yen: number }[];
  /** 무엇을 탈 수 있는지 */
  covers: string[];
  /** 무엇이 안 되는지 — 사고는 대개 여기서 난다 */
  excludes: string[];
  /**
   * 한 줄로 끊은 손익 판단.
   *
   * 이 화면에서 사용자가 하는 질문은 하나다 — **「내가 이걸 사면 이득인가?」**
   * `worthIt` 은 그 답을 문단으로 설명하는데, 문단은 훑을 때 안 읽힌다.
   * 카드 맨 위에서 3초 안에 읽고 넘어갈 한 줄이 따로 필요하다.
   *
   * 「지하철 5번」처럼 **셀 수 있는 기준**으로 적는다. 「많이 타면 이득」은
   * 판단에 아무 도움이 안 된다.
   */
  breakEven: string;
  /** 위의 한 줄을 풀어 쓴 설명 */
  worthIt: string;
  /** 어디서 사는지 */
  whereToBuy: string[];
  /**
   * 온라인 구매 링크. 제휴 추천 ID는 constants/affiliates.ts 에서 붙는다.
   * `productUrl` 을 채우면 검색이 아니라 상품 페이지로 바로 간다.
   */
  buyLinks?: BuyLink[];
  /** 어떻게 쓰는지 — 개찰구·버스에서 실제로 하는 동작 */
  howToUse: string[];
  /** 꼭 알아야 할 함정 */
  caution?: string;
  verified: boolean;
}

export const PASS_CHECKED_AT = '2026년 8월 확인';

export const PASSES: TransitPass[] = [
  // ── 오사카 ───────────────────────────────────────────
  {
    id: 'osaka-amazing',
    name: '오사카 주유패스',
    shortName: '주유패스',
    nameJa: '大阪周遊パス',
    cityIds: ['osaka'],
    scope: 'city',
    tiers: [
      { label: '1일권', yen: 3500 },
      { label: '2일권', yen: 5000 },
    ],
    covers: [
      '오사카 메트로 전 노선과 시영버스',
      '사철 일부 구간 (한큐·한신·게이한·긴테츠·난카이)',
      '관광시설 약 40곳 무료 입장 — 오사카성 천수각, 우메다 공중정원, 츠텐카쿠 같은 곳이요',
    ],
    excludes: ['JR 전 노선', '유니버설 스튜디오(USJ)', '간사이공항 ↔ 시내 구간'],
    breakEven: '유료 관광지 3곳 이상이면 이득',
    worthIt:
      '이 패스는 교통보다 입장료로 뽑는 거예요. 하루에 유료 관광지를 세 곳 이상 갈 생각이면 거의 무조건 이득이고, 지하철만 탈 거라면 오히려 손해예요.',
    whereToBuy: [
      '한국에서 미리 온라인으로 사두는 게 제일 편해요. 요즘은 QR로 받는 디지털권이 기본이에요',
      '현지에서 산다면 간사이공항 관광안내소, 난바·우메다 역 안내소에서 살 수 있어요',
    ],
    buyLinks: [
      { partner: 'klook', searchKeyword: '오사카 주유패스' },
      { partner: 'myrealtrip', searchKeyword: '오사카 주유패스' },
      { partner: 'kkday', searchKeyword: '오사카 주유패스' },
    ],
    howToUse: [
      '지하철은 개찰구의 QR 스캐너에 폰 화면을 대고 지나가면 돼요. QR 개찰구가 없으면 역무원에게 화면을 보여주세요',
      '버스는 내릴 때 차 안의 QR을 찍고 기사님께 화면을 보여주면 돼요',
      '관광시설은 입구의 QR을 찍은 다음 직원에게 보여주는 방식이에요',
    ],
    caution:
      'QR은 띄우고 5분이 지나면 만료돼요. 줄 서 있는 동안 미리 켜두면 다시 띄워야 하니, 차례가 왔을 때 켜는 게 좋아요. 그리고 2일권은 반드시 붙은 이틀이어야 해요. 하루 쉬었다 쓰는 건 안 돼요.',
    verified: true,
  },
  {
    id: 'enjoy-eco',
    name: '엔조이 에코카드',
    shortName: '에코카드',
    nameJa: 'エンジョイエコカード',
    cityIds: ['osaka'],
    scope: 'city',
    tiers: [
      { label: '평일 1일', yen: 820 },
      { label: '주말·공휴일 1일', yen: 620 },
    ],
    covers: ['오사카 메트로 전 노선', '오사카 시영버스'],
    excludes: ['사철과 JR', '관광시설 입장'],
    breakEven: '지하철 4번 이상 타면 이득',
    worthIt:
      '관광시설엔 관심 없고 지하철만 많이 탈 때 좋아요. 한 번 타면 240~290엔이니까 하루 네 번만 타도 본전이에요.',
    whereToBuy: ['오사카 메트로 각 역의 자동발매기에서 바로 살 수 있어요'],
    howToUse: [
      '보통 승차권처럼 개찰기에 넣고 지나가면 돼요',
      '처음 넣을 때 날짜가 찍히고, 그날 막차까지 쓸 수 있어요',
    ],
    caution:
      '주말이 200엔 더 싸요. 일정을 조정할 수 있다면 지하철 많이 타는 날을 주말로 몰면 이득이에요.',
    verified: false,
  },

  // ── 교토 ─────────────────────────────────────────────
  {
    id: 'kyoto-subway-bus',
    name: '지하철·버스 1일권',
    shortName: '교토 1일권',
    nameJa: '地下鉄・バス1日券',
    cityIds: ['kyoto'],
    scope: 'city',
    tiers: [{ label: '1일권', yen: 1100 }],
    covers: ['교토 시영 지하철 전 노선', '시버스·교토버스·게이한버스 대부분'],
    excludes: ['JR (교토역 ↔ 이나리 구간 등)', '한큐·게이한 전철'],
    breakEven: '버스·지하철 5번 이상 타면 이득',
    worthIt:
      '교토 버스는 한 번에 230엔이라 다섯 번만 타도 본전이에요. 절들이 흩어져 있어서 대부분 그냥 넘겨요.',
    whereToBuy: [
      '지하철역 자동발매기나 창구에서 살 수 있어요',
      '시버스·지하철 안내소에서도 팔아요',
    ],
    buyLinks: [
      { partner: 'klook', searchKeyword: '교토 지하철 버스 1일권' },
      { partner: 'kkday', searchKeyword: '교토 지하철 버스 1일권' },
    ],
    howToUse: [
      '지하철은 개찰기에 넣고 지나가면 돼요',
      '버스는 뒤로 타고 앞으로 내려요. 처음 탈 때 기사님 옆 카드리더에 넣으면 뒷면에 날짜가 찍혀요',
      '두 번째부터는 넣을 필요 없이 날짜 찍힌 면을 기사님께 보여주기만 하면 돼요',
    ],
    caution:
      '예전의 버스 전용 1일권(700엔)은 없어졌어요. 아직 그 가격으로 안내하는 블로그가 많은데 지금은 살 수 없고, 이 통합권이 유일한 대체예요. 그리고 24시간권이 아니라 그날 막차까지예요.',
    verified: true,
  },

  // ── 후쿠오카 ─────────────────────────────────────────
  {
    id: 'fukuoka-city-pass',
    name: '후쿠오카 투어리스트 시티패스',
    shortName: '시티패스',
    nameJa: '福岡ツーリストシティパス',
    cityIds: ['fukuoka'],
    scope: 'city',
    tiers: [
      { label: '시내', yen: 2500 },
      { label: '시내 + 다자이후', yen: 2800 },
    ],
    covers: ['후쿠오카시 지하철', '니시테츠 버스 (지정 구역)', 'JR 일부 구간', '시영 여객선'],
    excludes: ['신칸센', '지정 구역 밖으로 나가는 버스'],
    breakEven: '다자이후까지 갈 때만 이득',
    worthIt:
      '다자이후까지 갈 거라면 300엔만 더 내면 니시테츠 전철이 붙으니 그쪽이 나아요. 시내만 돌 거면 지하철 1일권(640엔)이 훨씬 싸요.',
    whereToBuy: [
      '후쿠오카공항 국제선 터미널 안내 창구에서 도착하자마자 살 수 있어요',
      '하카타역 종합안내소, 하카타 버스터미널, 니시테츠 텐진역에서도 팔아요',
      '한국 여권이면 「my route」 앱으로 디지털권을 살 수도 있어요',
    ],
    buyLinks: [
      { partner: 'klook', searchKeyword: '후쿠오카 투어리스트 시티패스' },
      { partner: 'myrealtrip', searchKeyword: '후쿠오카 시티패스' },
    ],
    howToUse: [
      '종이 패스는 쓸 날짜 칸을 동전으로 긁어서 활성화해요',
      '지하철·전철은 개찰구에서 역무원에게 보여주고 지나가요',
      '버스는 내릴 때 기사님께 보여주면 돼요',
    ],
    caution:
      '후쿠오카 시내는 지하철 세 정거장이면 웬만한 데를 다 가요. 생각보다 본전 뽑기가 어려운 패스예요.',
    verified: true,
  },
  {
    id: 'fukuoka-subway-1day',
    name: '후쿠오카 지하철 1일 승차권',
    shortName: '지하철 1일권',
    nameJa: '地下鉄1日乗車券',
    cityIds: ['fukuoka'],
    scope: 'city',
    tiers: [{ label: '1일권', yen: 640 }],
    covers: ['후쿠오카시 지하철 전 노선 (공항선·하코자키선·나나쿠마선)'],
    excludes: ['버스', 'JR', '니시테츠'],
    breakEven: '지하철 3번 이상 타면 이득',
    worthIt:
      '하카타·텐진·오호리공원 위주로 다닌다면 이거면 충분해요. 한 번에 210~260엔이라 세 번만 타도 본전이에요.',
    whereToBuy: ['지하철역 자동발매기에서 바로 살 수 있어요'],
    buyLinks: [
      { partner: 'klook', searchKeyword: '후쿠오카 지하철 1일권' },
      { partner: 'myrealtrip', searchKeyword: '후쿠오카 지하철 패스' },
    ],
    howToUse: ['개찰기에 넣고 지나가면 돼요. 그날 막차까지 몇 번이든 탈 수 있어요'],
    verified: true,
  },

  // ── 간사이 광역 ──────────────────────────────────────
  {
    id: 'kansai-railway',
    name: '간사이 레일웨이 패스 Lite',
    shortName: '간사이 패스',
    nameJa: 'KANSAI RAILWAY PASS Lite',
    cityIds: ['osaka', 'kyoto'],
    scope: 'wide',
    tiers: [
      { label: '2일권', yen: 5200 },
      { label: '3일권', yen: 6500 },
    ],
    covers: [
      '오사카 메트로 전 노선',
      '한큐 · 한신 · 난카이 · 긴테츠',
      '게이한 (본선 계통) — 고베 · 나라 · 히메지까지 갈 수 있어요',
    ],
    excludes: [
      'JR 전 노선 (하루카·간쿠쾌속도 안 돼요)',
      '교토 시영지하철 — 2026년 4월부터 빠졌어요',
      '게이한 게이신선 · 이시야마사카모토선',
      '란덴 (게이후쿠 전철)',
      '버스 전부',
      '특급 열차의 특급권 (따로 사야 해요)',
    ],
    breakEven: '두 도시 이상 오갈 때만 이득',
    worthIt:
      '오사카를 거점으로 고베·나라·히메지를 오갈 때 맞아요. 다만 2026년 4월부터 교토 시영지하철이 빠져서, 교토 시내를 많이 도는 일정이라면 예전만큼 이득이 아니에요. 한 도시에만 머문다면 그 도시 1일권이 나아요.',
    whereToBuy: [
      '온라인 판매만 해요. 클룩·KKday·와그 같은 곳에서 미리 사두세요',
      '현지 창구에서는 살 수 없어요',
    ],
    buyLinks: [
      { partner: 'klook', searchKeyword: '간사이 레일웨이 패스' },
      { partner: 'kkday', searchKeyword: '간사이 레일웨이 패스' },
    ],
    howToUse: [
      '받은 QR이나 교환권을 개찰구 직원에게 보여주고 지나가요',
      '하루는 오전 3시부터 다음날 오전 2시 59분까지로 쳐요',
      '2일권·3일권 모두 **연속된 날**로 써야 해요',
    ],
    caution:
      '2026년 4월에 이름이 「Lite」로 바뀌면서 교토 시영지하철이 커버에서 빠졌어요. 아직 예전 이름(간사이 스루패스)과 예전 범위로 안내하는 블로그가 많으니 주의하세요. JR도 원래부터 안 돼요.',
    verified: true,
  },
];

export function passesForCity(cityId: string): TransitPass[] {
  return PASSES.filter((p) => p.cityIds.includes(cityId));
}

// ── IC 카드 ────────────────────────────────────────────

export interface IcCard {
  id: string;
  name: string;
  nameJa: string;
  region: string;
  note: string;
}

export const IC_CARDS: IcCard[] = [
  {
    id: 'icoca',
    name: 'ICOCA',
    nameJa: 'イコカ',
    region: '간사이',
    note: '오사카·교토에서 가장 흔해요',
  },
  {
    id: 'sugoca',
    name: 'SUGOCA',
    nameJa: 'スゴカ',
    region: '규슈',
    note: 'JR큐슈에서 만든 카드예요',
  },
  {
    id: 'hayakaken',
    name: '하야카켄',
    nameJa: 'はやかけん',
    region: '후쿠오카',
    note: '지하철역에서 살 수 있고 보증금 500엔이 붙어요',
  },
];

/** IC카드에 대해 실제로 알아야 할 것. 카드 이름 외우는 것보다 이 셋이 훨씬 쓸모 있다. */
export const IC_CARD_GUIDE = [
  '어느 도시에서 산 카드든 전국에서 다 써요. ICOCA 하나로 후쿠오카 지하철도 타고 도쿄 지하철도 타요.',
  '아이폰이면 지갑 앱에 바로 추가할 수 있어요. 실물 카드를 안 사도 되고 충전도 한국 신용카드로 돼요.',
  '패스랑 IC카드는 쓰임이 달라요. 정해진 구간을 많이 타면 패스, 일정이 들쭉날쭉하면 IC카드가 편해요.',
];

// ── 도시별 이동 요령 ──────────────────────────────────

export interface TransitTip {
  cityId: string;
  title: string;
  body: string;
}

export const TRANSIT_TIPS: TransitTip[] = [
  {
    cityId: 'osaka',
    title: '미도스지선 하나만 알아도 절반은 끝나요',
    body: '난바, 신사이바시, 우메다, 신오사카가 전부 미도스지선(빨간색) 위에 있어요. 숙소를 이 노선 근처로 잡으면 갈아탈 일이 거의 없어요.',
  },
  {
    cityId: 'osaka',
    title: 'USJ 가는 날은 패스가 소용없어요',
    body: '유니버설 스튜디오는 지하철이 아니라 JR 유메사키선으로 가요. 주유패스로는 못 타니까 그날은 따로 요금을 준비하세요.',
  },
  {
    cityId: 'kyoto',
    title: '버스는 뒤로 타요',
    body: '교토 시버스는 뒷문으로 타고 앞문으로 내려요. 요금도 내릴 때 내고요. 앞에서 기다리면 못 타니 주의하세요.',
  },
  {
    cityId: 'kyoto',
    title: '단풍철엔 버스 말고 전철이요',
    body: '가을엔 시내버스가 꽉 차서 정류장을 그냥 지나치기도 해요. 후시미이나리는 JR 나라선, 아라시야마는 한큐나 란덴이 훨씬 안정적이에요.',
  },
  {
    cityId: 'fukuoka',
    title: '생각보다 걸어도 되는 거리가 많아요',
    body: '하카타에서 텐진까지 지하철로 5분인데 걸어도 25분이에요. 중간에 캐널시티 같은 볼거리가 있어서 굳이 안 타도 되는 구간이 꽤 있어요.',
  },
  {
    cityId: 'fukuoka',
    title: '도심 버스는 짧은 거리가 싸요',
    body: '텐진 주변 지정 구역 안에서는 니시테츠 버스가 균일 저가 요금으로 다녀요. 짧게 갈 때는 지하철보다 싸요.',
  },
];

export function tipsForCity(cityId: string): TransitTip[] {
  return TRANSIT_TIPS.filter((t) => t.cityId === cityId);
}

/** id 로 패스를 찾는다. 관광지 화면에서 뱃지 이름을 얻을 때 쓴다. */
export function findPass(id: string): TransitPass | undefined {
  return PASSES.find((p) => p.id === id);
}

/** 뱃지에 쓸 짧은 이름. 못 찾으면 null 이라 UI가 조용히 건너뛴다. */
export function passShortName(id: string): string | null {
  return findPass(id)?.shortName ?? null;
}
