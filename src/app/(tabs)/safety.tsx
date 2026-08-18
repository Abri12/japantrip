import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import {
  Badge,
  Card,
  Empty,
  IconCircle,
  Row,
  RowGroup,
  Screen,
  Section,
  Txt,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useQuakes } from '@/hooks/use-quakes';
import { useTheme } from '@/hooks/use-theme';
import { ActiveWarning, WarningReport, WarningSeverity, fetchWarnings } from '@/lib/jma-warnings';
import { withEunNeun } from '@/lib/korean';
import { areaLabel, regionLabel } from '@/lib/place-names';
import {
  EewEvent,
  QuakeEvent,
  Severity,
  actionGuide,
  eewScaleForPrefecture,
  parseJst,
  scaleInPrefecture,
  scaleLabel,
  severityOf,
  timeAgo,
  tsunamiLabel,
} from '@/lib/quake';
import { useSelectedCity } from '@/lib/selected-city';
import {
  DayPhase,
  TempHazardInfo,
  dayPhase,
  fetchWeather,
  tempHazard,
  tempHazardColorName,
  tempHazardTitle,
} from '@/lib/weather';

/**
 * 비상 연락처.
 *
 * 예전에는 대사관 번호로 대표전화(+81-3-3452-7611)만 있었다. 그런데 그건
 * 평일 09~18시에만 받는 교환대다. 정작 사고는 밤이나 주말에 나는데, 그 시간에
 * 걸면 아무도 받지 않는 번호를 비상 연락처라고 띄워 둔 셈이었다. 그래서
 * **받는 시간대를 번호마다 명시**하고, 야간·휴일 긴급전화를 따로 넣었다.
 * (외교부 주일본대사관 공식 안내 기준)
 *
 * 순서는 급한 순이다. 한국어가 되는 24시간 창구(영사콜센터)를 일본 기관 다음,
 * 대사관보다 앞에 둔다 — 말이 통하는 곳이 먼저 필요하다.
 */
const EMERGENCY_CONTACTS = [
  { emoji: '🚓', name: '경찰', note: '일본 전역 · 24시간', number: '110' },
  { emoji: '🚑', name: '화재 · 구급', note: '일본 전역 · 24시간', number: '119' },
  {
    emoji: '☎️',
    name: '영사콜센터',
    note: '24시간 한국어 · 사건사고, 여권 분실, 통역까지',
    number: '+82-2-3210-0404',
  },
  {
    emoji: '🆘',
    name: '대사관 긴급전화',
    note: '밤·주말에 사고가 났을 때 (평일 18시 이후·휴일)',
    number: '+81-70-2153-5454',
  },
  {
    emoji: '🏛️',
    name: '대사관 영사과',
    note: '평일 09~17시 · 여권 재발급 같은 민원',
    number: '+81-3-3455-2601',
  },
];

/**
 * 전화 걸기.
 *
 * tel: 은 하이픈이 섞여 있어도 대부분 동작하지만, 기기에 따라 그대로 넘기면
 * 실패하는 경우가 있어 숫자와 맨 앞 + 만 남긴다.
 */
function call(number: string) {
  const dialable = number.replace(/[^\d+]/g, '');
  Linking.openURL(`tel:${dialable}`);
}

/**
 * 「22:15」 형태의 24시간 표기.
 *
 * `toLocaleTimeString('ko-KR')` 은 「오후 10:15:32」처럼 초까지 붙고 오전/오후를
 * 쓴다. 앱의 다른 시간 표기(막차·환율·우산 시간대)는 전부 24시간이라 이 한 곳만
 * 형식이 달랐다.
 */
