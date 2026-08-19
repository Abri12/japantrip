import { Link } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Card, Txt } from '@/components/ui';
import { City } from '@/data/cities';
import { useQuakes } from '@/hooks/use-quakes';
import { useTheme } from '@/hooks/use-theme';
import {
  ActiveWarning,
  WarningReport,
  fetchWarnings,
  travelCriticalWarnings,
} from '@/lib/jma-warnings';
import { regionLabel } from '@/lib/place-names';
import { eewScaleForPrefecture, parseJst, scaleLabel, severityOf, timeAgo } from '@/lib/quake';
import {
  WeatherData,
  dayPhase,
  fetchWeather,
  tempHazard,
  tempHazardColorName,
  weatherCondition,
} from '@/lib/weather';
import { styles } from './styles';

/**
 * 홈 「지금 상황」 — 날씨가 주인공이고 지진은 한 줄이다.
 *
 * ── 왜 합쳤나 ────────────────────────────────────────
 *
 * 전에는 지진 카드와 날씨 카드가 같은 크기로 나란히 있었다. 그런데 지진은
 * **가끔 있는 일**이라, 화면 대부분의 시간 동안 그 카드는 「지진 걱정은 없어요 /
 * 최근 느껴진 지진이 없어요」라는 두 줄짜리 부정문만 차지했다. 홈에서 가장 잘
 * 읽히는 자리를 아무 일도 없다는 말이 가져간 셈이다.
 *
 * 반대로 날씨는 **매일 매 순간 쓰인다.** 그래서 비중을 실제 쓰임에 맞췄다 —
 * 휴대폰 날씨 위젯처럼 이모지와 기온이 카드의 주인공이고, 지진은 맨 아래
 * 한 줄로 접힌다.
 *
 * 기상특보(태풍·호우)는 지진 쪽이 아니라 **날씨 구역 안**에 둔다. 특보는 그
 * 자체가 날씨 이야기고, 오늘 일정을 바꿀지 말지에 기온·더위와 함께 읽히는
 * 정보이기 때문이다.
 *
 * ── 한 가지 예외 ─────────────────────────────────────
 *
 * 내가 있는 도시에 긴급지진속보가 내리면 그때는 몇 초 뒤에 흔들린다는 뜻이라,
 * 그것만은 날씨 위로 올라온다. 접는 것은 위험의 부재이지 위험 자체가 아니다.
 *
 * ── 카드는 하나지만 누르는 곳은 둘이다 ───────────────
 *
 * 합치면서 목적지가 하나로 줄면 「매우 위험한 더위예요」를 눌렀는데 기온이 없는
 * 안전 탭에 도착하는 일이 생긴다. 그래서 카드 안을 구역으로 나누고 각자 갈
 * 곳을 갖게 했다 — 날씨 구역은 `/weather`, 지진 구역은 `/safety`.
 * 구분선은 장식이 아니라 **누르는 경계**를 보여주는 표시다.
 */
