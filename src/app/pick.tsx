import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ConsentAnswer, ConsentSheet } from '@/components/consent-sheet';
import { Button, Card, Chip, Screen, Section, Txt } from '@/components/ui';
import { WHEEL_MAX, Wheel, WheelHandle } from '@/components/wheel';
import { Radius, Spacing } from '@/constants/theme';
import { PLACES, Place, placesByCity } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { buildLadder, tracePath } from '@/lib/ladder';
import { useSelectedCity } from '@/lib/selected-city';
import { collectTerms, consentGate, count, setConsent, snoozeToday } from '@/lib/stats';

/**
 * 못 정하겠을 때 — 랜덤 뽑기와 사다리타기.
 *
 * 이 화면의 목적은 **정보 제공이 아니라 결정을 대신 내려주는 것**이다. 여행 중에
 * 「어디 가지」·「뭐 먹지」에서 한참 멈추는 순간이 있고, 그때 필요한 건 더 많은
 * 선택지가 아니라 누가 하나 골라주는 일이다.
 *
 * 뽑기에 조건을 붙이지 않는다. 영업시간·거리로 걸러 「지금 갈 수 있는 곳」만
 * 내놓으면 그건 검색 결과지 뽑기가 아니다. 재미가 목적인 기능이라 **놀라움이
 * 남아야** 쓴다. 도시 범위만 지키는 이유는 오사카에 있는 사람에게 삿포로를
 * 내놓는 건 놀라움이 아니라 오류이기 때문이다.
 */
export default function PickScreen() {
  const [mode, setMode] = useState<'place' | 'ladder'>('place');

  /*
   * 동의 창은 화면 하나에서만 띄운다.
   *
   * 뽑기와 사다리 양쪽에 따로 두면 한쪽에서 거절한 사람이 다른 쪽에서 또 만난다.
   * 상태를 여기 올려 두고 「아직 안 물어봤고, 지금 글자를 모을 일이 생겼다」는
   * 한 조건에서만 뜨게 한다.
   */
  const [asking, setAsking] = useState(false);
  const pendingRef = useRef<null | (() => void)>(null);

  /**
   * 사용자가 적은 글자를 모아야 하는 동작을 감싼다.
   *
   * 물어봐야 하면 먼저 묻고 답을 받은 뒤에 이어서 실행한다. 이미 동의했거나
   * 오늘은 묻지 않기로 했으면 곧바로 실행한다 — `collectTerms` 가 동의를 다시
   * 확인하므로 여기서 답을 신경 쓸 필요가 없다.
   */
  const withConsent = useCallback((run: () => void) => {
    void consentGate().then((gate) => {
      if (gate === 'ask') {
        pendingRef.current = run;
        setAsking(true);
      } else {
        run();
      }
    });
  }, []);

  const answer = useCallback((a: ConsentAnswer) => {
    const save = a === 'snooze' ? snoozeToday() : setConsent(a === 'yes');
    void save.then(() => {
      setAsking(false);
      // 답을 저장한 뒤에 실행해야 이번 것부터 반영된다.
      pendingRef.current?.();
      pendingRef.current = null;
    });
  }, []);

  return (
    <>
      <Screen back title="못 정하겠을 때" subtitle="고민이 길어지면 그냥 뽑아버려요">
        <Section>
          <View style={styles.chipRow}>
            <Chip label="🎲 뽑기" active={mode === 'place'} onPress={() => setMode('place')} />
            <Chip
              label="🪜 사다리타기"
              active={mode === 'ladder'}
              onPress={() => setMode('ladder')}
            />
          </View>
        </Section>

        {mode === 'place' ? (
          <Roulette withConsent={withConsent} />
        ) : (
          <Ladder withConsent={withConsent} />
        )}
      </Screen>

      <ConsentSheet visible={asking} onAnswer={answer} />
    </>
  );
}

type WithConsent = (run: () => void) => void;

// ── 뽑기 ───────────────────────────────────────────

function Roulette({ withConsent }: { withConsent: WithConsent }) {
  const { city } = useSelectedCity();
  const [source, setSource] = useState<'app' | 'mine'>('app');

  return (
    <>
      <Section>
        <View style={styles.chipRow}>
          <Chip
            label="앱에 있는 곳에서"
            active={source === 'app'}
            onPress={() => setSource('app')}
          />
          <Chip
            label="내가 적은 것 중에"
            active={source === 'mine'}
            onPress={() => setSource('mine')}
          />
        </View>
      </Section>

      {source === 'app' ? (
        <AppRoulette cityId={city?.id ?? null} cityName={city?.name ?? null} />
      ) : (
        <CustomRoulette cityId={city?.id ?? null} withConsent={withConsent} />
      )}
    </>
  );
}

