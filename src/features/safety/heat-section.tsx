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

  /* WarningSection 과 같다 — 도시가 바뀌면 라우트가 key 로 갈아끼운다.
     phase 도 같이 초기값으로 돌아가는데, heat 가 null 인 동안에는 화면에
     쓰이지 않아서(제목이 「오늘 무더위」로 고정) 티가 나지 않는다. */
  useEffect(() => {
    fetchWeather(city.lat, city.lng).then((w) => {
      if (!w) return;
      // 밤에는 조언이 바뀐다 — 「한낮을 피하세요」는 이미 지난 이야기라
      // 열대야 쪽으로 내용을 옮겨야 한다.
      const p = dayPhase(w.sunrise, w.sunset);
      setPhase(p);
      setHeat(tempHazard(w.feelsLikeC, p));
    });
  }, [city]);

  // 날씨 화면과 같은 매핑을 쓴다(tempHazardColorName). 화면마다 따로 계산하면
  // 같은 등급인데 색이 갈린다 — 실제로 그런 상태였다.
  const colorName = heat ? tempHazardColorName(heat) : 'text';
  const color = colorName === 'text' ? theme.success : theme[colorName];

  /*
   * 뱃지 색도 카드 색과 같은 기준으로 낸다.
   *
   * 예전에는 여기서 따로 계산해서 severe 를 빨강 뱃지로 올렸는데, 카드 띠는
   * 노랑이라 한 카드 안에서 두 색이 다른 말을 했다. 심각도를 말하는 자리가
   * 둘이면 둘 중 하나는 반드시 틀리게 된다.
   */
  const badgeTone = colorName === 'danger' ? 'danger' : colorName === 'warning' ? 'warning' : 'success';

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
            <Badge label={heat.shortLabel} tone={badgeTone} />
          </View>

          {/* 판정의 근거를 숫자로 함께 보여준다.
              「31°인데 왜 매우 위험이지」가 이 화면을 못 믿게 만들던 이유였다.
              등급을 정한 값이 체감온도이므로 그 값을 그대로 옆에 둔다 —
              색과 숫자와 문구가 같은 것을 가리켜야 말이 된다. */}
          <Txt variant="bodyBold" tint={color} style={styles.tiny}>
            지금 체감온도 {heat.feelsLikeC}°
          </Txt>

          <Txt variant="body" color="textSecondary" style={styles.gap}>
            {heat.advice}
          </Txt>
        </Card>
      )}
    </Section>
  );
}
