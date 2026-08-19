/**
 * 우리 서버 주소 — 있으면 서버, 없으면 공개 API 직통.
 *
 * ## 왜 「있으면」인가
 *
 * 서버를 붙이는 이유는 분명하다(server/index.mjs 머리말). 하지만 서버가
 * **없어도 앱은 그대로 동작해야 한다.** 두 가지 이유가 있다.
 *
 * 하나는 개발이다. 서버를 띄우지 않고 앱만 열어도 날씨·지진이 나와야 한다.
 * 다른 하나는 장애다. 서버가 죽었다고 날씨 화면이 통째로 비면, 사용자에게는
 * 앱이 고장난 것이지 서버가 죽은 게 아니다. 여행 중에 그건 치명적이다.
 *
 * 그래서 모든 호출부가 같은 모양을 지킨다 — **서버를 먼저 부르고, 실패하면
 * 공개 API 로 떨어진다.** 서버는 성능과 한도를 위한 것이지 기능의 전제가
 * 아니다.
 *
 * ## 키는 여기 없다
 *
 * `EXPO_PUBLIC_` 이 붙은 값은 앱 번들에 그대로 들어간다. 그러니 여기 두는 건
 * 공개해도 되는 **주소**뿐이다. API 키는 서버 환경변수로만 존재한다.
 */

const BASE = process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, '');

/** 서버를 쓰도록 설정돼 있는지. 화면이 분기할 일은 없고 진단용이다 */
export const hasServer = !!BASE;

/**
 * 서버 엔드포인트 주소. 서버가 설정 안 됐으면 null.
 *
 * @param path `/api/weather` 처럼 앞에 슬래시를 붙인 경로
 */
export function apiUrl(path: string, params?: Record<string, string | number>): string | null {
  if (!BASE) return null;
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v));
  return url.toString();
}

/**
 * 서버에서 JSON 을 받아 본다. 서버가 없거나 실패하면 null.
 *
 * **던지지 않는다.** 호출부는 null 을 받으면 공개 API 로 넘어가면 된다 —
 * try/catch 를 호출부마다 다시 쓰게 하면 어딘가는 빠뜨린다.
 */
export async function fromServer<T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T | null> {
  const url = apiUrl(path, params);
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
