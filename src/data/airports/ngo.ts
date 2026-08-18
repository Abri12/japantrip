import { Airport } from './types';

export const NGO: Airport = {
    id: 'ngo',
    code: 'NGO',
    name: '주부 국제공항 (센트레아)',
    nameJa: '中部国際空港 セントレア',
    city: '나고야',
    region: 'chubu',
    prefecture: '愛知県',
    routes: [
      {
        id: 'ngo-musky',
        name: '메이테츠 뮤스카이',
        nameJa: '名鉄ミュースカイ',
        type: 'train',
        destination: '나고야역',
        destinationJa: '名古屋',
        minutes: 28,
        yen: 1250,
        recommended: true,
        reserved: true,
        note: '전 좌석 지정제라 자리가 보장돼요. 차량마다 객실 앞쪽에 짐 두는 자리가 있는데 넓지는 않아서, 늦게 타면 이미 차 있을 수 있어요. 앉은 자리에서 짐이 보이는 위치라 마음은 편해요.',
      },
      {
        id: 'ngo-express',
        name: '메이테츠 급행',
        nameJa: '名鉄 急行',
        type: 'train',
        destination: '나고야역',
        destinationJa: '名古屋',
        minutes: 37,
        yen: 890,
        note: '좌석 지정은 없지만 저렴해요. 9분 차이니까 예산이 우선이면 이쪽이 나아요.',
      },
    ],
    tips: [
      '터미널과 역이 걸어서 2분이에요. 일본 공항 중에 손꼽히게 동선이 짧아요.',
      '스카이덱에서 활주로가 바로 보여요. 전망 좋은 온천도 있어요.',
    ],
};
