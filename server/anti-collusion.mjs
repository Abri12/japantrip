/**
 * 담합 탐지 — 계정을 못 세는 대신 **관계를 센다.**
 *
 * ## 문제
 *
 * 이 앱은 회원가입이 없다. 그래서 기기를 여러 개 쓰거나 앱을 지웠다 깔면 새
 * 사람이 된다. 서로 확인해 주면 교차검증이 통과한다. 「신원을 확인하자」는
 * 답은 회원가입을 되살리는 것이라 채택할 수 없었다.
 *
 * ## 뒤집어 본다
 *
 * 막아야 하는 것은 *신원을 여러 개 만드는 일*이 아니라 **가짜 확인이 돈이
 * 되는 일**이다. 신원을 비싸게 만들 수 없으면 **확인을 비싸게** 만들면 된다.
 * 확인 한 건의 값이 공격자에게만 비싸고 정상 사용자에게는 싸야 한다.
 *
 * 그 조건을 만족하는 신호가 넷 있다. 모두 **이미 가진 데이터**로 계산된다 —
 * 새로 수집하는 개인정보가 없다.
 *
 *   현장 여부   그 장소에 실제로 있었나        정상 사용자는 어차피 거기 있다
 *   상호성      A가 B를, B가 A를 확인하는가    정상 사용자끼리는 드물다
 *   집중도      A의 확인이 몇 사람에게 쏠리나  정상이면 확인자가 흩어진다
 *   동일망      확인자와 제보자가 같은 회선인가 같은 집 기기 두 대가 여기 걸린다
 *
 * ## 차단하지 않고 무게를 준다
 *
 * 위 신호로 확인을 **거부하지 않는다.** 휴리스틱으로 거부하면 실제 사용자가
 * 먼저 다친다 — 친구와 같이 여행 온 두 사람은 같은 와이파이를 쓰고 서로의
 * 제보를 확인한다. 그건 담합이 아니라 정상이다.
 *
 * 대신 확인마다 **무게**를 매기고, 필요한 무게가 모여야 확정한다.
 *
 *   현장 확인    3   거기까지 갔다는 것이 가장 비싼 증거다
 *   원격 확인    1   기본값
 *   의심 관계    0   세지 않는다. 거부는 아니다 — 화면에는 확인으로 보인다
 *
 * 무게가 0이어도 사용자에게는 「확인했습니다」로 보인다. 탐지 규칙을 화면에
 * 노출하면 그건 공격자에게 주는 설명서가 된다.
 *
 * ## 그래도 남는 것
 *
 * 실제로 일본에 가서 두 사람이 같이 다니며 서로 확인하면 통과한다. 그건
 * 막지 않는다 — 그 시점에 그들은 **실제로 그 정보를 확인한 것**이고, 공격
 * 비용이 항공권이 된 순간 이미 공격이 아니다.
 */

import { createHash } from 'node:crypto';

/** 확인 무게 */
export const WEIGHT_ON_SITE = 3;
export const WEIGHT_REMOTE = 1;
export const WEIGHT_SUSPECT = 0;

/**
 * 이 사람이 저 사람을 확인해 준 비율이 이 값을 넘으면 상호성으로 본다.
 * 서로 한 번씩은 우연히 일어난다. 반복되는 것이 신호다.
 */
const RECIPROCAL_MIN = 2;

/** 한 제보자의 확인 중 한 사람이 차지하는 비율의 상한 */
const CONCENTRATION_MAX = 0.5;

/** 집중도를 보기 시작하는 최소 표본. 초기 몇 건은 쏠릴 수밖에 없다 */
const CONCENTRATION_MIN_SAMPLE = 4;

/**
 * IP 를 저장하지 않기 위한 소금.
 *
 * 원본 IP 는 어디에도 남기지 않는다. 대역까지만 자른 뒤 **해시**해서
 * 「같은 회선인가」만 비교할 수 있게 한다. 소금이 매 실행 바뀌면 재시작 전후를
 * 비교하지 못하므로 환경변수로 고정할 수 있게 열어 둔다.
 */
const IP_SALT = process.env.IP_SALT ?? 'japantrip-default-salt';

/**
 * 같은 회선인지만 판별할 수 있는 값.
 *
 * IPv4 는 /24, IPv6 는 /48 까지만 남긴다. 개인을 특정하기에는 모자라고
 * 「같은 집·같은 카페인가」를 보기에는 충분한 해상도다.
 */
export function networkTag(ip) {
  if (!ip) return null;
  const clean = String(ip).replace(/^::ffff:/, '');
  const prefix = clean.includes(':')
    ? clean.split(':').slice(0, 3).join(':') // IPv6 /48
    : clean.split('.').slice(0, 3).join('.'); // IPv4 /24
  return createHash('sha256').update(IP_SALT).update(prefix).digest('hex').slice(0, 16);
}

/** 요청에서 클라이언트 IP 를 뽑는다. 리버스 프록시 뒤를 고려한다 */
export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress ?? null;
}

/**
 * 이 확인에 몇 점을 줄지 정한다.
 *
 * @param items    전체 기여 목록 — 관계 계산의 원본이다
 * @param item     지금 확인되는 기여
 * @param viewerId 확인하는 사람
 * @param onSite   현장 인증을 통과했는가
 * @param net      확인자의 회선 태그
 * @returns `{ weight, flags }` — flags 는 운영자 검토용이지 사용자에게 보이지 않는다
 */
