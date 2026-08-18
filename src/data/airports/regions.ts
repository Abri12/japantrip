import { RouteStep } from './types';

export const CONTACTLESS_HOWTO: RouteStep[] = [
  {
    action: '카드에 이 표시가 있는지 확인해요',
    icon: 'contactless',
    caution: '한국에서 발급받은 Visa·Mastercard·JCB·아멕스 대부분에 있어요. 폰에 넣은 카드도 돼요.',
  },
  {
    action: '개찰구에서 같은 표시가 붙은 리더를 찾아요',
    signJa: 'クレジットカード / タッチ決済',
    icon: 'contactless',
    caution: 'IC카드(Suica·ICOCA) 찍는 자리와 다른 경우가 많아요. 이 표시가 붙은 쪽에 대세요.',
  },
  {
    action: '들어갈 때 한 번, 나올 때 한 번 대요',
    caution: '요금은 나올 때 자동 계산돼요. 충전도, 보증금도 필요 없어요.',
  },
  {
    action: '들어갈 때와 나올 때 같은 카드로 대요',
    caution: '⚠ 같은 카드번호라도 실물카드로 들어가서 폰으로 나오면 안 돼요. 처음 댄 그 물건 그대로 써야 해요.',
  },
];

export interface Region {
  id: string;
  name: string;
  nameJa: string;
  emoji: string;
}

export const REGIONS: Region[] = [
  { id: 'kanto', name: '간토 (도쿄)', nameJa: '関東', emoji: '🗼' },
  { id: 'kansai', name: '간사이 (오사카·교토)', nameJa: '関西', emoji: '🏯' },
  { id: 'kyushu', name: '규슈 (후쿠오카)', nameJa: '九州', emoji: '♨️' },
  { id: 'hokkaido', name: '홋카이도 (삿포로)', nameJa: '北海道', emoji: '❄️' },
  { id: 'chubu', name: '주부 (나고야)', nameJa: '中部', emoji: '⛩️' },
  { id: 'okinawa', name: '오키나와', nameJa: '沖縄', emoji: '🏝️' },
];

