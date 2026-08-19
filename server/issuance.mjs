/**
 * 발행 한도 — **규제선을 코드가 지킨다.**
 *
 * ## 무엇이 문제였나
 *
 * 크레딧을 제휴사 상품(eSIM·기프티콘·티켓)으로 바꿔 주면, 그 크레딧은
 * 전자금융거래법상 **선불전자지급수단**에 해당한다. 「발행인 외의 제3자로부터
 * 재화 또는 용역을 구입하고 그 대가를 지급하는 데 사용」되기 때문이다(법
 * 제2조 제14호). 금융위원회도 앱 리워드 포인트를 제휴사 쿠폰으로 바꿔 주는
 * 사안을 같은 취지로 회신한 바 있다.
 *
 * 2024년 9월 개정으로 「2개 업종 이상」 요건이 사라져서, 한 업종만 써도
 * 해당한다. 즉 **빠져나갈 구멍이 좁아졌다.**
 *
 * ## 그런데 등록 의무는 규모로 면제된다
 *
 * 해당한다고 곧바로 등록해야 하는 것은 아니다. 다음 중 하나면 면제다.
 *
 *   ① 발행인이 직접 운영하는 1개 가맹점에서만 사용   (자가형)
 *   ② 발행잔액 30억원 **미만** 이고 연간 총발행액 500억원 **미만**
 *   ③ 무상 발행분에 상환보증보험 가입
 *
 * 이 앱이 설 자리는 ②다. 개인이 운영하는 여행 앱이 발행잔액 30억원에 닿는
 * 일은 없다 — 크레딧 1점을 2원으로 쳐도 15억 점을 미상환으로 들고 있어야
 * 하는 규모다. 그러니 **자본금 20억이 필요하다는 것은 사실이 아니다.**
 *
 * ## 그래서 이 모듈이 하는 일
 *
 * 「어차피 안 닿는다」를 믿지 않고 **닿지 못하게 막는다.** 규제선보다 훨씬
 * 낮은 자체 한도를 두고, 넘으면 발행을 멈춘다. 사고(지급 로직 버그, 대규모
 * 어뷰징)로 하룻밤에 폭증하는 경우를 막기 위한 것이지 정상 운영을 제약하려는
 * 것이 아니다.
 *
 * 한도에 걸리면 **지급만 멈추고 사용은 열어 둔다.** 이미 준 것을 못 쓰게
 * 하면 그건 이용자 손해고, 미상환 잔액을 줄이는 방향도 아니다.
 *
 * ## 이건 법률 자문이 아니다
 *
 * 조문과 유권해석을 근거로 한 설계일 뿐이다. 실제로 켜기 전에 변호사 확인이
 * 필요하고, 특히 아래 둘은 이 모듈이 다루지 않는다.
 *
 *   유효기간·환급 약관   미상환 잔액은 회계상 채무다. 소멸시효를 정해야 한다
 *   세무               기여 보상이 기타소득인지, 원천징수 의무가 생기는지
 */

/** 크레딧 1점을 원화로 얼마로 볼 것인가 — 규제선과 비교하려면 환산이 필요하다 */
export const CREDIT_WON = Number(process.env.CREDIT_WON ?? 2);

/** 전자금융거래법상 등록 면제 기준 (2024.9.15 시행) */
export const REG_OUTSTANDING_KRW = 3_000_000_000; // 발행잔액 30억
export const REG_ANNUAL_KRW = 50_000_000_000; // 연간 총발행액 500억

/**
 * 자체 한도.
 *
 * 규제선의 3% 남짓으로 잡는다. 여기 닿는다면 그건 성공이 아니라 **사고일
 * 가능성이 높다** — 그때 멈추는 편이 낫다. 실제로 서비스가 커져서 닿는
 * 것이라면, 그 시점에는 등록을 준비할 여유와 이유가 함께 생긴다.
 */
export const CAP_OUTSTANDING_KRW = Number(process.env.CAP_OUTSTANDING_KRW ?? 100_000_000);
export const CAP_ANNUAL_KRW = Number(process.env.CAP_ANNUAL_KRW ?? 500_000_000);

/** 이 비율을 넘으면 로그로 경고한다. 막히고 나서 아는 것은 늦다 */
const WARN_RATIO = 0.8;

let warned = false;

/**
 * 지금 발행해도 되는가.
 *
 * @param outstanding 미상환 크레딧 합계
 * @param annual      최근 1년 발행 합계
 */
export function checkIssuance(outstanding, annual, delta) {
  const outWon = (outstanding + delta) * CREDIT_WON;
  const annWon = (annual + delta) * CREDIT_WON;

  if (!warned && (outWon > CAP_OUTSTANDING_KRW * WARN_RATIO || annWon > CAP_ANNUAL_KRW * WARN_RATIO)) {
    warned = true;
    console.warn(
      `[issuance] 자체 한도의 ${Math.round(WARN_RATIO * 100)}% 를 넘었어요 — ` +
        `미상환 ${Math.round(outWon).toLocaleString()}원 / 연간 ${Math.round(annWon).toLocaleString()}원`,
    );
  }

  if (outWon > CAP_OUTSTANDING_KRW) return { ok: false, error: 'cap-outstanding' };
  if (annWon > CAP_ANNUAL_KRW) return { ok: false, error: 'cap-annual' };
  return { ok: true };
}

/** 운영자가 보는 현황 — 규제선까지 얼마나 남았나 */
export function report(outstanding, annual) {
  const outWon = outstanding * CREDIT_WON;
  const annWon = annual * CREDIT_WON;
  return {
    creditWon: CREDIT_WON,
    outstanding: { credits: outstanding, krw: outWon, cap: CAP_OUTSTANDING_KRW, legal: REG_OUTSTANDING_KRW },
    annual: { credits: annual, krw: annWon, cap: CAP_ANNUAL_KRW, legal: REG_ANNUAL_KRW },
    // 규제선 대비 몇 %인지. 이 값이 커지기 시작하면 등록 준비를 시작해야 한다.
    legalUsage: {
      outstanding: outWon / REG_OUTSTANDING_KRW,
      annual: annWon / REG_ANNUAL_KRW,
    },
  };
}
