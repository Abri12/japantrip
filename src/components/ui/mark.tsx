import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/use-theme';
import { styles } from './styles';

const MARK_CX = 19;
const MARK_CY = 50;
/** 중심선 기준 위아래로 벌어지는 각도. 실제 마크는 100도쯤 열려 있다 */
const MARK_SWEEP = 50;
const MARK_STROKE = 9;
/**
 * 호 3개.
 *
 * 원래 4개였는데 줄였다. 반지름 간격이 선 굵기와 비슷하면(14 대 8) 작게 줄었을
 * 때 흰 호와 사이 공간이 같은 굵기로 보여서, 호가 몇 개인지 세기 어려워진다.
 * 지금은 간격 18에 선 9라 **빈 공간이 선의 두 배**다. 40px 로 줄여도 세 줄이
 * 또렷하게 갈린다.
 *
 * 공식 마크는 호가 4개지만, 이 그림의 목적은 규격을 옮기는 게 아니라 카드와
 * 개찰구에서 같은 모양을 알아보게 하는 것이다. 3개도 그 일은 한다.
 */
const MARK_RADII = [16, 34, 52];

function markArcPath(r: number): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = MARK_CX + r * Math.cos(rad(-MARK_SWEEP));
  const y1 = MARK_CY + r * Math.sin(rad(-MARK_SWEEP));
  const x2 = MARK_CX + r * Math.cos(rad(MARK_SWEEP));
  const y2 = MARK_CY + r * Math.sin(rad(MARK_SWEEP));
  // largeArc=0 (100도라 반원 미만), sweep=1 (y 가 아래로 커지는 좌표계에서 시계방향)
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

export function ContactlessMark({ size = 40 }: { size?: number }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.contactlessMark,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: theme.primary,
        },
      ]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {MARK_RADII.map((r) => (
          <Path
            key={r}
            d={markArcPath(r)}
            stroke={theme.onPrimary}
            strokeWidth={MARK_STROKE}
            // 끝을 둥글게 — 실제 마크의 인상을 만드는 건 사실상 이 하나다.
            // 테두리로 그리던 때는 끝이 각지게 잘려서 괄호처럼 보였다.
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}

/** 아이콘 자리에 들어가는 원형 배경 + 이모지. */
export function IconCircle({ emoji, tone }: { emoji: string; tone?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.iconCircle, { backgroundColor: tone ?? theme.surfaceStrong }]}>
      <Text style={styles.iconEmoji}>{emoji}</Text>
    </View>
  );
}

/**
 * 엔화 요금 아래 붙는 원화 환산 캡션.
 *
 * 환율을 못 가져왔으면(오프라인·API 장애) **아무것도 그리지 않는다.**
 * 에러 문구를 띄우면 여행 중 로밍이 불안정한 상황에서 요금·시간 정보보다
 * 에러 배너가 먼저 눈에 들어오게 된다. 조용히 사라지는 편이 낫다.
 */
