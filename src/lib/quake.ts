/**
 * P2P지진정보 JSON API v2 클라이언트.
 *
 * 무료 · 등록 불필요 · 상업 이용 허용. 원본은 기상청(JMA) 발표를 중계한다.
 * 레이트 리밋: /history 60회/분 (IP당). 앱에서 직접 부르므로 폴링 주기를 넉넉히 잡는다.
 *
 * 스펙: https://www.p2pquake.net/develop/json_api_v2/
 */

import { fromServer } from '@/lib/api';

const BASE = 'https://api.p2pquake.net/v2';

/**
 * 직통 경로(`/history?codes=...&limit=...`)를 서버 파라미터로 옮긴다.
 *
 * 서버는 지진정보와 긴급속보를 한 번에 받아 캐시하므로 codes 를 따로 받지
 * 않는다 — 두 종류를 각각 캐시하면 같은 호출이 두 배가 된다. limit 만 넘기고
 * 종류 구분은 받은 쪽에서 한다.
 */
function quakeParams(path: string): { limit: number } {
  const limit = Number(new URLSearchParams(path.split('?')[1] ?? '').get('limit') ?? 20);
  return { limit: Number.isFinite(limit) ? limit : 20 };
}

/** 정보 코드. 스펙의 codes 파라미터 값이다. */
export const Code = {
  /** 지진정보 (발생 후 확정 정보) */
  QUAKE: 551,
  /** 쓰나미 예보 */
  TSUNAMI: 552,
  /** 긴급지진속보(경보) — 흔들림 도달 전에 나온다 */
  EEW: 556,
} as const;

/**
 * 진도(震度) 값. JMA 진도계급을 10배한 정수이며 5·6은 약/강으로 갈린다.
 * -1은 진도 관측이 없는 경우다.
 */
export type Scale = -1 | 10 | 20 | 30 | 40 | 45 | 50 | 55 | 60 | 70;

export type DomesticTsunami =
  | 'None'
  | 'Unknown'
  | 'Checking'
  | 'NonEffective'
  | 'Watch'
  | 'Warning';

export interface Hypocenter {
  name: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
}

export interface QuakePoint {
  addr: string;
  pref: string;
  scale: Scale;
  isArea: boolean;
}

/** code 551 — 지진정보 */
export interface QuakeEvent {
  id: string;
  code: 551;
  time: string;
  earthquake: {
    time: string;
    hypocenter: Hypocenter;
    maxScale: Scale;
    domesticTsunami: DomesticTsunami;
    foreignTsunami: string;
  };
  points: QuakePoint[];
}

/** code 556 — 긴급지진속보(경보) */
export interface EewEvent {
  id: string;
  code: 556;
  time: string;
  cancelled: boolean;
  earthquake: {
    originTime: string;
    arrivalTime: string;
    condition: string;
    hypocenter: Hypocenter & { reduceName: string };
  };
  areas: {
    pref: string;
    name: string;
    scaleFrom: Scale;
    scaleTo: Scale;
    arrivalTime: string;
  }[];
}

/** 진도 → 한국어 표기. */
export function scaleLabel(scale: Scale | number): string {
  switch (scale) {
    case 10:
      return '진도 1';
    case 20:
      return '진도 2';
    case 30:
      return '진도 3';
    case 40:
      return '진도 4';
    case 45:
      return '진도 5약';
    case 50:
      return '진도 5강';
    case 55:
      return '진도 6약';
    case 60:
      return '진도 6강';
    case 70:
      return '진도 7';
    default:
      return '진도 정보 없음';
  }
}

/**
 * 진도별 대응 등급. 색상과 행동 지침을 여기서 한 번에 결정한다.
 *
 * 기준은 JMA 진도계급 해설이다. 진도 4까지는 놀랄 뿐 피해가 드물고,
 * 5약부터 가구가 움직이며, 6약부터 서 있기가 어렵다.
 */
export type Severity = 'none' | 'info' | 'caution' | 'warning' | 'danger';

export function severityOf(scale: Scale | number): Severity {
  if (scale < 0) return 'none';
  if (scale <= 20) return 'info';
  if (scale <= 40) return 'caution';
  if (scale <= 50) return 'warning';
  return 'danger';
}

export const SeverityColor: Record<Severity, string> = {
  none: '#8E8E93',
  info: '#34C759',
  caution: '#FFCC00',
  warning: '#FF9500',
  danger: '#FF3B30',
};

/**
 * 진도별 행동 지침.
 *
 * 급한 상황에서 읽는 문장이라 짧게, 그리고 해야 할 동작을 앞에 둔다.
 * 겁을 주지도 안심시키지도 않고 무엇을 하면 되는지만 말한다.
 */
