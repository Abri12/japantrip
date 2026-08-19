import { Airport } from './types';
import { TOKYO_HUB_NEARBY } from './tokyo-areas';

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
        fareTo: '시나가와',
        minutes: 15,
        yen: 330,
        recommended: true,
        note: '카드 터치로 바로 타요. 표를 사러 줄 설 필요가 없어요.',
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 2층 도착 로비예요',
            where: '제3터미널 2층 · 정면에 안내소가 보여요',
          },
          {
            action: '「電車」 표지판을 따라 걸어요',
            key: true,
            where: '도착 로비에서 안내소를 지나 안쪽으로. 걸어서 2~3분이에요',
            signJa: '電車 / Trains',
            minutes: 3,
          },
          {
            action: '개찰구가 두 개 나란히 있어요 — 「京急線」 쪽으로',
            key: true,
            where: '왼쪽·오른쪽에 각각 다른 회사 개찰이 있어요',
            signJa: '京急線 / Keikyu Line',
            caution:
              '옆은 도쿄 모노레일이에요. 회사가 달라서 잘못 들어가면 요금을 다시 내야 해요. 개찰 위 글자를 꼭 보세요.',
            recover: '잘못 찍었으면 바로 옆 역무원 창구에서 취소해 줘요.',
          },
          {
            action: '카드를 대고 들어가요',
            icon: 'contactless',
            cost: '시나가와까지 327엔 · 아사쿠사까지 599엔',
            caution: '해외 카드 터치 결제도 되고, Suica·파스모도 돼요. 표를 안 사도 괜찮아요.',
          },
          {
            action: '에스컬레이터로 지하 승강장까지 내려가요',
            where: '개찰은 2층, 승강장은 지하예요',
            minutes: 3,
          },
          {
            action: '행선지를 보고 타요',
            key: true,
            where: '승강장은 하나라 오는 열차를 타면 되는데, 어디까지 가는지가 갈려요',
            signJa: '品川 / 都営線直通',
            caution:
              '아사쿠사·오시아게 쪽으로 갈 거면 「都営線直通」이라고 뜬 열차를 타세요. 「品川行」은 시나가와까지만 가요.',
          },
          {
            action: '시나가와에서 내려 JR로 갈아타요',
            key: true,
            where: '시나가와가 첫 큰 역이에요. JR 개찰이 같은 층에 있어요',
            signJa: '品川',
          },
        ],
      },
      {
        id: 'hnd-monorail',
        name: '도쿄 모노레일',
        nameJa: '東京モノレール',
        type: 'monorail',
        destination: '하마마쓰초',
        destinationJa: '浜松町',
        fareTo: '하마마쓰초',
        minutes: 18,
        yen: 520,
        note: 'JR패스로 탈 수 있어요. 하마마쓰초에서 JR로 갈아타는 구조라, 패스가 있으면 뒷구간까지 공짜예요.',
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 2층 도착 로비예요',
            where: '제3터미널 2층',
          },
          {
            action: '「モノレール」 표지판을 따라 걸어요',
            key: true,
            signJa: '東京モノレール / Tokyo Monorail',
            minutes: 3,
          },
          {
            action: '개찰구가 두 개 나란히 있어요 — 「東京モノレール」 쪽으로',
            key: true,
            signJa: '東京モノレール',
            caution: '옆은 케이큐선이에요. 회사가 달라서 잘못 들어가면 요금을 다시 내야 해요.',
          },
          {
            action: '카드를 대거나 표를 사요',
            icon: 'contactless',
            cost: '하마마쓰초까지 520엔',
            caution: 'JR패스가 있으면 여기서 패스로 들어가요. 모노레일은 JR패스로 탈 수 있어요.',
          },
          {
            action: '지하 승강장으로 내려가요',
            minutes: 2,
          },
          {
            action: '「空港快速」이 있으면 그걸 타요',
            key: true,
            where: '공항쾌속·구간쾌속·보통 세 종류가 와요',
            signJa: '空港快速 / 浜松町',
            caution:
              '보통 열차는 역마다 다 서서 5분 넘게 더 걸려요. 어차피 종점은 같으니 공항쾌속이 오면 그걸 타세요.',
          },
          {
            action: '하마마쓰초에서 내려요',
            key: true,
            where: '종점이라 전원 내려요',
            signJa: '浜松町',
          },
        ],
      },
      {
        id: 'hnd-limousine',
        name: '리무진 버스',
        nameJa: 'リムジンバス',
        type: 'bus',
        destination: '신주쿠 · 시부야 · 도쿄역',
        destinationJa: '新宿・渋谷・東京',
        fareTo: '신주쿠',
        minutes: 45,
        yen: 1300,
        note: '가는 곳마다 요금이 달라요. 성수기엔 만석이 되니 공식 사이트에서 미리 잡아두는 게 편해요.',
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 2층 도착 로비예요',
            where: '제3터미널 2층',
          },
          {
            action: '표를 먼저 사요',
            key: true,
            where: '도착 로비에 리무진 버스 카운터와 자동판매기가 있어요',
            signJa: 'リムジンバス きっぷうりば',
            cost: '신주쿠까지 1,300엔',
            caution: '타기 전에 표가 있어야 해요. 성수기엔 만석이 되니 도착하자마자 사두세요.',
          },
          {
            action: '표에 적힌 승강장 번호를 확인해요',
            key: true,
            where: '행선지마다 승강장이 달라요',
            caution: '신주쿠·시부야·도쿄역이 각각 다른 자리에서 타요. 번호를 안 보고 줄 서면 엉뚱한 버스를 타요.',
          },
          {
            action: '1층으로 내려가 밖으로 나가요',
            where: '버스 승강장은 1층 건물 밖이에요',
            minutes: 3,
          },
          {
            action: '캐리어를 기사에게 맡기고 번호표를 받아요',
            caution: '내릴 때 이 번호표로 짐을 찾아요. 잃어버리면 곤란해요.',
          },
          {
            action: '타서 앉으면 돼요',
            key: true,
            minutes: 45,
            caution: '길이 막히면 예정보다 20~30분 더 걸릴 수 있어요.',
          },
        ],
      },
    ],
    hubs: [
      {
        id: 'shinjuku-shibuya',
        cityId: 'tokyo',
        name: '신주쿠 · 시부야',
        blurb: '한국 여행자가 가장 많이 묵는 동네예요',
        nearby: TOKYO_HUB_NEARBY['shinjuku-shibuya'],
        ways: [
          {
            routeId: 'hnd-monorail',
            label: '모노레일 + 오에도선',
            // 공항으로 가는 구간의 첫차다. 신주쿠에서 하마마쓰초까지 가는
            // 시간은 따로 더해야 하고, 그건 from 표기가 말해 준다.
            firstTrain: { from: '모노레일 하마마쓰초', time: '04:59', confidence: 'confirmed' },
            minutes: 44,
            yen: 739,
            transfers: 1,
            recommended: true,
            note: '하마마쓰초에서 한 번 갈아타요. 신주쿠 기준이에요.',
            transferSteps: [
              {
                action: '하마마쓰초에서 내려요',
                key: true,
                where: '모노레일 종점이라 전원 내려요',
                signJa: '浜松町',
              },
              {
                action: '개찰을 나와 다이몬역까지 걸어가요',
                key: true,
                where:
                  '모노레일 개찰을 나와 JR 북쪽 출구 쪽으로. 지상으로 나가 큰길을 건너면 오른쪽에 지하철 B2 출입구가 있어요',
                signJa: '大門 / 都営地下鉄',
                minutes: 7,
                caution:
                  '역 이름이 「하마마쓰초」에서 「다이몬」으로 바뀌어요. 같은 자리인데 이름이 달라서 길을 잘못 든 줄 알기 쉬워요',
                recover: '헤매면 「大門駅」 표지판만 따라가면 돼요',
              },
              {
                action: '오에도선 롯폰기·신주쿠 방면을 타요',
                key: true,
                signJa: '都営大江戸線',
                minutes: 25,
              },
            ],
          },
          {
            routeId: 'hnd-monorail',
            label: '모노레일 + 야마노테선',
            minutes: 39,
            yen: 772,
            transfers: 1,
            note: '시부야로 갈 때 이쪽이에요. 하마마쓰초에서 갈아타요.',
            transferSteps: [
              {
                action: '하마마쓰초에서 내려 JR로 갈아타요',
                key: true,
                where: '모노레일 개찰을 나오면 바로 앞이 JR 개찰이에요. 같은 건물이라 밖으로 안 나가요',
                signJa: 'JR線のりかえ',
                minutes: 3,
              },
              {
                action: '야마노테선 바깥쪽(시부야·신주쿠 방면)을 타요',
                key: true,
                signJa: 'JR山手線 外回り',
                minutes: 21,
              },
            ],
          },
          {
            routeId: 'hnd-limousine',
            label: '리무진 버스',
            minutes: 45,
            yen: 1300,
            transfers: 0,
            note: '호텔 앞까지 가요. 캐리어가 크면 갈아타지 않는 값어치가 있어요.',
          },
        ],
      },
      {
        id: 'tokyo-ginza',
        cityId: 'tokyo',
        name: '도쿄역 · 긴자',
        blurb: '신칸센으로 이어가거나, 시내 한복판에 묵을 때예요',
        nearby: TOKYO_HUB_NEARBY['tokyo-ginza'],
        ways: [
          {
            routeId: 'hnd-monorail',
            label: '모노레일 + 게이힌토호쿠선',
            firstTrain: { from: '모노레일 하마마쓰초', time: '04:59', confidence: 'confirmed' },
            minutes: 23,
            yen: 718,
            transfers: 1,
            recommended: true,
            note: '도쿄역까지 갈 거면 이쪽이에요. 긴자가 목적지면 아래 케이큐 직통이 더 싸고 갈아탈 일도 없어요.',
            transferSteps: [
              {
                action: '하마마쓰초에서 내려 JR로 갈아타요',
                key: true,
                where: '모노레일 개찰을 나오면 바로 앞이 JR 개찰이에요. 같은 건물이라 밖으로 안 나가요',
                signJa: 'JR線のりかえ',
                minutes: 3,
              },
              {
                action: '게이힌토호쿠선 북행(오미야 방면)을 타요',
                key: true,
                signJa: 'JR京浜東北線 大宮方面',
                minutes: 5,
              },
            ],
          },
          {
            routeId: 'hnd-keikyu',
            label: '케이큐선 직통 (히가시긴자)',
            minutes: 28,
            yen: 590,
            transfers: 0,
            note: '⚠ 도쿄역에는 안 가요. 케이큐가 도에이 아사쿠사선으로 그대로 이어져 신바시·히가시긴자·니혼바시에 서요. 긴자 쪽에 묵으면 모노레일보다 싸고 갈아탈 일도 없어요. 다만 센가쿠지에서 갈아타야 하는 편도 섞여 있으니, 전광판에서 행선지가 아사쿠사선 쪽인지 보고 타세요.',
          },
        ],
      },
      {
        id: 'ueno-nippori',
        cityId: 'tokyo',
        name: '우에노 · 닛포리',
        blurb: '값싼 숙소가 많고, 아사쿠사와 가까워요',
        nearby: TOKYO_HUB_NEARBY['ueno-nippori'],
        ways: [
          {
            routeId: 'hnd-monorail',
            label: '모노레일 + 게이힌토호쿠선',
            firstTrain: { from: '모노레일 하마마쓰초', time: '04:59', confidence: 'confirmed' },
            minutes: 30,
            yen: 728,
            transfers: 1,
            recommended: true,
            note: '하마마쓰초에서 갈아타 쭉 올라가요.',
            transferSteps: [
              {
                action: '하마마쓰초에서 내려 JR로 갈아타요',
                key: true,
                where: '모노레일 개찰을 나오면 바로 앞이 JR 개찰이에요. 같은 건물이라 밖으로 안 나가요',
                signJa: 'JR線のりかえ',
                minutes: 3,
              },
              {
                action: '게이힌토호쿠선 북행(오미야 방면)을 타요',
                key: true,
                signJa: 'JR京浜東北線 大宮方面',
                minutes: 12,
              },
            ],
          },
        ],
      },
      {
        id: 'asakusa',
        cityId: 'tokyo',
        name: '아사쿠사',
        blurb: '센소지 근처. 옛 동네 분위기를 원할 때예요',
        nearby: TOKYO_HUB_NEARBY['asakusa'],
        ways: [
          {
            routeId: 'hnd-keikyu',
            label: '케이큐선 (에어포트 쾌특)',
            minutes: 35,
            yen: 599,
            transfers: 0,
            recommended: true,
            note: '케이큐가 도에이 아사쿠사선으로 그대로 이어져서 갈아타지 않아요. 하네다에서 가장 싸게 가는 거점이에요.',
          },
        ],
      },
      {
        id: 'shinagawa',
        cityId: 'tokyo',
        name: '시나가와',
        blurb: '신칸센 환승역. 하네다에서 가장 가까워요',
        ways: [
          {
            routeId: 'hnd-keikyu',
            label: '케이큐선',
            minutes: 15,
            yen: 330,
            transfers: 0,
            recommended: true,
            note: '여기서 JR로 갈아타면 도쿄 어디든 갈 수 있어요.',
          },
        ],
      },
    ],
    tips: [
      '도심까지 거리가 나리타의 3분의 1이에요. 항공권 값이 비슷하다면 하네다가 훨씬 이득이에요.',
      '케이큐선과 모노레일 개찰이 2층 도착 로비 바로 안쪽에 나란히 있어요(승강장은 지하). 밖으로 나갈 필요가 없는 대신, 회사가 달라서 어느 개찰로 들어가는지는 봐야 해요.',
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
