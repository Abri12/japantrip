import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Chip, Section, Txt } from '@/components/ui';
import { PLACES, placesByCity } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { buildLadder } from '@/lib/ladder';
import { useSelectedCity } from '@/lib/selected-city';
import { collectTerms, count } from '@/lib/stats';

import { CandidateList } from './candidate-list';
import { LADDER_COLORS } from './constants';
import { LadderGraph } from './ladder-graph';
import { styles } from './styles';
import { LadderGame, WithConsent } from './types';

export function Ladder({ withConsent }: { withConsent: WithConsent }) {
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