/**
 * 원판에 올릴 후보를 골라낸다.
 *
 * 앱에는 50곳 넘게 있는데 원판 칸이 그만큼 늘면 글자가 겹쳐 아무것도 못 읽는다.
 * 무작위로 몇 곳만 올리고 「다른 후보로」를 주는 편이, 다 올려 두고 못 읽는
 * 것보다 낫다. 어차피 뽑기는 후보를 다 보고 고르는 기능이 아니다.
 */
function sample<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function AppRoulette({ cityId, cityName }: { cityId: string | null; cityName: string | null }) {
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
  const lastKey = useRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
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

/**
 * 직접 적은 후보로 돌리는 원판.
 *
 * 앱 목록에는 없지만 이미 마음에 담아 둔 후보가 있다 — 친구가 추천한 가게,
 * 인스타에서 본 곳. 그 사이에서 못 정하는 게 실제로 더 흔한 상황이라, 우리
 * 데이터에 없다고 못 뽑게 두면 정작 필요할 때 못 쓴다.
 */
function CustomRoulette({
  cityId,
  withConsent,
}: {
  cityId: string | null;
  withConsent: WithConsent;
}) {
  const theme = useTheme();
  const wheel = useRef<WheelHandle>(null);

  const [items, setItems] = useState<string[]>(['', '', '']);
  const [picked, setPicked] = useState<string | null>(null);

  const filled = items.map((t) => t.trim()).filter((t) => t.length > 0);

  const go = () => {
    // 적는 도중이 아니라 돌리는 순간에 묻는다. 입력 중에 창이 뜨면 하던 일이 끊긴다.
    withConsent(() => {
      void count({ kind: 'custom_pick', count: filled.length });
      void collectTerms(filled, { from: 'pick', cityId });
      wheel.current?.spin();
    });
  };

  return (
    <>
      <Section title="후보를 적어주세요" caption={`2~${WHEEL_MAX}개까지 올릴 수 있어요`}>
        <Card>
          <CandidateList items={items} onChange={setItems} min={2} max={WHEEL_MAX} />
        </Card>
      </Section>

      <Section>
        <Card>
          <Wheel
            ref={wheel}
            labels={filled}
            onStart={() => setPicked(null)}
            onResult={(i) => setPicked(filled[i])}
          />
        </Card>
      </Section>

      {picked ? (
        <Section>
          <Card accent={theme.primary}>
            <Txt variant="caption" color="textTertiary">
              여기로 정했어요
            </Txt>
            <Txt variant="display" style={styles.pickName}>
              {picked}
            </Txt>
          </Card>
        </Section>
      ) : null}

      <Button
        label={picked ? '다시 돌리기' : '돌리기'}
        onPress={go}
        disabled={filled.length < 2}
      />
    </>
  );
}


// ── 사다리타기 ─────────────────────────────────────────

const LADDER_COLORS = ['#E14356', '#E8850F', '#12A87A', '#4C5FD7', '#8B5CF6', '#0EA5E9'];

interface LadderGame {
  ladder: ReturnType<typeof buildLadder>;
  /** 당첨 자리 (도착 지점 기준) */
  winner: number;
}

function Ladder({ withConsent }: { withConsent: WithConsent }) {
  const theme = useTheme();
  const { city } = useSelectedCity();
  const cityId = city?.id ?? null;

  const [names, setNames] = useState<string[]>(['', '']);
  const [game, setGame] = useState<LadderGame | null>(null);
  const [revealed, setRevealed] = useState<number | null>(null);

  const filled = names.map((n, i) => n.trim() || `${i + 1}번`);

  /** 후보를 그 도시 맛집으로 채운다. 「뭐 먹지」가 이 기능의 주 용도다. */
  const fillWithFood = () => {
    const food = (cityId ? placesByCity(cityId) : PLACES)
      .filter((p) => p.category === 'food')
      .map((p) => p.name);
    if (food.length < 2) return;

    const shuffled = [...food].sort(() => Math.random() - 0.5);
    setNames(shuffled.slice(0, Math.min(4, shuffled.length)));
    setGame(null);
    setRevealed(null);
    if (cityId) void count({ kind: 'ladder_autofill', cityId });
  };

  const run = () => {
    withConsent(() => {
      setGame({
        ladder: buildLadder(names.length),
        // 도착 자리가 「1번·2번」이면 누가 걸린 건지 알 수 없다. 당첨 한 자리를
        // 정해 두어야 사다리가 끝났을 때 결론이 난다.
        winner: Math.floor(Math.random() * names.length),
      });
      setRevealed(null);
      void count({ kind: 'ladder', count: names.length });
      // 동의 여부는 collectTerms 안에서 확인한다. 여기서 확인하도록 두면
      // 호출부가 늘어날 때마다 빠뜨릴 위험이 생긴다.
      void collectTerms(names, { from: 'ladder', cityId });
    });
  };

  const wonName =
    game && revealed !== null && game.ladder.mapping[revealed] === game.winner;

  return (
    <>
      <Section title="후보를 적어주세요" caption="2~6개까지 돼요">
        <Card>
          <CandidateList
            items={names}
            onChange={(next) => {
              setNames(next);
              setGame(null);
              setRevealed(null);
            }}
            min={2}
            max={6}
            colors={LADDER_COLORS}
            extra={<Chip label="🍜 맛집으로 채우기" active={false} onPress={fillWithFood} />}
          />
        </Card>
      </Section>

      {game ? (
        <Section title="결과" caption="이름을 누르면 어디로 내려가는지 보여드려요">
          <Card>
            <LadderGraph
              result={game.ladder}
              names={filled}
              winner={game.winner}
              revealed={revealed}
              onPick={setRevealed}
            />

            {revealed !== null ? (
              <View
                style={[
                  styles.ladderResult,
                  { backgroundColor: wonName ? theme.primarySoft : theme.background },
                ]}>
                <Txt variant="bodyBold" tint={wonName ? theme.primary : theme.textSecondary}>
                  {wonName ? `🎉 ${filled[revealed]} 당첨!` : `${filled[revealed]} — 꽝`}
                </Txt>
              </View>
            ) : (
              <Txt variant="caption" color="textTertiary" style={styles.ladderHint}>
                아직 아무도 안 눌렀어요. 위쪽 이름을 눌러보세요.
              </Txt>
            )}
          </Card>
        </Section>
      ) : null}

      <Button label={game ? '다시 그리기' : '사다리 타기'} onPress={run} />
    </>
  );
}

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
function LadderGraph({
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

/**
 * 후보 입력 칸 묶음.
 *
 * 가챠와 사다리가 같은 것을 요구하므로 한 컴포넌트로 둔다. 두 벌로 두면 한쪽만
 * 고쳐 놓고 다른 쪽이 어긋나기 시작한다.
 */
function CandidateList({
  items,
  onChange,
  min,
  max,
  colors,
  extra,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  min: number;
  max: number;
  colors?: string[];
  extra?: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <>
      {items.map((value, i) => (
        <View key={i} style={i === 0 ? styles.inputRow : styles.inputRowGap}>
          {colors ? (
            <View style={[styles.colorDot, { backgroundColor: colors[i] }]} />
          ) : (
            <Txt variant="caption" color="textTertiary">
              {i + 1}
            </Txt>
          )}
          <TextInput
            value={value}
            onChangeText={(t) => onChange(items.map((v, k) => (k === i ? t : v)))}
            placeholder={`${i + 1}번`}
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          />
          {items.length > min ? (
            <Pressable onPress={() => onChange(items.filter((_, k) => k !== i))} hitSlop={8}>
              <Txt variant="body" color="textTertiary">
                ✕
              </Txt>
            </Pressable>
          ) : null}
        </View>
      ))}

      <View style={styles.addRow}>
        {items.length < max ? (
          <Chip label="+ 추가" active={false} onPress={() => onChange([...items, ''])} />
        ) : null}
        {extra}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chipRowGap: {
    marginTop: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.three,
  },
  dice: {
    fontSize: 44,
    lineHeight: 52,
  },
  pickName: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  pickSummary: {
    marginTop: Spacing.three,
  },
  openHint: {
    alignSelf: 'flex-start',
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  note: {
    marginTop: Spacing.three,
  },
  wheelFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  inputRowGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    fontSize: 15,
  },
  addRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  ladderRow: {
    flexDirection: 'row',
  },
  ladderCell: {
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  ladderLabel: {
    textAlign: 'center',
  },
  ladderBoard: {
    position: 'relative',
    marginVertical: Spacing.three,
  },
  vline: {
    position: 'absolute',
    top: 0,
  },
  hline: {
    position: 'absolute',
    height: 2,
  },
  prize: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  ladderResult: {
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  ladderHint: {
    marginTop: Spacing.four,
  },
});
