import { Airport } from './types';
import { TOKYO_HUB_NEARBY } from './tokyo-areas';

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
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 1층 도착 로비예요',
            where: '제1터미널은 남·북 윙 모두, 제2터미널도 1층이 도착층이에요',
            caution:
              '제3터미널(LCC)에 내렸다면 그 건물엔 역이 없어요. 제2터미널까지 걸어서 15분 넘게 걸리니 먼저 그쪽으로 이동하세요.',
          },
          {
            action: '도착 로비 앞 에스컬레이터로 지하 1층에 내려가요',
            key: true,
            where: '내려가면 바로 나리타공항역이에요',
            signJa: '鉄道 / Railways',
            minutes: 3,
          },
          {
            action: '왼쪽 京成 개찰 앞 창구·발매기에서 스카이라이너 표를 사요',
            key: true,
            where: '지하 1층에 京成과 JR 개찰이 나란히 있고, 京成이 왼쪽이에요',
            signJa: '京成線 / スカイライナー',
            minutes: 5,
            cost: '2,580엔 (운임 1,280 + 라이너권 1,300)',
            caution:
              '한국에서 미리 할인권을 사뒀다면 여기서 좌석만 지정하면 돼요. 승차권과 라이너권 두 장이 필요한 열차예요.',
          },
          {
            action: '개찰을 지나 「スカイライナー」 표시를 따라가요',
            key: true,
            where: '개찰 안에서 주황색 게이트 옆 에스컬레이터로 내려가요',
            signJa: 'スカイライナー',
            caution: '주황색 게이트를 지나지 않으면 다른 승강장(액세스 특급·京成本線)으로 가요.',
          },
          {
            action: '표에 적힌 호차·좌석에 앉아요',
            key: true,
            minutes: 41,
            caution: '전 좌석 지정이라 아무 데나 앉으면 안 돼요. 캐리어는 객실 끝 선반에 둬요.',
          },
          {
            action: '닛포리 또는 우에노에서 내려요',
            key: true,
            where: '닛포리가 먼저고, 우에노가 종점이에요',
            signJa: '日暮里 / 上野',
            caution: 'JR 야마노테선으로 갈아탈 거면 닛포리에서 내리는 게 훨씬 편해요.',
          },
        ],
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
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 1층 도착 로비예요',
            where: '제1터미널은 남·북 윙 모두, 제2터미널도 1층이 도착층이에요',
            caution:
              '제3터미널(LCC)에 내렸다면 그 건물엔 역이 없어요. 제2터미널까지 걸어서 15분 넘게 걸리니 먼저 그쪽으로 이동하세요.',
          },
          {
            action: '도착 로비 앞 에스컬레이터로 지하 1층에 내려가요',
            key: true,
            where: '내려가면 바로 나리타공항역이에요',
            signJa: '鉄道 / Railways',
            minutes: 3,
          },
          {
            action: '오른쪽 JR 개찰로 가요',
            key: true,
            where: '京成과 JR 개찰이 나란히 있는데, JR이 오른쪽이에요',
            signJa: 'JR線 / JR East',
            caution: '왼쪽 京成으로 들어가면 N’EX를 못 타요. 개찰 위 글자를 꼭 보세요.',
          },
          {
            action: '미도리노마도구치나 발매기에서 지정석 표를 사요',
            key: true,
            signJa: 'みどりの窓口',
            minutes: 8,
            cost: '도쿄역까지 3,070엔 · 신주쿠·시나가와는 3,250엔',
            caution: 'JR패스가 있으면 추가 요금 없이 좌석만 지정하면 돼요. 여권을 같이 내세요.',
          },
          {
            action: '표에 적힌 호차에 앉아요',
            key: true,
            minutes: 60,
            caution:
              '도쿄역에서 열차가 앞뒤로 갈라져요. 한쪽은 신주쿠 방면, 다른 쪽은 요코하마 방면이라 호차를 틀리면 엉뚱한 곳으로 가요. 표에 적힌 호차에 꼭 앉으세요.',
          },
          {
            action: '도쿄역에서 내려요',
            key: true,
            signJa: '東京',
            caution: '신주쿠·시부야까지 간다면 여기서 내리지 말고 그대로 앉아 계세요.',
          },
        ],
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
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 1층 도착 로비예요',
            where: '제1터미널은 남·북 윙 모두, 제2터미널도 1층이 도착층이에요',
            caution:
              '제3터미널(LCC)에 내렸다면 그 건물엔 역이 없어요. 제2터미널까지 걸어서 15분 넘게 걸리니 먼저 그쪽으로 이동하세요.',
          },
          {
            action: '도착 로비 앞 에스컬레이터로 지하 1층에 내려가요',
            key: true,
            where: '내려가면 바로 나리타공항역이에요',
            signJa: '鉄道 / Railways',
            minutes: 3,
          },
          {
            action: '왼쪽 京成 개찰로 가요',
            key: true,
            where: '京成과 JR 개찰이 나란히 있고, 京成이 왼쪽이에요',
            signJa: '京成線 / Keisei Line',
          },
          {
            action: 'Suica·파스모로 들어가거나 표를 사요',
            key: true,
            cost: '아사쿠사까지 1,290엔 · 시나가와까지 1,520엔',
            caution:
              '좌석 지정이 없어서 예약은 필요 없어요. 다만 해외 카드 터치 결제로는 못 타니, IC카드가 없으면 발매기에서 표를 사세요.',
          },
          {
            action: '「アクセス特急」인지 꼭 확인하고 타요',
            key: true,
            where: '같은 승강장에 두 종류가 와요',
            signJa: 'アクセス特急',
            caution:
              '「京成本線」 열차는 다른 길로 돌아가서 20분 넘게 더 걸리고, 아사쿠사선으로 이어지지도 않아요. 「アクセス特急」이라고 뜬 것만 타세요.',
            recover: '잘못 탔으면 다음 큰 역에서 내려 되돌아오면 돼요.',
          },
          {
            action: '그대로 앉아 아사쿠사까지 가요',
            key: true,
            where: '도중에 도에이 아사쿠사선으로 그대로 이어져요',
            signJa: '浅草',
            minutes: 60,
            caution: '아사쿠사선으로 직통하지 않는 편도 있어요. 전광판에 「都営線直通」이 있는지 보세요.',
          },
        ],
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
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 1층 도착 로비예요',
          },
          {
            action: '밖으로 나가 버스 승강장을 찾아요',
            key: true,
            where: '도착 로비를 나서면 바로 앞이 버스 정류장이에요',
            signJa: 'エアポートバス東京・特急',
            minutes: 3,
            caution: '승강장 번호는 터미널마다 달라요. 「東京駅」이라고 쓰인 표지판을 보고 서세요.',
          },
          {
            action: '요금은 타면서 내요',
            key: true,
            cost: '1,500엔 · 현금 또는 IC카드',
            caution: '표를 미리 안 사도 돼요. 다만 자리가 차면 다음 편을 기다려야 해요.',
          },
          {
            action: '캐리어를 기사에게 맡겨요',
          },
          {
            action: '도쿄역 야에스구치에서 내려요',
            key: true,
            signJa: '東京駅八重洲口',
            minutes: 80,
            caution: '고속도로가 막히면 2시간까지 걸리기도 해요. 시간이 급하면 열차가 안전해요.',
          },
        ],
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
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 1층 도착 로비예요',
          },
          {
            action: '리무진 버스 카운터에서 표를 사요',
            key: true,
            where: '도착 로비 안에 카운터와 자동판매기가 있어요',
            signJa: 'リムジンバス きっぷうりば',
            cost: '신주쿠까지 3,600엔',
            caution: '내릴 호텔을 말하면 그에 맞는 표를 줘요. 타기 전에 사야 해요.',
          },
          {
            action: '표에 적힌 승강장 번호를 확인하고 밖으로 나가요',
            key: true,
            caution: '호텔마다 노선이 갈려서 승강장이 달라요. 번호를 안 보고 줄 서면 엉뚱한 버스를 타요.',
          },
          {
            action: '캐리어를 맡기고 번호표를 받아요',
            caution: '내릴 때 이 번호표로 짐을 찾아요.',
          },
          {
            action: '숙소 앞이나 가까운 정류장에서 내려요',
            key: true,
            minutes: 100,
            caution: '여러 호텔을 돌기 때문에 자기 호텔이 몇 번째인지 알아두면 마음이 편해요.',
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
        blurb: '신칸센으로 이어가거나, 시내 한복판에 묵을 때예요',
        nearby: TOKYO_HUB_NEARBY['tokyo-ginza'],
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
        blurb: '값싼 숙소가 많고, 나리타에서 가장 빨리 닿아요',
        nearby: TOKYO_HUB_NEARBY['ueno-nippori'],
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
        blurb: '센소지 근처. 옛 동네 분위기를 원할 때예요',
        nearby: TOKYO_HUB_NEARBY['asakusa'],
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
