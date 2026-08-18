import { Airport } from './types';

export const OKA: Airport = {
    id: 'oka',
    code: 'OKA',
    name: '나하 공항',
    nameJa: '那覇空港',
    city: '오키나와',
    region: 'okinawa',
    prefecture: '沖縄県',
    routes: [
      {
        id: 'oka-yui',
        name: '유이레일 (오키나와 도시 모노레일)',
        nameJa: 'ゆいレール',
        type: 'monorail',
        destination: '겐초마에 · 고쿠사이도리',
        destinationJa: '県庁前・国際通り',
        minutes: 12,
        yen: 270,
        recommended: true,
        note: '나하 시내만 다닐 거라면 이걸로 다녀요. 1일권·2일권도 따로 있어요. 다만 2량짜리 모노레일이라 붐빌 때는 캐리어를 두기 마땅치 않아요.',
      },
      {
        id: 'oka-rentcar',
        name: '렌터카 셔틀',
        nameJa: 'レンタカー送迎',
        type: 'bus',
        destination: '렌터카 영업소',
        destinationJa: 'レンタカー営業所',
        minutes: 15,
        yen: 0,
        note: '츄라우미 수족관처럼 북부로 갈 거면 렌터카가 사실상 필수예요. 셔틀은 무료고요.',
      },
    ],
    tips: [
      '오키나와 본섬엔 철도가 유이레일 하나뿐이고 그마저 나하 시내만 다녀요. 북부를 보려면 렌터카나 고속버스가 필요해요.',
      '한국 면허만으로는 운전할 수 없어요. 국제운전면허증을 한국에서 미리 발급받아 가세요.',
      '태풍 길목에 자주 놓여요. 7~10월에 간다면 항공권 변경 규정을 미리 확인해두세요.',
    ],
};
