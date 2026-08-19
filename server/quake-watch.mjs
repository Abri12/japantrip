/**
 * 지진 감시 — WebSocket 하나로 받아서 대상자에게만 보낸다.
 *
 * ## 왜 앱이 직접 못 하나
 *
 * P2PQuake WebSocket 은 **IP당 동시 2연결** 제한이 있다. 사용자마다 붙을 수
 * 없다. 폴링으로 바꾸면 이번엔 앱이 꺼져 있을 때 못 받는데, 긴급지진속보는
 * 흔들림 도달까지 수 초~수십 초가 전부라 **앱을 켜야만 아는 구조로는 존재
 * 이유가 없다.**
 *
 * 그래서 서버가 연결 하나를 들고 상주하다가, 사용자의 체류 도도부현과 맞는
 * 것만 골라 푸시로 밀어 준다.
 *
 * ## 무엇을 보내고 무엇을 안 보내나
 *
 * 일본에는 사람이 못 느끼는 지진까지 하루에도 여러 번 있다. 그걸 다 보내면
 * 사용자는 알림을 꺼 버리고, 그러면 정작 위험할 때도 못 받는다. 그래서 두 겹으로 건다.
 *
 * 1. **내가 있는 현에 해당하는 것만.** 규슈 지진을 도쿄 여행자에게 보내지 않는다.
 * 2. **사용자가 정한 진도 이상만.** 기본은 진도 4 — 「실내에서 확실히 느끼는」
 *    수준이다. 그 아래는 알림을 받아도 할 일이 없다.
 *
 * 긴급지진속보(EEW)는 예외다. 예상 진도가 기준에 닿으면 방해금지 모드를
 * 뚫는 알림으로 보낸다 — 자고 있어도 깨워야 하는 유일한 종류다.
 *
 * ## 중복을 막는다
 *
 * 같은 지진에 대해 P2PQuake 는 정보를 여러 번 갱신해 보낸다(진도 확정, 진원
 * 수정 등). 이벤트 id 를 기억해 두 번 보내지 않는다. 한 지진에 알림이 세 번
 * 오면 그것만으로 알림을 끄게 된다.
 */

import { send } from './push.mjs';
import { drop, targets } from './subscribers.mjs';

const WS_URL = 'wss://api.p2pquake.net/v2/ws';

/** 이미 알린 이벤트. 지진 하나에 알림이 여러 번 가지 않게 한다 */
const notified = new Set();

/** 진도(JMA 정수 표기) → 사람이 읽는 말 */
function scaleLabel(scale) {
  const map = {
    10: '진도 1',
    20: '진도 2',
    30: '진도 3',
    40: '진도 4',
    45: '진도 5약',
    50: '진도 5강',
    55: '진도 6약',
    60: '진도 6강',
    70: '진도 7',
  };
  return map[scale] ?? '진도 정보 없음';
}

/**
 * 도도부현 이름 비교.
 *
 * P2PQuake 는 「大阪府」처럼 접미사를 붙여 주는데, 데이터에 따라 붙기도 하고
 * 빠지기도 한다. 접미사를 떼고 견줘야 놓치지 않는다 — 여기서 어긋나면
 * 알림이 조용히 아무에게도 안 간다.
 */
function samePref(a, b) {
  const strip = (s) => (s ?? '').replace(/[都道府県]$/, '');
  return strip(a) === strip(b) && strip(a) !== '';
}

/** 지진정보(551) → 그 현의 최대 관측 진도 */
function observedScale(event, pref) {
  let max = null;
  for (const p of event.points ?? []) {
    if (!samePref(pref, p.pref)) continue;
    if (max === null || p.scale > max) max = p.scale;
  }
  return max;
}

/** 긴급지진속보(556) → 그 현의 예상 최대 진도 */
function forecastScale(event, pref) {
  let max = null;
  for (const a of event.areas ?? []) {
    if (!samePref(pref, a.pref)) continue;
    if (max === null || a.scaleTo > max) max = a.scaleTo;
  }
  return max;
}

