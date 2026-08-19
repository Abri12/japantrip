import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, Chip, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DayTrend, HourPoint, tempHazardColorName } from '@/lib/weather';

/** 'YYYY-MM-DD' → '8/18'. 문자열을 그대로 잘라 쓴다 — Date 로 다시 파싱하면 기기 시간대에 따라 하루 밀릴 수 있다. */
function shortDate(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

/**
 * 시간별 체감온도 추이 — 오늘 / 내일.
 *
 * 숫자를 더 늘리지 않는 게 이 화면의 요령이다. 이미 큰 숫자로 지금 기온·체감·습도가
 * 있으니, 여기서 할 일은 **언제 나가면 안 되는지를 색으로 보이게** 하는 것이다.
 * 그래서 막대 높이는 체감온도, 색은 위험도 등급으로 칠하고, 글자는 시각과
 * 온도 두 개만 남겼다.
 *
 * 색 기준은 큰 숫자에 쓴 것과 같은 `tempHazardColorName()` 이다. 다른 기준을 쓰면
 * 「지금은 빨강인데 그래프의 지금 칸은 주황」 같은 모순이 바로 보인다.
 */
export function TempTrend({ trends }: { trends: DayTrend[] }) {
  const theme = useTheme();
  const [dayIndex, setDayIndex] = useState(0);

  if (trends.length === 0) return null;
  const day = trends[Math.min(dayIndex, trends.length - 1)];

  // 막대 높이 기준. 하루 안의 최저~최고로 잡으면 온화한 날에도 그래프가 요란해
  // 보이므로, 두 날을 합친 범위로 고정해 오늘·내일을 눈으로 비교할 수 있게 한다.
  const all = trends.flatMap((t) => t.hours);
  const lo = Math.min(...all.map((p) => p.feelsLikeC));
  const hi = Math.max(...all.map((p) => p.feelsLikeC));
  const span = Math.max(1, hi - lo);

  return (
    <Card>
      <View style={styles.tabs}>
        {trends.map((t, i) => (
          <Chip
            key={t.date}
            label={`${i === 0 ? '오늘' : '내일'} (${shortDate(t.date)})`}
            active={i === dayIndex}
            onPress={() => setDayIndex(i)}
          />
        ))}
      </View>

      {/* 최저·최고를 먼저 말로 준다. 그래프를 읽지 않아도 하루 윤곽이 잡힌다. */}
      <Txt variant="body" color="textSecondary" style={styles.summary}>
        체감 {Math.round(day.minFeels.feelsLikeC)}° ~ {Math.round(day.maxFeels.feelsLikeC)}° ·
        가장 더운 때는 {day.maxFeels.hour}시예요
      </Txt>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chart}>
        {day.hours.map((p) => (
          <HourBar key={p.hour} point={p} lo={lo} span={span} />
        ))}
      </ScrollView>

      {/* 색이 무슨 뜻인지 적어 둔다. 색만으로 뜻을 전달하지 않는다는 원칙은
          노선 색 점·체감온도 숫자와 같다. */}
      <View style={styles.legend}>
        <LegendDot color={theme.danger} label="위험" />
        <LegendDot color={theme.warning} label="주의·경고" />
        <LegendDot color={theme.textTertiary} label="보통" />
        <LegendDot color={theme.cold} label="추위" />
      </View>
    </Card>
  );
}

function HourBar({ point, lo, span }: { point: HourPoint; lo: number; span: number }) {
  const theme = useTheme();
  const name = tempHazardColorName(point.hazard);
  // 'text' 는 위험이 없는 구간이다. 큰 숫자에서는 본문색이지만 막대에서는
  // 회색이어야 색이 있는 구간(주황·빨강)이 도드라진다.
  const color = name === 'text' ? theme.textTertiary : theme[name];

  const MAX_H = 76;
  const MIN_H = 8;
  const height = MIN_H + ((point.feelsLikeC - lo) / span) * (MAX_H - MIN_H);

  return (
    <View style={styles.col}>
      <Txt variant="caption" color={point.now ? 'text' : 'textTertiary'}>
        {Math.round(point.feelsLikeC)}
      </Txt>
      <View style={styles.barArea}>
        <View style={[styles.bar, { height, backgroundColor: color }]} />
      </View>
      {/* 비 올 확률이 높은 시간은 물방울로 표시한다. 우산 시간대 섹션이 따로
          있지만, 추이를 보며 일정을 짤 때 같은 자리에서 보이는 게 낫다. */}
      <Txt variant="caption" color="textTertiary" style={styles.rain}>
        {point.rainProbability >= 50 ? '☂' : ' '}
      </Txt>
      <Txt
        variant="caption"
        color={point.now ? 'text' : 'textTertiary'}
        style={point.now ? styles.nowLabel : undefined}>
        {point.now ? '지금' : point.hour}
      </Txt>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Txt variant="caption" color="textTertiary">
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  summary: {
    marginTop: Spacing.three,
  },
  chart: {
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  col: {
    alignItems: 'center',
    width: 26,
  },
  barArea: {
    height: 80,
    justifyContent: 'flex-end',
    marginTop: Spacing.one,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  rain: {
    marginTop: Spacing.half,
  },
  nowLabel: {
    fontFamily: undefined,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
