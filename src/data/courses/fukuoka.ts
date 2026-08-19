import { Course } from './types';

/** 후쿠오카 추천 코스. 화면에 나오는 순서 그대로 둔다 */
export const FUKUOKA_COURSES: Course[] = [
  {
    id: 'fukuoka-2n3d',
    cityId: 'fukuoka',
    title: '후쿠오카 2박 3일 · 처음 가는 사람',
    nights: 2,
    forWho: '후쿠오카가 처음이고, 먹는 걸 여행의 중심에 두는 분',
    summary:
      '하카타나 텐진을 숙소로 잡는다고 보고 짰어요. 후쿠오카는 시내가 좁아 이동이 짧은 대신, 웨이팅이 변수예요.',
    days: [
      {
        label: '1일차 · 도착',
        transitYen: 470, // 지하철 260+210 (셔틀 무료)
        theme: '도착하고 야타이까지',
        stops: [
          {
            custom: '후쿠오카공항 → 하카타',
            when: '도착 직후',
            move: '무료 셔틀 10분 + 지하철 5분',
            note: '⚠ 지하철역은 국내선에 있어요. 국제선에서 셔틀로 건너가야 해요. 일행이 3명 이상이면 택시가 시간도 아끼고 1인당 부담도 얼마 안 늘어요.',
          },
          { placeId: 'canal-city', when: '오후', move: '하카타역에서 도보 10분' },
          { placeId: 'kushida', when: '캐널시티 보는 김에', move: '도보 5분' },
          {
            placeId: 'nakasu-yatai',
            when: '18시 이후',
            move: '지하철 나카스카와바타역',
            note: '18시 전에는 문을 안 열어요. 현금을 챙기세요.',
          },
        ],
      },
      {
        label: '2일차 · 다자이후 + 텐진',
        transitYen: 1170, // 니시테츠 480 왕복 · 지하철 210
        theme: '오전에 근교, 오후에 시내',
        stops: [
          {
            placeId: 'dazaifu',
            when: '오전에 출발',
            move: '니시테츠 텐진 → 다자이후 30분 (후츠카이치 환승)',
            note: '야나가와까지 같이 돌 거면 「다자이후·야나가와 관광킷푸」가 훨씬 싸요.',
          },
          {
            placeId: 'yatai-tenjin',
            when: '오후',
            move: '니시테츠로 텐진 복귀',
            note: '지하상가가 넓어서 비가 와도 다니기 편해요.',
          },
          { placeId: 'ohori-park', when: '해 지기 전', move: '지하철 공항선 5분' },
        ],
        tip: '지하철을 카드로 타면 하루 640엔이 넘지 않아요. 1일권을 따로 살 필요가 없어요.',
      },
      {
        label: '3일차 · 귀국',
        transitYen: 680, // 지하철 210+210+260
        theme: '공항이 가까워 여유가 있어요',
        stops: [
          { custom: '숙소 체크아웃 · 짐 맡기기', when: '오전' },
          {
            placeId: 'yanagibashi',
            when: '오전',
            move: '지하철 나나쿠마선',
            note: '오후 늦게는 많이 닫아요. 오전에만 넣을 수 있는 항목이에요.',
          },
          {
            placeId: 'hakata-station',
            when: '점심',
            move: '지하철 5분',
            note: '9~10층 식당가에서 마지막 라멘을 먹고 바로 공항으로 갈 수 있어요.',
          },
          {
            custom: '하카타 → 후쿠오카공항',
            when: '비행기 2시간 30분 전 출발',
            move: '지하철 5분 + 국내선→국제선 셔틀 10분',
            note: '시내는 가깝지만 국제선까지 셔틀을 한 번 더 타야 해서 여유를 두세요.',
          },
        ],
      },
    ],
  },
];
