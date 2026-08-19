/**
 * Expo 푸시 발송.
 *
 * Expo 가 APNs(애플)·FCM(구글) 앞에 서 주는 덕에 인증서를 직접 다루지 않는다.
 * 우리는 `ExponentPushToken[...]` 형태의 토큰에 JSON 을 던지면 된다.
 *
 * ## 지키는 것
 *
 * **100건씩 끊어 보낸다.** Expo 가 한 요청에 받는 상한이다. 사용자가 늘어도
 * 코드가 안 바뀌게 처음부터 나눠 보낸다.
 *
 * **죽은 토큰은 즉시 지운다.** 앱을 지운 기기의 토큰은 영원히 실패한다.
 * 그대로 두면 발송 한도만 쓰고, 명부가 실제 사용자 수를 말해주지 못한다.
 *
 * **실패해도 서버를 죽이지 않는다.** 푸시가 안 나가는 것보다 지진 감시가
 * 멈추는 게 훨씬 나쁘다.
 */

const ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const CHUNK = 100;

/**
 * @param {{to: string, title: string, body: string, data?: object, critical?: boolean}[]} messages
 * @returns {Promise<string[]>} 죽은 토큰
 */
export async function send(messages) {
  /** @type {string[]} */
  const dead = [];

  for (let i = 0; i < messages.length; i += CHUNK) {
    const batch = messages.slice(i, i + CHUNK);

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify(
          batch.map((m) => ({
            to: m.to,
            title: m.title,
            body: m.body,
            data: m.data,
            sound: 'default',
            /*
             * 긴급지진속보는 방해금지 모드를 뚫어야 한다.
             *
             * 흔들림 도달까지 수 초~수십 초가 전부라, 자는 사이에 조용히
             * 쌓이는 알림은 아무 쓸모가 없다. 반대로 이걸 모든 지진에 쓰면
             * 사용자가 알림을 통째로 꺼 버리므로, 진짜 급한 것에만 쓴다.
             */
            priority: m.critical ? 'high' : 'default',
            channelId: m.critical ? 'eew' : 'quake',
            ...(m.critical ? { interruptionLevel: 'critical' } : {}),
          })),
        ),
      });

      const json = await res.json();
      const tickets = json?.data ?? [];

      tickets.forEach((t, idx) => {
        if (t?.status !== 'error') return;
        const code = t?.details?.error;
        if (code === 'DeviceNotRegistered') dead.push(batch[idx].to);
        else console.warn('[push] 발송 오류:', code ?? t?.message);
      });
    } catch (err) {
      console.warn('[push] 발송 실패:', err.message);
    }
  }

  return dead;
}
