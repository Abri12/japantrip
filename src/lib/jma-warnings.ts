/**
 * 기상청(JMA) 경보·주의보 — 태풍·호우·폭풍 등.
 *
 * 이 앱에 원래 있던 지진 정보(P2PQuake)만으로는 여름 일본 여행의 실제 위험을
 * 다 못 덮는다. 태풍이 오면 기상청은 "태풍 경보"라는 별도 항목이 아니라
 * **그 태풍이 몰고 오는 호우·폭풍·해일 경보**를 낸다 — 그래서 태풍 전용 API를
 * 새로 붙이는 대신, 이미 있는 경보·주의보 API로 같은 신호를 잡는다.
 * (태풍 전용 API(jma.go.jp/bosai/typhoon)는 문서화되지 않았고 이번에 확인한
 * 시점 기준 5월 이후 갱신이 없어 실시간성을 신뢰하기 어려웠다.)
 *
 * 엔드포인트: https://www.jma.go.jp/bosai/warning/data/warning/{지역코드}.json
 * 인증키 불필요. 코드 표는 여러 출처가 서로 다른 숫자를 대는 경우가 있어,
 * 실제로 받아온 데이터(오사카 지역 "21"=건조주의보)와 대조해 일치를 확인한
 * 표만 썼다.
 */

import { fromServer } from '@/lib/api';

export type WarningSeverity = 'advisory' | 'warning' | 'emergency';

interface WarningDef {
  label: string;
  severity: WarningSeverity;
}

/**
 * 코드 → 이름·심각도.
 *
 * 여행자에게 의미 있는 것 위주로 채웠다. 서리·착빙·눈사태처럼 여행 안전과
 * 거리가 먼 항목은 굳이 다 채우지 않았다 — 코드가 목록에 없으면
 * `unknownWarningLabel()` 이 원문 코드를 그대로 보여준다(추측해서 잘못
 * 이름 붙이는 것보다 낫다).
 */
const WARNING_DEFS: Record<string, WarningDef> = {
  '02': { label: '폭풍설 경보', severity: 'warning' },
  '03': { label: '호우 경보', severity: 'warning' },
  '04': { label: '홍수 경보', severity: 'warning' },
  '05': { label: '폭풍(강풍) 경보', severity: 'warning' },
  '06': { label: '대설 경보', severity: 'warning' },
  '07': { label: '파랑(높은 파도) 경보', severity: 'warning' },
  '08': { label: '고조(해일성 침수) 경보', severity: 'warning' },
  '09': { label: '산사태 경보', severity: 'warning' },
  '10': { label: '호우 주의보', severity: 'advisory' },
  '12': { label: '대설 주의보', severity: 'advisory' },
  '13': { label: '풍설 주의보', severity: 'advisory' },
  '14': { label: '낙뢰 주의보', severity: 'advisory' },
  '15': { label: '강풍 주의보', severity: 'advisory' },
  '16': { label: '파랑 주의보', severity: 'advisory' },
  '17': { label: '융설 주의보', severity: 'advisory' },
  '18': { label: '홍수 주의보', severity: 'advisory' },
  '19': { label: '고조 주의보', severity: 'advisory' },
  '20': { label: '짙은 안개 주의보', severity: 'advisory' },
  '21': { label: '건조 주의보', severity: 'advisory' },
  '22': { label: '눈사태 주의보', severity: 'advisory' },
  '23': { label: '저온 주의보', severity: 'advisory' },
  '29': { label: '산사태 주의보', severity: 'advisory' },
  32: { label: '폭풍설 특별경보', severity: 'emergency' },
  33: { label: '호우 특별경보', severity: 'emergency' },
  35: { label: '폭풍(강풍) 특별경보', severity: 'emergency' },
  36: { label: '대설 특별경보', severity: 'emergency' },
  37: { label: '파랑 특별경보', severity: 'emergency' },
  38: { label: '고조 특별경보', severity: 'emergency' },
  39: { label: '산사태 특별경보', severity: 'emergency' },
};

/** 여행 판단에 직결되는 항목만 홈 요약에 올린다. 나머지는 안전 탭 전체 목록에서만 보인다. */
const TRAVEL_CRITICAL_CODES = new Set(['02', '03', '05', '07', '08', '32', '33', '35', '37', '38']);