function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SafetyScreen() {
  const { quakes, eew, loading, error, updatedAt } = useQuakes();
  const { city } = useSelectedCity();
  const theme = useTheme();

  const activeEew = eew.filter((e) => !e.cancelled);

  // 고른 도시가 실제로 흔들린 지진만 따로 앞에 뽑는다.
  // 일본 전역 목록에서 내 지역을 눈으로 찾는 건 급할 때 할 일이 아니다.
  const nearby = city
    ? quakes.filter((q) => q.points.some((p) => p.pref === city.prefecture))
    : [];

  return (
    <Screen
      title="안전"
      subtitle={
        updatedAt
          ? `일본 기상청(JMA) 발표 · ${hhmm(updatedAt)} 기준`
          : '일본 기상청 발표를 실시간으로 받아오고 있어요'
      }>
      {error ? (
        <Section>
          <Card accent={theme.warning}>
            <Txt variant="subtitle">정보를 못 가져왔어요</Txt>
            <Txt variant="body" color="textSecondary" style={styles.gap}>
              {error}
            </Txt>
          </Card>
        </Section>
      ) : null}

      {activeEew.length > 0 ? (
        <Section title="긴급지진속보" caption="흔들림이 오기 전에 미리 알려주는 정보예요">
          {activeEew.map((e) => (
            <EewCard key={e.id} event={e} pref={city?.prefecture} cityName={city?.name} />
          ))}
        </Section>
      ) : city ? (
        <Section title="긴급지진속보">
          <Card accent={theme.success}>
            <View style={styles.head}>
              <Txt variant="subtitle">{city.name}에 지진 걱정은 없어요</Txt>
              <Badge label="이상 없음" tone="success" />
            </View>
            <Txt variant="body" color="textSecondary" style={styles.gap}>
              발령 중인 지진 경보가 없어요. 경보가 뜨면 여기 바로 알려드릴게요.
            </Txt>
          </Card>
        </Section>
      ) : null}

      {city ? <WarningSection city={city} /> : null}
      {city ? <HeatSection city={city} /> : null}

      {city && nearby.length > 0 ? (
        <Section
          title={`${city.name} 근처에서 있었던 지진`}
          caption="이 근처에서 실제로 느껴진 것만 골랐어요">
          {nearby.slice(0, 5).map((q) => (
            <QuakeCard key={`near-${q.id}`} quake={q} pref={city.prefecture} />
          ))}
        </Section>
      ) : city ? (
        <Section title={`${city.name} 근처`}>
          <Empty text={`최근 ${city.name} 주변에서 느껴진 지진이 없어요.`} />
        </Section>
      ) : null}

      <Section title="일본 전체 최근 지진">
        {loading && quakes.length === 0 ? (
          <Empty text="불러오고 있어요" />
        ) : quakes.length === 0 ? (
          <Empty text="보여드릴 지진 정보가 없어요." />
        ) : (
          quakes.slice(0, 15).map((q) => <QuakeCard key={q.id} quake={q} />)
        )}
      </Section>

      <Section title="비상 연락처" caption="눌러서 바로 걸 수 있어요">
        <RowGroup>
          {EMERGENCY_CONTACTS.map((c, i) => (
            <Row
              key={c.number}
              leading={<IconCircle emoji={c.emoji} tone={theme.primarySoft} />}
              title={c.name}
              subtitle={c.note}
              trailing={c.number}
              last={i === EMERGENCY_CONTACTS.length - 1}
              onPress={() => call(c.number)}
            />
          ))}
        </RowGroup>
      </Section>
    </Screen>
  );
}

/**
 * 기상청 경보·주의보 — 태풍이 오면 이 자리에 호우·폭풍 경보가 뜬다.
 *
 * 태풍 전용 API 대신 이 경보·주의보 API를 쓴 이유는 코드 상단 주석
 * (lib/jma-warnings.ts) 참조. 여기서는 travelCriticalWarnings 로 거르지 않고
 * **전부** 보여준다 — 안전 탭은 상세를 보러 오는 곳이라 주의보 수준까지
 * 다 아는 편이 낫다(홈 화면 요약 카드와의 역할 차이다).
 */
function WarningSection({ city }: { city: { name: string; jmaAreaCode: string } }) {
  const theme = useTheme();
  const [report, setReport] = useState<WarningReport | null>(null);

  useEffect(() => {
    setReport(null);
    fetchWarnings(city.jmaAreaCode).then(setReport);
  }, [city]);

  const colorOf = (s: WarningSeverity) =>
    s === 'emergency' ? theme.danger : s === 'warning' ? theme.warning : theme.textSecondary;

  return (
    <Section title="기상 경보 · 주의보" caption="태풍이 오면 호우·폭풍 경보로 알려드려요">
      {report === null ? (
        <Empty text="불러오고 있어요" />
      ) : report.active.length === 0 ? (
        <Card accent={theme.success}>
          <View style={styles.head}>
            {/* 앱 전체가 해요체다. 여기만 「발효 중인 특보 없음」처럼 명사로
                끊으면 다른 카드와 말투가 어긋난다. */}
            <Txt variant="subtitle">발효 중인 특보는 없어요</Txt>
            <Badge label="이상 없음" tone="success" />
          </View>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            {withEunNeun(city.name)} 지금 기상 경보나 주의보가 걸려 있지 않아요.
          </Txt>
        </Card>
      ) : (
        report.active.map((w) => (
          <Card key={w.code} accent={colorOf(w.severity)} style={styles.card}>
            <View style={styles.head}>
              <Txt variant="subtitle" tint={colorOf(w.severity)}>
                {w.label}
              </Txt>
              <Badge
                label={w.severity === 'emergency' ? '특별경보' : w.severity === 'warning' ? '경보' : '주의보'}
                tone={w.severity === 'emergency' ? 'danger' : w.severity === 'warning' ? 'warning' : 'neutral'}
              />
            </View>
          </Card>
        ))
      )}
    </Section>
  );
}