export function actionGuide(scale: Scale | number): string {
  const s = severityOf(scale);
  switch (s) {
    case 'info':
      return '대부분 느끼지 못할 정도예요. 따로 하실 건 없어요.';
    case 'caution':
      return '실내에 계시면 흔들림이 느껴져요. 선반 위에 떨어질 만한 게 있는지만 봐주세요.';
    case 'warning':
      return '가구가 움직일 수 있어요. 머리를 감싸고 탁자 아래로 들어가세요. 엘리베이터는 타지 마세요.';
    case 'danger':
      return '서 있기 힘들고 건물이 상할 수 있어요. 먼저 머리를 보호하고, 흔들림이 멎으면 가까운 대피소로 이동하세요.';
    default:
      return '아직 진도가 확정되지 않았어요.';
  }
}

export function tsunamiLabel(t: DomesticTsunami): { text: string; alarming: boolean } {
  switch (t) {
    case 'Warning':
      return { text: '쓰나미 경보가 내렸어요', alarming: true };
    case 'Watch':
      return { text: '쓰나미 주의보가 내렸어요', alarming: true };
    case 'Checking':
      return { text: '쓰나미가 있을지 확인 중이에요', alarming: true };
    case 'NonEffective':
      return { text: '해수면이 조금 변하지만 피해 우려는 없어요', alarming: false };
    case 'None':
      return { text: '쓰나미 걱정은 없어요', alarming: false };
    default:
      return { text: '쓰나미 정보가 아직 없어요', alarming: false };
  }
}

/**
 * P2PQuake의 시각 문자열은 "2026/08/17 06:37:00" 형식의 일본 표준시(JST)다.
 * JS Date가 이 형식을 로컬 시간으로 오해하지 않도록 명시적으로 +09:00을 붙인다.
 */
export function parseJst(s: string): Date {
  const iso = s.replace(/\//g, '-').replace(' ', 'T');
  return new Date(`${iso}+09:00`);
}

/** "3분 전" 같은 상대 시각. 한국 사용자가 바로 읽을 수 있게 한다. */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (sec < 0) return '방금';
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Tokyo' });
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  /*
   * 서버가 있으면 서버를 먼저 본다.
   *
   * P2PQuake 는 **IP당 60회/분** 제한이 있다. 기기가 각자 60초마다 부르면
   * 평소엔 안 걸리지만, 공용 와이파이나 회사망처럼 IP 를 공유하는 곳에서
   * 여럿이 동시에 쓰면 한꺼번에 막힌다. 서버가 1분에 한 번 부르고 나눠 주면
   * 그 위험이 사라지고, 나중에 푸시 알림을 붙일 자리도 여기가 된다.
   *
   * 서버가 없거나 죽으면 예전처럼 직접 부른다.
   */
  const viaServer = await fromServer<T>('/api/quakes', quakeParams(path));
  if (viaServer !== null) return viaServer;

  const res = await fetch(`${BASE}${path}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`P2PQuake ${res.status}: ${path}`);
  }
  return (await res.json()) as T;
}

/** 최근 지진정보. limit 최대 100. */
export function fetchQuakes(limit = 20, signal?: AbortSignal): Promise<QuakeEvent[]> {
  return get<QuakeEvent[]>(`/history?codes=${Code.QUAKE}&limit=${limit}`, signal);
}

/** 최근 긴급지진속보(경보). 평상시에는 비어 있는 게 정상이다. */
export function fetchEew(limit = 5, signal?: AbortSignal): Promise<EewEvent[]> {
  return get<EewEvent[]>(`/history?codes=${Code.EEW}&limit=${limit}`, signal);
}

/**
 * 사용자가 있는 지역에 영향이 있었는지 판정한다.
 * points에는 관측점이 시정촌 단위로 들어오므로 도도부현(pref)으로 매칭한다.
 */
export function scaleInPrefecture(quake: QuakeEvent, pref: string): Scale | null {
  let max: Scale | null = null;
  for (const p of quake.points) {
    if (p.pref !== pref) continue;
    if (max === null || p.scale > max) max = p.scale;
  }
  return max;
}

/**
 * 두 도도부현 표기가 같은 곳을 가리키는지.
 *
 * 지진정보(551)의 `points[].pref` 는 「熊本県」처럼 완전한 이름으로 오는데,
 * 긴급지진속보(556)의 `areas[].pref` 는 「熊本」처럼 県을 뗀 형태로 온다.
 * 같은 곳인데 문자열이 달라서, 그대로 비교하면 내 지역 경보를 놓친다.
 */
export function samePrefecture(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

/**
 * 긴급지진속보가 이 도도부현에 해당하는지, 해당한다면 예상 최대진도는 얼마인지.
 *
 * 해당 없으면 null 이다. 「일본 어딘가에 경보가 떴다」와 「내가 있는 곳에 경보가
 * 떴다」는 완전히 다른 정보인데, 이걸 구분하지 않으면 규슈 지진에 도쿄 여행자가
 * 놀라게 된다. 반대로 진짜 위험할 때의 경고도 같이 무뎌진다.
 */
export function eewScaleForPrefecture(event: EewEvent, pref: string): Scale | null {
  let max: Scale | null = null;
  for (const area of event.areas) {
    if (!samePrefecture(pref, area.pref)) continue;
    if (max === null || area.scaleTo > max) max = area.scaleTo;
  }
  return max;
}
