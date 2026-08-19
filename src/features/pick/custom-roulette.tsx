import { useRef, useState } from 'react';

import { Button, Card, Section, Txt } from '@/components/ui';
import { WHEEL_MAX, Wheel, WheelHandle } from '@/components/wheel';
import { useTheme } from '@/hooks/use-theme';

import { CandidateList } from './candidate-list';
import { styles } from './styles';

/**
 * 직접 적은 후보로 돌리는 원판.
 *
 * 앱 목록에는 없지만 이미 마음에 담아 둔 후보가 있다 — 친구가 추천한 가게,
 * 인스타에서 본 곳. 그 사이에서 못 정하는 게 실제로 더 흔한 상황이라, 우리
 * 데이터에 없다고 못 뽑게 두면 정작 필요할 때 못 쓴다.
 */
export function CustomRoulette({
  cityId,
}: {
  cityId: string | null;
}) {
  const theme = useTheme();
  const wheel = useRef<WheelHandle>(null);

  const [items, setItems] = useState<string[]>(['', '', '']);
  const [picked, setPicked] = useState<string | null>(null);

  const filled = items.map((t) => t.trim()).filter((t) => t.length > 0);

  const go = () => {
    wheel.current?.spin();
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
