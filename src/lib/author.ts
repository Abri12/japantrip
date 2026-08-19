/**
 * 이 기기의 작성자 id.
 *
 * ## 계정을 만들지 않는다
 *
 * 이 앱은 「회원가입이 없다」를 지켜 왔다. 리뷰를 쓰려고 로그인시키면 그게
 * 무너진다. 대신 처음 실행될 때 **임의의 값**을 하나 만들어 두고, 그걸로
 * 「내가 쓴 리뷰」를 가린다.
 *
 * 하는 일은 둘뿐이다 — 내 리뷰를 지울 수 있게 하고, 같은 장소에 두 번 쓰지
 * 못하게 한다. 이 값으로 사람을 알아내거나 다른 서비스의 기록과 이을 수는
 * 없다. 광고 식별자나 기기 고유 식별자(IMEI·MAC)를 쓰지 않는 이유가 그것이다.
 *
 * 앱을 지우면 사라진다. 그러면 예전에 쓴 리뷰는 남지만 내 것으로 표시되지
 * 않고 지울 수도 없다 — 계정이 없는 구조의 대가다. 로그인을 만들지 않는 쪽이
 * 이 앱에는 더 맞는 선택이라고 봤다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'authorId:v1';

let cached: string | null = null;

/** 32자 임의 문자열. 예측할 수 없으면 충분하다 */
function makeId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function authorId(): Promise<string> {
  if (cached) return cached;
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (saved) {
      cached = saved;
      return saved;
    }
  } catch {
    // 저장소를 못 읽었다 — 새로 만든다
  }
  const made = makeId();
  cached = made;
  AsyncStorage.setItem(KEY, made).catch(() => {});
  return made;
}
