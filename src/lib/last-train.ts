/**
 * 막차까지 얼마나 남았는지 판정한다.
 *
 * 반드시 **일본 표준시(JST)** 기준으로 계산한다. 한국 여행자의 폰이 자동으로
 * 시간대를 바꾸면 한국시(KST)와 일본시(JST)는 둘 다 UTC+9라 우연히 같지만,
 * 로밍 설정에 따라 폰이 한국 시간을 그대로 유지하는 경우가 있어서 기기 로컬
 * 시간을 그대로 믿지 않는다.
 */
import { LastTrain } from '@/data/airports';

export type LastTrainStatus = 'normal' | 'soon' | 'gone';

export interface LastTrainState {
  status: LastTrainStatus;
  /** 막차까지 남은 분. gone 이면 음수 */
  minutesLeft: number;
}

const SOON_THRESHOLD_MIN = 120;

/** 지금 시각을 일본 표준시 "HH:MM"으로. */
function nowInJst(now: Date): { hh: number; mm: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const hh = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const mm = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return { hh, mm };
}

export function lastTrainState(lastTrain: LastTrain, now: Date = new Date()): LastTrainState {
  const [lastHh, lastMm] = lastTrain.time.split(':').map(Number);
  const { hh, mm } = nowInJst(now);

  const lastTotal = lastHh * 60 + lastMm;
  const nowTotal = hh * 60 + mm;
  const minutesLeft = lastTotal - nowTotal;

  if (minutesLeft < 0) return { status: 'gone', minutesLeft };
  if (minutesLeft <= SOON_THRESHOLD_MIN) return { status: 'soon', minutesLeft };
  return { status: 'normal', minutesLeft };
}
