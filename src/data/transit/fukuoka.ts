import { PassAdvisory, TransitPass, TransitTip } from './types';

/** 후쿠오카 교통패스. 화면에 나오는 순서 그대로 둔다 */
export const FUKUOKA_PASSES: TransitPass[] = [
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
    checkedAt: '2026-08',
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
    breakEven: '해외 카드가 있으면 살 이유가 없어요',
    worthIt:
      '하카타·텐진·오호리공원 위주로 다닌다면 범위는 이거면 충분하고, 한 번에 210~260엔이라 세 번만 타도 640엔을 넘겨요. 그런데 **해외 신용카드를 그냥 개찰구에 대고 타면 같은 카드로 하루 640엔이 넘지 않아요.** 1일권과 값이 똑같이 맞춰져 있어서, 터치 결제가 되는 카드가 있으면 이 표를 사러 발매기에 갈 이유가 없어요. 현금만 쓰거나 터치 결제가 안 되는 카드일 때의 선택지예요.',
    whereToBuy: ['지하철역 자동발매기에서 바로 살 수 있어요'],
    buyLinks: [
      { partner: 'klook', searchKeyword: '후쿠오카 지하철 1일권' },
      { partner: 'myrealtrip', searchKeyword: '후쿠오카 지하철 패스' },
    ],
    howToUse: ['개찰기에 넣고 지나가면 돼요. 그날 막차까지 몇 번이든 탈 수 있어요'],
    caution:
      '표를 사기 전에 카드부터 보세요. Visa·JCB·아멕스·유니온페이 중에 ))) 표시가 있는 카드면 개찰구에 그대로 대고 타면 되고, 그날 요금이 640엔을 넘으면 640엔만 청구돼요. 이 표와 같은 값이에요.',
    checkedAt: '2026-08',
    verified: true,
  },
];

/** 패스 목록보다 먼저 읽어야 하는 한 줄 결론 */
export const FUKUOKA_ADVISORY: PassAdvisory = {
    cityId: 'fukuoka',
    tone: 'careful',
    headline: '후쿠오카는 시내가 좁아서 패스가 잘 안 맞아요',
    body: '하카타에서 텐진까지 지하철로 5분, 걸어도 25분이에요. 시내만 돌면 하루에 세 번도 안 타는 날이 많아요. 다자이후까지 나가는 날에만 패스를 따져보고, 시내에 머무는 날은 그냥 IC카드로 타세요.',
  };

export const FUKUOKA_TIPS: TransitTip[] = [
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
