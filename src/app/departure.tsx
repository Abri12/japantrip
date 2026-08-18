import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, IconCircle, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { AIRPORTS, bestWayForCity, hubForCity } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';
import { useSelectedCity } from '@/lib/selected-city';

/**
 * 귀국일 — 여행에서 가장 실수가 잦은 날.
 *
 * 이 날의 일은 다른 날과 성격이 다르다. **되돌릴 수 없는 것들**이 몰려 있다:
 * 비행기를 놓치면 끝이고, 면세 환급은 공항을 나가면 못 받고, 짐을 잘못 부치면
 * 보조배터리가 압수된다.
 *
 * 그런데 앱은 이 정보를 여기저기 흩어 두고 있었다 — 면세는 별도 화면, 짐 규정은
 * 준비물, 공항 가는 법은 공항 화면. 정작 그날 아침에 한 화면에서 훑을 곳이
 * 없었다. 이 화면은 새 정보를 만드는 게 아니라 **그날 필요한 것만 모으는** 자리다.
 */

/** 국제선은 출발 2시간 전 공항 도착이 기본이다 */
const CHECKIN_MINUTES = 120;
/** 길이 막히거나 역에서 헤매는 몫 */
const SAFETY_MINUTES = 30;
/** 면세 환급 창구에 서는 줄 */
const TAX_FREE_MINUTES = 30;