export function NowStatusCard({ city }: { city: City }) {
  const theme = useTheme();
  const { quakes, eew, loading: quakesLoading } = useQuakes();
  const [warnings, setWarnings] = useState<WarningReport | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetchWarnings(city.jmaAreaCode).then(setWarnings);
    fetchWeather(city.lat, city.lng).then(setWeather);
  }, [city]);

  // ── 지진 ────────────────────────────────────────────
  const activeEew = eew.filter((e) => !e.cancelled);

  // 「일본 어딘가에 경보」와 「내가 있는 곳에 경보」는 완전히 다른 정보다.
  // 규슈 지진에 도쿄 여행자가 놀라면 정작 진짜 위험할 때의 경고도 무뎌진다.
  const myEew = activeEew.find((e) => eewScaleForPrefecture(e, city.prefecture) !== null);
  const otherEew = myEew ? null : (activeEew[0] ?? null);
  const myEewScale = myEew ? eewScaleForPrefecture(myEew, city.prefecture) : null;

  // 이 도시가 속한 도도부현이 최근에 흔들린 적 있는지 본다.
  const localQuake = quakes.find((q) => q.points.some((p) => p.pref === city.prefecture));

  // ── 기상특보 ────────────────────────────────────────
  const critical: ActiveWarning[] = warnings ? travelCriticalWarnings(warnings) : [];
  const hasEmergency = critical.some((w) => w.severity === 'emergency');

  // ── 날씨 ────────────────────────────────────────────
  // 해가 진 뒤에는 더위 문구가 열대야 쪽으로 바뀐다. 홈과 상세 화면이 같은
  // 판정을 써야 등급이 어긋나지 않는다.
  const phase = weather ? dayPhase(weather.sunrise, weather.sunset) : 'day';
  const heat = weather ? tempHazard(weather.feelsLikeC, phase) : null;
  const condition = weather ? weatherCondition(weather.weatherCode) : null;
  // 「경고할 만한 더위인가」의 기준을 색과 같은 자리에서 낸다. 예전에는
  // warning 등급까지 여기 들어와서, 색은 안 칠해지는데 뱃지만 노랗게 뜨는
  // 날이 있었다.
  const heatAlert = heat !== null && (heat.level === 'severe' || heat.level === 'danger');

  /**
   * 날씨 구역 뱃지 — 특보와 더위 중 더 센 쪽.
   *
   * 문구는 안쪽 상세 화면과 **같은 값**을 써야 한다. 대부분의 사용자는 홈
   * 카드만 보고 들어가지 않기 때문에, 여기 뜬 등급이 곧 그 사람이 아는 전부다.
   * 안쪽보다 약하게 표시하면 위험을 낮게 알린 셈이 된다.
   */
  const weatherBadge: { label: string; tone: 'danger' | 'warning' | 'success' | 'primary' } | null =
    hasEmergency
      ? { label: '위험', tone: 'danger' }
      : critical.length > 0 && !heatAlert
        ? { label: '경보', tone: 'warning' }
        : heat
          ? {
              label: heat.shortLabel,
              tone:
                heat.level === 'danger'
                  ? 'danger'
                  : heatAlert
                    ? 'warning'
                    : heat.kind === 'cold'
                      ? 'primary'
                      : 'success',
            }
          : null;

  /**
   * 카드 왼쪽 띠 색.
   *
   * 색 기준을 여기서 새로 만들지 않는다 — `tempHazardColorName()` 하나를
   * 재사용해야 홈과 날씨 화면의 색이 어긋나지 않는다.
   */
  const heatColorName = heat ? tempHazardColorName(heat) : 'text';
  const heatTint = heatColorName === 'text' ? theme.textSecondary : theme[heatColorName];
  const accent = myEew
    ? theme.danger
    : hasEmergency || heat?.level === 'danger'
      ? theme.danger
      : critical.length > 0 || heatAlert
        ? theme.warning
        : heat
          ? heatColorName === 'text'
            ? theme.success
            : theme[heatColorName]
          : theme.border;

  /**
   * 지진 한 줄.
   *
   * 아직 안 받아온 상태에서 「최근 지진은 없어요」라고 적지 않는다. 확인한 적
   * 없는 사실을 확인한 것처럼 말하는 셈이고, 안전 정보에서 그건 그냥 틀린
   * 안심이다. 그래서 로딩 중에는 로딩이라고 적는다.
   */
  const quakeLine: ReactNode = quakesLoading ? (
    <Txt variant="caption" color="textTertiary" style={styles.flexShrink}>
      지진 정보를 확인하고 있어요
    </Txt>
  ) : localQuake ? (
    <Txt variant="caption" color="textSecondary" style={styles.flexShrink}>
      최근 {city.name} 근처 · {regionLabel(localQuake.earthquake.hypocenter.name)}{' '}
      <Txt variant="caption" tint={severityTint(theme, localQuake.earthquake.maxScale)}>
        {scaleLabel(localQuake.earthquake.maxScale)}
      </Txt>{' '}
      · {timeAgo(parseJst(localQuake.earthquake.time))}
    </Txt>
  ) : otherEew ? (
    <Txt variant="caption" color="textSecondary" style={styles.flexShrink}>
      {regionLabel(otherEew.earthquake.hypocenter.name)}에 지진 속보 · {city.name}은 대상 지역이
      아니에요
    </Txt>
  ) : (
    <Txt variant="caption" color="textTertiary" style={styles.flexShrink}>
      최근 느껴진 지진은 없어요
    </Txt>
  );

  const divider = <View style={[styles.zoneDivider, { backgroundColor: theme.border }]} />;

  return (
    <Card accent={accent} padded={false}>
      {/* 내 도시에 긴급지진속보 — 이때만 지진이 날씨 위로 올라온다 */}
      {myEew ? (
        <>
          <Zone href="/safety">
            <View style={styles.statusHead}>
              <Txt variant="subtitle">{city.name}에 긴급지진속보가 내렸어요</Txt>
              <View style={styles.zoneTrailing}>
                <Badge label="위험" tone="danger" />
                <Chevron />
              </View>
            </View>
            <Txt variant="body" color="textSecondary" style={styles.statusBody}>
              {regionLabel(myEew.earthquake.hypocenter.name)} · M
              {myEew.earthquake.hypocenter.magnitude}
              {myEewScale !== null ? ` · 예상 ${scaleLabel(myEewScale)}` : ''}
            </Txt>
          </Zone>
          {divider}
        </>
      ) : null}

      {/* 날씨 구역 — 이모지와 기온이 카드의 주인공이다 */}
      <Zone href="/weather">
        {weather && condition && heat ? (
          <>
            <View style={styles.widget}>
              <Txt style={styles.widgetEmoji}>{condition.emoji}</Txt>
              <View style={styles.widgetBody}>
                <View style={styles.widgetTempLine}>
                  <Txt variant="display">{Math.round(weather.tempC)}°</Txt>
                  <Txt variant="body" color="textSecondary">
                    {condition.label}
                  </Txt>
                </View>
                {/* 최저·최고를 못 받았으면 줄 자체를 안 그린다. 0° 로 떨어뜨리면
                    여름 오사카에서 「최저 0°」라는 틀린 값이 찍힌다. */}
                {/* 체감온도를 먼저 둔다. 아래 「매우 위험한 더위예요」의 근거가
                    이 숫자이고, 근거 없이 판정만 있으면 안 믿긴다. 최저·최고는
                    못 받았으면 그 부분만 뺀다 — 0° 로 떨어뜨리면 여름 오사카에
                    「최저 0°」라는 틀린 값이 찍힌다. */}
                <Txt variant="caption" color="textTertiary">
                  <Txt variant="caption" tint={heatTint}>
                    체감 {Math.round(weather.feelsLikeC)}°
                  </Txt>
                  {weather.tempMinC !== null && weather.tempMaxC !== null
                    ? ` · 최저 ${Math.round(weather.tempMinC)}° · 최고 ${Math.round(weather.tempMaxC)}°`
                    : ''}
                </Txt>
              </View>
              <View style={styles.zoneTrailing}>
                {weatherBadge ? (
                  <Badge label={weatherBadge.label} tone={weatherBadge.tone} />
                ) : null}
                <Chevron />
              </View>
            </View>

            {/* 첨언 — 「위험한 더위예요」와 그래서 뭘 하면 되는지 */}
            <Txt variant="bodyBold" tint={heatTint} style={styles.statusBody}>
              {heat.headline}
            </Txt>
            <Txt variant="body" color="textSecondary" style={styles.hazardLine}>
              {heat.advice}
            </Txt>
          </>
        ) : (
          // 날씨를 아직 못 받아온 상태. 빈 자리를 두느니 뭘 하는 중인지 적는다.
          <View style={styles.zoneLine}>
            <Txt variant="body" color="textTertiary">
              날씨를 가져오고 있어요
            </Txt>
            <Chevron />
          </View>
        )}

        {/* 특보는 날씨 이야기라 이 구역 안에 둔다. 걸려 있으면 무슨 특보인지가
            가장 급하고, 없다는 사실은 확인했다는 표시로만 작게 남긴다. */}
        {critical.length > 0 ? (
          <Txt variant="bodyBold" tint={theme.warning} style={styles.hazardLine}>
            기상특보 · {critical.map((w) => w.label).join(', ')}
          </Txt>
        ) : warnings !== null ? (
          <Txt variant="caption" color="textTertiary" style={styles.quietLine}>
            발효 중인 기상특보는 없어요
          </Txt>
        ) : null}
      </Zone>

      {/* 지진 구역 — 평소에는 한 줄이면 충분하다 */}
      {divider}
      <Zone href="/safety">
        <View style={styles.zoneLine}>
          {quakeLine}
          <Chevron />
        </View>
      </Zone>
    </Card>
  );
}

