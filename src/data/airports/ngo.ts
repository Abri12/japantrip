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
        fareTo: '나고야역',
        destinationJa: '名古屋',
        minutes: 28,
        yen: 1250,
        recommended: true,
        reserved: true,
        note: '객실 앞쪽에 짐 두는 자리가 있는데 넓지 않아서, 늦게 타면 이미 차 있을 수 있어요. 앉은 자리에서 짐이 보이는 위치예요.',
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 2층 도착 로비예요',
            where: '센트레아는 도착층이 2층이에요',
          },
          {
            action: '3층 액세스 플라자로 올라가요',
            key: true,
            where: '터미널과 역이 통로로 바로 이어져요. 밖으로 안 나가요',
            signJa: 'アクセスプラザ / 名鉄',
            minutes: 2,
          },
          {
            action: '승차권과 μ티켓 두 장을 사요',
            key: true,
            where: '메이테츠 발매기·창구에서',
            signJa: 'ミュースカイ / μチケット',
            cost: '890엔(승차권) + 360엔(μ티켓) = 1,250엔',
            caution:
              '뮤스카이는 전 좌석 지정이라 승차권만으로는 못 타요. μ티켓을 반드시 같이 사야 해요.',
            recover: 'μ티켓 없이 탔다가는 차내에서 따로 내야 해요.',
          },
          {
            action: '개찰을 지나 승강장으로 내려가요',
          },
          {
            action: '「ミュースカイ 名鉄名古屋行」을 타요',
            key: true,
            signJa: 'ミュースカイ / 名鉄名古屋',
            minutes: 28,
            caution: '표에 적힌 호차·좌석에 앉으세요. 짐 두는 자리는 객실 앞쪽에 있어요.',
          },
          {
            action: '메이테츠 나고야역에서 내려요',
            key: true,
            signJa: '名鉄名古屋',
          },
        ],
      },
      {
        id: 'ngo-express',
        name: '메이테츠 급행',
        nameJa: '名鉄 急行',
        type: 'train',
        destination: '나고야역',
        fareTo: '나고야역',
        destinationJa: '名古屋',
        firstTrain: { from: '메이테츠 나고야', time: '05:22', confidence: 'confirmed' },
        minutes: 37,
        yen: 890,
        note: '교통카드로 그냥 타면 돼요. 추가 요금 없는 일반 열차예요.',
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 2층 도착 로비예요',
          },
          {
            action: '3층 액세스 플라자로 올라가요',
            key: true,
            signJa: 'アクセスプラザ / 名鉄',
            minutes: 2,
          },
          {
            action: '교통카드를 대거나 발매기에서 표를 사요',
            key: true,
            icon: 'contactless',
            cost: '나고야역까지 890엔',
            caution: '급행은 추가 요금이 없어요. μ티켓을 안 사도 그냥 타면 돼요.',
          },
          {
            action: '「ミュースカイ」가 아닌 열차를 타요',
            key: true,
            where: '같은 승강장에 뮤스카이와 급행이 섞여 와요',
            signJa: '急行 / 準急 / 名鉄名古屋',
            caution:
              '「ミュースカイ」라고 뜬 열차는 μ티켓이 없으면 못 타요. 「急行」이나 「準急」이라고 뜬 것을 타세요.',
            recover: '잘못 탔으면 차장에게 말하고 μ티켓 값을 내면 돼요.',
          },
          {
            action: '메이테츠 나고야역에서 내려요',
            key: true,
            signJa: '名鉄名古屋',
            minutes: 37,
          },
        ],
      },
    ],
    hubs: [
      {
        id: 'nagoya-station',
        cityId: 'nagoya',
        name: '나고야역',
        blurb: '신칸센과 지하철이 모이는 역. 숙소가 가장 많아요',
        ways: [
          {
            routeId: 'ngo-express',
            label: '메이테츠 급행',
            minutes: 37,
            yen: 890,
            transfers: 0,
            recommended: true,
            note: '뮤스카이보다 9분 느린 대신 360엔 싸요. 추가 요금이 없어요.',
          },
          {
            routeId: 'ngo-musky',
            label: '메이테츠 뮤스카이',
            minutes: 28,
            yen: 1250,
            transfers: 0,
            note: '전 좌석 지정이라 자리가 보장돼요.',
          },
        ],
      },
      {
        id: 'sakae',
        cityId: 'nagoya',
        name: '사카에',
        blurb: '나고야 최대 번화가. 백화점과 밤거리가 이쪽이에요',
        ways: [
          {
            routeId: 'ngo-express',
            label: '메이테츠 급행 + 지하철 히가시야마선',
            minutes: 54,
            yen: 1120,
            transfers: 1,
            recommended: true,
            note: '나고야역에서 지하철 히가시야마선으로 갈아타요. 사카에는 두 정거장이에요.',
            transferSteps: [
              {
                action: '메이테츠 나고야역에서 내려요',
                key: true,
                signJa: '名鉄名古屋',
              },
              {
                action: '지하철 히가시야마선으로 갈아타요',
                key: true,
                where: '메이테츠 북쪽 개찰을 나와 지하로 3분쯤 걸어요',
                signJa: '地下鉄東山線',
                minutes: 3,
                caution:
                  '나고야역에는 메이조선이 안 와요. 사카에까지는 히가시야마선이에요. 사카에에 내려서야 메이조선으로 갈아탈 수 있어요',
              },
              {
                action: '히가시야마선 후지가오카 방면을 타요',
                key: true,
                where: '사카에는 두 정거장이에요',
                signJa: '地下鉄東山線 藤が丘方面',
                minutes: 4,
              },
            ],
          },
        ],
      },
    ],
    tips: [
      '터미널과 역이 걸어서 2분이에요. 일본 공항 중에 손꼽히게 동선이 짧아요.',
      '스카이덱에서 활주로가 바로 보여요. 전망 좋은 온천도 있어요.',
    ],
};
