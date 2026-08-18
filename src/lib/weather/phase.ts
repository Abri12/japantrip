export type DayPhase = 'day' | 'night';

/** "2026-08-17T18:44" → 1124 (그날 0시부터의 분) */
function minutesOfDay(iso: string): number | null {
  const h = Number(iso.slice(11, 13));
  const m = Number(iso.slice(14, 16));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function jstMinutesNow(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  const [h, m] = parts.split(':').map(Number);
  return h * 60 + m;
}

export function dayPhase(sunrise: string, sunset: string, now: Date = new Date()): DayPhase {
  const rise = minutesOfDay(sunrise);
  const set = minutesOfDay(sunset);
  // 일출·일몰을 못 받았으면 낮으로 둔다. 밤 조언은 「내일 대비」로 시제를
  // 바꾸는 것이라, 근거 없이 그쪽으로 넘기면 낮에 오늘 정보가 사라진다.
  if (rise === null || set === null) return 'day';

  const nowMin = jstMinutesNow(now);
  return nowMin >= rise && nowMin < set ? 'day' : 'night';
}

