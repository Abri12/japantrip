import { Airport } from './types';

export const HND: Airport = {
    id: 'hnd',
    code: 'HND',
    name: '하네다 공항',
    nameJa: '羽田空港',
    city: '도쿄',
    region: 'kanto',
    prefecture: '東京都',
    routes: [
      {
        id: 'hnd-keikyu',
        name: '케이큐선 에어포트 급행',
        nameJa: '京急線 エアポート急行',
        type: 'train',
        destination: '시나가와 · 아사쿠사',
        destinationJa: '品川・浅草',
        firstTrain: { from: '시나가와', time: '05:09', confidence: 'confirmed' },
        minutes: 15,
        yen: 330,
        recommended: true,
        note: '가장 싸고 빨라요. 시나가와에서 JR로 갈아타면 도쿄 어디든 갈 수 있어요. 일부 열차는 아사쿠사선으로 바로 이어져요.',
      },
      {
        id: 'hnd-monorail',
        name: '도쿄 모노레일',
        nameJa: '東京モノレール',
        type: 'monorail',
        destination: '하마마쓰초',
        destinationJa: '浜松町',
        minutes: 18,
        yen: 520,
        note: 'JR패스로 탈 수 있어요. 하마마쓰초에서 야마노테선으로 갈아타면 돼요.',
      },
      {
        id: 'hnd-limousine',
        name: '리무진 버스',
        nameJa: 'リムジンバス',
        type: 'bus',
        destination: '신주쿠 · 시부야 · 도쿄역',
        destinationJa: '新宿・渋谷・東京',
        minutes: 45,
        yen: 1400,
        note: '갈아타지 않고 주요 호텔까지 바로 가요.',
      },
    ],
    tips: [
      '도심까지 거리가 나리타의 3분의 1이에요. 항공권 값이 비슷하다면 하네다가 훨씬 이득이에요.',
      '국제선 터미널 지하에 케이큐선과 모노레일 역이 바로 연결돼 있어요. 밖으로 나갈 필요가 없어요.',
      '새벽 도착편이 많아서 24시간 열려 있는 구역이 있어요. 첫차를 기다릴 수 있어요.',
      '케이큐선은 카드 터치로 바로 탈 수 있어요. 도착하자마자 IC카드를 사러 줄 설 필요가 없어요.',
    ],
    // 하네다는 추천 노선(케이큐)이 컨택리스가 되는 드문 경우다. 2026년 3월부터
    // 관동 11사국이 상호이용을 시작해서, 케이큐로 들어와 도쿄메트로로 갈아타는
    // 동선이 카드 한 장으로 끊기지 않는다.
    contactless: {
      supported: [
        { name: '케이큐선', perk: '하네다에서 추천하는 그 노선이에요 — 내려서 바로 탈 수 있어요' },
        { name: '도쿄 시내 지하철·사철', perk: '2026년 3월부터 11개 회사가 서로 이어져서 갈아타도 끊기지 않아요' },
      ],
      unsupported: [
        {
          name: 'JR (야마노테선 등)',
          reason: 'JR동일본은 Suica에 집중한다며 도입하지 않겠다고 밝혔어요. JR을 탈 일이 있으면 IC카드가 필요해요.',
        },
      ],
    },
};
