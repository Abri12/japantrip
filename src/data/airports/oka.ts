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
        // 슈리성까지 가면 29분 340엔이다.
        fareTo: '겐초마에',
        destinationJa: '県庁前・国際通り',
        firstTrain: { from: '겐초마에', time: '05:44', confidence: 'confirmed' },
        minutes: 12,
        yen: 270,
        recommended: true,
        note: '1일권·2일권이 따로 있어서 시내를 여러 번 오갈 거면 더 싸요. 다만 2량짜리라 붐빌 때는 캐리어를 두기 마땅치 않아요.',
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 국제선 터미널 1층이에요',
          },
          {
            action: '국내선 터미널 쪽으로 걸어가요',
            key: true,
            where: '연결통로로 이어져 있어요',
            signJa: '国内線 / ゆいレール',
            minutes: 7,
            caution: '유이레일역은 국내선 터미널 쪽에 붙어 있어요. 국제선 건물엔 없어요.',
          },
          {
            action: '2층 연결통로를 건너 유이레일역으로',
            key: true,
            signJa: 'ゆいレール 那覇空港駅',
            minutes: 3,
          },
          {
            action: '발매기에서 표를 사요',
            key: true,
            cost: '겐초마에까지 270엔 · 슈리까지 340엔',
            caution:
              '유이레일은 전국 교통카드(Suica·ICOCA)가 안 돼요. 표를 사거나 오키나와 전용 OKICA가 필요해요. 1일권도 여기서 팔아요.',
          },
          {
            action: '표에 있는 QR코드를 개찰기에 대요',
            key: true,
            signJa: 'きっぷ / QR',
            caution: '표를 넣는 게 아니라 QR을 갖다 대는 방식이에요. 내릴 때도 필요하니 버리지 마세요.',
          },
          {
            action: '슈리 방면 열차를 타요',
            key: true,
            where: '노선이 하나뿐이라 방향만 맞으면 돼요',
            signJa: 'てだこ浦西 / 首里',
            minutes: 12,
          },
          {
            action: '겐초마에나 마키시에서 내려요',
            key: true,
            where: '이 두 역 사이가 고쿠사이도리예요',
            signJa: '県庁前 / 牧志',
          },
        ],
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
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 국제선 터미널 1층이에요',
          },
          {
            action: '예약한 렌터카 회사 카운터를 찾아요',
            key: true,
            where: '도착층에 회사별 카운터가 모여 있어요',
            caution: '여기서 차를 받는 게 아니라, 영업소까지 갈 셔틀을 안내받는 자리예요.',
          },
          {
            action: '1층 밖 셔틀 승강장으로 나가요',
            key: true,
            signJa: 'レンタカー送迎',
            cost: '무료',
            caution: '회사마다 셔틀이 달라요. 차체에 적힌 회사 이름을 보고 타세요.',
          },
          {
            action: '영업소에서 국제운전면허증과 여권을 내요',
            key: true,
            minutes: 15,
            caution:
              '한국 면허만으로는 차를 못 빌려요. 국제운전면허증을 한국에서 미리 발급받아 가야 해요.',
          },
        ],
      },
    ],
    hubs: [
      {
        id: 'kokusai-dori',
        cityId: 'okinawa',
        name: '고쿠사이도리 (겐초마에 · 마키시)',
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
        cityId: 'okinawa',
        name: '슈리',
        blurb: '슈리성 쪽. 유이레일 종점 방향이에요',
        ways: [
          {
            routeId: 'oka-yui',
            label: '유이레일',
            minutes: 29,
            yen: 340,
            transfers: 0,
            recommended: true,
            firstTrain: { from: '슈리', time: '05:28', confidence: 'approx' },
            note: '종점 한 정거장 앞이에요. 역에서 슈리성까지는 걸어서 15분쯤 걸려요.',
          },
        ],
      },
    ],
    checkedAt: '2026-08',
    tips: [
      '오키나와 본섬엔 철도가 유이레일 하나뿐이고 그마저 나하 시내만 다녀요. 북부를 보려면 렌터카나 고속버스가 필요해요.',
      '한국 면허만으로는 운전할 수 없어요. 국제운전면허증을 한국에서 미리 발급받아 가세요.',
      '태풍 길목에 자주 놓여요. 7~10월에 간다면 항공권 변경 규정을 미리 확인해두세요.',
    ],
};
