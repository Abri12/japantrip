/**
 * 지진 푸시 알림 등록.
 *
 * ## 왜 서버가 필요한가
 *
 * 앱이 켜져 있을 때만 지진을 아는 구조로는 긴급지진속보가 쓸모없다 —
 * 흔들림 도달까지 수 초~수십 초가 전부다. 그리고 P2PQuake WebSocket 은
 * **IP당 동시 2연결**이라 기기마다 붙을 수도 없다. 서버가 연결 하나를 들고
 * 상주하다가 대상자에게만 밀어 준다. (server/quake-watch.mjs)
 *
 * ## 서버에 보내는 것
 *
 * **푸시 토큰과 체류 도도부현, 그리고 알림 받을 진도** 셋뿐이다. 좌표도,
 * 이동 이력도, 계정도 보내지 않는다 — 「어느 현에 있는가」만 알면 대상자를
 * 고를 수 있고, 그 이상은 알 이유가 없다. 도도부현은 사용자가 고른 도시에서
 * 그대로 나오는 값이라 위치 권한도 필요 없다.
 *
 * ## 언제 다시 보내나
 *
 * 도시를 바꾸면 체류 현이 바뀐다. 그때 다시 등록하지 않으면 오사카로 옮긴
 * 사람에게 홋카이도 지진이 간다. 그래서 도시가 바뀔 때마다 같은 토큰으로
 * 다시 보내고, 서버는 덮어쓴다.
 *
 * ## 웹에서는 아무 일도 하지 않는다
 *
 * Expo 푸시는 네이티브 빌드에서만 동작한다. 웹으로 열었을 때 권한 요청을
 * 띄우면 아무 소용도 없이 사용자만 놀란다. 조용히 건너뛴다.
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiUrl } from '@/lib/api';

/**
 * 알림을 받을 최소 진도.
 *
 * 40 = 진도 4. 「실내에서 확실히 느끼고 물건이 흔들리는」 수준이다. 그 아래는
 * 알림을 받아도 할 일이 없고, 일본에는 사람이 못 느끼는 지진이 하루에도
 * 여러 번 있어서 다 보내면 사용자가 알림을 통째로 꺼 버린다. 그러면 정작
 * 위험할 때도 못 받는다.
 */
const DEFAULT_MIN_SCALE = 40;

/** 지금 등록된 토큰. 도시가 바뀌어 다시 등록할 때 재사용한다 */
let cachedToken: string | null = null;

/**
 * 안드로이드는 채널을 미리 만들어 둬야 소리·중요도가 먹는다.
 *
 * 둘로 나누는 이유가 있다. 긴급지진속보는 자고 있어도 깨워야 하고, 지난
 * 지진 정보는 그럴 필요가 없다. 한 채널로 묶으면 사용자가 EEW 를 끄려다
 * 전부 끄거나, 반대로 일반 지진 때문에 새벽에 깬다.
 */
async function ensureChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('eew', {
    name: '긴급지진속보',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    enableVibrate: true,
    bypassDnd: true,
  });

  await Notifications.setNotificationChannelAsync('quake', {
    name: '지진 정보',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

/**
 * 푸시 토큰을 받아 서버에 등록한다.
 *
 * 실패해도 던지지 않는다 — 알림이 안 켜지는 것과 앱이 안 열리는 것은 전혀
 * 다른 문제다. 호출부는 결과를 무시해도 된다.
 *
 * @param prefecture 체류 도도부현 (`City.prefecture`)
 * @returns 등록에 성공했는지
 */
export async function registerQuakePush(prefecture: string): Promise<boolean> {
  // 서버가 없으면 보낼 곳이 없다. 권한도 묻지 않는다.
  if (!apiUrl('/api/push/register')) return false;

  // 웹은 Expo 푸시 대상이 아니고, 시뮬레이터는 토큰이 안 나온다.
  if (Platform.OS === 'web' || !Device.isDevice) return false;

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    /*
     * 이미 거절한 사람에게 다시 묻지 않는다.
     *
     * `canAskAgain` 이 false 면 시스템이 더 이상 창을 띄우지 않는다. 그걸
     * 무시하고 요청하면 조용히 실패할 뿐이라, 여기서 끊고 나간다.
     */
    if (status !== 'granted') {
      if (!existing.canAskAgain) return false;
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return false;

    await ensureChannels();

    if (!cachedToken) {
      const { data } = await Notifications.getExpoPushTokenAsync();
      cachedToken = data;
    }

    const res = await fetch(apiUrl('/api/push/register')!, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: cachedToken,
        pref: prefecture,
        minScale: DEFAULT_MIN_SCALE,
      }),
    });
    return res.ok;
  } catch {
    // 권한 거절·네트워크 장애·시뮬레이터 — 어느 쪽이든 알림만 없을 뿐이다
    return false;
  }
}

/** 알림을 끈다. 토큰을 명부에서 뺀다 */
export async function unregisterQuakePush(): Promise<void> {
  const url = apiUrl('/api/push/unregister');
  if (!url || !cachedToken) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: cachedToken }),
    });
  } catch {
    // 실패해도 다음 등록 때 덮어써지므로 조용히 넘어간다
  }
}