async function dispatch(event) {
  const isEew = event.code === 556;
  const id = event.id ?? `${event.code}:${event.time}`;

  // EEW 는 갱신될 때마다 예상 진도가 올라갈 수 있어서, 같은 id 라도
  // 「경보로 승격」된 첫 순간은 보내야 한다. 그 외에는 한 번만 보낸다.
  const key = isEew ? `${id}:${event.cancelled ? 'x' : 'a'}` : id;
  if (notified.has(key)) return;
  notified.add(key);
  // 무한히 쌓이지 않게 오래된 것부터 버린다
  if (notified.size > 500) notified.delete(notified.values().next().value);

  if (isEew && event.cancelled) return; // 취소 전문은 알리지 않는다

  const scaleFor = (pref) => (isEew ? forecastScale(event, pref) : observedScale(event, pref));
  const list = await targets(scaleFor);
  if (list.length === 0) return;

  const place = event.earthquake?.hypocenter?.name ?? '진원 불명';
  const mag = event.earthquake?.hypocenter?.magnitude;

  const messages = list.map(({ token, scale }) => ({
    to: token,
    title: isEew
      ? `긴급지진속보 · 예상 ${scaleLabel(scale)}`
      : `지진 · ${scaleLabel(scale)}`,
    body: isEew
      ? `${place} · 곧 흔들려요. 머리를 보호하고 탁자 아래로 들어가세요.`
      : `${place}${typeof mag === 'number' ? ` · M${mag}` : ''} 지진이 있었어요.`,
    data: { code: event.code, id, scale },
    critical: isEew,
  }));

  const dead = await send(messages);
  if (dead.length) await drop(dead);

  console.log(
    `[quake] ${isEew ? 'EEW' : '지진'} ${place} → ${messages.length}명 발송` +
      (dead.length ? ` (죽은 토큰 ${dead.length})` : ''),
  );
}

/**
 * 감시를 시작한다. 끊기면 다시 붙는다.
 *
 * 재연결 간격을 점점 늘린다(1s → 최대 60s). 서버가 잠깐 죽었을 때 몰려가
 * 상황을 더 나쁘게 만들지 않기 위해서다.
 */
export function watchQuakes() {
  let delay = 1000;
  let ws = null;
  let stopped = false;

  const connect = () => {
    if (stopped) return;

    ws = new WebSocket(WS_URL);

    ws.addEventListener('open', () => {
      delay = 1000;
      console.log('[quake] 감시 연결됨');
    });

    ws.addEventListener('message', (ev) => {
      try {
        const event = JSON.parse(ev.data);
        if (event.code === 551 || event.code === 556) {
          dispatch(event).catch((err) => console.warn('[quake] 발송 중 오류:', err.message));
        }
      } catch {
        // 형식이 다른 전문 — 무시한다
      }
    });

    /*
     * 재연결은 **한 번만** 예약한다.
     *
     * 예전에는 error 핸들러가 `ws.close()` 를 불렀는데, 연결 자체가 실패한
     * 소켓에서는 그 close 가 다시 error 를 일으킨다. 서로를 부르며 스택이
     * 쌓여 `Maximum call stack size exceeded` 로 **프로세스가 죽었다.**
     * 지진 감시가 죽는 것으로 끝나지 않고 서버 전체가 내려간다 — 환율도
     * 날씨도 같이 멈춘다.
     *
     * 연결이 끊기면 close 와 error 가 둘 다 오는 경우가 흔하므로, 이 소켓에
     * 대해 이미 예약했는지를 기억해 두 번 잡지 않는다. close 를 우리가 다시
     * 부를 필요도 없다 — 실패한 소켓은 이미 닫혀 있다.
     */
    let scheduled = false;
    const retry = () => {
      if (stopped || scheduled) return;
      scheduled = true;
      console.warn(`[quake] 연결 끊김 — ${delay / 1000}초 뒤 재시도`);
      setTimeout(connect, delay);
      delay = Math.min(delay * 2, 60_000);
    };

    ws.addEventListener('close', retry);
    ws.addEventListener('error', retry);
  };

  connect();

  return () => {
    stopped = true;
    ws?.close();
  };
}
