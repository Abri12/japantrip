import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';

import { ConsentAnswer, ConsentSheet } from '@/components/consent-sheet';
import { Chip, Screen, Section } from '@/components/ui';
import { Ladder, Roulette, styles } from '@/features/pick';
import { consentGate, setConsent, snoozeToday } from '@/lib/stats';

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