/** 195 → 「3시간 15분」 */
function durationLabel(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export default function DepartureScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { city } = useSelectedCity();

  const airports = city ? AIRPORTS.filter((a) => city.airportIds.includes(a.id)) : [];
  const airport = airports[0];

  /*
   * 기준은 **고른 도시까지** 가는 법이지, 「이 공항의 추천 노선」이 아니다.
   *
   * 예전에는 `airport.routes` 에서 recommended 를 집었는데, 간사이공항은
   * 오사카와 교토가 같이 쓰는 공항이라 교토에 묵는 사람에게도 난바까지의
   * 45분을 답했다. 교토는 하루카로 80분이다. 그 35분이 그대로 모자라서,
   * 되돌릴 수 없는 날에 「비행기 3시간 15분 전」이라고 말하고 있었다.
   */
  const best = airport ? bestWayForCity(airport, city?.id) : undefined;
  const hub = airport ? hubForCity(airport, city?.id) : undefined;
  const firstTrain = best?.routeId
    ? airport?.routes.find((r) => r.id === best.routeId)?.firstTrain
    : undefined;

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
    <Screen back title="귀국하는 날" subtitle="놓치면 되돌릴 수 없는 것들만 모았어요">
      <Section
        title="몇 시에 나서야 하나요"
        caption="이보다 늦게 나서면 안 되는 최소 시간이에요">
        {lead !== null && airport && best ? (
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
                label={`${hub?.name ?? city?.name ?? '시내'}에서 공항까지 · ${best.label}`}
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

      {/* 두 가지 일을 한 목록에 섞어 두면 훑다가 놓친다 — 「방을 나서기 전에
          하는 일」과 「가방을 쌀 때 지켜야 하는 규정」은 하는 시점도 다르고
          틀렸을 때 벌어지는 일도 다르다. */}
      <Section title="숙소를 나오기 전에" caption="여기서 놓치면 되돌리기 어려워요">
        <RowGroup>
          {/* 목록 맨 위에 둔다. 되돌릴 수 없기로는 이만한 게 없다 — 공항에서
              알게 되면 숙소까지 왕복하는 시간이 통째로 사라진다. */}
          <Row
            leading={<IconCircle emoji="🛂" tone={theme.dangerSoft} />}
            title="여권 · 방 금고를 꼭 열어보세요"
            subtitle="금고에 넣어둔 여권을 두고 나오는 일이 가장 많아요. 문 닫기 전에 한 번 더"
          />
          <Row
            leading={<IconCircle emoji="🔑" tone={theme.primarySoft} />}
            title="숙소 열쇠 반납 · 방 한 번 더 확인"
            subtitle="충전기와 어댑터를 콘센트에 두고 오는 일이 제일 흔해요"
          />
          <Row
            leading={<IconCircle emoji="📶" tone={theme.warningSoft} />}
            title="빌린 와이파이 · 유심 챙기기"
            subtitle="공항 반납함에 넣어야 해요. 두고 오면 연체료가 붙어요"
          />
          <Row
            leading={<IconCircle emoji="🪙" tone={theme.primarySoft} />}
            title="남은 동전 털기"
            subtitle="편의점이나 자판기에서 쓰는 게 나아요. 동전은 환전이 안 돼요"
            last
          />
        </RowGroup>
      </Section>

      <Section title="가방을 쌀 때" caption="검색대에서 뺏기거나 버리게 되는 것들이에요">
        <RowGroup>
          {/* 2026년 4월 20일부터 국내 항공사에 일괄 적용된 규정이다. 예전에
              알던 「100Wh 이하면 5개까지」와 다르고, 기내 사용 금지와 선반
              보관 금지가 새로 붙었다. */}
          <Row
            leading={<IconCircle emoji="🔋" tone={theme.warningSoft} />}
            title="보조배터리는 기내로 · 1인 2개까지"
            subtitle="부치는 가방에 있으면 공항에서 빼야 해요. 기내에선 충전도 사용도 안 되고, 선반에 두지 말고 몸에 지녀야 해요"
          />
          <Row
            leading={<IconCircle emoji="🧴" tone={theme.warningSoft} />}
            title="액체는 100ml 이하로"
            subtitle="산 화장품·술은 부치는 가방에 넣으세요. 공항 면세점에서 산 건 봉인된 채로 두면 괜찮아요"
          />
          <Row
            leading={<IconCircle emoji="✂️" tone={theme.warningSoft} />}
            title="칼 · 가위 · 손톱깎이는 부치는 가방에"
            subtitle="기내 가방에 있으면 검색대에서 버려야 해요. 셀카봉과 삼각대도 걸려요"
          />
          {/* 이 규칙은 2026년 11월 1일에 없어진다. 날짜를 함께 적어 두면
              그날이 지난 뒤에 읽어도 스스로 설명이 된다. */}
          <Row
            leading={<IconCircle emoji="🛍️" tone={theme.primarySoft} />}
            title="면세로 산 소모품은 봉투 그대로"
            subtitle="화장품·과자처럼 밀봉해 준 건 출국 전에 뜯으면 세금을 다시 낼 수 있어요. 2026년 11월 1일부터는 이 규칙이 없어져요"
            last
          />
        </RowGroup>
      </Section>

      {/* 「공항 가는 방법」 줄은 원래 아래 「공항에서 할 일」 안에 있었다. 공항에
          가는 일은 공항에 **닿기 전에** 하는 일이라 자리가 어긋나 있었고, 정작
          나서는 시각을 본 직후에는 무엇을 타는지 알 길이 없었다. 나서는 시각
          바로 뒤로 옮기고, 첫차 시각을 함께 적는다. */}
      {airport ? (
        <Section title="공항 가는 길">
          <RowGroup>
            <Row
              leading={<IconCircle emoji="🚃" tone={theme.primarySoft} />}
              title={`${airport.name}까지 가는 노선`}
              subtitle={
                best
                  ? `${best.label} · ${hub?.name ?? '시내'}에서 ${best.minutes}분${
                      firstTrain ? ` · 첫차 ${firstTrain.from} ${firstTrain.time}` : ''
                    }`
                  : '노선별 소요시간과 요금을 비교해 보세요'
              }
              chevron
              last
              onPress={() => router.push(`/airport/${airport.id}`)}
            />
          </RowGroup>
        </Section>
      ) : null}

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

      <Section title="공항에서 할 일">
        <RowGroup>
          <Row
            leading={<IconCircle emoji="🛍️" tone={theme.primarySoft} />}
            title="면세 환급"
            subtitle="2026년 11월부터 방식이 바뀌어요"
            chevron
            last
            onPress={() => router.push('/tax-free')}
          />
        </RowGroup>
      </Section>

      <Txt variant="caption" color="textTertiary">
        IC카드(ICOCA·SUGOCA)는 반납하면 보증금 500엔을 돌려받지만, 다음에 또 올 거면 그냥
        들고 가도 돼요. 잔액은 10년간 유효해요.
      </Txt>
    </Screen>
  );
}

/** 합계를 이루는 한 줄. 항목 이름은 왼쪽, 시간은 오른쪽 끝에 붙여 세로로 읽힌다 */
function BreakdownRow({ label, minutes }: { label: string; minutes: number }) {
  return (
    <View style={styles.breakdownRow}>
      <Txt variant="body" color="textSecondary" style={styles.flex}>
        {label}
      </Txt>
      <Txt variant="bodyBold">{durationLabel(minutes)}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  breakdown: {
    marginTop: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    gap: Spacing.two,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  taxFree: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.md,
  },
  resultNote: {
    marginTop: Spacing.two,
  },
  hint: {
    marginTop: Spacing.three,
  },
  caveat: {
    marginTop: Spacing.four,
  },
  leadLabel: {
    marginBottom: Spacing.one,
  },
  gap: {
    marginTop: Spacing.three,
  },
});
