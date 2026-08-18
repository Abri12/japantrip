import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Badge, Card, Txt } from '@/components/ui';
import { City } from '@/data/cities';
import { useTheme } from '@/hooks/use-theme';
import { ActiveWarning, WarningReport, fetchWarnings, travelCriticalWarnings } from '@/lib/jma-warnings';
import { TempHazardInfo, dayPhase, fetchWeather, tempHazard } from '@/lib/weather';
import { styles } from './styles';

/**
 * 기상특보(태풍이 몰고 오는 호우·폭풍 등) · 무더위 위험도를 한 카드로 묶는다.
 *
 * 지진 카드와 나란히 두되 별도 컴포넌트로 뺀 이유는 두 가지 다른 API(JMA 경보,
 * Open-Meteo 날씨)를 자체적으로 불러와야 해서다. 이 도시 홈 화면에 원래
 * 지진 정보만 있었는데, 여름 일본 여행자에게는 태풍·폭염이 실제로 더 자주
 * 마주치는 위험이라 함께 보여준다.
 */
export function WeatherHazardCard({ city }: { city: City }) {
  const theme = useTheme();
  const [warnings, setWarnings] = useState<WarningReport | null>(null);
  const [heat, setHeat] = useState<TempHazardInfo | null>(null);

  useEffect(() => {
    fetchWarnings(city.jmaAreaCode).then(setWarnings);
    fetchWeather(city.lat, city.lng).then((w) => {
      // 해가 진 뒤에는 더위 문구가 열대야 쪽으로 바뀐다. 홈 뱃지도 같은 판정을
      // 써야 상세 화면과 어긋나지 않는다.
      if (w) setHeat(tempHazard(w.tempC, w.humidity, w.feelsLikeC, dayPhase(w.sunrise, w.sunset)));
    });
  }, [city]);

  const critical: ActiveWarning[] = warnings ? travelCriticalWarnings(warnings) : [];
  const hasEmergency = critical.some((w) => w.severity === 'emergency');
  /** 기상특보(태풍·호우·폭풍 등)가 하나라도 걸려 있는지 */
  const weatherOnEarly = hasEmergency || critical.length > 0;
  const heatAlert = heat && (heat.level === 'warning' || heat.level === 'severe' || heat.level === 'danger');

  // 아직 둘 다 안 왔으면(로딩 중) 카드를 그리지 않는다 — 회색 뼈대만 잠깐
  // 보였다 바뀌는 것보다, 준비되면 한 번에 나타나는 편이 덜 어수선하다.
  if (warnings === null && heat === null) return null;

  const overall: 'danger' | 'warning' | 'safe' =
    hasEmergency || heat?.level === 'danger'
      ? 'danger'
      : critical.length > 0 || heatAlert
        ? 'warning'
        : 'safe';

  const accent =
    overall === 'danger' ? theme.danger : overall === 'warning' ? theme.warning : theme.success;

  /**
   * 뱃지 문구는 안쪽 상세 화면과 **같은 값**을 써야 한다.
   *
   * 전에는 홈이 3단계(위험/주의/정상)로 뭉개고 안전 탭은 5단계(shortLabel)를
   * 써서, 무더위가 「경고」인데 홈 뱃지는 「주의」로 나오는 모순이 생겼다.
   * 대부분의 사용자는 홈 카드만 보고 들어가지 않기 때문에, 홈에 뜬 등급이
   * 곧 그 사람이 아는 전부다 — 그게 안쪽보다 약하게 표시되면 위험을 낮게
   * 알린 셈이 된다. 그래서 원인이 하나뿐일 때는 그 원인의 등급을 그대로 쓴다.
   */
  const badgeLabel = (() => {
    // 기상특보가 있으면 그쪽 강도가 우선 — 특별경보 > 경보
    if (hasEmergency) return '위험';
    if (critical.length > 0 && !heatAlert) return '경보';
    // 더위·추위만 걸린 경우: 안쪽과 같은 shortLabel 을 그대로 쓴다
    if (!weatherOnEarly && heat) return heat.shortLabel;
    // 둘 다 걸렸으면 더 센 쪽을 따른다
    if (heat && heatAlert) return heat.level === 'danger' ? '위험' : heat.shortLabel;
    return '괜찮음';
  })();

  const badgeTone: 'danger' | 'warning' | 'success' =
    overall === 'danger' ? 'danger' : overall === 'warning' ? 'warning' : 'success';

  // 카드 색(overall)과 헤드라인 문장은 따로 만든다. 색은 "가장 심각한 것 하나"만
  // 보면 되지만, 문장은 **그 심각도를 실제로 일으킨 원인**을 정확히 짚어야 한다.
  // 전에는 무더위 하나만으로 danger 가 됐는데도 문장이 항상 "경보가 발효
  // 중이에요"라고 나가서, 경보가 없다는 아래 줄과 서로 모순돼 보였다.
  //
  // heat 가 있으면 항상 heat.headline 을 그대로 재사용한다 — 거기 이미
  // 체감온도가 박혀 있어서("매우 위험한 더위예요 (체감 33℃)") 여기서
  // 다시 문장을 만들면 체감온도를 빠뜨리기 쉽다.
  const weatherOn = weatherOnEarly;
  const headline =
    weatherOn && heat
      ? heatAlert
        ? `${city.name}에 기상특보가 발효 중이고, ${heat.headline}`
        : hasEmergency
          ? `${city.name}에 기상 특별경보가 발효 중이에요`
          : `${city.name}에 기상특보가 발효 중이에요`
      : weatherOn
        ? hasEmergency
          ? `${city.name}에 기상 특별경보가 발효 중이에요`
          : `${city.name}에 기상특보가 발효 중이에요`
        : heat
          ? `${city.name} · ${heat.headline}`
          : '기상 · 무더위 특별한 위험 없어요';

  /**
   * 제목 줄에 heat.headline 이 이미 들어갔는지.
   *
   * 들어갔으면 본문에서는 같은 문장을 반복하지 말고 advice 를 보여준다.
   * 위 headline 식과 조건이 어긋나면 문장이 두 번 찍히거나 반대로 사라지므로,
   * 판단을 한 곳에 모아 둔다.
   */
  const titleHasHeatHeadline = heat !== null && (!weatherOn || Boolean(heatAlert));

  /*
   * 카드가 지금 무슨 이야기를 하고 있느냐에 따라 들어갈 곳이 다르다.
   *
   * 이 카드는 기상특보와 무더위를 같이 싣는데, 목적지는 늘 안전 탭이었다.
   * 그래서 「매우 위험한 더위예요」를 누르고 들어갔는데 정작 기온이 없어
   * 이상하게 느껴졌다. 더위를 보고 눌렀으면 기온·체감온도·시간대별 추이가
   * 있는 날씨로 가야 한다.
   *
   * 특보가 걸려 있을 때만 안전으로 보낸다. 그때는 제목도 특보 이야기이고,
   * 대피나 행동 요령이 안전 탭에 있기 때문이다.
   */
  const href = weatherOn ? '/safety' : '/weather';

  return (
    <Link href={href} asChild>
      <Card accent={accent}>
        <View style={styles.statusHead}>
          <Txt variant="subtitle">{headline}</Txt>
          <Badge label={badgeLabel} tone={badgeTone} />
        </View>

        {/* 특보가 걸려 있으면 무슨 특보인지가 가장 급한 정보다. */}
        {critical.length > 0 ? (
          <Txt variant="body" color="textSecondary" style={styles.statusBody}>
            기상특보 · {critical.map((w) => w.label).join(', ')}
          </Txt>
        ) : null}

        {/* 제목에 이미 heat.headline 이 나간 경우에는 같은 문장을 또 찍지 않고
            **무엇을 하면 되는지**(advice)를 보여준다. 전에는 이 자리에 특보가
            없을 때 「발효 중인 특보 없음」이 들어갔는데, 카드에서 가장 잘 읽히는
            줄을 부정문이 차지하는 셈이었다. 정작 지금 필요한 행동은 더위 쪽에
            있는데도 그걸 보려면 탭을 눌러 들어가야 했다. */}
        {heat ? (
          <Txt variant="body" color="textSecondary" style={styles.statusBody}>
            {titleHasHeatHeadline ? heat.advice : `${heat.emoji} ${heat.headline}`}
          </Txt>
        ) : null}

        {/* 특보가 없다는 사실은 확인했다는 표시로만 남기고 뒤로 내린다. */}
        {critical.length === 0 ? (
          <Txt variant="caption" color="textTertiary" style={styles.hazardLine}>
            발효 중인 기상특보는 없어요
          </Txt>
        ) : null}
      </Card>
    </Link>
  );
}

