import { PassAdvisory, TransitPass, TransitTip } from './types';

/** 오사카 교통패스. 화면에 나오는 순서 그대로 둔다 */
export const OSAKA_PASSES: TransitPass[] = [
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
];

/** 패스 목록보다 먼저 읽어야 하는 한 줄 결론 */
export const OSAKA_ADVISORY: PassAdvisory = {
    cityId: 'osaka',
    tone: 'worth',
    headline: '오사카는 교통비가 아니라 입장료로 뽑는 패스예요',
    body: '주유패스(3,500엔)의 값어치는 지하철이 아니라 관광시설 무료 입장에 있어요. 유료 관광지를 세 곳 이상 갈 생각이면 이득이고, 지하철만 탈 거면 에코카드(평일 820엔)가 훨씬 나아요. 다만 시설마다 시간 조건이 붙는 게 있으니 그날 동선부터 보세요.',
  };

export const OSAKA_TIPS: TransitTip[] = [
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
];