/** 체감온도 기반 더위·추위 위험도. 산출 방식은 lib/weather.ts 의 tempHazard() 참조. */
function HeatSection({ city }: { city: { lat: number; lng: number } }) {
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

/** 심각도를 팔레트 색으로 옮긴다. */
function useSeverityColor() {
  const theme = useTheme();
  return (s: Severity): string => {
    switch (s) {
      case 'danger':
        return theme.danger;
      case 'warning':
      case 'caution':
        return theme.warning;
      case 'info':
        return theme.success;
      default:
        return theme.textTertiary;
    }
  };
}

function EewCard({
  event,
  pref,
  cityName,
}: {
  event: EewEvent;
  pref?: string;
  cityName?: string;
}) {
  const theme = useTheme();
  const colorOf = useSeverityColor();

  const maxScale = event.areas.reduce<number>((m, a) => Math.max(m, a.scaleTo), -1);

  // 내 도시가 대상인지부터 본다. 대상이 아니면 색과 문구의 강도를 낮춘다.
  const myScale = pref ? eewScaleForPrefecture(event, pref) : null;
  const affectsMe = myScale !== null;
  const shown = affectsMe ? myScale! : maxScale;

  const color = affectsMe ? colorOf(severityOf(shown)) : theme.textTertiary;
  const at = parseJst(event.earthquake.originTime);

  return (
    <Card accent={color} style={styles.card}>
      <View style={styles.head}>
        <Txt variant="subtitle" tint={color}>
          긴급지진속보 (경보)
        </Txt>
        <Txt variant="caption" color="textTertiary">
          {timeAgo(at)}
        </Txt>
      </View>

      {cityName ? (
        <View style={styles.gap}>
          <Badge
            label={
              affectsMe
                ? `${cityName} 대상 · 예상 ${scaleLabel(shown)}`
                : `${withEunNeun(cityName)} 대상 아님`
            }
            tone={affectsMe ? 'danger' : 'neutral'}
          />
        </View>
      ) : null}

      <Txt variant="title" style={styles.gap}>
        {regionLabel(event.earthquake.hypocenter.name)}
      </Txt>
      <Txt variant="body" color="textSecondary">
        규모 M{event.earthquake.hypocenter.magnitude} · 진앙 최대 {scaleLabel(maxScale)} 예상
      </Txt>

      {affectsMe || !cityName ? (
        <View style={[styles.guide, { backgroundColor: theme.dangerSoft }]}>
          <Txt variant="body" tint={color}>
            {actionGuide(shown)}
          </Txt>
        </View>
      ) : null}

      {event.areas.length > 0 ? (
        <Txt variant="caption" color="textTertiary" style={styles.gap}>
          대상 지역 · {event.areas.slice(0, 5).map((a) => areaLabel(a.name)).join(', ')}
          {event.areas.length > 5 ? ` 외 ${event.areas.length - 5}곳` : ''}
        </Txt>
      ) : null}
    </Card>
  );
}

function QuakeCard({ quake, pref }: { quake: QuakeEvent; pref?: string }) {
  const theme = useTheme();
  const colorOf = useSeverityColor();

  const { earthquake } = quake;

  // 내 지역에서 실제로 얼마나 흔들렸는지 — 진앙 최대진도와 다를 수 있다.
  const localScale = pref ? scaleInPrefecture(quake, pref) : null;

  // 색과 행동 지침은 **사용자가 실제로 겪은 진도**를 따라야 한다.
  // 진앙 최대진도로 칠하면, 멀리서 크게 난 지진이 내 지역에서는 거의 안 느껴졌는데도
  // 빨간 카드와 "탁자 밑으로" 안내가 뜬다. 그건 겁만 주고 판단을 흐린다.
  const shownScale = localScale ?? earthquake.maxScale;
  const severity = severityOf(shownScale);
  const color = colorOf(severity);
  const at = parseJst(earthquake.time);
  const tsunami = tsunamiLabel(earthquake.domesticTsunami);

  const notable = severity === 'warning' || severity === 'danger';

  return (
    <Card accent={color} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Txt variant="subtitle">{regionLabel(earthquake.hypocenter.name)}</Txt>
          <Txt variant="caption" color="textTertiary" style={styles.tiny}>
            M{earthquake.hypocenter.magnitude} · 깊이 {earthquake.hypocenter.depth}km ·{' '}
            {timeAgo(at)}
          </Txt>
        </View>
        <View style={styles.scaleBox}>
          <Txt variant="bodyBold" tint={color}>
            {scaleLabel(shownScale)}
          </Txt>
          {localScale !== null && localScale !== earthquake.maxScale ? (
            <Txt variant="caption" color="textTertiary">
              내 지역 기준
            </Txt>
          ) : null}
        </View>
      </View>

      {tsunami.alarming ? (
        <View style={styles.gap}>
          <Badge label={`🌊 ${tsunami.text}`} tone="danger" />
        </View>
      ) : null}

      {notable ? (
        <View style={[styles.guide, { backgroundColor: theme.warningSoft }]}>
          <Txt variant="caption" tint={color}>
            {actionGuide(shownScale)}
          </Txt>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    marginBottom: Spacing.three,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  gap: {
    marginTop: Spacing.two,
  },
  tiny: {
    marginTop: Spacing.half,
  },
  scaleBox: {
    alignItems: 'flex-end',
  },
  guide: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
