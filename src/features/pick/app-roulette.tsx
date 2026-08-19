import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, Chip, Section, Txt } from '@/components/ui';
import { WHEEL_MAX, Wheel, WheelHandle } from '@/components/wheel';
import { PLACES, Place, placesByCity } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { count } from '@/lib/stats';
import { sample } from '@/lib/util/random';

import { styles } from './styles';

export function AppRoulette({ cityId, cityName }: { cityId: string | null; cityName: string | null }) {
  const theme = useTheme();
  const router = useRouter();
  const wheel = useRef<WheelHandle>(null);

  const [scope, setScope] = useState<'city' | 'all'>('city');
  const [kind, setKind] = useState<'all' | 'sight' | 'food'>('all');
  const [picked, setPicked] = useState<Place | null>(null);

  const pool = scope === 'city' && cityId ? placesByCity(cityId) : PLACES;
  const filtered = pool.filter((p) => kind === 'all' || p.category === kind);

  const [board, setBoard] = useState<Place[]>(() => sample(filtered, WHEEL_MAX));

  // 조건을 바꾸면 원판도 새로 짠다. 그대로 두면 「오사카만」으로 바꿨는데
  // 후쿠오카 가게가 원판에 남아 있는 일이 생긴다.
  const key = `${scope}:${kind}:${cityId ?? ''}`;

  /* 이전 조건을 ref 가 아니라 state 로 들고 있는다.
     렌더 도중에 ref 를 읽고 쓰면 StrictMode 의 이중 렌더나 동시성 렌더링에서
     한쪽만 갱신돼 원판이 옛 조건으로 남는다. 「렌더 중 setState 로 상태
     맞추기」는 React 가 문서로 인정하는 패턴이고, 그때 직전 값은 state 로
     비교해야 한다. 동작은 같다 — setState 가 커밋 전에 즉시 재렌더된다. */
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setBoard(sample(filtered, WHEEL_MAX));
    setPicked(null);
  }

  const reshuffle = () => {
    setBoard(sample(filtered, WHEEL_MAX));
    setPicked(null);
  };

  return (
    <>
      <Section>
        <View style={styles.chipRow}>
          <Chip
            label={cityName ? `${cityName}만` : '고른 도시'}
            active={scope === 'city'}
            onPress={() => setScope('city')}
          />
          <Chip label="전 도시" active={scope === 'all'} onPress={() => setScope('all')} />
        </View>
        <View style={[styles.chipRow, styles.chipRowGap]}>
          <Chip label="상관없어" active={kind === 'all'} onPress={() => setKind('all')} />
          <Chip label="관광지" active={kind === 'sight'} onPress={() => setKind('sight')} />
          <Chip label="맛집" active={kind === 'food'} onPress={() => setKind('food')} />
        </View>
      </Section>

      <Section>
        <Card>
          <Wheel
            ref={wheel}
            labels={board.map((p) => p.name)}
            onStart={() => setPicked(null)}
            onResult={(i) => {
              setPicked(board[i]);
              void count({ kind: 'pick', placeId: board[i].id });
            }}
          />

          {filtered.length > board.length ? (
            <View style={styles.wheelFoot}>
              <Txt variant="caption" color="textTertiary">
                {filtered.length}곳 중 {board.length}곳을 올렸어요
              </Txt>
              <Chip label="다른 후보로" active={false} onPress={reshuffle} />
            </View>
          ) : null}
        </Card>
      </Section>

      {picked ? (
        <Section>
          <Card accent={theme.primary}>
            <Pressable onPress={() => router.push(`/place/${picked.id}` as never)}>
              <Txt variant="caption" color="textTertiary">
                오늘은 여기 어때요?
              </Txt>
              <Txt variant="display" style={styles.pickName}>
                {picked.name}
              </Txt>
              <Txt variant="body" color="textSecondary">
                {picked.city}
                {picked.admission ? ` · ${picked.admission}` : ''}
              </Txt>
              <Txt variant="body" color="textSecondary" style={styles.pickSummary}>
                {picked.summary}
              </Txt>
              <View style={[styles.openHint, { backgroundColor: theme.primarySoft }]}>
                <Txt variant="label" tint={theme.primary}>
                  눌러서 자세히 보기 →
                </Txt>
              </View>
            </Pressable>
          </Card>
        </Section>
      ) : null}

      <Button
        label={picked ? '다시 돌리기' : '돌리기'}
        onPress={() => wheel.current?.spin()}
        disabled={board.length < 2}
      />

      {filtered.length === 0 ? (
        <Txt variant="caption" color="textTertiary" style={styles.note}>
          조건에 맞는 곳이 없어요. 범위를 넓혀보세요.
        </Txt>
      ) : null}
    </>
  );
}
