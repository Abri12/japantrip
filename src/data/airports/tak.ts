import { Airport } from './types';

/*
 * 다카마쓰공항도 철도가 없고 리무진버스가 전부다. 다만 마쓰야마와 다른 점이
 * 하나 있다 — **시각표가 매달 바뀐다.** 비행기 발착에 맞춰 편성하기 때문이다.
 *
 * 그래서 이 공항에는 첫차 시각(`firstTrain`)을 넣지 않았다. 한 달 지나면
 * 틀릴 값을 확정된 것처럼 보여주면, 그걸 믿고 새벽에 나선 사람이 정류장에서
 * 알게 된다. 대신 「그날 시각표를 확인하라」를 tips 에 남긴다.
 */
export const TAK: Airport = {
  id: 'tak',
  code: 'TAK',
  name: '다카마쓰 공항',
  nameJa: '高松空港',
  city: '다카마쓰',
  region: 'shikoku',
  prefecture: '香川県',
  routes: [
    {
      id: 'tak-limousine',
      name: '다카마쓰공항 리무진버스',
      nameJa: '高松空港リムジンバス',
      type: 'bus',
      destination: '다카마쓰역 · 페리 승강장',
      destinationJa: '高松駅・フェリー乗り場',
      fareTo: '다카마쓰역',
      minutes: 45,
      yen: 1000,
      recommended: true,
      note: '2번 승강장에서 타요(운행 ことでんバス). 시각표가 비행기 발착에 맞춰 매달 바뀌어요.',
      stops: [
        { name: '유메타운 다카마쓰 앞', nameJa: 'ゆめタウン高松前', transfer: '쇼핑몰 · 19분 800엔' },
        { name: '리쓰린코엔마에', nameJa: '栗林公園前', transfer: '리쓰린 공원 · 23분 900엔' },
        { name: '가와라마치', nameJa: '瓦町', transfer: '코토덴 3개 노선 환승 · 30분 900엔' },
        { name: '다카마쓰치쿠코', nameJa: '高松築港', transfer: '코토덴 고토히라선 · 다마모 공원 · 40분 1,000엔' },
        { name: '다카마쓰역 · 페리 승강장', nameJa: '高松駅・フェリー乗り場', transfer: 'JR · 섬으로 가는 배 · 45분 1,000엔' },
      ],
      stopsComplete: false,
      steps: [
        {
          action: '짐을 찾고 나오면 1층 도착 로비예요',
        },
        {
          action: '건물 밖 2번 승강장으로 나가요',
          key: true,
          where: '도착 로비 정면에 승강장이 번호순으로 늘어서 있어요',
          signJa: '2番のりば / 高松市内',
          minutes: 3,
          caution:
            '1번은 고토히라 방면, 4번은 사카이데·마루가메 방면이에요. 다카마쓰 시내로 가려면 2번이에요.',
        },
        {
          action: '어디서 내릴지 먼저 정해요',
          key: true,
          cost: '리쓰린코엔마에·가와라마치 900엔 · 다카마쓰치쿠코·다카마쓰역 1,000엔',
          caution:
            '숙소가 가와라마치 쪽이면 다카마쓰역까지 타고 되돌아올 필요가 없어요. 15분과 100엔을 아껴요.',
        },
        {
          action: '요금은 내릴 때 내요',
          icon: 'contactless',
          caution: '전국 IC카드가 통해요. 현금이면 잔돈을 준비하세요.',
        },
        {
          action: '다카마쓰역에서 내리면 항구가 바로 옆이에요',
          key: true,
          signJa: '高松港 / フェリーのりば',
          caution: '나오시마·쇼도시마행 배를 그날 탈 거면 여기서 내리세요. 걸어서 5분이에요.',
        },
      ],
    },
    {
      id: 'tak-kotohira',
      name: '고토히라 방면 리무진버스',
      nameJa: '琴平方面リムジンバス',
      type: 'bus',
      destination: 'JR 고토히라역',
      destinationJa: 'JR琴平駅',
      fareTo: 'JR 고토히라역',
      minutes: 48,
      yen: 2000,
      note: '1번 승강장에서 타요(운행 琴空バス). 곤피라산 온천에 바로 묵을 사람만 쓰는 노선이에요. 다카마쓰 시내를 거치지 않아요.',
      steps: [
        {
          action: '1층 도착 로비를 나가 1번 승강장으로',
          key: true,
          signJa: '1番のりば / 琴平方面',
          caution: '2번(다카마쓰 시내)과 헷갈리기 쉬워요. 승강장 번호를 확인하세요.',
        },
        {
          action: '요금은 내릴 때 내요',
          cost: 'JR 고토히라역까지 2,000엔',
        },
      ],
    },
    {
      id: 'tak-taxi',
      name: '택시',
      nameJa: 'タクシー',
      type: 'taxi',
      destination: '다카마쓰 시내',
      destinationJa: '高松市内',
      fareTo: '다카마쓰역 주변',
      minutes: 30,
      yen: 6000,
      note: '공항이 산 쪽에 있어서 시내까지 15km 남짓이에요. 값은 교통 상황에 따라 달라지는 대략치예요. 리무진 막차 뒤에 도착했을 때의 대안이에요.',
    },
  ],
  hubs: [
    {
      id: 'takamatsu-station',
      cityId: 'takamatsu',
      name: '다카마쓰역 · 항구',
      blurb: 'JR과 섬으로 가는 배가 붙어 있어요. 다음 날 나오시마에 갈 거면 이쪽이에요',
      ways: [
        {
          routeId: 'tak-limousine',
          label: '리무진버스 (종점까지)',
          minutes: 45,
          yen: 1000,
          transfers: 0,
          recommended: true,
          note: '내리면 항구가 걸어서 5분이에요.',
        },
      ],
    },
    {
      id: 'kawaramachi',
      cityId: 'takamatsu',
      name: '가와라마치 · 상점가',
      blurb: '번화가와 아케이드. 우동집과 술집이 몰려 있어요',
      ways: [
        {
          routeId: 'tak-limousine',
          label: '리무진버스 (가와라마치 하차)',
          minutes: 30,
          yen: 900,
          transfers: 0,
          recommended: true,
          note: '종점까지 타면 15분과 100엔을 더 쓰고 되돌아오게 돼요. 숙소가 이쪽이면 여기서 내리세요.',
        },
      ],
    },
  ],
  tips: [
    '철도가 안 들어와요. 리무진버스나 택시뿐이고, 시내까지 45분쯤 걸려요 — 시코쿠의 다른 공항보다 먼 편이에요.',
    '⚠ 시각표가 비행기 발착에 맞춰 매달 바뀌어요. 돌아가는 날 몇 시 차를 탈지는 그날 시각표로 확인하세요.',
    '승강장이 방면별로 나뉘어 있어요. 다카마쓰 시내는 2번, 고토히라는 1번, 사카이데·마루가메는 4번이에요.',
    '섬(나오시마·쇼도시마)에 갈 거면 종점인 다카마쓰역에서 내리세요. 항구가 걸어서 5분이에요.',
  ],
};
