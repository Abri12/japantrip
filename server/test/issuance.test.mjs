/**
 * 발행 한도 — 규제선을 넘기 전에 스스로 멈추는 장치.
 *
 * 이 값들이 틀리면 알아채는 방법이 없다. 한도는 평상시에 **한 번도 걸리지
 * 않는** 것이 정상이라, 잘못 계산돼 있어도 아무 증상이 안 나온다. 그러다
 * 정작 사고가 났을 때 안 막힌다.
 *
 * 환경변수로 한도를 바꿀 수 있으므로, 기본값이 아니라 **바꾼 값이 실제로
 * 먹는지**까지 본다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

/* 계산을 눈으로 따라갈 수 있는 값으로 바꿔 둔다.
   크레딧 1점 = 10원, 미상환 한도 1,000원(=100점), 연간 2,000원(=200점). */
process.env.CREDIT_WON = '10';
process.env.CAP_OUTSTANDING_KRW = '1000';
process.env.CAP_ANNUAL_KRW = '2000';

const { CREDIT_WON, REG_ANNUAL_KRW, REG_OUTSTANDING_KRW, checkIssuance, report } = await import(
  '../issuance.mjs'
);

describe('checkIssuance', () => {
  it('한도 안이면 통과한다', () => {
    strictEqual(checkIssuance(50, 50, 10).ok, true);
  });

  it('한도에 정확히 닿는 것은 통과한다', () => {
    // 90 + 10 = 100점 = 1,000원 = 한도. 넘은 게 아니라 닿은 것이다.
    strictEqual(checkIssuance(90, 90, 10).ok, true);
  });

  it('미상환 한도를 넘으면 막는다', () => {
    const res = checkIssuance(100, 0, 1);
    strictEqual(res.ok, false);
    strictEqual(res.error, 'cap-outstanding');
  });

  it('연간 한도를 넘으면 막는다', () => {
    // 미상환은 여유가 있는데 연간만 넘는 경우 — 많이 주고 많이 쓴 해다
    const res = checkIssuance(0, 200, 1);
    strictEqual(res.ok, false);
    strictEqual(res.error, 'cap-annual');
  });

  it('이번에 줄 양까지 더해서 본다 — 준 뒤에 넘는 것도 막아야 한다', () => {
    strictEqual(checkIssuance(95, 0, 4).ok, true);
    strictEqual(checkIssuance(95, 0, 6).ok, false);
  });
});

describe('자체 한도와 규제선의 관계', () => {
  it('자체 한도는 규제선보다 한참 낮다', () => {
    const r = report(0, 0);
    ok(r.outstanding.cap < REG_OUTSTANDING_KRW);
    ok(r.annual.cap < REG_ANNUAL_KRW);
  });

  it('report 는 규제선 대비 비율을 준다 — 등록 준비 시점을 보는 값이다', () => {
    const r = report(100, 200);
    strictEqual(r.creditWon, CREDIT_WON);
    strictEqual(r.outstanding.krw, 1000);
    strictEqual(r.annual.krw, 2000);
    strictEqual(r.legalUsage.outstanding, 1000 / REG_OUTSTANDING_KRW);
    strictEqual(r.legalUsage.annual, 2000 / REG_ANNUAL_KRW);
  });

  it('규제선 값은 법이 정한 그대로다', () => {
    // 이 둘이 바뀌면 등록 면제 판단이 통째로 달라진다. 상수를 고정해 둔다.
    strictEqual(REG_OUTSTANDING_KRW, 3_000_000_000);
    strictEqual(REG_ANNUAL_KRW, 50_000_000_000);
  });
});
