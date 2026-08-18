/**
 * 제휴(어필리에이트) 링크 설정.
 *
 * 패스·티켓 구매 링크에 내 추천 코드를 붙여 수수료를 받는 구조다.
 * 여기 한 곳만 채우면 앱 전체의 구매 버튼에 반영된다.
 *
 * ─────────────────────────────────────────────────────────────
 * 시작하기 전에 (순서대로)
 * ─────────────────────────────────────────────────────────────
 * 1. 각 제휴사 파트너 프로그램에 가입하고 **승인**을 받는다.
 *    승인 전 코드를 붙여도 수수료가 잡히지 않는다.
 *      · 클룩       https://affiliate.klook.com
 *      · KKday      https://affiliate.kkday.com
 *      · 마이리얼트립 파트너스 (제휴 문의)
 *      · 트립닷컴   https://kr.trip.com/partners/
 * 2. 발급받은 추천 ID를 아래 `referralId` 에 넣는다.
 * 3. 정확한 상품 URL을 각 패스의 `buyLinks` 에 넣는다.
 *    (지금은 검색 URL이 기본값이라 링크는 열리지만 상품이 특정되지 않는다)
 *
 * ─────────────────────────────────────────────────────────────
 * 추천 ID는 비밀이 아니다
 * ─────────────────────────────────────────────────────────────
 * URL 쿼리로 노출되는 값이라 저장소에 두어도 보안 문제가 없다.
 * 다만 값이 바뀔 수 있으니 코드 곳곳이 아니라 이 파일에만 둔다.
 *
 * ─────────────────────────────────────────────────────────────
 * 🔴 법적 의무 — 대가성 표시
 * ─────────────────────────────────────────────────────────────
 * 공정거래위원회 「추천·보증 등에 관한 표시·광고 심사지침」상,
 * 수수료를 받는 링크에는 **경제적 이해관계를 명확히 표시**해야 한다.
 * 숨기거나 흐리게 적으면 표시광고법 위반이 될 수 있다.
 *
 * 그래서 `DISCLOSURE` 를 구매 버튼 옆에 항상 노출한다. 이 문구를 지우거나
 * 눈에 안 띄게 바꾸지 말 것. 앱스토어 심사에서도 문제가 된다.
 */

export interface AffiliatePartner {
  id: string;
  name: string;
  /**
   * 파트너 프로그램에서 발급받은 추천 ID.
   * 비어 있으면 그 제휴사 링크는 추천 코드 없이(= 수수료 없이) 열린다.
   */
  referralId: string;
  /** 추천 ID를 실어 보낼 쿼리 파라미터 이름 */
  param: string;
  /** 검색 URL 기본형 — 상품 URL을 아직 안 넣었을 때 대체로 쓴다 */
  searchUrl: (keyword: string) => string;
}

export const PARTNERS: Record<string, AffiliatePartner> = {
  klook: {
    id: 'klook',
    name: '클룩',
    // ↓ 승인 후 발급받은 ID로 교체하세요
    referralId: '',
    param: 'aid',
    searchUrl: (k) => `https://www.klook.com/ko/search/?query=${encodeURIComponent(k)}`,
  },
  myrealtrip: {
    id: 'myrealtrip',
    name: '마이리얼트립',
    referralId: '',
    param: 'ref',
    searchUrl: (k) => `https://www.myrealtrip.com/search?q=${encodeURIComponent(k)}`,
  },
  kkday: {
    id: 'kkday',
    name: 'KKday',
    referralId: '',
    param: 'aid',
    searchUrl: (k) => `https://www.kkday.com/ko/product/ls?keyword=${encodeURIComponent(k)}`,
  },
};

export type PartnerId = keyof typeof PARTNERS;

/** 패스 하나에 붙는 구매 링크. */
export interface BuyLink {
  partner: PartnerId;
  /**
   * 정확한 상품 URL. 비워 두면 `searchKeyword` 로 검색 페이지를 연다.
   * 상품 URL이 있어야 전환율도 수수료 인정률도 올라간다.
   */
  productUrl?: string;
  /** 상품 URL이 없을 때 쓸 검색어 */
  searchKeyword: string;
}

/**
 * 추천 ID를 붙인 최종 URL을 만든다.
 *
 * 이미 쿼리가 있는 상품 URL에도 안전하게 덧붙이도록 URL 객체로 처리한다.
 * 추천 ID가 비어 있으면 원본 URL을 그대로 반환한다 — 가짜 파라미터를 붙여
 * 링크를 깨뜨리지 않기 위해서다.
 */
export function buildBuyUrl(link: BuyLink): string {
  const partner = PARTNERS[link.partner];
  const base = link.productUrl ?? partner.searchUrl(link.searchKeyword);

  if (!partner.referralId) return base;

  try {
    const url = new URL(base);
    url.searchParams.set(partner.param, partner.referralId);
    return url.toString();
  } catch {
    // URL 파싱에 실패하면 원본을 그대로 연다. 링크가 안 열리는 것보다 낫다.
    return base;
  }
}

/** 추천 ID가 하나라도 설정되어 있는지. 표시 문구를 고를 때 쓴다. */
export function hasAnyReferral(): boolean {
  return Object.values(PARTNERS).some((p) => p.referralId.length > 0);
}

/**
 * 🔴 대가성 표시 문구. 구매 버튼 옆에 항상 보여야 한다.
 * 법적 의무이며, 이 파일 상단 주석 참조.
 */
export const DISCLOSURE =
  '구매 링크를 통해 결제하면 앱 운영자에게 일정 수수료가 지급돼요. 가격은 동일해요.';

/** 제휴 링크가 없는 경우에도 쓰는 일반 안내. */
export const PRICE_NOTE = '가격과 판매 여부는 판매처 기준이에요.';
