/**
 * 막차 — 틀리면 밤에 역 앞에 남는다.
 *
 * 이 계산이 기기 시간이 아니라 **일본 시간**을 봐야 하는 이유가 있다.
 * 한국 로밍이면 폰이 KST 로 남아 있을 수 있는데, 둘 다 UTC+9 라 우연히
 * 같아서 버그가 있어도 한국·일본에서는 안 드러난다. 경유지에서 앱을 열면
 * 그때 드러나고, 그때는 이미 늦었다.
 */

import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { lastTrainState } from '@/lib/last-train';

const at = (hhmm: string) => new Date(`2026-08-20T${hhmm}:00+09:00`);
const LAST = { time: '23:00', confidence: 'confirmed' as const };

describe('남은 시간', () => {
  it('여유가 있으면 normal', () => {
    const s = lastTrainState(LAST, at('18:00'));
    strictEqual(s.status, 'normal');
    strictEqual(s.minutesLeft, 300);
  });

  it('두 시간 안으로 들어오면 soon', () => {
    strictEqual(lastTrainState(LAST, at('21:00')).status, 'soon');
    strictEqual(lastTrainState(LAST, at('20:59')).status, 'normal');
  });

  it('막차 시각 정각은 아직 soon — 놓쳤다고 말하지 않는다', () => {
    const s = lastTrainState(LAST, at('23:00'));
    strictEqual(s.status, 'soon');
    strictEqual(s.minutesLeft, 0);
  });

  it('지나면 gone 이고 남은 시간이 음수다', () => {
    const s = lastTrainState(LAST, at('23:30'));
    strictEqual(s.status, 'gone');
    strictEqual(s.minutesLeft, -30);
  });
});

describe('시각은 일본 기준', () => {
  it('폰 시간대가 달라도 같은 답', () => {
    const moment = [
      at('21:30'),
      new Date('2026-08-20T12:30:00Z'),
      new Date('2026-08-20T07:30:00-05:00'),
    ];
    const results = moment.map((d) => lastTrainState(LAST, d));
    for (const r of results) {
      strictEqual(r.status, results[0].status);
      strictEqual(r.minutesLeft, results[0].minutesLeft);
    }
  });

  it('날짜가 넘어가는 시간대에서도 일본 날짜로 센다', () => {
    /* 뉴욕이 아직 8/19 저녁일 때 일본은 8/20 오전이다. 기기 날짜를 쓰면
       계산이 하루 어긋난다. */
    const newYorkStillYesterday = new Date('2026-08-19T21:00:00-04:00'); // JST 8/20 10:00
    strictEqual(lastTrainState(LAST, newYorkStillYesterday).minutesLeft, 13 * 60);
  });
});

describe('막차가 새벽인 노선', () => {
  it('00:30 막차는 그날 낮에 이미 지난 것으로 나온다', () => {
    /*
     * ⚠ 알려진 한계다. 이 함수는 「같은 날의 분」끼리만 빼서, 자정을 넘는
     * 막차(00:30)를 낮 시간과 비교하면 음수가 된다.
     *
     * 지금 데이터에는 그런 값이 없어서(전부 22~23시대) 드러나지 않는다.
     * 새벽 막차를 넣게 되면 여기가 먼저 깨지도록 시험으로 박아 둔다 —
     * 그때 이 시험이 실패하면 함수를 고치라는 뜻이다.
     */
    const midnight = { time: '00:30', confidence: 'confirmed' as const };
    strictEqual(lastTrainState(midnight, at('14:00')).status, 'gone');
  });
});
