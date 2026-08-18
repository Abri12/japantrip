import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Card, Empty, Screen, Section, Txt } from '@/components/ui';
import { TempTrend } from '@/components/temp-trend';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withEunNeun } from '@/lib/korean';
import { useSelectedCity } from '@/lib/selected-city';
import {
  DailyRisk,
  RainWindow,
  WeatherData,
  clothingAdvice,
  dayPhase,
  dayTrends,
  tempHazardColorName,
  tempHazardTitle,
  fetchWeather,
  rainWindows,
  tempHazard,
  uvRisk,
  weatherCondition,
  windRisk,
} from '@/lib/weather';

export default function WeatherScreen() {
  const { city } = useSelectedCity();
  const theme = useTheme();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    fetchWeather(city.lat, city.lng)
      .then(setWeather)
      .finally(() => setLoading(false));
  }, [city]);

  if (!city) {
    return (
      <Screen back title="오늘 날씨">
        <Empty text="먼저 홈에서 도시를 골라 주세요." />
      </Screen>
    );
  }

  return (
    <Screen back title={`${city.name} 오늘 날씨`} subtitle="체감온도와 습도로 옷차림을 알려드려요">
      {loading ? (
        // 다른 화면의 로딩 문구와 같은 말을 쓴다. 여기만 줄임표까지 붙어 있어서
        // 같은 상태가 화면마다 다르게 보였다.
        <Empty text="불러오고 있어요" />
      ) : !weather ? (
        <Card accent={theme.warning}>
          <Txt variant="subtitle">날씨를 못 가져왔어요</Txt>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            인터넷 연결을 확인하고 다시 열어봐 주세요.
          </Txt>
        </Card>
      ) : (
        <WeatherBody city={city} weather={weather} />
      )}
    </Screen>
  );
}

function WeatherBody({
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
  const heat = tempHazard(weather.tempC, weather.humidity, weather.feelsLikeC, phase);

  // 체감온도 숫자에 칠할 색. 팔레트 이름으로 받아 여기서 실제 색으로 바꾼다.
  const colorName = tempHazardColorName(heat);
  const feelsColor = colorName === 'text' ? theme.text : theme[colorName];
  // 「괜찮음」·「주의」까지 라벨에 붙이면 온화한 날에도 경고처럼 보인다.
  // 색이 실제로 바뀌는 구간에서만 등급 이름을 함께 보여준다.
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
                색 기준은 tempHazardColorName() — 환경성 열중증 WBGT 구분과
                동상 경고 기준을 그대로 따른다.

                색만으로 뜻을 전달하지 않는다. 등급 이름을 라벨에 함께 적어야
                색약이거나 화면이 밝은 곳에서도 통한다. */}
            <View style={styles.tempCol}>
              <Txt variant="display" tint={feelsColor}>
                {Math.round(weather.feelsLikeC)}°
              </Txt>
              <Txt variant="body" tint={feelsColor}>
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

/** 자외선·바람 카드 — 둘 다 같은 {emoji, headline, advice, shortLabel} 모양이라 공유한다. */
function RiskCard({ risk }: { risk: DailyRisk }) {
  const theme = useTheme();
  const color =
    risk.level === 'extreme' || risk.level === 'veryHigh'
      ? theme.danger
      : risk.level === 'high'
        ? theme.warning
        : theme.success;
  const tone = risk.level === 'extreme' || risk.level === 'veryHigh'
    ? 'danger'
    : risk.level === 'high'
      ? 'warning'
      : 'success';

  return (
    <Card accent={color}>
      <View style={styles.heatRow}>
        <Txt style={styles.adviceEmoji}>{risk.emoji}</Txt>
        <Badge label={risk.shortLabel} tone={tone} />
      </View>
      <Txt variant="title" style={styles.gap}>
        {risk.headline}
      </Txt>
      <Txt variant="body" color="textSecondary" style={styles.tipGap}>
        {risk.advice}
      </Txt>
    </Card>
  );
}

function RainWindowCard({ window }: { window: RainWindow }) {
  const theme = useTheme();
  const label =
    window.startHour === window.endHour
      ? `${window.startHour}시`
      : `${window.startHour}~${window.endHour + 1}시`;

  return (
    <Card accent={theme.warning} style={styles.rainCard}>
      <View style={styles.rainRow}>
        <Txt variant="subtitle">☔ {label}</Txt>
        <Txt variant="caption" color="textTertiary">
          강수확률 최대 {window.maxProbability}%
        </Txt>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: {
    marginTop: Spacing.two,
  },
  tipGap: {
    marginTop: Spacing.one,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  conditionEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  heatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempCol: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  vline: {
    width: 1,
    height: 40,
  },
  adviceEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  rainCard: {
    marginBottom: Spacing.two,
  },
  rainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