/**
 * 카드 안에서 따로 눌리는 한 구역.
 *
 * 카드 자체의 padding 을 끄고(`padded={false}`) 구역마다 안쪽 여백을 주는 이유는
 * 구분선이 카드 폭을 꽉 채워야 해서다. 여백 안에서 선을 그으면 양옆이 떠서
 * 「경계」가 아니라 「장식」으로 읽힌다.
 */
function Zone({ href, children }: { href: '/weather' | '/safety'; children: ReactNode }) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => (pressed ? styles.pressed : null)}>
        {/* 여백은 Pressable 이 아니라 안쪽 View 가 갖는다. `Link asChild` 는
            자식의 style 을 자기 것으로 덮어써서, Pressable 에 준 padding 이
            웹에서 사라진다(카드가 위아래로 납작해진다). */}
        <View style={styles.zone}>{children}</View>
      </Pressable>
    </Link>
  );
}

/** 이 구역이 눌린다는 표시. 목록의 `Row` 와 같은 기호를 쓴다. */
function Chevron() {
  return (
    <Txt variant="body" color="textTertiary">
      ›
    </Txt>
  );
}

/** 진도 색 — 안전 탭과 같은 severityOf() 구분을 쓴다. */
function severityTint(theme: ReturnType<typeof useTheme>, scale: number): string {
  switch (severityOf(scale)) {
    case 'danger':
      return theme.danger;
    case 'warning':
    case 'caution':
      return theme.warning;
    default:
      return theme.success;
  }
}
