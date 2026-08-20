import { View } from 'react-native';

import { Chip } from '@/components/ui';
import { useSavedPlaces } from '@/lib/saved-places';

import { styles } from './styles';

/**
 * 저장 토글 — 「내가 갈 곳」에 넣고 빼기.
 *
 * 상세 화면 맨 위에 둔다. 장소를 읽고 「가고 싶다」가 되는 순간이 이 화면인데,
 * 그 마음을 담아 둘 곳이 지금까지 없었다 — 나중에 다시 찾으려면 검색부터
 * 다시 해야 했다.
 *
 * ## 왜 칩인가
 *
 * 전에는 **전폭 테두리 상자**였다. 화면에서 가장 큰 요소가 됐는데, 정작 이건
 * 보조 동작이다 — 사용자가 이 화면에 온 이유는 장소를 읽으러 온 것이지
 * 저장하러 온 게 아니다. 크기가 중요도를 거짓말하고 있었다.
 *
 * 게다가 이 앱에서 **켜고 끄는 것은 전부 `Chip`** 이다(일차 선택·도시 필터).
 * 저장만 다른 모양을 쓸 이유가 없다. 바로 아래 일차 칩과 나란히 놓이는
 * 자리라 더 그렇다.
 *
 * ## 색만으로 구분하지 않는다
 *
 * 저장된 상태를 **문구로도** 바꾼다(「저장됨」). 색만 바꾸면 지금 눌러서
 * 저장된 건지 원래 그랬는지 확신이 안 서고, 색약이면 아예 구분이 안 된다.
 */
export function SaveButton({ placeId }: { placeId: string }) {
  const { has, toggle } = useSavedPlaces();
  const saved = has(placeId);

  /* 칩은 내용만큼만 넓다. 왼쪽에 붙여야 아래 일차 칩과 시작선이 맞는다. */
  return (
    <View style={styles.saveRow}>
      <Chip
        label={saved ? '⭐ 저장됨' : '☆ 내가 갈 곳에 저장'}
        active={saved}
        onPress={() => toggle(placeId)}
      />
    </View>
  );
}
