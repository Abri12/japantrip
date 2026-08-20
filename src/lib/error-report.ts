import { Platform } from 'react-native';

import { apiUrl } from './api';

/**
 * 앱이 죽었다는 사실을 밖으로 알린다.
 *
 * ## 왜 필요한가
 *
 * 지금까지 이 앱에는 「죽었다」를 아는 방법이 아예 없었다. 사용자 폰에서
 * 화면이 흰색이 돼도 그 사실이 여기까지 오지 않는다. 여행 중에 앱이 안
 * 열리는 사람이 있어도 우리는 모른 채로 지나간다.
 *
 * ## 무엇을 보내나 — 그리고 무엇을 안 보내나
 *
 * 오류 메시지 · 스택 · 어느 화면이었나 · 플랫폼 · 앱 버전. 그게 전부다.
 *
 * **기기 id 를 안 보낸다.** 리뷰·기여에 쓰는 그 id 를 여기 얹으면 「누가 어느
 * 화면에서 언제 무엇을 했나」가 서버에 쌓인다. 그건 오류 추적이 아니라 행동
 * 기록이고, 이 앱이 계속 안 하기로 해 온 바로 그것이다.
 *
 * 그 대가로 「이 사용자가 세 번 겪었다」는 알 수 없다. 「이 오류가 세 번
 * 일어났다」만 안다. 고치는 데는 그걸로 충분하다.
 *
 * 좌표·검색어·화면에 뜬 내용도 안 보낸다. 화면 이름(`/airport/fuk`)까지만이다.
 *
 * ## 던지지 않는다
 *
 * 오류를 보고하다 오류가 나면 그때부터는 정말로 아무것도 모르게 된다. 서버가
 * 없거나(설정 안 됨) 죽었거나 네트워크가 없어도 **조용히 포기한다.**
 */

/** 같은 오류를 짧은 시간에 여러 번 보내지 않기 위한 기억 */
const recentlySent = new Map<string, number>();
const DEDUP_MS = 60_000;

/** 한 번 실행하는 동안 보낼 수 있는 최대 건수 — 무한 루프가 서버를 때리지 않게 */
const MAX_PER_SESSION = 20;
let sentCount = 0;

function appVersion(): string {
  // 웹은 빌드 시각, 네이티브는 app.json 의 version 이 들어온다.
  return process.env.EXPO_PUBLIC_APP_VERSION ?? 'dev';
}

/**
 * 오류 하나를 서버로 보낸다.
 *
 * @param where 어느 화면이었나. 라우트 경로처럼 **사람이 아니라 자리**를
 *   가리키는 값만 넣는다.
 */
export function reportError(error: unknown, where: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const key = `${where}::${err.message}`;

  const now = Date.now();
  const last = recentlySent.get(key);
  if (last && now - last < DEDUP_MS) return;
  if (sentCount >= MAX_PER_SESSION) return;
  recentlySent.set(key, now);
  sentCount += 1;

  const url = apiUrl('/api/errors');
  if (!url) return; // 서버를 안 쓰는 설정이다. 화면 복구는 그대로 동작한다.

  /* 결과를 기다리지 않는다. 보고가 화면 복구를 늦추면 안 된다. */
  void fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: err.message,
      stack: err.stack ?? '',
      where,
      platform: Platform.OS,
      version: appVersion(),
    }),
  }).catch(() => {
    // 서버가 없거나 죽었다. 여기서 할 수 있는 일이 없다.
  });
}

/**
 * 화면 밖에서 나는 오류까지 잡는다.
 *
 * `ErrorBoundary` 는 **그리는 동안** 난 오류만 잡는다. 이벤트 처리기 안이나
 * 응답을 기다리다 난 오류는 그 그물에 안 걸리는데, 실제로는 그쪽이 더 흔하다.
 *
 * 앱이 시작할 때 한 번 부른다.
 */
export function installGlobalErrorHandler(): void {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return; // 웹 정적 렌더링 중이다
    window.addEventListener('error', (e) => {
      reportError(e.error ?? e.message, location?.pathname ?? 'unknown');
    });
    window.addEventListener('unhandledrejection', (e) => {
      reportError(e.reason, location?.pathname ?? 'unknown');
    });
    return;
  }

  /*
   * 네이티브는 리액트 네이티브가 들고 있는 전역 처리기를 감싼다.
   *
   * 원래 처리기를 **반드시 다시 부른다.** 그게 개발 중 빨간 화면과 배포판
   * 종료를 담당하는데, 우리가 삼키면 오류가 조용히 사라져서 디버깅이 훨씬
   * 어려워진다. 우리는 곁다리로 기록만 한다.
   */
  const globals = globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler: () => (e: unknown, isFatal?: boolean) => void;
      setGlobalHandler: (h: (e: unknown, isFatal?: boolean) => void) => void;
    };
  };
  const utils = globals.ErrorUtils;
  if (!utils) return;

  const previous = utils.getGlobalHandler();
  utils.setGlobalHandler((e, isFatal) => {
    reportError(e, isFatal ? 'fatal' : 'global');
    previous(e, isFatal);
  });
}
