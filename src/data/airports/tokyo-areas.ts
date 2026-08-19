import { HubSpot } from './types';

/**
 * 도쿄 거점의 근처 동네 — 하네다(hnd)와 나리타(nrt)가 **같이 쓴다.**
 *
 * 도쿄 거점은 두 공항 파일에 같은 이름으로 나란히 있다(신주쿠·시부야,
 * 도쿄역·긴자…). 거점까지 가는 법(`ways`)은 공항마다 다르니 각자 갖는 게
 * 맞지만, **거점에 내린 다음**은 어느 공항에서 왔든 똑같다. 이걸 양쪽에
 * 복사해 두면 언젠가 한쪽만 고쳐져서 같은 질문에 두 답이 생긴다.
 *
 * 키는 두 파일이 함께 쓰는 거점 id 다.
 */
export const TOKYO_HUB_NEARBY: Record<string, HubSpot[]> = {
  'shinjuku-shibuya': [
    {
      name: '하라주쿠',
      nameJa: '原宿',
      how: '신주쿠·시부야 어느 쪽에서든 야마노테선으로 한두 정거장이에요',
    },
    {
      name: '이케부쿠로',
      nameJa: '池袋',
      how: '신주쿠역에서 야마노테선으로 10분쯤이에요',
    },
  ],
  'tokyo-ginza': [
    {
      name: '긴자',
      nameJa: '銀座',
      lineIds: ['tokyo-marunouchi'],
      how: '도쿄역에서 한 정거장 · 걸어도 15분쯤이에요',
    },
    {
      name: '니혼바시',
      nameJa: '日本橋',
      how: '도쿄역에서 걸어서 10분쯤이에요',
    },
  ],
  'ueno-nippori': [
    {
      name: '아키하바라',
      nameJa: '秋葉原',
      lineIds: ['tokyo-hibiya'],
      how: '우에노역에서 두 정거장 · 야마노테선으로도 가요',
    },
  ],
  asakusa: [
    {
      name: '스카이트리 (오시아게)',
      nameJa: 'とうきょうスカイツリー',
      how: '아사쿠사역에서 도부선으로 한 정거장 · 걸어도 15분쯤이에요',
    },
  ],
  // 시나가와는 신칸센 환승 거점이라 숙소가 역 앞에 몰려 있다. 비워 둔다.
};
