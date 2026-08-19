import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  /*
   * 이 규칙은 여기서 끈다.
   *
   * 「효과 안에서 동기 setState 하지 마라」는 대개 옳지만, **하이드레이션을
   * 감지하는 일**은 그 규칙이 못 다루는 경우다. 서버에서 그린 HTML 과 클라이언트
   * 첫 렌더는 결과가 같아야 하는데, 실제 색 테마는 클라이언트에서만 알 수 있다.
   * 그래서 첫 렌더는 무조건 light 로 맞추고, 효과가 한 번 돌고 나서야 진짜 값을
   * 쓴다. 「효과가 돌았다」는 사실 자체가 여기서 필요한 신호라 다른 방법이 없다.
   *
   * 정확히 한 번만 도는 재렌더라 성능 문제도 아니다.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
