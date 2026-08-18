import { Airport } from './types';

export const NRT: Airport = {
    id: 'nrt',
    code: 'NRT',
    name: '나리타 국제공항',
    nameJa: '成田国際空港',
    city: '도쿄',
    region: 'kanto',
    prefecture: '千葉県',
    routes: [
      {
        id: 'nrt-skyliner',
        name: '케이세이 스카이라이너',
        nameJa: '京成スカイライナー',
        type: 'train',
        destination: '닛포리 · 우에노',
        destinationJa: '日暮里・上野',
        firstTrain: { from: '닛포리', time: '05:45', confidence: 'confirmed' },
        fareTo: '우에노',
        minutes: 41,
        yen: 2580,
        recommended: true,
        reserved: true,
        note: '객실 끝에 캐리어 두는 선반이 있어요. 닛포리에서 JR 야마노테선으로 갈아타면 도쿄 시내는 거의 다 갈 수 있어요.',
      },
      {
        id: 'nrt-nex',
        name: '나리타 익스프레스 (N’EX)',
        nameJa: '成田エクスプレス',
        type: 'train',
        destination: '도쿄역 · 신주쿠 · 시나가와',
        destinationJa: '東京・新宿・品川',
        // 신주쿠·시나가와는 도쿄역보다 요금이 높다(3,250엔). 「도쿄 구간 균일」이
        // 아니라서 거점별 값은 hubs 에 따로 둔다.
        fareTo: '도쿄역',
        minutes: 60,
        yen: 3070,
        reserved: true,
        note: 'JR패스가 있으면 추가 요금 없이 탈 수 있어요. 다만 배차가 30분~1시간 간격이라 시간표를 봐야 해요.',
      },
      {
        id: 'nrt-access',
        name: '케이세이 액세스 특급',
        nameJa: 'アクセス特急',
        type: 'train',
        destination: '아사쿠사 · 니혼바시 · 시나가와',
        destinationJa: '浅草・日本橋・品川',
        // 케이세이 공식 운임표 기준 — 아사쿠사 1,290 / 니혼바시 1,330 / 시나가와 1,520.
        // 한 노선인데 내리는 곳마다 200엔 넘게 갈린다.
        fareTo: '아사쿠사',
        minutes: 60,
        yen: 1290,
        note: '통근 노선과 같은 열차라 자리 보장이 없고, 짐 두는 공간도 따로 없어요.',
      },
      {
        id: 'nrt-bus-tokyo',
        name: '에어포트 버스 도쿄·특급',
        nameJa: 'エアポートバス東京・特急',
        type: 'bus',
        destination: '도쿄역 · 긴자',
        destinationJa: '東京・銀座',
        fareTo: '도쿄역',
        minutes: 80,
        yen: 1500,
        note: '짐을 트렁크에 싣고 앉아서 가요. 도쿄역 야에스구치에 내려요.',
      },
      {
        id: 'nrt-limousine',
        name: '리무진 버스',
        nameJa: 'リムジンバス',
        type: 'bus',
        destination: '신주쿠 · 시부야 주요 호텔',
        destinationJa: '新宿・渋谷',
        fareTo: '신주쿠',
        minutes: 100,
        yen: 3600,
        note: '주요 호텔 앞에 서요. 어느 호텔에 서는지는 노선마다 달라서 미리 확인하세요.',
      },
    ],
    hubs: [
      {
        id: 'shinjuku-shibuya',
        cityId: 'tokyo',
        name: '신주쿠 · 시부야',
        nameJa: '新宿・渋谷',
        blurb: '한국 여행자가 가장 많이 묵는 동네예요',
        ways: [
          {
            routeId: 'nrt-access',
            label: '액세스 특급 + 도에이 신주쿠선',
            minutes: 110,
            yen: 1466,
            transfers: 1,
            recommended: true,
            note: '값이 절반이지만 두 시간 가까이 걸려요. 나리타에서 신주쿠는 어느 길로 가도 멀어요.',
            transferSteps: [
              {
                action: '히가시니혼바시에서 내려요',
                key: true,
                where: '액세스 특급이 도에이 아사쿠사선으로 그대로 이어져 있어요',
                signJa: '東日本橋',
              },
              {
                action: '주황색 환승 개찰구를 지나 바쿠로요코야마역으로',
                key: true,
                where: '지하 연락통로로 이어져요. 200m 남짓이에요',
                signJa: '馬喰横山 / 新宿線のりかえ',
                minutes: 5,
                caution:
                  '역 이름이 「히가시니혼바시」에서 「바쿠로요코야마」로 바뀌어요. 밖으로 나가는 개찰이 아니라 주황색 환승 전용 개찰구를 지나야 요금이 이어져요',
                recover: '일반 출구로 나가 버렸으면 다시 들어가 표를 새로 사야 해요',
              },
              {
                action: '신주쿠선 신주쿠 방면을 타요',
                key: true,
                signJa: '都営新宿線 新宿方面',
                minutes: 20,
              },
            ],
          },
          {
            routeId: 'nrt-limousine',
            label: '리무진 버스',
            minutes: 100,
            yen: 3600,
            transfers: 0,
            note: '호텔 앞까지 가요. 갈아타는 곳이 아예 없어서 짐이 많으면 이쪽이에요.',
          },
          {
            routeId: 'nrt-nex',
            label: '나리타 익스프레스 (N’EX)',
            minutes: 90,
            yen: 3250,
            transfers: 0,
            note: '신주쿠까지 직통이에요. 소요시간은 열차마다 달라서 시각표를 보세요. 시부야에 서는 편도 있어요.',
          },
        ],
      },
      {
        id: 'tokyo-ginza',
        cityId: 'tokyo',
        name: '도쿄역 · 긴자',
        nameJa: '東京・銀座',
        blurb: '신칸센으로 이어가거나, 시내 한복판에 묵을 때예요',
        ways: [
          {
            routeId: 'nrt-nex',
            label: '나리타 익스프레스 (N’EX)',
            minutes: 60,
            yen: 3070,
            transfers: 0,
            recommended: true,
            note: '좌석 지정이라 자리가 보장돼요. JR패스가 있으면 추가 요금이 없어요.',
          },
          {
            routeId: 'nrt-bus-tokyo',
            label: '에어포트 버스 도쿄·특급',
            minutes: 80,
            yen: 1500,
            transfers: 0,
            note: '값이 절반 아래예요. 다만 고속도로가 막히면 2시간까지 걸리기도 해요.',
          },
        ],
      },
      {
        id: 'ueno-nippori',
        cityId: 'tokyo',
        name: '우에노 · 닛포리',
        nameJa: '上野・日暮里',
        blurb: '값싼 숙소가 많고, 나리타에서 가장 빨리 닿아요',
        ways: [
          {
            routeId: 'nrt-skyliner',
            label: '케이세이 스카이라이너',
            minutes: 41,
            yen: 2580,
            transfers: 0,
            recommended: true,
            note: '나리타에서 가장 빨라요. 닛포리 기준이고 우에노는 몇 분 더예요. 한국에서 미리 할인권을 사두면 더 싸요.',
          },
        ],
      },
      {
        id: 'asakusa',
        cityId: 'tokyo',
        name: '아사쿠사',
        nameJa: '浅草',
        blurb: '센소지 근처. 옛 동네 분위기를 원할 때예요',
        ways: [
          {
            routeId: 'nrt-access',
            label: '케이세이 액세스 특급',
            minutes: 60,
            yen: 1290,
            transfers: 0,
            recommended: true,
            note: '갈아타지 않고 아사쿠사까지 가요. 예약이 없어 바로 타면 되는 대신 자리 보장은 없어요.',
          },
        ],
      },
      {
        id: 'shinagawa',
        cityId: 'tokyo',
        name: '시나가와',
        nameJa: '品川',
        blurb: '신칸센 환승역. 하네다로 이어가기도 좋아요',
        ways: [
          {
            routeId: 'nrt-access',
            label: '케이세이 액세스 특급',
            minutes: 85,
            yen: 1520,
            transfers: 0,
            recommended: true,
            note: '아사쿠사를 지나 시나가와까지 그대로 이어져요. 아사쿠사보다 25분쯤 더 걸려요.',
          },
          {
            routeId: 'nrt-nex',
            label: '나리타 익스프레스 (N’EX)',
            minutes: 67,
            yen: 3250,
            transfers: 0,
          },
        ],
      },
    ],
    tips: [
      '터미널이 1·2·3으로 나뉘어요. 제주항공·티웨이 같은 LCC는 보통 3터미널인데, 역까지 걸어서 15분 넘게 걸려요.',
      '스카이라이너는 한국에서 온라인으로 미리 사면 현장에서 사는 것보다 싸요.',
      '막차가 대체로 22시쯤이에요. 밤늦게 도착하는 비행기라면 리무진이나 심야버스를 미리 알아두세요.',
      '⚠️ 나리타는 공항에서 시내 가는 열차가 전부 카드 터치로는 못 타요. Suica·파스모를 사거나 표를 끊어야 해요.',
    ],
    // 나리타는 컨택리스가 가장 안 되는 공항이다. 공항 열차를 굴리는 게이세이가
    // 「기술적 과제」를 이유로 도입하지 않았고, N'EX 를 굴리는 JR동일본은 사장이
    // 도입하지 않겠다고 공개적으로 밝혔다(Suica 중심 전략).
    //
    // 그래서 이 카드는 「됩니다」가 아니라 「안 됩니다」를 알리는 쪽이 본체다.
    // 카드만 들고 내려서 개찰구 앞에서 되돌아 나오는 일을 막는 게 목적이다.
    contactless: {
      supported: [
        { name: '도쿄 시내 지하철·사철', perk: '도쿄메트로·도에이·도큐·오다큐·게이오·세이부·도부는 카드로 타요' },
      ],
      unsupported: [
        {
          name: '스카이라이너 · 액세스 특급',
          reason: '게이세이 전철은 컨택리스를 도입하지 않았어요. 표를 사거나 IC카드가 필요해요.',
        },
        {
          name: '나리타 익스프레스 (JR)',
          reason: 'JR동일본은 Suica에 집중한다며 도입하지 않겠다고 밝혔어요. 야마노테선도 마찬가지예요.',
        },
      ],
    },
};
