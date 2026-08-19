/**
 * 「지금 열려 있나」 — 영업시간·정기휴일을 지금 시각과 대조한다.
 *
 * ## 확실한 것만 말한다
 *
 * `local.hours` 는 자유 문장이다 — 「대부분 오후 6시 전후로 닫아요」,
 * 「해 뜰 때 열고 해 질 때 닫아요」. 이런 걸 그럴듯하게 파싱해서 「지금
 * 영업 중」이라고 말하면, 틀렸을 때 사용자가 닫힌 문 앞에 서게 된다.
 * 확인하지 않은 값을 만들어내지 않는다는 이 앱의 규칙 그대로,
 * **판정이 확실한 패턴만 다루고 나머지는 침묵한다.** 침묵하면 화면은
 * 지금까지처럼 원문만 보여준다 — 없던 것이 없어질 뿐 틀리지는 않는다.
 *
 * 확실한 패턴 둘:
 *
 *  ① 시간 — `hours` 가 「9:30~14:30」처럼 **숫자 범위로 시작**할 때만.
 *     「목욕만 하면 6:00~23:00」처럼 조건이 앞에 붙은 건 그 조건을 우리가
 *     해석할 수 없으므로 건드리지 않는다.
 *  ② 요일 — `closed` 가 「일요일」·「월요일 (공휴일이면 열어요)」처럼
 *     **요일 나열로만** 되어 있을 때. 「일요일·수요일에 쉬는 가게가 많아요」
 *     같은 경향 서술은 특정 가게의 휴일이 아니라서 판정하지 않는다.
 *
 * ## 문구도 단정을 피한다
 *
 * 시간 안이어도 「영업 중」이 아니라 「영업시간이에요」라고 말한다. 우동집은
 * 면이 떨어지면 그전에 닫는다 — 시간표상 그렇다는 것까지만 우리가 아는
 * 사실이고, 그 단서(원문)는 바로 아래 줄에 그대로 보인다.
 *
 * ## 시각은 일본 기준
 *
 * 폰이 한국 시간대에 남아 있어도 가게는 일본 시간으로 연다.
 * (lib/last-train.ts 와 같은 이유·같은 방식)
 */

import { LocalCaveat } from '@/data/places';

export interface OpenStatus {
  kind: 'holiday' | 'closed' | 'closingSoon' | 'open';
  /** 뱃지에 들어갈 짧은 한 마디 */
  label: string;
  /** 한 줄 보충. 없으면 뱃지만 */
  detail?: string;
}

/** 지금 일본 시각 — 그날의 분(0~1439)과 요일(0=일) */
function nowInJst(now: Date): { minutes: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { minutes, weekday };
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * `closed` 문장에서 확실한 휴무 요일만 뽑는다.
 *
 * 「·」 나열의 각 토큰이 「X요일」로 시작할 때만 그 요일을 인정한다.
 * 토큰 뒤에 문장이 이어지면(「~에 쉬는 가게가 많아요」) 나열이 아니라
 * 서술이므로 전체를 버린다. 괄호 보충(「(공휴일이면 열어요)」)은 나열의
 * 끝에서만 허용한다 — 그 내용까지 해석하지는 않지만, 나열 자체는 유효하다.
 */
function closedWeekdays(closed: string): number[] {
  // 끝의 괄호 보충을 떼어낸다
  const core = closed.replace(/\s*\(.*\)\s*$/, '').trim();
  const tokens = core.split('·').map((t) => t.trim());

  const days: number[] = [];
  for (const token of tokens) {
    const m = token.match(/^([일월화수목금토])요일$/);
    if (m) {
      days.push(WEEKDAY_KO.indexOf(m[1]));
    } else if (token === '공휴일') {
      // 공휴일 여부는 우리가 모른다. 요일 판정에는 영향이 없으니 넘어간다.
      continue;
    } else {
      // 요일 나열이 아니라 서술이다 — 전체를 판정 불가로 본다
      return [];
    }
  }
  return days;
}

/** 「9:30~14:30 …」에서 맨 앞의 시간 범위만. 조건이 앞에 붙어 있으면 null */
function parseRange(hours: string): { open: number; close: number } | null {
  const m = hours.match(/^(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const open = Number(m[1]) * 60 + Number(m[2]);
  const close = Number(m[3]) * 60 + Number(m[4]);
  if (open >= 24 * 60 || close >= 24 * 60) return null;
  return { open, close };
}

const HHMM = (min: number) =>
  `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

/** 마감이 이 안으로 다가오면 「곧 닫아요」로 바꾼다 */
const CLOSING_SOON_MIN = 60;

export function openStatus(local: LocalCaveat, now: Date = new Date()): OpenStatus | null {
  const { minutes, weekday } = nowInJst(now);

  // ① 정기휴일이 먼저다 — 휴일이면 영업시간은 의미가 없다.
  if (local.closed && closedWeekdays(local.closed).includes(weekday)) {
    return {
      kind: 'holiday',
      label: '오늘은 정기휴일이에요',
      detail: '다른 날에 가시거나, 임시 영업 여부를 따로 확인해보세요.',
    };
  }

  if (!local.hours) return null;
  const range = parseRange(local.hours);
  if (!range) return null;

  const { open, close } = range;
  // 자정을 넘는 범위(20:00~02:00)는 지금 데이터에 파싱되는 예가 없지만,
  // 생기면 틀린 판정을 하느니 침묵한다.
  if (close <= open) return null;

  if (minutes < open) {
    return {
      kind: 'closed',
      label: '지금은 문 닫는 시간이에요',
      detail: `${HHMM(open)}에 열어요.`,
    };
  }
  if (minutes >= close) {
    return {
      kind: 'closed',
      label: '지금은 문 닫는 시간이에요',
      detail: `영업은 ${HHMM(close)}까지였어요. 내일 ${HHMM(open)}에 열어요.`,
    };
  }
  if (close - minutes <= CLOSING_SOON_MIN) {
    return {
      kind: 'closingSoon',
      label: `곧 닫아요 · ${HHMM(close)}까지`,
    };
  }
  return {
    kind: 'open',
    label: `지금 영업시간이에요 · ${HHMM(close)}까지`,
  };
}
