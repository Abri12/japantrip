import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sweepOf, targetRotation } from '@/lib/wheel';

/**
 * 원판 돌리기.
 *
 * 뽑기의 목적은 정보가 아니라 **결정을 대신 내려주는 순간의 재미**다. 결과만 툭
 * 바꾸면 「눌렀더니 글자가 바뀌었다」로 끝나는데, 원판은 돌아가는 동안 후보가
 * 눈앞에 다 보이고 점점 느려지다 한 칸에 멈춘다. 뽑혔다는 느낌이 훨씬 강하게 남는다.
 *
 * 다만 원판은 칸이 많아지면 못 쓴다. 글자가 겹치고 각 칸이 실오라기처럼 얇아진다.
 * 그래서 후보 수에 상한을 두고, 목록이 길면 부르는 쪽에서 몇 개만 골라 넘긴다.
 */

/** 칸이 이보다 많아지면 글자가 겹쳐 읽을 수 없다. */
export const WHEEL_MAX = 10;

const COLORS = [
  '#E14356', '#E8850F', '#12A87A', '#4C5FD7', '#8B5CF6',
  '#0EA5E9', '#DB2777', '#65A30D', '#0891B2', '#C2410C',
];

const SIZE = 260;
const R = 118;
const CX = 130;
const CY = 130;

export interface WheelHandle {
  spin: () => void;
}

/**
 * 12시가 0°, 시계 방향으로 도는 좌표에서 원 위의 점.
 *
 * 화면 좌표는 y 가 아래로 커지므로 cos 에 음수가 붙는다.
 */
function pointOn(deg: number, radius: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)];
}

function sectorPath(start: number, end: number): string {
  const [x1, y1] = pointOn(start, R);
  const [x2, y2] = pointOn(end, R);
  const large = end - start > 180 ? 1 : 0;
  // sweep-flag 1 = 시계 방향. 위 좌표 약속과 같은 방향이어야 칸이 뒤집히지 않는다.
  return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
}

/** 칸 안에 넣을 수 있는 만큼만 남긴다. 칸이 좁을수록 더 짧게. */
function fit(label: string, count: number): string {
  const max = count <= 4 ? 8 : count <= 6 ? 6 : 4;
  return label.length > max ? `${label.slice(0, max)}…` : label;
}

export const Wheel = forwardRef<WheelHandle, {
  labels: string[];
  /** 멈춘 뒤에 부른다. 돌기 전에 정해진 값이라 화면과 어긋날 수 없다. */
  onResult: (index: number) => void;
  onStart?: () => void;
}>(function Wheel({ labels, onResult, onStart }, ref) {
  const theme = useTheme();
  const count = labels.length;

  const rotation = useRef(new Animated.Value(0)).current;
  // 다음 회전을 이어서 시작하려면 지금 각도를 알아야 한다. Animated.Value 는
  // 바로 못 읽으므로 따로 들고 있는다.
  const angleRef = useRef(0);
  const [spinning, setSpinning] = useState(false);

  useImperativeHandle(ref, () => ({
    spin: () => {
      if (spinning || count < 2) return;

      // 당첨을 먼저 뽑고 각도를 역산한다. 멈춘 자리를 읽어 결과로 삼으면
      // 애니메이션이 끊기거나 소수점이 어긋날 때 결과가 흔들린다.
      const winner = Math.floor(Math.random() * count);
      const turns = 4 + Math.floor(Math.random() * 3);
      const to = targetRotation(angleRef.current, winner, count, turns);

      setSpinning(true);
      onStart?.();

      Animated.timing(rotation, {
        toValue: to,
        duration: 3200,
        // 끝에서 천천히 멎어야 「어디 걸리나」 하는 순간이 생긴다.
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        angleRef.current = to;
        setSpinning(false);
        // 도중에 화면을 벗어나 애니메이션이 잘리면 결과를 내지 않는다.
        if (finished) onResult(winner);
      });
    },
  }));

  const sweep = count >= 2 ? sweepOf(count) : 360;

  const spin = rotation.interpolate({
    // 입력·출력을 같은 값으로 두면 각도를 그대로 쓰는 셈이 된다.
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  if (count < 2) {
    return (
      <View style={[styles.wrap, { height: SIZE }]}>
        <Txt variant="body" color="textTertiary">
          후보를 2개 이상 적어주세요
        </Txt>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={SIZE} height={SIZE}>
          {labels.map((label, i) => {
            const start = i * sweep;
            const mid = start + sweep / 2;
            const [tx, ty] = pointOn(mid, R * 0.66);

            return (
              <G key={i}>
                <Path d={sectorPath(start, start + sweep)} fill={COLORS[i % COLORS.length]} />
                {/* 글자를 칸 방향으로 눕혀야 좁은 칸에도 들어간다. */}
                <SvgText
                  x={tx}
                  y={ty}
                  fill="#fff"
                  fontSize={count <= 4 ? 15 : count <= 7 ? 13 : 11}
                  fontWeight="600"
                  textAnchor="middle"
                  transform={`rotate(${mid} ${tx} ${ty})`}>
                  {fit(label, count)}
                </SvgText>
              </G>
            );
          })}

          {/* 가운데 축. 칸들이 한 점에서 만나 지저분해 보이는 걸 덮는다. */}
          <Circle cx={CX} cy={CY} r={22} fill={theme.surface} />
        </Svg>
      </Animated.View>

      {/* 바늘은 원판 밖에 둔다. 같이 돌면 영원히 같은 칸을 가리킨다. */}
      <View style={styles.pointer} pointerEvents="none">
        <Svg width={30} height={26}>
          <Path d="M 15 24 L 2 0 L 28 0 Z" fill={theme.text} />
        </Svg>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
  pointer: {
    position: 'absolute',
    // 원판 위쪽 테두리에 살짝 걸치게 둔다.
    top: Spacing.three - 2,
    alignSelf: 'center',
  },
});
