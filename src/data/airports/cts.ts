import { Airport } from './types';

export const CTS: Airport = {
    id: 'cts',
    code: 'CTS',
    name: '신치토세 공항',
    nameJa: '新千歳空港',
    city: '삿포로',
    region: 'hokkaido',
    prefecture: '北海道',
    routes: [
      {
        id: 'cts-jr',
        name: 'JR 쾌속 에어포트',
        nameJa: 'JR 快速エアポート',
        type: 'train',
        destination: '삿포로역',
        fareTo: '삿포로역',
        destinationJa: '札幌',
        firstTrain: { from: '삿포로', time: '05:50', confidence: 'confirmed' },
        minutes: 37,
        // 2025년 4월 JR홋카이도 운임 개정으로 1,150 → 1,230엔.
        yen: 1230,
        recommended: true,
        note: '지정석 칸(u시트)이 따로 있어요. 짐이 많으면 조금 더 내고 앉는 편이 편해요.',
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 국제선 터미널 1층이에요',
          },
          {
            action: '연결통로로 국내선 터미널까지 걸어가요',
            key: true,
            where: '2층 연결통로를 따라 쭉 걸어요',
            signJa: '国内線ターミナル / JR',
            minutes: 10,
            caution:
              'JR역은 국내선 터미널 지하에만 있어요. 국제선 건물에서 아무리 찾아도 안 나와요. 무빙워크가 있지만 10분은 잡으세요.',
          },
          {
            action: '국내선 터미널 지하 1층으로 내려가요',
            key: true,
            signJa: 'JR 新千歳空港駅',
            minutes: 3,
          },
          {
            action: '교통카드를 대거나 발매기에서 표를 사요',
            icon: 'contactless',
            cost: '삿포로역까지 1,230엔',
            caution: 'Kitaca·Suica·ICOCA 다 돼요. 지정석(u시트)을 원하면 창구에서 따로 사야 해요.',
          },
          {
            action: '「快速エアポート 札幌行」을 타요',
            key: true,
            signJa: '快速エアポート / 札幌',
            minutes: 37,
            caution: '공항이 시발역이라 대체로 앉아서 가요. 눈이 와도 가장 안 밀리는 수단이에요.',
          },
          {
            action: '삿포로역에서 내려요',
            key: true,
            signJa: '札幌',
            caution: '오타루까지 그대로 이어지는 편이 많아요. 삿포로에서 꼭 내리세요.',
          },
        ],
      },
      {
        id: 'cts-bus',
        name: '연락 버스',
        nameJa: '連絡バス',
        type: 'bus',
        destination: '삿포로 시내 호텔',
        fareTo: '삿포로 시내',
        destinationJa: '札幌市内',
        minutes: 70,
        yen: 1300,
        note: '어느 호텔에 서는지는 편마다 달라요. 타기 전에 정차 호텔 목록을 확인하세요.',
        steps: [
          {
            action: '짐을 찾고 세관을 나오면 국제선 터미널 1층이에요',
          },
          {
            action: '1층 밖 버스 승강장으로 나가요',
            key: true,
            where: '국제선 터미널에서 바로 탈 수 있어요. 국내선까지 걸어갈 필요가 없어요',
            signJa: '連絡バス / 札幌市内',
            minutes: 3,
          },
          {
            action: '행선지 호텔이 맞는지 확인하고 서요',
            key: true,
            caution: '편마다 서는 호텔이 달라요. 승강장 표지판에서 자기 호텔 이름을 찾으세요.',
          },
          {
            action: '캐리어를 맡기고 요금은 내릴 때 내요',
            cost: '삿포로 시내까지 1,300엔',
          },
          {
            action: '숙소 앞이나 가까운 정류장에서 내려요',
            key: true,
            minutes: 70,
            caution: '눈이 많이 오면 시간을 장담할 수 없어요. 겨울엔 JR이 안전해요.',
          },
        ],
      },
    ],
    hubs: [
      {
        id: 'sapporo-station',
        cityId: 'sapporo',
        name: '삿포로역',
        blurb: '지하상가로 이어진 중심역. 숙소가 가장 많아요',
        ways: [
          {
            routeId: 'cts-jr',
            label: 'JR 쾌속 에어포트',
            minutes: 37,
            yen: 1230,
            transfers: 0,
            recommended: true,
            note: '눈이 와도 가장 안 밀려요. 겨울엔 버스보다 이쪽이 확실해요.',
          },
          {
            routeId: 'cts-bus',
            label: '연락 버스',
            minutes: 70,
            yen: 1300,
            transfers: 0,
            note: '호텔 앞까지 가요. 다만 눈길에서는 시간을 장담할 수 없어요.',
          },
        ],
      },
      {
        id: 'susukino',
        cityId: 'sapporo',
        name: '스스키노 · 오도리',
        blurb: '번화가와 먹자골목. 밤에 나갈 일이 많으면 이쪽이에요',
        ways: [
          {
            routeId: 'cts-jr',
            label: 'JR 쾌속 에어포트 + 지하철 난보쿠선',
            minutes: 65,
            yen: 1440,
            transfers: 1,
            recommended: true,
            note: '삿포로역에서 지하철로 갈아타요. 삿포로역에서 두 정거장이라 짐이 적으면 걸어도 돼요.',
            transferSteps: [
              {
                action: '삿포로역에서 내려요',
                key: true,
                signJa: '札幌',
              },
              {
                action: '지하철 「さっぽろ」역으로 걸어가요',
                key: true,
                where: 'JR 서쪽 개찰을 나와 지하로. 250m 남짓이에요',
                signJa: 'さっぽろ / 地下鉄南北線',
                minutes: 5,
                caution:
                  'JR은 한자 「札幌」, 지하철은 히라가나 「さっぽろ」로 표기가 달라요. 같은 자리인데 이름이 갈려서 헷갈려요. 짐이 많거나 눈이 오면 10분 잡으세요',
              },
              {
                action: '난보쿠선 마코마나이 방면을 타요',
                key: true,
                where: '스스키노는 두 정거장이에요',
                signJa: '地下鉄南北線 真駒内方面',
                minutes: 4,
              },
            ],
          },
        ],
      },
    ],
    tips: [
      'JR역은 국내선 터미널 지하에 있어요. 국제선에서 걸어서 연결되는데 10분쯤 걸려요.',
      '겨울엔 폭설로 결항이 잦아요. 돌아오는 비행기는 여유 있게 잡는 게 안전해요.',
      '공항 자체가 볼거리예요. 온천, 영화관, 라멘 거리가 있어서 기다리는 시간이 아깝지 않아요.',
    ],
};
