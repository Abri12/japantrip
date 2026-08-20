import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FX_REFERENCE_URL, FX_SOURCE, formatWonApprox, formatWonRangeApprox, rateFreshnessNote, useFx, useFxRate, yenToWon } from '@/lib/fx';
import { Card } from './card';
import { Txt } from './text';
import { styles } from './styles';

/**
 * 엔화 금액 옆에 원화 어림값을 붙인다.
 *
 * 하나면 「(약 4,800원)」, 금액대면 「(13,000원 ~ 약 22,000원)」.
 * 금액대를 따로 받는 이유는 장소 입장료·식사값이 대개 폭이 있어서다 —
 * 낮은 값 하나만 보여주면 실제보다 싸게 말하는 셈이 된다.
 *
 * 환율을 못 가져온 동안은 **아무것도 그리지 않는다.** 여행 중 로밍이
 * 불안정한 상황을 고려한 정책이라, 「불러오는 중」 같은 자리표시도 두지
 * 않는다(FxCorner 와 같다).
 */
export function KrwEstimate({ yen }: { yen: number | readonly number[] }) {
  const rate = useFxRate();
  const values = typeof yen === 'number' ? [yen] : yen;
  const low = yenToWon(values[0] ?? 0, rate);
  const high = values.length > 1 ? yenToWon(values[1], rate) : null;
  if (low === null) return null;

  return (
    <Txt variant="caption" color="textTertiary">
      ({high === null ? formatWonApprox(low) : formatWonRangeApprox(low, high)})
    </Txt>
  );
}

/**
 * 화면 우측 상단에 붙는 환율 배지.
 *
 * 100엔당 원화로 표시한다 — 1엔당 값(8.88원)보다 100엔당 값(888원)이
 * 실제 여행 중 감을 잡기에 더 익숙한 단위다(한국 뉴스·환전소 표기 관행과 같다).
 * 출처와 고시일을 함께 적어, 이게 실시간 확정가가 아니라 참고용 시세라는 걸
 * 표시 자체에서 알 수 있게 한다.
 *
 * rate 를 못 가져온 동안은 아무것도 그리지 않는다 — KrwEstimate 와 같은 정책이다.
 *
 * ## 왜 두 줄인가
 *
 * 예전에는 네 줄이었다 — 숫자, 「8/20 기준 · 출처」, 낡음 알림,
 * 「실시간은 눌러서 확인 →」. 이 배지는 **모든 화면의 제목 옆에** 붙는데,
 * 회색 잔글씨 네 줄이 제목과 같은 높이를 차지하면서 화면에서 제일 시끄러운
 * 자리가 됐다. 장소 상세처럼 본문이 바로 시작돼야 하는 화면에서 특히 그랬다.
 *
 * 줄인 것은 **중복된 것뿐**이다. 「실시간은 눌러서 확인 →」은 배지 전체가
 * 이미 링크이고 그 뜻이 `accessibilityLabel` 에도 들어 있어서, 화살표 하나로
 * 대신할 수 있었다. 출처와 고시일은 위에 적은 이유로 남긴다 — 이건 장식이
 * 아니라 **이 숫자를 얼마나 믿어야 하는지**를 말해 준다.
 *
 * 낡음 알림은 값이 실제로 낡았을 때만 나오므로 평소에는 두 줄이다.
 */
export function FxCorner() {
  const { rate, rateDate, source } = useFx();
  if (rate === null || rateDate === null) return null;

  const per100 = (rate * 100).toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  // 앱이 불러온 시각(fetchedAt)이 아니라 **환율이 고시된 날짜**를 쓴다.
  // 주말·공휴일에는 값이 마지막 영업일 것이라, 불러온 시각을 적으면
  // 실제보다 최신인 것처럼 오해를 준다.
  const month = rateDate.getMonth() + 1;
  const date = rateDate.getDate();
  const note = rateFreshnessNote(rateDate);

  /*
   * 눌러서 네이버 환율로 넘어간다.
   *
   * 이 값은 하루 한 번 고시되는 기준환율이라 네이버가 보여주는 실시간 숫자와
   * 조금 다르다. 여행 중 「1,490엔이 대충 얼마야」를 가늠하는 데는 충분하지만,
   * 정확한 값이 필요한 사람에게는 익숙한 곳에서 확인할 길을 열어 두는 편이 낫다.
   * 숫자를 감추거나 실시간인 척하는 것보다 정직하다.
   */
  return (
    <Pressable
      onPress={() => Linking.openURL(FX_REFERENCE_URL)}
      accessibilityRole="link"
      accessibilityLabel="네이버에서 실시간 환율 보기"
      style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={fxCornerStyles.box}>
        <Txt variant="bodyBold" color="textSecondary">
          ¥100 ≈ {per100}원
        </Txt>
        {/* 고시일 · 출처 · 누를 수 있다는 표시를 한 줄에 담는다 */}
        <Txt variant="label" color="textTertiary" style={fxCornerStyles.line}>
          {month}/{date} · {source ?? FX_SOURCE} ›
        </Txt>
        {/* 값이 실제로 낡았을 때만 나온다. 평소에는 두 줄로 끝난다 */}
        {note ? (
          <Txt variant="label" color="textTertiary" style={fxCornerStyles.line}>
            {note}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

const fxCornerStyles = StyleSheet.create({
  box: {
    alignItems: 'flex-end',
  },
  // label(12px)보다 한 단계 더 눌러서 환율 숫자와의 크기 차이를 분명히 준다
  line: {
    marginTop: Spacing.half,
    fontSize: 10,
    lineHeight: 13,
  },
});

export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

/** 내용이 없을 때. 빈 화면을 그대로 두지 않는다. */
export function Empty({ text }: { text: string }) {
  return (
    <Card>
      <Txt variant="body" color="textTertiary">
        {text}
      </Txt>
    </Card>
  );
}

