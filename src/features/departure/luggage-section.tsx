import { Card, Section, Txt } from '@/components/ui';

import { styles } from './styles';

export function LuggageSection() {
  return (
    <Section title="짐을 맡기고 더 돌아볼 거면">
      <Card>
        <Txt variant="body" color="textSecondary">
          체크아웃 후에도 숙소가 짐을 맡아줘요. 역 코인락커는 오전에 금방 차고 큰 캐리어가
          들어가는 칸은 더 적어서, 숙소에 맡기는 편이 확실해요.
        </Txt>
        <Txt variant="body" color="textSecondary" style={styles.gap}>
          공항에 일찍 도착해서 맡기는 방법도 있어요. 수속 카운터가 열리면 짐만 먼저 부치고
          가볍게 다닐 수 있어요.
        </Txt>
      </Card>
    </Section>
  );
}
