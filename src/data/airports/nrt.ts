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
        minutes: 41,
        yen: 2580,
        recommended: true,
        reserved: true,
        note: '가장 빨라요. 전 좌석 지정이라 자리가 보장되고, 객실 끝에 캐리어 두는 선반이 있어요. 닛포리에서 JR 야마노테선으로 갈아타면 도쿄 시내는 거의 다 갈 수 있어요. 한국에서 미리 할인권을 사두면 더 저렴해요.',
      },
      {
        id: 'nrt-nex',
        name: '나리타 익스프레스 (N’EX)',
        nameJa: '成田エクスプレス',
        type: 'train',
        destination: '도쿄역 · 신주쿠 · 시나가와',
        destinationJa: '東京・新宿・品川',
        minutes: 60,
        yen: 3070,
        reserved: true,
        note: '좌석 지정이라 자리가 보장되고 짐 두는 자리도 있어요. JR패스가 있으면 추가 요금 없이 탈 수 있고, 신주쿠나 시부야로 바로 간다면 갈아타지 않아도 돼요. 다만 배차가 30분~1시간 간격이라 시간표를 봐야 해요.',
      },
      {
        id: 'nrt-access',
        name: '케이세이 액세스 특급',
        nameJa: 'アクセス特急',
        type: 'train',
        destination: '아사쿠사 · 니혼바시 · 시나가와',
        destinationJa: '浅草・日本橋・品川',
        minutes: 60,
        yen: 1320,
        note: '좌석 지정이 없어서 예약 없이 바로 타면 돼요. 숙소가 아사쿠사나 긴자 쪽이면 값이 가장 싸요. 다만 통근 노선과 같은 열차라 자리 보장이 없고, 짐 두는 공간도 따로 없어요.',
      },
      {
        id: 'nrt-bus-tokyo',
        name: '에어포트 버스 도쿄·특급',
        nameJa: 'エアポートバス東京・特急',
        type: 'bus',
        destination: '도쿄역 · 긴자',
        destinationJa: '東京・銀座',
        minutes: 80,
        yen: 1500,
        note: '캐리어가 크거나 일행이 많으면 편해요. 다만 고속도로가 막히면 2시간까지 걸리기도 해요.',
      },
      {
        id: 'nrt-limousine',
        name: '리무진 버스',
        nameJa: 'リムジンバス',
        type: 'bus',
        destination: '신주쿠 · 시부야 주요 호텔',
        destinationJa: '新宿・渋谷',
        minutes: 100,
        yen: 3600,
        note: '호텔 앞까지 데려다줘요. 갈아탈 일이 아예 없어서 짐 많은 가족 여행에 잘 맞아요.',
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
