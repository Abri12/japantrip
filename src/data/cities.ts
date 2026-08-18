/**
 * 거점 도시 단계적 오픈.
 *
 * 전국을 한 번에 열면 어느 도시도 데이터가 얇아진다. 초기 사용자는 "정보가 없네"
 * 한 번으로 이탈하므로, 밀도가 곧 생존이다. 그래서 한국인 방문 비중이 높고
 * 교통이 복잡해 앱의 가치가 즉시 증명되는 도시부터 연다.
 *
 * 단계가 올라갈수록 운영이 채우는 비중이 줄고 사용자 기여(UGC)가 늘어난다.
 * 3단계 소도시는 애초에 공식 한국어 정보가 거의 없어서, 사용자가 개척한
 * 데이터 자체가 앱의 해자가 된다.
 */

export type Phase = 1 | 2 | 3;

export type CityStatus =
  /** 정식 오픈 — 큐레이션 데이터가 채워져 있다 */
  | 'live'
  /** 오픈했으나 데이터가 얇다 — 기여 보상 배율이 높다 */
  | 'seeding'
  /** 미오픈 — 사전 관심 등록만 받는다 */
  | 'coming';

export interface City {
  id: string;
  name: string;
  nameJa: string;
  phase: Phase;
  status: CityStatus;
  /** 지진 정보 매칭용 도도부현 */
  prefecture: string;
  /** 날씨 조회용 도심 좌표 (역·시청 인근) */
  lat: number;
  lng: number;
  /**
   * 기상청(JMA) 경보·주의보 조회용 지역 코드.
   * https://www.jma.go.jp/bosai/common/const/area.json 의 offices 코드다.
   */
  jmaAreaCode: string;
  /** 이 도시로 들어오는 공항 (data/airports.ts 의 id) */
  airportIds: string[];
  /**
   * 왜 이 단계에 배치했는지 — **개발 우선순위를 정한 내부 근거**다.
   * 사용자 화면에 쓰지 말 것. 화면에는 travelTip 을 쓴다.
   */
  rationale: string;
  /** 이 도시에 처음 가는 사람에게 실제로 도움이 되는 한 줄 */
  travelTip: string;
  /**
   * 도시 소개 한 줄 — 처음 듣는 사람도 감이 오게.
   *
   * 전에는 이 자리에 대표 관광지 이름(「오사카성」)만 있었는데, 그건 이미 그
   * 도시를 아는 사람에게나 의미가 있다. 처음 보는 사람에게는 "이 도시가 어떤
   * 곳인지"가 먼저다 — 한국인들이 왜 찾는지, 어떤 도시와 비슷한지, 뭘로 유명한지.
   * 관광지 목록은 카드 안에 이미 「관광지 N곳」으로 따로 표시되므로 여기서
   * 하나를 다시 짚을 필요가 없다.
   */
  blurb: string;
  /**
   * 대표 이미지 대신 쓰는 랜드마크 표시.
   *
   * 실제 사진은 저작권 확인이 끝난 것만 쓸 수 있어서, 우선 이모지로 도시의
   * 인상을 준다. 나중에 사진으로 교체하더라도 이 자리(emoji → image)만 바꾸면 된다.
   */
  landmark: { emoji: string; tint: string };
  /** 기여 보상 배율. 데이터가 부족한 도시일수록 높다 */
  contributionMultiplier: number;
}

/**
 * 화면에 보이는 단계 이름.
 *
 * 「1단계 · MVP」처럼 개발 로드맵 용어를 그대로 쓰면 사용자에게는 아무 뜻이
 * 없다. 사용자가 알고 싶은 건 "지금 이 도시 정보가 얼마나 준비됐는지"뿐이라
 * 그 상태로 이름을 바꿨다.
 */
export const PHASE_LABEL: Record<Phase, string> = {
  1: '지금 가장 자세해요',
  2: '기본 정보는 있어요',
  3: '채워가는 중이에요',
};

export const PHASE_GOAL: Record<Phase, string> = {
  1: '교통패스부터 관광지까지 꼼꼼히 정리해뒀어요',
  2: '공항 가는 길과 대표 관광지를 정리해뒀어요',
  3: '대표 관광지부터 하나씩 채우고 있어요',
};

