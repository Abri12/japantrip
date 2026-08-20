import { PassAdvisory, TransitPass, TransitTip } from './types';

/** 교토 교통패스. 화면에 나오는 순서 그대로 둔다 */
export const KYOTO_PASSES: TransitPass[] = [
  {
    id: 'kyoto-subway-bus',
    name: '지하철·버스 1일권',
    shortName: '교토 1일권',
    nameJa: '地下鉄・バス1日券',
    cityIds: ['kyoto'],
    scope: 'city',
    tiers: [{ label: '1일권', yen: 1100 }],
    covers: [
      '교토 시영 지하철 전 노선',
      '시버스 전 노선 · 교토버스 · 게이한버스 대부분',
      'JR버스 — 교토역에서 다카오(진고지) 가는 균일구간이 들어가요',
    ],
    excludes: [
      'JR 전철 (교토역 ↔ 이나리 구간 등) — 버스와 헷갈리기 쉬워요',
      '한큐·게이한 전철',
      '히에이산·구라마·아라시야마로 올라가는 일부 버스 노선',
      '공항 리무진과 고속버스',
    ],
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
      '**예전의 버스 전용 1일권(700엔)은 없어졌어요.** 아직 그 가격으로 안내하는 블로그가 많은데 지금은 살 수 없고, 이 통합권이 유일한 대체예요. 그리고 24시간권이 아니라 그날 막차까지예요.',
    checkedAt: '2026-08',
    verified: true,
  },
];

/** 패스 목록보다 먼저 읽어야 하는 한 줄 결론 */
export const KYOTO_ADVISORY: PassAdvisory = {
    cityId: 'kyoto',
    tone: 'worth',
    headline: '교토는 거의 항상 사는 게 맞아요',
    body: '절과 신사가 흩어져 있어서 버스를 하루에 다섯 번 넘게 타요. 한 번에 230엔쯤이니 **1일권(1,100엔)은 웬만하면 본전을 넘겨요.** 네 도시 중에 판단이 가장 쉬운 곳이에요.',
  };

export const KYOTO_TIPS: TransitTip[] = [
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
];
