import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Chip, IconCircle, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { AIRPORTS } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';
import { useSelectedCity } from '@/lib/selected-city';

/**
 * 귀국일 — 여행에서 가장 실수가 잦은 날.
 *
 * 이 날의 일은 다른 날과 성격이 다르다. **되돌릴 수 없는 것들**이 몰려 있다:
 * 비행기를 놓치면 끝이고, 면세 환급은 공항을 나가면 못 받고, 짐을 잘못 부치면
 * 보조배터리가 압수된다.
 *
 * 그런데 앱은 이 정보를 여기저기 흩어 두고 있었다 — 면세는 별도 화면, 짐 규정은
 * 준비물, 공항 가는 법은 공항 화면. 정작 그날 아침에 한 화면에서 훑을 곳이
 * 없었다. 이 화면은 새 정보를 만드는 게 아니라 **그날 필요한 것만 모으는** 자리다.
 */

/** 공항까지 걸리는 시간에 따라 언제 나서야 하는지 계산한다. */
function leaveBy(flightHHMM: string, travelMinutes: number): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(flightHHMM.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;

  // 국제선은 2시간 전 도착이 기본. 여기에 이동 시간과 여유 30분을 더한다.
  const CHECKIN_BUFFER = 120;
  const SAFETY = 30;
  let total = h * 60 + min - CHECKIN_BUFFER - SAFETY - travelMinutes;
  if (total < 0) total += 24 * 60;

  const lh = Math.floor(total / 60) % 24;
  const lm = total % 60;
  return `${String(lh).padStart(2, '0')}:${String(lm).padStart(2, '0')}`;
}

export default function DepartureScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { city } = useSelectedCity();

  const airports = city ? AIRPORTS.filter((a) => city.airportIds.includes(a.id)) : [];
  const airport = airports[0];

  // 그 공항에서 추천하는 노선의 소요시간을 기준으로 삼는다.
  const best = airport?.routes.find((r) => r.recommended) ?? airport?.routes[0];
  const travel = best?.minutes ?? 60;

  const [flight, setFlight] = useState<string | null>(null);
  const HOURS = ['09:00', '12:00', '15:00', '18:00', '21:00'];

  return (
    <Screen back title="귀국하는 날" subtitle="놓치면 되돌릴 수 없는 것들만 모았어요">
      {/* 출발 시각 역산이 이 화면의 핵심이다. 「2시간 전 도착」은 다들 알지만
          거기에 이동 시간을 더해 몇 시에 숙소를 나서야 하는지는 매번 헷갈린다. */}
      <Section title="몇 시에 나서야 하나요" caption="비행기 시각을 고르면 계산해 드려요">
        <Card>
          <View style={styles.chipRow}>
            {HOURS.map((h) => (
              <Chip key={h} label={h} active={flight === h} onPress={() => setFlight(h)} />
            ))}
          </View>

          {flight ? (
            <View style={[styles.result, { backgroundColor: theme.primarySoft }]}>
              <Txt variant="caption" tint={theme.primary}>
                숙소에서 나서는 시각
              </Txt>
              <Txt variant="display" tint={theme.primary}>
                {leaveBy(flight, travel) ?? '—'}
              </Txt>
              <Txt variant="caption" color="textSecondary" style={styles.resultNote}>
                {airport ? `${airport.name}까지 ${travel}분` : '이동 60분'} + 탑승 수속 2시간 +
                여유 30분으로 잡았어요
              </Txt>
            </View>
          ) : null}

          <Txt variant="caption" color="textTertiary" style={styles.hint}>
            면세 환급을 받을 거면 30분 더 일찍 나서세요. 성수기 주말은 보안검색 줄이 길어요.
          </Txt>
        </Card>
      </Section>

      <Section title="숙소를 나오기 전에" caption="여기서 놓치면 되돌리기 어려워요">
        <RowGroup>
          <Row
            leading={<IconCircle emoji="🔋" tone={theme.warningSoft} />}
            title="보조배터리는 기내로"
            subtitle="부치는 가방에 있으면 공항에서 빼야 해요. 1인 2개까지예요"
          />
          <Row
            leading={<IconCircle emoji="🧴" tone={theme.warningSoft} />}
            title="액체는 100ml 이하로"
            subtitle="산 화장품·술은 부치는 가방에 넣으세요"
          />
          <Row
            leading={<IconCircle emoji="🔑" tone={theme.primarySoft} />}
            title="숙소 열쇠 반납 · 방 한 번 더 확인"
            subtitle="충전기와 어댑터를 콘센트에 두고 오는 일이 제일 흔해요"
          />
          <Row
            leading={<IconCircle emoji="🪙" tone={theme.primarySoft} />}
            title="남은 동전 털기"
            subtitle="편의점이나 자판기에서 쓰는 게 나아요. 동전은 환전이 안 돼요"
            last
          />
        </RowGroup>
      </Section>

      <Section title="짐을 맡기고 더 돌아볼 거면">
        <Card>
          <Txt variant="body" color="textSecondary">
            체크아웃 후에도 숙소가 짐을 맡아줘요. 역 코인락커는 오전에 금방 차고 큰 캐리어가
            들어가는 칸은 더 적어서, 숙소에 맡기는 편이 확실해요.
          </Txt>
          <Txt variant="body" color="textSecondary" style={styles.gap}>
            공항에 일찍 도착해서 맡기는 방법도 있어요. 수속 카운터가 열리면 짐만 먼저 부치고
            가볍게 다닐 수 있어요.
          </Txt>
        </Card>
      </Section>

      <Section title="공항에서 할 일">
        <RowGroup>
          <Row
            leading={<IconCircle emoji="🛍️" tone={theme.primarySoft} />}
            title="면세 환급"
            subtitle="2026년 11월부터 방식이 바뀌어요"
            chevron
            onPress={() => router.push('/tax-free')}
          />
          <Row
            leading={<IconCircle emoji="✈️" tone={theme.primarySoft} />}
            title={airport ? `${airport.name} 가는 방법` : '공항 가는 방법'}
            subtitle={best ? `${best.name} ${best.minutes}분` : '노선 비교'}
            chevron
            last
            onPress={() =>
              airport ? router.push(`/airport/${airport.id}` as never) : router.push('/airports')
            }
          />
        </RowGroup>
      </Section>

      <Txt variant="caption" color="textTertiary">
        IC카드(ICOCA·SUGOCA)는 반납하면 보증금 500엔을 돌려받지만, 다음에 또 올 거면 그냥
        들고 가도 돼요. 잔액은 10년간 유효해요.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  result: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.md,
  },
  resultNote: {
    marginTop: Spacing.two,
  },
  hint: {
    marginTop: Spacing.three,
  },
  gap: {
    marginTop: Spacing.three,
  },
});
