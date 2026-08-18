/**
 * 면세(Tax-Free) 안내 · 계산기.
 *
 * 확인한 사실 (2026년 8월 기준) — 2026년 11월 1일부터 시행:
 * - 매장에서 즉시 할인 방식이 사라지고, 세금 포함 전액을 먼저 결제한 뒤
 *   출국 시 공항 전용 단말기에서 확인받아 환급받는 방식으로 바뀐다
 * - 최소 구매액 5,000엔 기준은 유지되지만, "일반물품"과 "소모품"의
 *   구분과 각각의 상한(소모품 50만엔 등)이 폐지되어 합산 5,000엔만 넘으면 된다
 * - 소모품에 걸려 있던 밀봉 포장 의무도 폐지된다
 *
 * 세율은 소비세 10%로 계산한다(면세 대상 대부분이 10% 표준세율 품목).
 * 식품 등 8% 경감세율 품목은 실제 환급액이 이 계산기보다 낮을 수 있다 —
 * 그래서 결과에 "최대"라는 표현을 쓰고 폭을 인정한다.
 */

import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Badge, Card, Screen, Section, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatWonApprox, useFxRate, yenToWon } from '@/lib/fx';

const MIN_YEN = 5_000;
/** 세금 포함가에서 세전가를 역산하는 계수. 소비세 10% 기준. */
const TAX_RATE = 0.1;

export default function TaxFreeScreen() {
  const theme = useTheme();
  const rate = useFxRate();
  const [input, setInput] = useState('');

  const totalYen = Number(input.replace(/[^0-9]/g, '')) || 0;
  const eligible = totalYen >= MIN_YEN;
  // 세금 포함가 = 세전가 × 1.1 → 환급액(세금분) = 세금포함가 × (0.1/1.1)
  const refundYen = eligible ? Math.floor(totalYen * (TAX_RATE / (1 + TAX_RATE))) : 0;
  const refundWon = yenToWon(refundYen, rate);

  return (
    <Screen
      back
      title="면세 계산기"
      subtitle="2026년 11월 1일부터 환급 방식이 통째로 바뀌어요">
      <Section>
        <Card accent={theme.warning}>
          <View style={styles.headRow}>
            <Txt variant="subtitle">가장 크게 바뀌는 것</Txt>
            <Badge label="2026.11.1 시행" tone="warning" />
          </View>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            지금까지는 매장 계산대에서 여권을 보여주면 그 자리에서 세금을 뺀 금액을
            결제했어요. 11월부터는 이 방식이 사라져요.
          </Txt>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            앞으로는 매장에서 세금 포함 정가를 전액 결제하고, 출국할 때 공항 전용
            단말기에서 물건을 실제로 갖고 나간다는 걸 확인받은 다음 세금만큼
            돌려받아요. 매장 따라 환급은 그 자리에서 카드로 받거나, 위탁 환급
            사업자를 거치기도 해요.
          </Txt>
        </Card>
      </Section>

      <Section title="뭐가 달라지나요">
        <Card style={styles.spaced}>
          <Txt variant="subtitle">기준은 그대로 5,000엔</Txt>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            최소 구매 금액 5,000엔은 안 바뀌어요.
          </Txt>
        </Card>
        <Card style={styles.spaced}>
          <Txt variant="subtitle">일반물품 · 소모품 구분이 없어져요</Txt>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            예전엔 화장품·식품 같은 소모품과 다른 물건을 따로 계산해야 했는데, 이제는
            전부 합쳐서 5,000엔만 넘으면 돼요. 소모품에 걸려 있던 50만 엔 상한도
            없어져요.
          </Txt>
        </Card>
        <Card style={styles.spaced}>
          <Txt variant="subtitle">밀봉 포장이 없어져요</Txt>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            소모품을 산 뒤 뜯지 말라고 포장해주던 밀봉 규칙이 사라져요. 여행 중에 바로
            뜯어서 써도 돼요.
          </Txt>
        </Card>
      </Section>

      <Section title="장바구니 계산기" caption="대략적인 금액이에요">
        <Card>
          <Txt variant="caption" color="textTertiary">
            지금까지 산 금액을 다 더해서 넣어보세요 (엔)
          </Txt>
          <TextInput
            value={input}
            onChangeText={setInput}
            keyboardType="numeric"
            placeholder="예: 12000"
            placeholderTextColor={theme.textTertiary}
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
            ]}
          />

          {totalYen > 0 ? (
            eligible ? (
              <View style={[styles.result, { backgroundColor: theme.successSoft }]}>
                <Txt variant="caption" tint={theme.success}>
                  면세 기준(5,000엔)을 넘었어요
                </Txt>
                <Txt variant="display" tint={theme.success} style={styles.gap}>
                  최대 ¥{refundYen.toLocaleString()}
                </Txt>
                {refundWon !== null ? (
                  <Txt variant="caption" color="textTertiary">
                    ({formatWonApprox(refundWon)})
                  </Txt>
                ) : null}
                <Txt variant="caption" color="textTertiary" style={styles.note}>
                  식품이 섞여 있으면 실제로는 이보다 조금 적게 받아요.
                </Txt>
              </View>
            ) : (
              <View style={[styles.result, { backgroundColor: theme.warningSoft }]}>
                <Txt variant="body" tint={theme.warning}>
                  {(MIN_YEN - totalYen).toLocaleString()}엔 더 사야 면세 기준을 넘어요
                </Txt>
              </View>
            )
          ) : null}
        </Card>
      </Section>

      <Txt variant="caption" color="textTertiary">
        제도가 바뀔 수 있어요. 매장이나 공항 안내를 한 번 더 확인해 주세요.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  gap: {
    marginTop: Spacing.two,
  },
  spaced: {
    marginBottom: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginTop: Spacing.two,
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 20,
  },
  result: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.md,
  },
  note: {
    marginTop: Spacing.two,
  },
});