export const CITIES: City[] = [
  // ── 1단계 ────────────────────────────────────────────
  {
    id: 'osaka',
    name: '오사카',
    nameJa: '大阪',
    jmaAreaCode: '270000',
    lat: 34.6937,
    lng: 135.5023,
    phase: 1,
    status: 'live',
    prefecture: '大阪府',
    airportIds: ['kix'],
    rationale:
      '한국인이 가장 많이 찾는 도시예요. 간사이공항에서 라피트·하루카·공항급행·간쿠쾌속이 전부 다른 곳으로 가는데, 처음이면 이 차이를 모르고 승강장에서 헤매기 쉬워요. 그래서 여기부터 정리했어요.',
    landmark: { emoji: '🏯', tint: '#FDF0E4' },
    blurb: '한국인의 대표 여행지 — 오사카성과 도톤보리로 유명해요',
    travelTip:
      '난바·신사이바시·우메다가 모두 미도스지선(빨간색) 위에 있어요. 숙소를 이 노선 근처로 잡으면 갈아탈 일이 거의 없어요.',
    contributionMultiplier: 1.0,
  },
  {
    id: 'kyoto',
    name: '교토',
    nameJa: '京都',
    jmaAreaCode: '260000',
    lat: 35.0116,
    lng: 135.7681,
    phase: 1,
    status: 'live',
    prefecture: '京都府',
    airportIds: ['kix'],
    rationale:
      '오사카와 같은 공항을 쓰지만 타는 노선이 완전히 달라요(하루카 직통). 그래서 오사카와 항상 같이 봐야 해요.',
    landmark: { emoji: '⛩️', tint: '#FBEBEC' },
    blurb: '일본의 옛 수도 — 한국의 경주 같은, 절과 신사의 도시예요',
    travelTip:
      '절과 신사가 흩어져 있어서 버스를 많이 타요. 지하철·버스 1일권이 거의 항상 이득이에요.',
    contributionMultiplier: 1.0,
  },
  {
    id: 'fukuoka',
    name: '후쿠오카',
    nameJa: '福岡',
    jmaAreaCode: '400000',
    lat: 33.5904,
    lng: 130.4017,
    phase: 1,
    status: 'live',
    prefecture: '福岡県',
    airportIds: ['fuk'],
    rationale:
      '한국에서 가장 가까워서 처음 가시는 분이나 짧게 다녀오시는 분이 많아요. 국제선 터미널엔 지하철역이 없어서 무료 셔틀을 타야 하는데, 모르면 도착하자마자 막혀요.',
    landmark: { emoji: '🍜', tint: '#FCF3DF' },
    blurb: '한국에서 가장 가까운 일본 도시 — 미식으로 유명해요',
    travelTip:
      '공항에서 하카타역까지 지하철로 5분이에요. 다만 국제선 터미널엔 지하철역이 없어서 무료 셔틀을 먼저 타야 해요.',
    contributionMultiplier: 1.0,
  },

  // ── 2단계 ────────────────────────────────────────────
  {
    id: 'tokyo',
    name: '도쿄',
    nameJa: '東京',
    jmaAreaCode: '130000',
    lat: 35.6762,
    lng: 139.6503,
    phase: 2,
    status: 'live',
    prefecture: '東京都',
    airportIds: ['nrt', 'hnd'],
    rationale:
      '노선이 세계에서 가장 복잡하고, 공항이 둘이라 도심까지 거리가 3배나 차이 나요. 볼 게 많은 만큼 정리해둘 가치도 커요.',
    landmark: { emoji: '🗼', tint: '#EAF0FC' },
    blurb: '일본의 수도이자 최대 도시예요',
    travelTip:
      '노선이 워낙 많아서 구글 지도 없이는 헤매기 쉬워요. 오프라인 지도를 미리 받아두면 마음이 편해요.',
    contributionMultiplier: 1.1,
  },
  {
    id: 'sapporo',
    name: '삿포로',
    nameJa: '札幌',
    jmaAreaCode: '016000',
    lat: 43.0621,
    lng: 141.3544,
    phase: 2,
    status: 'live',
    prefecture: '北海道',
    airportIds: ['cts'],
    rationale:
      '겨울엔 눈 때문에 결항이나 교통 통제가 잦아요. 실시간 정보가 정말 필요해지는 곳이에요.',
    landmark: { emoji: '❄️', tint: '#E9F2FA' },
    blurb: '홋카이도의 중심 도시 — 눈과 게 요리로 유명해요',
    travelTip:
      '겨울엔 눈 때문에 버스가 늦어요. 시간 약속이 있는 날은 지하철이나 JR이 안전해요.',
    contributionMultiplier: 1.1,
  },

  // ── 3단계 ────────────────────────────────────────────
  {
    id: 'okinawa',
    name: '오키나와',
    nameJa: '沖縄',
    jmaAreaCode: '471000',
    lat: 26.2124,
    lng: 127.6809,
    phase: 3,
    status: 'seeding',
    prefecture: '沖縄県',
    airportIds: ['oka'],
    rationale:
      '철도가 유이레일 하나뿐이라 렌터카 없이는 다니기 어려워요. 대중교통 정보가 얇아서 제보가 특히 귀한 곳이에요.',
    landmark: { emoji: '🐋', tint: '#E4F4F1' },
    blurb: '일본의 하와이라 불리는 아열대 휴양지예요',
    travelTip:
      '유이레일이 나하 시내만 다녀요. 츄라우미 수족관처럼 북부로 가려면 렌터카나 고속버스가 필요해요.',
    contributionMultiplier: 1.5,
  },
  {
    id: 'nagoya',
    name: '나고야',
    nameJa: '名古屋',
    jmaAreaCode: '230000',
    lat: 35.1815,
    lng: 136.9066,
    phase: 3,
    status: 'seeding',
    prefecture: '愛知県',
    airportIds: ['ngo'],
    rationale: '직항은 있는데 한국어 정보가 상대적으로 적어요.',
    landmark: { emoji: '🍤', tint: '#FBF0E8' },
    blurb: '일본 3대 도시 중 하나 — 도요타의 고장이에요',
    travelTip:
      '공항에서 나고야역까지 메이테츠 전철로 30분이면 닿아요. 역과 터미널이 붙어 있어 환승이 편해요.',
    contributionMultiplier: 1.5,
  },
  {
    id: 'matsuyama',
    name: '마츠야마',
    nameJa: '松山',
    jmaAreaCode: '380000',
    lat: 33.8416,
    lng: 132.7657,
    phase: 3,
    status: 'coming',
    prefecture: '愛媛県',
    airportIds: [],
    rationale: '도고온천 덕에 직항이 생겼는데 한국어 정보는 아직 거의 없어요.',
    landmark: { emoji: '♨️', tint: '#F3EEF9' },
    blurb: '일본에서 손꼽히는 온천, 도고온천이 있는 도시예요',
    travelTip:
      '도고온천이 대표 명소예요. 시내 노면전차로 편하게 오갈 수 있어요.',
    contributionMultiplier: 2.0,
  },
  {
    id: 'shizuoka',
    name: '시즈오카',
    nameJa: '静岡',
    jmaAreaCode: '220000',
    lat: 34.9756,
    lng: 138.3827,
    phase: 3,
    status: 'coming',
    prefecture: '静岡県',
    airportIds: [],
    rationale: '후지산 가는 거점으로 찾는 분이 늘고 있어요.',
    landmark: { emoji: '🗻', tint: '#EDF1F7' },
    blurb: '후지산이 가장 잘 보이는 도시예요',
    travelTip:
      '날이 맑으면 후지산이 잘 보여요. 신칸센으로 도쿄·오사카 양쪽 다 가까워요.',
    contributionMultiplier: 2.0,
  },
  {
    id: 'takamatsu',
    name: '다카마츠',
    nameJa: '高松',
    jmaAreaCode: '370000',
    lat: 34.3401,
    lng: 134.0434,
    phase: 3,
    status: 'coming',
    prefecture: '香川県',
    airportIds: [],
    rationale: '우동 순례와 세토우치 예술제로 찾는 분이 많아요.',
    landmark: { emoji: '🍲', tint: '#F5F1E6' },
    blurb: '우동의 성지이자 세토내해 예술섬으로 가는 관문이에요',
    travelTip:
      '우동 가게가 도심에 몰려 있어요. 세토우치 섬으로 가는 배도 항구에서 바로 타요.',
    contributionMultiplier: 2.0,
  },
];

export function findCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

export function cityByName(name: string): City | undefined {
  return CITIES.find((c) => c.name === name);
}

export function citiesInPhase(phase: Phase): City[] {
  return CITIES.filter((c) => c.phase === phase);
}

/** 지금 콘텐츠를 볼 수 있는 도시 (미오픈 제외) */
export function openCities(): City[] {
  return CITIES.filter((c) => c.status !== 'coming');
}

export const STATUS_LABEL: Record<CityStatus, string> = {
  live: '정식 오픈',
  seeding: '데이터 모으는 중',
  coming: '오픈 예정',
};
