import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FX_REFERENCE_URL, FX_SOURCE, formatWonApprox, rateFreshnessNote, useFx, useFxRate, yenToWon } from '@/lib/fx';
import { Card } from './card';
import { Txt } from './text';
import { styles } from './styles';

export function KrwEstimate({ yen }: { yen: number }) {
  const rate = useFxRate();
  const won = yenToWon(yen, rate);
  if (won === null) return null;

  return (
    <Txt variant="caption" color="textTertiary">
      ({formatWonApprox(won)})
    </Txt>
  );
}

/**
 * 화면 우측 상단에 붙는 환율 배지.
 *
 * 100엔당 원화로 표시한다 — 1엔당 값(8.88원)보다 100엔당 값(888원)이
 * 실제 여행 중 감을 잡기에 더 익숙한 단위다(한국 뉴스·환전소 표기 관행과 같다).
 * 출처와 데이터를 받아온 시각을 함께 적어, 이게 실시간 확정가가 아니라
 * 참고용 시세라는 걸 표시 자체에서 알 수 있게 한다.
 *
 * rate 를 못 가져온 동안은 아무것도 그리지 않는다 — KrwEstimate 와 같은 정책이다.
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
        <Txt variant="label" color="textTertiary" style={fxCornerStyles.line}>
          {month}/{date} 기준 · {source ?? FX_SOURCE}
        </Txt>
        {note ? (
          <Txt variant="label" color="textTertiary" style={fxCornerStyles.line}>
            {note}
          </Txt>
        ) : null}
        <Txt variant="label" color="textTertiary" style={fxCornerStyles.line}>
          실시간은 눌러서 확인 →
        </Txt>
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

