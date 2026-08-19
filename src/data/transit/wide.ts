import { TransitPass } from './types';

/**
 * 도시 하나에 속하지 않는 광역 패스.
 *
 * `cityIds` 가 여럿이라 도시별 파일에 둘 자리가 없다. 한쪽에 넣으면 다른
 * 도시를 손보는 사람이 이 패스를 못 찾는다.
 */
export const WIDE_PASSES: TransitPass[] = [
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
      '2일권·3일권 모두 연속된 날로 써야 해요',
    ],
    caution:
      '2026년 4월에 이름이 「Lite」로 바뀌면서 교토 시영지하철이 커버에서 빠졌어요. 아직 예전 이름(간사이 스루패스)과 예전 범위로 안내하는 블로그가 많으니 주의하세요. JR도 원래부터 안 돼요.',
    checkedAt: '2026-08',
    verified: true,
  },
];
