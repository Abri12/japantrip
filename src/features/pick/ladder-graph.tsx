import { useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';

import { Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { buildLadder, tracePath } from '@/lib/ladder';

import { LADDER_COLORS } from './constants';
import { styles } from './styles';

/**
 * 사다리 그림.
 *
 * `buildLadder` 가 만든 가로줄을 그대로 그린다. 결과만 따로 뽑고 그림은 흉내만
 * 내면 눈으로 따라간 사람과 답이 어긋나므로, 같은 데이터를 쓴다.
 *
 * 열 너비를 고정값(52px)으로 두었더니 3명일 때 카드 왼쪽 3분의 1에만 그려지고
 * 이름은 「멘야타…」처럼 잘렸다. 남는 자리를 비워 둘 이유가 없으므로 **실제 폭을
 * 재서 인원수로 나눈다.** 이름도 그만큼 넓어져 대부분 두 줄 안에 다 들어간다.
 */
export function LadderGraph({
  result,
  names,
  winner,
  revealed,
  onPick,
}: {
  result: ReturnType<typeof buildLadder>;
  names: string[];
  winner: number;
  revealed: number | null;
  onPick: (i: number) => void;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const cols = names.length;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // 폭을 재기 전에는 그리지 않는다. 0으로 한 번 그렸다가 튀는 것보다 낫다.
  const col = width > 0 ? width / cols : 0;
  const H = 220;
  const rowH = H / result.rows;
  // 세로줄은 각 열의 한가운데에 세운다.
  const cx = (i: number) => col * i + col / 2;

  // 누른 사람이 지나간 길. 판정과 같은 함수를 쓴다.
  const path = revealed !== null ? tracePath(result, revealed) : null;
  const pathColor = revealed !== null ? LADDER_COLORS[revealed] : theme.border;

  return (
    <View onLayout={onLayout}>
      {width === 0 ? (
        <View style={{ height: H }} />
      ) : (
        <>
          <View style={styles.ladderRow}>
            {names.map((n, i) => (
              <Pressable
                key={i}
                onPress={() => onPick(i)}
                style={[styles.ladderCell, { width: col }]}>
                <Txt
                  variant="caption"
                  tint={revealed === i ? LADDER_COLORS[i] : theme.textSecondary}
                  numberOfLines={2}
                  style={styles.ladderLabel}>
                  {n}
                </Txt>
              </Pressable>
            ))}
          </View>

          <View style={[styles.ladderBoard, { height: H }]}>
            {/* 바탕 사다리. 세로줄은 전부 회색으로 두고, 지나간 길만 위에 덧그린다. */}
            {names.map((_, i) => (
              <View
                key={`v${i}`}
                style={[
                  styles.vline,
                  { left: cx(i) - 1, height: H, width: 2, backgroundColor: theme.border },
                ]}
              />
            ))}

            {result.rungs.map((r, i) => (
              <View
                key={`r${i}`}
                style={[
                  styles.hline,
                  {
                    left: cx(r.left),
                    top: r.row * rowH,
                    width: col,
                    backgroundColor: theme.border,
                  },
                ]}
              />
            ))}

            {/* 실제로 지나간 길. 출발 열을 통째로 칠하면 「3번 → 1번」이라 해놓고
                선은 3번에서 곧게 내려가 있어, 그림이 결과와 다른 말을 하게 된다. */}
            {path
              ? path.downs.map((d, i) => (
                  <View
                    key={`pd${i}`}
                    style={[
                      styles.vline,
                      {
                        left: cx(d.col) - 2,
                        top: d.fromRow * rowH,
                        height: Math.max((d.toRow - d.fromRow) * rowH, 2),
                        width: 4,
                        backgroundColor: pathColor,
                      },
                    ]}
                  />
                ))
              : null}

            {path
              ? path.acrosses.map((a, i) => (
                  <View
                    key={`pa${i}`}
                    style={[
                      styles.hline,
                      {
                        left: cx(Math.min(a.fromCol, a.toCol)) - 2,
                        top: a.row * rowH - 1,
                        width: col + 4,
                        height: 4,
                        backgroundColor: pathColor,
                      },
                    ]}
                  />
                ))
              : null}
          </View>

          {/* 도착 자리에 당첨·꽝을 적는다. 「1번·2번」만으로는 결론이 안 난다. */}
          <View style={styles.ladderRow}>
            {names.map((_, i) => (
              <View key={`b${i}`} style={[styles.ladderCell, { width: col }]}>
                <View
                  style={[
                    styles.prize,
                    {
                      backgroundColor: i === winner ? theme.primarySoft : theme.background,
                      // 선이 들어온 칸에 테두리를 둘러 경로와 결과를 눈으로 잇는다.
                      borderColor: path?.end === i ? pathColor : 'transparent',
                    },
                  ]}>
                  <Txt
                    variant="caption"
                    tint={i === winner ? theme.primary : theme.textTertiary}
                    numberOfLines={1}>
                    {i === winner ? '🎉 당첨' : '꽝'}
                  </Txt>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