export interface ActiveWarning {
  code: string;
  label: string;
  severity: WarningSeverity;
}

/**
 * API가 실제로 주는 항목의 모양.
 *
 * `code` 가 없을 수 있다 — 발효 중인 특보가 없는 지역은
 * `{status: '発表警報・注意報はなし'}` 처럼 status 만 담아 보낸다.
 */
interface RawWarning {
  code?: string;
  status?: string;
}

export interface WarningReport {
  reportDatetime: Date;
  headlineText: string;
  active: ActiveWarning[];
}

/** 기상청 응답에서 우리가 읽는 부분만 */
interface JmaWarningResponse {
  reportDatetime?: string;
  headlineText?: string;
  areaTypes?: { areas?: { warnings?: RawWarning[] }[] }[];
}

function warningDef(code: string): WarningDef {
  return WARNING_DEFS[code] ?? { label: `기타 경보(코드 ${code})`, severity: 'advisory' };
}

export async function fetchWarnings(jmaAreaCode: string): Promise<WarningReport | null> {
  try {
    /*
     * 서버가 있으면 서버를 먼저 본다. 지역코드가 같으면 답도 같아서, 같은
     * 도시의 사용자 전부가 한 번의 호출을 나눠 쓴다. 기상청은 공식 이용 조건에
     * 과도한 접근을 자제하라고 적어 두었는데, 서버 캐시가 그 요구에 맞는
     * 접근 방식이기도 하다.
     */
    const viaServer = await fromServer<JmaWarningResponse>('/api/warning', {
      area: jmaAreaCode,
    });

    const data =
      viaServer ??
      (await (async () => {
        const res = await fetch(
          `https://www.jma.go.jp/bosai/warning/data/warning/${jmaAreaCode}.json`,
        );
        if (!res.ok) return null;
        return (await res.json()) as JmaWarningResponse;
      })());

    if (!data) return null;
    // areaTypes[0] 이 지역 전체 요약(우리가 조회한 코드 그 자체)이다.
    // 시정촌 단위 세분(areaTypes[1] 이후)까지는 여행자 요약에 필요 없다.
    const summary: RawWarning[] = data.areaTypes?.[0]?.areas?.[0]?.warnings ?? [];

    // 「해제」만 걸러내면 안 된다. 발효 중인 특보가 하나도 없는 지역은
    // code 없이 status 만 담긴 항목({status:'発表警報・注意報はなし'})을
    // 보내는데, 그걸 경보로 세면 "기타 경보(코드 undefined)"가 표시되고
    // React 도 key 가 undefined 라 경고를 낸다. 그래서 **code 가 있는 것만**
    // 실제 특보로 인정한다.
    const seen = new Set<string>();
    const active: ActiveWarning[] = summary
      .filter((w) => typeof w.code === 'string' && w.code.length > 0)
      .filter((w) => w.status !== '解除')
      // 같은 코드가 두 번 오면(발표+계속 등) 하나로 합친다. 화면에 같은 경보가
      // 두 줄로 나오는 것도, 목록 key 가 겹치는 것도 막아 준다.
      .filter((w) => {
        const code = w.code as string;
        if (seen.has(code)) return false;
        seen.add(code);
        return true;
      })
      .map((w) => {
        const def = warningDef(w.code as string);
        return { code: w.code as string, label: def.label, severity: def.severity };
      });

    return {
      // 서버 경유든 직통이든 같은 원본이라 형식은 같지만, 필드가 빠진
      // 응답이 와도 화면이 죽지 않게 없으면 지금 시각으로 둔다.
      reportDatetime: data.reportDatetime ? new Date(data.reportDatetime) : new Date(),
      headlineText: data.headlineText ?? '',
      active,
    };
  } catch {
    return null;
  }
}

/** 홈 화면 요약에 올릴 만큼 심각한 것만 고른다. */
export function travelCriticalWarnings(report: WarningReport): ActiveWarning[] {
  return report.active.filter((w) => TRAVEL_CRITICAL_CODES.has(w.code));
}

export function warningSeverityRank(w: ActiveWarning): number {
  return w.severity === 'emergency' ? 2 : w.severity === 'warning' ? 1 : 0;
}
