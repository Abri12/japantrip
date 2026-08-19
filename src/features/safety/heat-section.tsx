import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Badge, Card, Empty, Section, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { DayPhase, TempHazardInfo, dayPhase, fetchWeather, tempHazard, tempHazardColorName, tempHazardTitle } from '@/lib/weather';

import { styles } from './styles';

/** 체감온도 기반 더위·추위 위험도. 산출 방식은 lib/weather.ts 의 tempHazard() 참조. */
export function HeatSection({ city }: { city: { lat: number; lng: number } }) {
  const theme = useTheme();
  const [heat, setHeat] = useState<TempHazardInfo | null>(null);
  const [phase, setPhase] = useState<DayPhase>('day');

  useEffect(() => {
    setHeat(null);
    fetchWeather(city.lat, city.lng).then((w) => {
      if (!w) return;
      // 밤에는 조언이 바뀐다 — 「한낮을 피하세요」는 이미 지난 이야기라
      // 열대야 쪽으로 내용을 옮겨야 한다.
      const p = dayPhase(w.sunrise, w.sunset);
      setPhase(p);
      setHeat(tempHazard(w.tempC, w.humidity, w.feelsLikeC, p));
    });
  }, [city]);

  // 날씨 화면과 같은 매핑을 쓴다(tempHazardColorName). 화면마다 따로 계산하면
  // 같은 등급인데 색이 갈린다 — 실제로 그런 상태였다.
  const colorName = heat ? tempHazardColorName(heat) : 'text';
  const color = colorName === 'text' ? theme.success : theme[colorName];

  return (
    <Section title={heat ? tempHazardTitle(heat, phase) : '오늘 무더위'}>
      {heat === null ? (
        <Empty text="불러오고 있어요" />
      ) : (
        <Card accent={color}>
          <View style={styles.head}>
            <Txt variant="title">
              {heat.emoji} {heat.headline}
            </Txt>
            <Badge
              label={heat.shortLabel}
              tone={
                heat.level === 'danger' || heat.level === 'severe'
                  ? 'danger'
                  : heat.level === 'warning' || heat.level === 'caution'
                    ? 'warning'
                    : 'success'
              }
            />
          </View>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            {heat.advice}
          </Txt>
        </Card>
      )}
    </Section>
  );
}
