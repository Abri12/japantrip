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
        // 2024-03-16 개정 반영 — 운임 980 + μ티켓 450.
        yen: 1430,
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
            cost: '980엔(승차권) + 450엔(μ티켓) = 1,430엔',
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
        /*
         * 이름을 「급행」에서 「특급」으로 고쳤다.
         *
         * 공항선의 特急은 **일부 특별차**다 — 1·2호차만 μ티켓이 필요하고 나머지
         * 일반차는 승차권만으로 탄다. 즉 추가 요금 없이 탈 수 있는 것 중 가장
         * 빠른 열차가 特急이다(38분). 그런데 이 항목이 「急行/準急을 타라」고
         * 적고 있어서, 그 안내를 따르면 눈앞의 特急을 그냥 보내고 10~20분을
         * 더 기다리게 된다. 「ミュースカイ가 아니면 된다」가 맞는 규칙이다.
         */
        id: 'ngo-express',
        name: '메이테츠 특급 (일반차)',
        nameJa: '名鉄 特急',
        type: 'train',
        destination: '나고야역',
        fareTo: '나고야역',
        destinationJa: '名古屋',
        firstTrain: { from: '메이테츠 나고야', time: '05:22', confidence: 'confirmed' },
        minutes: 38,
        // 2024-03-16 개정 반영 (900 → 980).
        yen: 980,
        note: '교통카드로 그냥 타면 돼요. 1·2호차만 μ티켓이 필요하고, 나머지 칸은 승차권만으로 타요.',
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
            cost: '나고야역까지 980엔',
            caution: '「ミュースカイ」만 아니면 추가 요금이 없어요. μ티켓을 안 사도 그냥 타면 돼요.',
          },
          {
            action: '「ミュースカイ」가 아닌 열차를 타요',
            key: true,
            where: '같은 승강장에 뮤스카이·특급·급행이 섞여 와요',
            signJa: '特急 / 急行 / 準急 / 名鉄名古屋',
            caution:
              '「ミュースカイ」라고 뜬 열차만 μ티켓이 필요해요. 그 외에는 뭐든 타도 되고, 그중 「特急」이 가장 빨라요 — 特急은 1·2호차만 지정석이라 3호차부터 타면 돼요.',
            recover: '잘못 탔으면 차장에게 말하고 μ티켓 값을 내면 돼요.',
          },
          {
            action: '메이테츠 나고야역에서 내려요',
            key: true,
            signJa: '名鉄名古屋',
            minutes: 38,
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
            label: '메이테츠 특급 (일반차)',
            minutes: 38,
            yen: 980,
            transfers: 0,
            recommended: true,
            note: '뮤스카이보다 9분 느린 대신 450엔 싸요. 추가 요금이 없어요.',
          },
          {
            routeId: 'ngo-musky',
            label: '메이테츠 뮤스카이',
            minutes: 28,
            yen: 1430,
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
        /*
         * 사카에는 **가나야마에서 갈아타는 쪽이 낫다.**
         *
         * 예전에는 나고야역 환승만 실어 뒀는데, 세 가지가 전부 가나야마 쪽이
         * 유리하다 — 싸고(1,120 vs 1,190), 빠르고(53분 vs 61분), 갈아타기 쉽다.
         * 마지막이 제일 크다. 나고야역은 메이테츠 개찰을 나와 지하상가를 가로질러
         * 지하철 개찰까지 걸어야 하는데, 일본에서도 헤매기로 이름난 자리다.
         * 가나야마는 메이테츠와 지하철이 같은 역 건물 안에 있다.
         *
         * 나고야역 경유는 신칸센으로 이어가거나 숙소가 나고야역 쪽인 사람을 위해
         * 남겨 둔다.
         */
        ways: [
          {
            routeId: 'ngo-express',
            label: '메이테츠 특급 + 지하철 메이조선 (가나야마 환승)',
            minutes: 53,
            yen: 1120,
            transfers: 1,
            recommended: true,
            note: '가나야마에서 갈아타요. **나고야역까지 가서 갈아타는 것보다 70엔 싸고 8분 빨라요.**',
            transferSteps: [
              {
                action: '가나야마역에서 내려요',
                key: true,
                where: '메이테츠 나고야역 한 정거장 앞이에요. 여기서 내리는 게 맞아요',
                signJa: '金山',
                caution:
                  '종점이 아니라서 안내방송을 놓치면 지나쳐요. 전광판에 「金山」이 뜨면 내릴 준비를 하세요',
                recover: '지나쳤으면 메이테츠 나고야역에서 내려 지하철 히가시야마선으로 가면 돼요. 사카에까지 두 정거장이에요',
              },
              {
                action: '지하철 메이조선으로 갈아타요',
                key: true,
                where: '같은 역 건물 안이에요. 밖으로 안 나가고 표지판만 따라가면 돼요',
                signJa: '地下鉄名城線',
                minutes: 5,
              },
              {
                action: '메이조선 오른쪽 순환(사카에·오조네 방면)을 타요',
                key: true,
                where: '사카에는 네 정거장이에요',
                signJa: '地下鉄名城線 右回り 栄・大曽根方面',
                minutes: 7,
                caution:
                  '메이조선은 순환선이라 왼쪽 순환도 같은 승강장 건너편에 와요. 「右回り」인지 보고 타세요',
                recover: '반대로 탔어도 한 바퀴 돌면 사카에에 닿아요. 다만 20분쯤 더 걸려요',
              },
            ],
          },
          {
            routeId: 'ngo-express',
            label: '메이테츠 특급 + 지하철 히가시야마선 (나고야역 환승)',
            minutes: 61,
            yen: 1190,
            transfers: 1,
            note: '숙소가 나고야역 쪽이거나 신칸센으로 이어갈 때예요. 사카에만 갈 거면 위쪽이 싸고 빨라요.',
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
    checkedAt: '2026-08',
    tips: [
      '터미널과 역이 걸어서 2분이에요. 일본 공항 중에 손꼽히게 동선이 짧아요.',
      '스카이덱에서 활주로가 바로 보여요. 전망 좋은 온천도 있어요.',
    ],
};
