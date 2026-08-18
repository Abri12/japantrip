import { Airport } from './types';

export const CTS: Airport = {
    id: 'cts',
    code: 'CTS',
    name: '신치토세 공항',
    nameJa: '新千歳空港',
    city: '삿포로',
    region: 'hokkaido',
    prefecture: '北海道',
    routes: [
      {
        id: 'cts-jr',
        name: 'JR 쾌속 에어포트',
        nameJa: 'JR 快速エアポート',
        type: 'train',
        destination: '삿포로역',
        destinationJa: '札幌',
        firstTrain: { from: '삿포로', time: '05:50', confidence: 'confirmed' },
        minutes: 37,
        yen: 1150,
        recommended: true,
        note: '눈이 와도 제시간에 다니는 편이에요. 겨울 홋카이도에선 이게 정말 중요해요.',
      },
      {
        id: 'cts-bus',
        name: '연락 버스',
        nameJa: '連絡バス',
        type: 'bus',
        destination: '삿포로 시내 호텔',
        destinationJa: '札幌市内',
        minutes: 70,
        yen: 1300,
        note: '스스키노나 오도리 호텔 앞에 서요. 다만 눈이 많이 오면 많이 늦어져요.',
      },
    ],
    tips: [
      'JR역은 국내선 터미널 지하에 있어요. 국제선에서 걸어서 연결되는데 10분쯤 걸려요.',
      '겨울엔 폭설로 결항이 잦아요. 돌아오는 비행기는 여유 있게 잡는 게 안전해요.',
      '공항 자체가 볼거리예요. 온천, 영화관, 라멘 거리가 있어서 기다리는 시간이 아깝지 않아요.',
    ],
};
