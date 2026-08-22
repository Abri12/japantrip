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
 * ## 안드로이드는 FCM 을 거친다
 *
 * Expo 푸시 서버는 안드로이드로 직접 못 보낸다 — 구글의 FCM 이 유일한 통로다.
 * 그래서 **설정이 두 군데** 필요하고, 둘 중 하나만 빠져도 알림이 통째로 안 온다.
 *
 * | 무엇 | 어디 | 없으면 |
 * |---|---|---|
 * | `google-services.json` | 저장소 루트 (app.json 이 가리킨다) | 빌드가 실패한다 |
 * | FCM V1 서비스 계정 키 | EAS credentials (저장소 아님) | 빌드는 되고 **알림만 안 온다** |
 *
 * 아래쪽이 위험한 쪽이다. 빌드도 되고 심사도 통과하고 설치도 되는데 알림만
 * 안 온다 — 지진이 나야 알게 된다. 절차는 `docs/ANDROID-RELEASE.md` 에 있다.
 *
 * ## 웹에서는 아무 일도 하지 않는다
 *
 * Expo 푸시는 네이티브 빌드에서만 동작한다. 웹으로 열었을 때 권한 요청을
 * 띄우면 아무 소용도 없이 사용자만 놀란다. 조용히 건너뛴다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
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

/** 사용자가 알림을 켰는가. 기본은 꺼짐 */
const ON_KEY = 'quakePush:v1';

/**
 * 마지막으로 등록한 토큰.
 *
 * **끄기 위해서 남긴다.** 명부에서 빼려면 토큰을 알아야 하는데, 앱을 껐다
 * 켜면 위의 `cachedToken` 은 비어 있다. 그때 끄기를 누르면 보낼 것이 없어서
 * **아무 일도 안 일어나고**, 서버 명부에는 토큰이 그대로 남는다.
 *
 * 화면에는 꺼진 것으로 보이는데 서버는 계속 보낸다 — 기기가 조용히 버릴 뿐이다.
 */
const TOKEN_KEY = 'quakePushToken:v1';

async function readFlag(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function writeFlag(key: string, value: string | null) {
  try {
    if (value === null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, value);
  } catch {
    // 저장에 실패해도 이번 실행 동안은 동작한다. 다음 실행에 다시 물어볼 뿐이다
  }
}

/** 사용자가 지진 알림을 켜 뒀는가 */
export async function isQuakePushOn(): Promise<boolean> {
  return (await readFlag(ON_KEY)) === '1';
}

/**
 * EAS 프로젝트 id.
 *
 * `getExpoPushTokenAsync()` 를 **인자 없이 부르면 릴리스 빌드에서 던진다.**
 * 개발 중에는 개발 서버가 이 값을 알려 주기 때문에 인자 없이도 되는데,
 * 스토어에 올라간 앱에는 그 서버가 없다. 그래서 개발자에게만 잘 돌고
 * 사용자에게만 안 도는, 가장 늦게 발견되는 종류의 고장이 된다.
 *
 * 실제로 이 앱이 그 상태였다. 아래 try 가 모든 것을 삼켜 false 로 바꾸므로
 * 화면에는 아무 일도 안 일어난 것처럼 보인다 — 지진 알림이 통째로 죽어
 * 있는데 아무도 모른다.
 *
 * 두 자리를 다 본다. `extra.eas.projectId` 는 `eas init` 이 app.json 에
 * 적어 주는 값이고, `easConfig` 는 EAS 빌드가 런타임에 넣어 주는 값이다.
 */
function easProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
}

/** 설정이 빠졌다는 경고는 한 번만 낸다 — 도시를 바꿀 때마다 다시 부른다 */
let warnedNoProject = false;

function warnMissingProjectId() {
  if (warnedNoProject) return;
  warnedNoProject = true;
  console.warn(
    '[push] EAS 프로젝트 id 가 없어서 지진 알림을 켤 수 없어요.\n' +
      '  릴리스 빌드에서는 이 값 없이 푸시 토큰을 받지 못해요 — 알림만 조용히 안 옵니다.\n' +
      '  `npx eas init` 을 돌리면 app.json 의 extra.eas.projectId 에 적힙니다.',
  );
}

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

  /*
   * 설정을 **권한보다 먼저** 본다.
   *
   * 순서가 뜻을 가진다. 뒤에서 보면 사용자에게 알림 권한을 묻고, 허락을
   * 받고 나서, 우리 쪽 설정이 없어서 실패한다. 사용자는 허락해 줬는데
   * 알림이 안 오는 상태가 되고 — 그건 우리가 만든 문제다.
   */
  const projectId = easProjectId();
  if (!projectId) {
    warnMissingProjectId();
    return false;
  }

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
      const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
      cachedToken = data;
      await writeFlag(TOKEN_KEY, data);
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

/**
 * 알림을 끈다. 토큰을 명부에서 뺀다.
 *
 * 기억에 없으면 **저장해 둔 토큰**을 꺼내 쓴다. 앱을 껐다 켠 뒤에 끄는 것이
 * 오히려 흔한 경우라, 여기서 포기하면 끄기가 대부분 실패한다.
 */
export async function unregisterQuakePush(): Promise<void> {
  const url = apiUrl('/api/push/unregister');
  const token = cachedToken ?? (await readFlag(TOKEN_KEY));
  if (!url || !token) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {
    // 실패해도 다음 등록 때 덮어써지므로 조용히 넘어간다
  }
}

/**
 * 사용자가 스위치를 켰다.
 *
 * 권한 창은 **여기서만** 뜬다. 도시를 고르다가 갑자기 뜨지 않는다 —
 * 사용자가 알림을 켜겠다고 누른 그 순간이 묻기에 맞는 자리다.
 *
 * @returns 실제로 켜졌는가. 권한을 거절했거나 서버가 없으면 false
 */
export async function turnOnQuakePush(prefecture: string): Promise<boolean> {
  const ok = await registerQuakePush(prefecture);
  if (ok) await writeFlag(ON_KEY, '1');
  return ok;
}

/** 사용자가 스위치를 껐다 */
export async function turnOffQuakePush(): Promise<void> {
  await unregisterQuakePush();
  await writeFlag(ON_KEY, null);
  await writeFlag(TOKEN_KEY, null);
  cachedToken = null;
}

/**
 * 도시가 바뀌었다 — **켜 둔 사람에게만** 다시 등록한다.
 *
 * 서버는 체류 도도부현으로 대상자를 고른다. 갱신하지 않으면 오사카로 옮긴
 * 사람에게 홋카이도 지진이 간다.
 *
 * 꺼 둔 사람에게는 아무 일도 하지 않는다. 예전에는 도시를 고르는 것만으로
 * 권한 창이 떴는데, 사용자는 왜 뜨는지 모른 채 창을 만났다.
 */
export async function refreshQuakePush(prefecture: string): Promise<void> {
  if (!(await isQuakePushOn())) return;
  await registerQuakePush(prefecture);
}
