import { View } from 'react-native';

import { Card, Section, Txt } from '@/components/ui';
import { CourseDay } from '@/data/courses';
import { useTheme } from '@/hooks/use-theme';
import { formatWonApprox, useFxRate, yenToWon } from '@/lib/fx';

import { dayCostYen } from './day-cost';
import { StopRow } from './stop-row';
import { styles } from './styles';

export function DayBlock({ day }: { day: CourseDay }) {
  const theme = useTheme();
  const rate = useFxRate();

  /*
   * 제목 옆에 그날 깔고 들어가는 돈을 붙인다.
   *
   * 코스를 보는 사람이 다음에 묻는 것은 「그래서 하루에 얼마 드냐」다. 교통비만
   * 적으면 그 질문에 반만 답한 것이 된다 — 오사카 둘째 날은 지하철이 910엔인데
   * 천수각과 공중정원 입장료가 2,600엔이라, 교통비만 보고 예산을 잡으면 실제와
   * 네 배 가까이 벌어진다.
   *
   * 원화는 환율을 못 받아왔으면 빼고 엔만 적는다. 「약 0원」처럼 틀린 값을
   * 잠깐이라도 띄우지 않기 위해서다(KrwEstimate 와 같은 정책).
   *
   * 「약」은 한 줄에 한 번만 쓴다. 엔에도 원에도 붙이면 읽기가 걸린다. 엔 금액도
   * 정확한 값을 약속하는 건 아니지만(지하철이 구간제다) 그 사실은 화면 맨 아래에
   * 한 번 적어 둔다 — 제목마다 반복할 이야기가 아니다.
   *
   * 제목과 **같은 줄에 두되 같은 글씨로 두지 않는다.** 「1일차 · 도착」과 금액을
   * 한 문자열로 이으면 굵기·크기가 같아 훑을 때 한 덩어리로 보인다. 날짜가 먼저
   * 읽히고 금액이 따라 읽히도록, 금액만 작고 흐린 글씨로 내보낸다.
   */
  const yen = dayCostYen(day);
  const won = yen === null ? null : yenToWon(yen, rate);
  const cost =
    yen === null ? null : (
      <Txt variant="caption" color="textTertiary">
        {yen.toLocaleString()}엔{won === null ? '' : ` · ${formatWonApprox(won)}`}
      </Txt>
    );

  return (
    <Section title={day.label} titleSuffix={cost} caption={day.theme}>
      <Card>
        {day.stops.map((stop, i) => (
          <StopRow key={i} stop={stop} last={i === day.stops.length - 1} />
        ))}

        {day.tip ? (
          <View style={[styles.dayTip, { borderTopColor: theme.border }]}>
            <Txt variant="caption" tint={theme.primary}>
              💡 {day.tip}
            </Txt>
          </View>
        ) : null}
      </Card>
    </Section>
  );
}
