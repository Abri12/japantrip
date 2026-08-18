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
        // 슈리성까지 가면 29분 360엔이다.
        fareTo: '겐초마에',
        destinationJa: '県庁前・国際通り',
        firstTrain: { from: '겐초마에', time: '05:44', confidence: 'confirmed' },
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
        fareTo: '렌터카 영업소',
        destinationJa: 'レンタカー営業所',
        minutes: 15,
        yen: 0,
        note: '츄라우미 수족관처럼 북부로 갈 거면 렌터카가 사실상 필수예요. 셔틀은 무료고요.',
      },
    ],
    hubs: [
      {
        id: 'kokusai-dori',
        name: '고쿠사이도리 (겐초마에 · 마키시)',
        nameJa: '国際通り（県庁前・牧志）',
        blurb: '나하 중심 상점가. 숙소가 가장 많아요',
        ways: [
          {
            routeId: 'oka-yui',
            label: '유이레일',
            minutes: 12,
            yen: 270,
            transfers: 0,
            recommended: true,
            note: '겐초마에에서 마키시까지가 고쿠사이도리예요. 어느 쪽에 묵는지 보고 내리세요.',
          },
        ],
      },
      {
        id: 'shuri',
        name: '슈리',
        nameJa: '首里',
        blurb: '슈리성 쪽. 유이레일 종점 방향이에요',
        ways: [
          {
            routeId: 'oka-yui',
            label: '유이레일',
            minutes: 29,
            yen: 360,
            transfers: 0,
            recommended: true,
            note: '종점 한 정거장 앞이에요. 역에서 슈리성까지는 걸어서 15분쯤 걸려요.',
          },
        ],
      },
    ],
    tips: [
      '오키나와 본섬엔 철도가 유이레일 하나뿐이고 그마저 나하 시내만 다녀요. 북부를 보려면 렌터카나 고속버스가 필요해요.',
      '한국 면허만으로는 운전할 수 없어요. 국제운전면허증을 한국에서 미리 발급받아 가세요.',
      '태풍 길목에 자주 놓여요. 7~10월에 간다면 항공권 변경 규정을 미리 확인해두세요.',
    ],
};
