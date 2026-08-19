import { useState } from 'react';
import { View } from 'react-native';

import { Chip, Screen, Section } from '@/components/ui';
import { Ladder, Roulette, styles } from '@/features/pick';

/**
 * 못 정하겠을 때 — 뽑기와 사다리타기.
 *
 * 예전에는 여기에 입력어 수집 동의 창이 있었다. 사용자가 적은 가게 이름을
 * 모으면 「우리 목록에 없는 곳」을 알 수 있어 데이터를 키우는 데 값졌기
 * 때문이다.
 *
 * 그런데 사다리타기는 음식보다 **사람 이름을 적는 데 훨씬 많이 쓰인다.**
 * 아무리 걸러내도 타인의 이름이 섞일 수밖에 없고, 그건 앱 이용자가 아닌
 * 제3자의 개인정보라 애초에 동의를 받을 수 있는 대상이 아니다.
 *
 * 그래서 수집 자체를 없앴다. 동의를 잘 받는 방법을 고민하는 것보다, 받을
 * 필요가 없게 만드는 쪽이 옳다. 이제 이 화면에서 사용자가 적은 글자는
 * 화면 밖으로 한 자도 나가지 않는다.
 */
export default function PickScreen() {
  const [mode, setMode] = useState<'place' | 'ladder'>('place');

  return (
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

      {mode === 'place' ? <Roulette /> : <Ladder />}
    </Screen>
  );
}
