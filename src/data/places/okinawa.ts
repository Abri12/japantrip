import { Place } from './types';

export const OKINAWA_PLACES: Place[] = [
  // ══ 오키나와 (3단계) ═════════════════════════════════
  {
    id: 'kokusai-dori',
    name: '고쿠사이도리',
    nameJa: '国際通り',
    category: 'food',
    city: '오키나와',
    cityId: 'okinawa',
    prefecture: '沖縄県',
    lat: 26.2148,
    lng: 127.6879,
    radiusM: 400,
    summary: '나하 중심 번화가예요. 오키나와 소바랑 타코라이스를 꼭 드셔보세요.',
    access: {
      mode: 'monorail',
      station: '겐초마에역',
      stationJa: '県庁前駅',
      lineLabel: '유이레일',
      leg: '도보 3분',
    },
    duration: '2시간',
    admission: '무료',
    tip: '일요일 낮엔 차를 막아서 걷기 좋은 거리가 돼요.',
  },
  {
    id: 'churaumi',
    name: '츄라우미 수족관',
    nameJa: '美ら海水族館',
    category: 'sight',
    city: '오키나와',
    cityId: 'okinawa',
    prefecture: '沖縄県',
    lat: 26.6944,
    lng: 127.8779,
    radiusM: 100,
    summary: '고래상어가 있는 거대한 수조로 유명한 수족관이에요.',
    access: {
      mode: 'car',
      station: '나하에서 차로 2시간',
      leg: '렌터카나 고속버스',
    },
    duration: '3시간',
    admission: '2,180엔',
    tip: '나하에서 차로 2시간 걸려요. 렌터카 없이 간다면 고속버스 시간표부터 확인하세요.',
  },
];
