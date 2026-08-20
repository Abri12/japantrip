/**
 * 보상 가격표 — **교환 금액을 정하는 유일한 자리.**
 *
 * ## 무엇이 뚫려 있었나
 *
 * 교환 요청이 이랬다.
 *
 *     POST /api/credits/redeem  { rewardId: 'starbucks', cost: 3000 }
 *
 * 서버가 그 `cost` 를 그대로 믿고 차감했다. 즉 **클라이언트가 자기 값을
 * 정했다.** `cost: 1` 을 보내면 1크레딧으로 3,000짜리 기프티콘이 나간다.
 * 앱을 고칠 필요도 없다 — 주소로 요청 한 번이면 된다.
 *
 * 원장을 서버로 옮기고(기기가 잔액을 못 만들게), 출금 게이트를 세우고(한
 * 사람이 한 사람분만 받게), 발행 한도까지 둔 것이 **이 한 줄로 전부
 * 무의미해지는** 자리였다. 잔액을 못 만들어도 값을 1로 부르면 그만이니까.
 *
 * ## 규칙
 *
 * 요청은 **무엇을 바꿀지**만 말한다. **얼마인지는 서버가 정한다.**
 *
 * 클라이언트가 보내는 값 중에 금액에 영향을 주는 것은 하나도 없어야 한다.
 * 이 파일이 있는 이유가 그 문장 하나다.
 *
 * ## 표는 어디서 오나
 *
 * `src/lib/credits.ts` 의 REWARDS 에서 뽑는다(`npm run gen:rewards`).
 * 손으로 두 곳에 적으면 화면에는 500이라 적혀 있는데 서버가 800을 깎는
 * 상황이 생기고, 사용자는 이유를 알 수 없다.
 */

import { readFileSync } from 'node:fs';

/** id → { cost, issuer, name } */
export const REWARDS = JSON.parse(
  readFileSync(new URL('./rewards.json', import.meta.url), 'utf8'),
);

/**
 * 표에서 하나 찾는다. **없으면 null** — 값을 지어내지 않는다.
 *
 * ## 왜 대괄호 조회로는 부족한가
 *
 * `REWARDS[id]` 만 쓰면 **물려받은 속성이 걸린다.** `id` 가 `'toString'` 이면
 * 그건 함수라서 참이고, 그다음 `.cost` 가 `undefined` 로 나온다. 호출부가
 * `null` 만 막고 있으면 그 `undefined` 가 그대로 지나가고, 원장에
 * `delta: -undefined` 즉 **NaN 이 기록된다.** 잔액 계산이 통째로 무너진다.
 *
 * 그래서 두 가지를 강제한다 — 문자열일 것, 그리고 **자기 속성일 것.**
 * 요청 본문에는 무엇이든 담겨 올 수 있으므로 여기서 막는 편이 확실하다.
 */
function find(rewardId) {
  if (typeof rewardId !== 'string' || !rewardId) return null;
  if (!Object.hasOwn(REWARDS, rewardId)) return null;
  return REWARDS[rewardId];
}

/**
 * 이 보상이 얼마인가.
 *
 * @returns 크레딧 수, 또는 모르면 null. 여기서 0이나 기본값을 돌려주면
 *   없는 상품을 공짜로 교환하게 된다.
 */
export function costOf(rewardId) {
  const reward = find(rewardId);
  // 표가 망가져 값이 숫자가 아닐 수도 있다. 그때도 null 이어야 한다.
  return typeof reward?.cost === 'number' ? reward.cost : null;
}

/** 화면에 이름을 돌려줄 때 쓴다. 모르면 null */
export function nameOf(rewardId) {
  return find(rewardId)?.name ?? null;
}

/** 운영자·앱이 목록을 받아 갈 때 */
export function list() {
  return Object.entries(REWARDS).map(([id, r]) => ({ id, ...r }));
}
