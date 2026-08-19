import { View } from 'react-native';

import { Card, Section, Txt } from '@/components/ui';
import { FirstTrain, HubWay } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';

import { BreakdownRow } from './breakdown-row';
import { CHECKIN_MINUTES, SAFETY_MINUTES, TAX_FREE_MINUTES } from './constants';
import { durationLabel } from './duration';
import { styles } from './styles';

export interface LeadTimeSectionProps {
  /** 공항 이름. 도시를 안 골랐으면 없다 */
  airportName?: string;
  /** 고른 도시까지 가는 법. 이게 없으면 계산 자체가 성립하지 않는다 */
  best?: HubWay;
  /** 시간을 재기 시작하는 자리 — 「난바에서 공항까지」의 난바 */
  hubName?: string;
  cityName?: string;
  /** 그 노선의 시내 → 공항 첫차 */
  firstTrain?: FirstTrain;
}

export function LeadTimeSection({
  airportName,
  best,
  hubName,
  cityName,
  firstTrain,
}: LeadTimeSectionProps) {
  const theme = useTheme();

  /*
   * 비행기 시각에서 거꾸로 세는 몫.
   *
   * 예전에는 비행기 시각을 여섯 칸 중에 고르게 하고 나서는 시각을 계산해 줬다.
   * 그런데 그 계산은 「출발 시각 − 고정된 상수」다. 고르는 수고를 시킨 대가로
   * 사용자가 이미 할 줄 아는 뺄셈을 대신해 준 셈이고, 07:20 비행기인 사람은
   * 자기 시각이 목록에 없어 아예 못 썼다.
   *
   * 그래서 계산 결과 대신 **상수 자체**를 말한다. 뺄셈은 각자 자기 시각으로
   * 하면 되고, 그 편이 어떤 비행기에나 맞는다.
   */
  const lead = best ? best.minutes + CHECKIN_MINUTES + SAFETY_MINUTES : null;

  return (
    <Section
      title="몇 시에 나서야 하나요"
      caption="이보다 늦게 나서면 안 되는 최소 시간이에요">
      {lead !== null && airportName && best ? (
        <Card accent={theme.primary}>
          {/*
           * 「숙소에서 나서기」였는데, 큰 숫자 위에 놓이니 그 숫자가 나서면
           * 되는 시각처럼 읽혔다. 하한이라는 걸 라벨에서부터 말한다.
           *
           * 그리고 이 줄은 caption(13px 흐린 회색)이 아니어야 한다. 카드에서
           * 제일 큰 글자가 숫자라, 그 위에 작고 흐린 줄이 있으면 **아무도 안
           * 읽고 숫자만 본다.** 그러면 붙여 둔 「늦어도」가 없는 것과 같다.
           * subtitle 로 올리고 기본 텍스트 색을 써서, 숫자와 색으로 갈리되
           * 문장으로 먼저 읽히게 한다.
           *
           * 「늦어도」에만 경고색을 준다. 이 네 글자가 이 화면에서 가장
           * 오해받는 지점이라, 한 단어만 집어서 눈에 걸리게 하는 편이
           * 줄 전체를 붉게 칠하는 것보다 낫다.
           */}
          <Txt variant="subtitle" style={styles.leadLabel}>
            숙소에서{' '}
            <Txt variant="subtitle" tint={theme.warning}>
              늦어도
            </Txt>{' '}
            이때는
          </Txt>
          <Txt variant="display" tint={theme.primary}>
            비행기 {durationLabel(lead)} 전
          </Txt>

          {/* 합계만 주면 자기 사정에 맞게 못 고친다. 숙소가 역 바로 앞인
              사람은 이동 시간을 줄이고, 짐 부칠 게 많으면 수속을 늘린다.
              내역이 보여야 그 조정이 가능하다. */}
          <View style={[styles.breakdown, { borderTopColor: theme.border }]}>
            {/* 「공항까지 45분」이 아니라 **어디서** 45분인지를 적는다.
                기준점이 있어야 참이 되고, 숙소가 그 기준점에서 멀면
                사용자가 스스로 더해야 한다. */}
            <BreakdownRow
              label={`${hubName ?? cityName ?? '시내'}에서 공항까지 · ${best.label}`}
              minutes={best.minutes}
            />
            <BreakdownRow label="탑승 수속 · 보안검색" minutes={CHECKIN_MINUTES} />
            <BreakdownRow label="길 막힘 · 헤매는 시간" minutes={SAFETY_MINUTES} />
          </View>

          <View style={[styles.taxFree, { backgroundColor: theme.primarySoft }]}>
            <Txt variant="bodyBold" tint={theme.primary}>
              면세 환급을 받을 거면 30분 더
            </Txt>
            <Txt variant="caption" color="textSecondary" style={styles.resultNote}>
              비행기 {durationLabel(lead + TAX_FREE_MINUTES)} 전에 나서세요. 성수기와 연휴에는
              환급 창구도 보안검색도 줄이 훨씬 길어요.
            </Txt>
          </View>

          {/* 새벽 비행기라면 계산이 맞아도 탈 것이 없다. 시각만 말하고 열차가
              다니는지 말하지 않으면 사람을 역 앞에 세워 두는 셈이다. */}
          {firstTrain ? (
            <Txt variant="caption" tint={theme.warning} style={styles.hint}>
              ⚠ 새벽 비행기라면 그 시각에 전철이 아직 없을 수 있어요. {best.label} 첫차는{' '}
              {firstTrain.from} {firstTrain.confidence === 'approx' ? '약 ' : ''}
              {firstTrain.time} 출발이에요. 그보다 일찍 나서야 하면 공항버스나 택시를
              알아보시거나, 전날 공항 근처에서 묵는 것도 방법이에요.
            </Txt>
          ) : null}
        </Card>
      ) : (
        <Card accent={theme.primary}>
          <Txt variant="body">비행기 출발 2시간 전에는 공항에 도착해 있어야 해요.</Txt>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            여기에 숙소에서 공항까지 걸리는 시간과, 길이 막히거나 헤맬 몫으로 30분을 더해
            나서면 돼요. 면세 환급을 받을 거면 30분 더 일찍 나서세요.
          </Txt>
          <Txt variant="caption" color="textTertiary" style={styles.hint}>
            도시를 고르면 그 공항까지 걸리는 시간까지 더해서 알려드려요.
          </Txt>
        </Card>
      )}

      {/*
       * 단서는 카드 밖에 둔다 — 도시를 골랐든 안 골랐든 이 구역 전체에
       * 걸리는 말이라, 어느 한쪽 카드 안에 넣으면 다른 쪽에서 사라진다.
       *
       * 이 말이 필요한 이유는, 숫자 하나만 크게 띄워 두면 그게 **목표**로
       * 읽히기 때문이다. 실제로는 **하한**이다. 이동 시간도 거점역에서
       * 재기 시작하는 값이라 숙소에서 역까지 걷는 시간은 아예 안 들어 있다.
       * 그 사실을 안 적으면 앱이 계산해 준 대로 나섰다가 늦는 사람이 나온다.
       */}
      <Txt variant="caption" color="textTertiary" style={styles.caveat}>
        ⏱ 여기 적힌 건 「이보다 늦게 나서면 안 된다」는 최소예요. 넉넉하게 잡은 시간이
        아니에요.
        {'\n\n'}
        숙소에서 역까지 걸어가는 시간은 안 들어가 있어요. 짐 부치는 줄, 출퇴근 시간대 지연,
        성수기 보안검색은 그날 상황이라 미리 셀 수가 없고요. 여유가 있으면 더 일찍 나서는
        쪽이 항상 낫습니다 — 공항에서 기다리는 건 되돌릴 수 있지만, 비행기는 놓치면 그만이에요.
      </Txt>
    </Section>
  );
}
