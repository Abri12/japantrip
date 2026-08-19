import { View } from 'react-native';

import { TempTrend } from '@/components/temp-trend';
import { Badge, Card, Section, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { withEunNeun } from '@/lib/korean';
import { WeatherData, clothingAdvice, dayPhase, dayTrends, rainWindows, tempHazard, tempHazardColorName, tempHazardTitle, uvRisk, weatherCondition, windRisk } from '@/lib/weather';

import { RainWindowCard } from './rain-window-card';
import { RiskCard } from './risk-card';
import { styles } from './styles';

export function WeatherBody({
  city,
  weather,
}: {
  city: { name: string; prefecture: string };
  weather: WeatherData;
}) {
  const theme = useTheme();
  const advice = clothingAdvice(weather.feelsLikeC, weather.humidity);
  const windows = rainWindows(weather.hourly);
  const trends = dayTrends(weather);
  const condition = weatherCondition(weather.weatherCode);
  // 조언의 시제를 지금에 맞춘다. 해가 진 뒤에는 「한낮을 피하세요」가 이미
  // 지난 이야기이고, 자외선·바람의 하루 최댓값도 오늘 몫은 끝난 값이다.
  const phase = dayPhase(weather.sunrise, weather.sunset);
  const heat = tempHazard(weather.feelsLikeC, phase);

  // 체감온도 숫자에 칠할 색. 팔레트 이름으로 받아 여기서 실제 색으로 바꾼다.
  const colorName = tempHazardColorName(heat);
  const feelsColor = colorName === 'text' ? theme.text : theme[colorName];
  // 「괜찮음」·「주의」까지 라벨에 붙이면 온화한 날에도 경고처럼 보인다.
  // 색이 실제로 바뀌는 구간에서만 등급 이름을 함께 보여주고, 그때는 글자도
  // 한 단계 키워 볼드로 쓴다 — 색 하나로는 훑는 눈에 안 걸린다.
  const showTempTier = colorName !== 'text';

  // 카드 띠도 숫자와 같은 매핑을 쓴다. 예전에는 여기만 따로 계산해서
  // 「경고」 등급인데 숫자는 주황, 카드 띠는 빨강으로 갈리는 상태였다.
  // 위험이 없을 때(text)는 초록으로 — 상태 카드에서는 「이상 없음」이 정보다.
  const heatColor = colorName === 'text' ? theme.success : theme[colorName];

  return (
    <>
      <Section>
        <Card>
          <View style={styles.conditionRow}>
            <Txt style={styles.conditionEmoji}>{condition.emoji}</Txt>
            <Txt variant="title" color="textSecondary">
              {condition.label}
            </Txt>
          </View>

          {/* 세 칸을 똑같은 폭으로 나누고(flex: 1) 각 칸 안에서 가운데 정렬한다.
              예전에는 칸이 글자 폭만 차지하고 space-around 로 밀려 있었다.
              그러면 「26°」가 「실제 기온」보다 좁아서 숫자가 라벨 왼쪽으로
              치우쳐 보이고, 가운데 구분선도 정확히 3등분 자리에 오지 않는다. */}
          <View style={styles.tempRow}>
            <View style={styles.tempCol}>
              <Txt variant="display">{Math.round(weather.tempC)}°</Txt>
              <Txt variant="body" color="textSecondary">
                실제 기온
              </Txt>
            </View>
            <View style={[styles.vline, { backgroundColor: theme.border }]} />
            {/* 체감온도만 위험도에 따라 색이 바뀐다. 기온·습도는 그냥 수치지만
                체감온도는 「지금 나가도 되나」에 바로 걸리는 값이라서다.
                색 기준은 tempHazardColorName() — 더위는 체감 35℃ 빨강 ·
                30℃ 노랑, 추위는 동상 경고 기준이다. 색을 정하는 값과 여기
                찍히는 큰 숫자가 **같은 값**이라 「왜 이 색이지」가 안 생긴다.

                색만으로 뜻을 전달하지 않는다. 등급 이름을 라벨에 함께 적어야
                색약이거나 화면이 밝은 곳에서도 통한다. */}
            <View style={styles.tempCol}>
              <Txt
                variant="display"
                tint={feelsColor}
                style={showTempTier ? styles.feelsEmphasis : undefined}>
                {Math.round(weather.feelsLikeC)}°
              </Txt>
              <Txt variant={showTempTier ? 'bodyBold' : 'body'} tint={feelsColor}>
                체감온도{showTempTier ? ` · ${heat.shortLabel}` : ''}
              </Txt>
            </View>
            <View style={[styles.vline, { backgroundColor: theme.border }]} />
            <View style={styles.tempCol}>
              <Txt variant="display">{weather.humidity}%</Txt>
              <Txt variant="body" color="textSecondary">
                습도
              </Txt>
            </View>
          </View>
        </Card>
      </Section>

      {/* 지금 기온 바로 아래에 둔다. 「지금 몇 도」를 본 다음 자연스럽게 따라오는
          질문이 「그럼 몇 시에 나가지」라서, 두 카드가 붙어 있어야 이어 읽힌다. */}
      <Section title="시간별 추이" caption="언제 나갈지 정할 때 보세요">
        <TempTrend trends={trends} />
      </Section>

      <Section title="오늘 옷차림">
        <Card accent={theme.primary}>
          <Txt style={styles.adviceEmoji}>{advice.emoji}</Txt>
          <Txt variant="title" style={styles.gap}>
            {advice.title}
          </Txt>
          {advice.tips.map((tip, i) => (
            <Txt
              key={i}
              variant="body"
              color="textSecondary"
              style={i === 0 ? styles.gap : styles.tipGap}>
              · {tip}
            </Txt>
          ))}
        </Card>
      </Section>

      <Section title={tempHazardTitle(heat, phase)}>
        <Card accent={heatColor}>
          <View style={styles.heatRow}>
            <Txt style={styles.adviceEmoji}>{heat.emoji}</Txt>
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
          <Txt variant="title" style={styles.gap}>
            {heat.headline}
          </Txt>
          <Txt variant="body" color="textSecondary" style={styles.tipGap}>
            {heat.advice}
          </Txt>
        </Card>
      </Section>

      {/* 밤에는 두 카드가 모두 내일 기준이 된다. 제목만 보고 오늘 이야기로
          오해하지 않게 캡션으로 한 번 알려준다. */}
      <Section title="자외선" caption={phase === 'night' ? '해가 져서 내일 기준이에요' : undefined}>
        <RiskCard
          risk={uvRisk(weather.uvIndexMax, { phase, tomorrowMax: weather.uvIndexMaxTomorrow })}
        />
      </Section>

      <Section title="바람" caption={phase === 'night' ? '해가 져서 내일 기준이에요' : undefined}>
        <RiskCard
          risk={windRisk(weather.windGustsMaxKmh, {
            phase,
            tomorrowGustKmh: weather.windGustsMaxTomorrowKmh,
          })}
        />
      </Section>

      <Section
        title="우산이 필요한 시간"
        caption={windows.length === 0 ? undefined : '오늘 남은 시간 기준이에요'}>
        {windows.length === 0 ? (
          <Card>
            <Txt variant="body" color="textSecondary">
              오늘 {withEunNeun(city.name)} 우산 없이 다녀도 괜찮을 것 같아요.
            </Txt>
          </Card>
        ) : (
          windows.map((w, i) => <RainWindowCard key={i} window={w} />)
        )}
      </Section>
    </>
  );
}
