import { View } from 'react-native';
import { Txt } from './text';
import { styles } from './styles';

// ── 기타 ───────────────────────────────────────────────

/** 큰 숫자 한 개를 강조해 보여 준다 (요금·평점 등). */
export function Stat({
  value,
  unit,
  label,
}: {
  value: string;
  unit?: string;
  label?: string;
}) {
  return (
    <View>
      <View style={styles.statRow}>
        <Txt variant="numeric">{value}</Txt>
        {unit ? (
          <Txt variant="body" color="textTertiary" style={styles.statUnit}>
            {unit}
          </Txt>
        ) : null}
      </View>
      {label ? (
        <Txt variant="caption" color="textTertiary">
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

/**
 * 컨택리스 결제 마크 — 카드와 개찰구 리더에 붙어 있는 그 표시.
 *
 * 이모지에 없는 기호라 직접 그린다. 처음에는 의존성을 늘리지 않으려고 원의
 * `borderRightColor` 만 칠해 호를 만들었는데, 실제 마크와 나란히 놓으니 확연히
 * 달라 보였다. 이유는 두 가지였다:
 *
 * 1. 테두리로는 **90°밖에 못 그린다.** 진짜 마크는 100° 넘게 열려 있다.
 * 2. 테두리 끝은 **각지게 잘린다.** 진짜 마크는 끝이 둥글다. 이 기호의 인상을
 *    만드는 건 사실상 이 둥근 끝이라, 각진 채로는 괄호처럼 보인다.
 *
 * 둘 다 테두리로는 못 만들어서 react-native-svg 로 옮겼다. 이건 도형 하나를
 * 위해 라이브러리를 넣을 만한 경우다 — 사용자가 카드와 개찰구에서 **눈으로
 * 대조할 그림**이라, 비슷하기만 해서는 목적을 못 이룬다.
 *
 * 네 호는 같은 점을 중심으로 커진다. 중심을 왼쪽에 두면 오른쪽으로 퍼지는
 * 실제 모양이 나온다.
 *
 * 색은 앱의 강조색을 쓴다. 실제 카드의 마크는 카드사마다 색이 달라서, 여행자가
 * 찾아야 하는 건 색이 아니라 이 모양이다.
 */

/** 100×100 좌표계에서 그린다. 실제 크기는 size 로 스케일된다. */
