import { IconCircle, Row, RowGroup, Section } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export function PackingRulesSection() {
  const theme = useTheme();

  return (
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
  );
}