export function weighConfirmation({ items, item, viewerId, onSite, net }) {
  const flags = [];
  const authorId = item.authorId;

  /*
   * ① 같은 회선.
   *
   * **이것 하나로는 0점을 주지 않는다.** 일본 통신사는 CGNAT 를 크게 써서
   * 여행자 다수가 같은 대역으로 보이고, 호텔·공항 와이파이도 마찬가지다.
   * 이 신호만으로 자르면 정상 사용자가 먼저 다친다.
   *
   * 관계 신호(②③)와 겹칠 때만 판단을 뒤집는 보조 증거로 쓴다.
   */
  if (net && item.authorNet && net === item.authorNet) flags.push('same-network');

  // ② 상호성 — 내가 저 사람 것을 확인해 준 만큼 저 사람이 내 것을 확인해 주나.
  const iConfirmedThem = countConfirms(items, viewerId, authorId);
  const theyConfirmedMe = countConfirms(items, authorId, viewerId);
  if (iConfirmedThem >= RECIPROCAL_MIN && theyConfirmedMe >= RECIPROCAL_MIN) {
    flags.push('reciprocal');
  }

  // ③ 집중도 — 이 제보자의 확인이 이 한 사람에게 쏠려 있나.
  const total = totalConfirmsReceived(items, authorId);
  if (total >= CONCENTRATION_MIN_SAMPLE) {
    const share = iConfirmedThem / total;
    if (share > CONCENTRATION_MAX) flags.push('concentrated');
  }

  /*
   * 현장 인증은 위 신호를 **덮는다.**
   *
   * 거기까지 갔다는 것이 관계 통계보다 훨씬 강한 증거이기 때문이다. 같이
   * 여행 온 친구 둘은 같은 회선을 쓰고 서로를 확인하지만, 둘 다 실제로 그
   * 가게 앞에 있었다면 그 확인은 참이다.
   */
  if (onSite) return { weight: WEIGHT_ON_SITE, flags, onSite: true };

  /*
   * 관계 신호가 있으면 세지 않는다.
   *
   * 상호성과 집중도는 **사람 사이의 패턴**이라 우연히 나오기 어렵다. 반면
   * 같은 회선은 위에 적은 이유로 흔하다 — 그래서 회선만 걸린 확인은 1점을
   * 주되 깃발은 남겨 둔다. 확정 직전 보류 판정(shouldHold)이 그 깃발을 본다.
   */
  const related = flags.includes('reciprocal') || flags.includes('concentrated');
  if (related) return { weight: WEIGHT_SUSPECT, flags, onSite: false };

  return { weight: WEIGHT_REMOTE, flags, onSite: false };
}

/** a 가 b 의 기여를 확인해 준 횟수 */
function countConfirms(items, a, b) {
  let n = 0;
  for (const it of items) {
    if (it.authorId !== b) continue;
    for (const c of it.confirms ?? []) if (c.by === a) n++;
  }
  return n;
}

/** 이 사람이 받은 전체 확인 수 */
function totalConfirmsReceived(items, authorId) {
  let n = 0;
  for (const it of items) {
    if (it.authorId !== authorId) continue;
    n += (it.confirms ?? []).length;
  }
  return n;
}

/**
 * 확정 직전 마지막 검사.
 *
 * 무게는 다 찼는데 **모인 확인이 전부 의심 관계**이거나 현장 확인이 하나도
 * 없는 고액 건이면 바로 지급하지 않고 보류한다. 보류는 거부가 아니다 —
 * 운영자가 보고 풀거나 반려한다.
 */
export function shouldHold(item) {
  const confirms = item.confirms ?? [];
  /*
   * 현장 확인에 붙은 깃발은 세지 않는다.
   *
   * 현장 인증이 관계 신호를 덮기로 한 이상, 덮인 깃발이 다시 보류 사유로
   * 살아나면 앞의 결정이 무의미해진다. 실제로 거기 있었으면 그걸로 됐다.
   */
  const flagged = confirms.filter((c) => !c.onSite && c.flags?.length).length;

  // 절반 넘게 깃발이 붙었으면 사람이 한 번 본다
  if (confirms.length && flagged / confirms.length > 0.5) return 'mostly-flagged';

  // 현장 확인 없이 큰 금액이 나가는 건도 사람이 본다
  const hasOnSite = confirms.some((c) => c.onSite);
  if (!hasOnSite && item.pendingCredits >= HOLD_CREDITS_WITHOUT_ON_SITE) return 'high-value-remote';

  return null;
}

/**
 * 현장 증거가 하나도 없이 이 금액을 넘기면 보류한다.
 *
 * 50 으로 잡은 것은 기여 유형의 난이도와 맞아떨어져서다 — 폐업 신고(10)와
 * 메뉴판(30)은 그냥 지나가고, 실시간 제보(80)와 인증 리뷰(100)는 사람이
 * 본다. 뒤의 둘은 **본래 현장에서만 할 수 있는 일**이라, 아무도 현장에 있지
 * 않은 채로 확정됐다면 그 자체가 이상 신호다.
 */
export const HOLD_CREDITS_WITHOUT_ON_SITE = Number(
  process.env.HOLD_CREDITS_WITHOUT_ON_SITE ?? 50,
);
