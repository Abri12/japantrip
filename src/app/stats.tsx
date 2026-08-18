import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { Button, Card, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { findPlace } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import {
  CollectedTerm,
  Counters,
  STATS_ENDPOINT,
  clearAll,
  hasConsent,
  loadCounters,
  loadTerms,
  setConsent,
} from '@/lib/stats';

/**
 * 수집한 통계를 사용자에게 그대로 보여주는 화면.
 *
 * 「익명으로 수집합니다」라고 적어 두는 것과, 모은 것을 있는 그대로 펼쳐 보이고
 * 한 번에 지울 수 있게 하는 것은 다르다. 뒤쪽만이 확인 가능한 약속이다.
 *
 * 이 화면이 있으면 수집 범위를 몰래 넓힐 수도 없다. 늘리는 순간 여기 나타난다.
 */
export default function StatsScreen() {
  const theme = useTheme();

  const [consent, setConsentState] = useState(false);
  const [counters, setCounters] = useState<Counters>({});
  const [terms, setTerms] = useState<CollectedTerm[]>([]);

  const reload = useCallback(() => {
    void hasConsent().then(setConsentState);
    void loadCounters().then(setCounters);
    void loadTerms().then(setTerms);
  }, []);

  useFocusEffect(reload);

  const toggle = async (next: boolean) => {
    await setConsent(next);
    setConsentState(next);
    if (!next) setTerms([]);
  };

  const wipe = () => {
    Alert.alert('기록을 지울까요', '지금까지 모인 통계가 모두 사라져요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '지우기',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          reload();
        },
      },
    ]);
  };

  // 뽑기 결과를 많이 나온 순으로. 우리 데이터의 id 라 이름으로 되돌릴 수 있다.
  const picks = Object.entries(counters)
    .filter(([k]) => k.startsWith('pick:'))
    .map(([k, n]) => ({ place: findPlace(k.slice(5)), n }))
    .filter((p) => p.place)
    .sort((a, b) => b.n - a.n);

  const ladderRuns = Object.entries(counters)
    .filter(([k]) => k.startsWith('ladder:'))
    .reduce((sum, [, n]) => sum + n, 0);

  return (
    <Screen back title="내 사용 기록" subtitle="이 기기에 모인 것 전부예요">
      <Section>
        <Card accent={theme.primary}>
          <Txt variant="body" color="textSecondary">
            뽑기와 사다리타기를 얼마나 썼는지 기록해 두면, 사람들이 실제로 찾는 곳을
            앱에 더 채워 넣을 수 있어요. 아래가 지금까지 모인 전부고, 아직{' '}
            <Txt variant="bodyBold">기기 밖으로 나간 적은 없어요.</Txt>
          </Txt>
          {!STATS_ENDPOINT ? (
            <View style={[styles.badge, { backgroundColor: theme.background }]}>
              <Txt variant="caption" color="textTertiary">
                전송 기능이 아직 꺼져 있어요
              </Txt>
            </View>
          ) : null}
        </Card>
      </Section>

      <Section
        title="적은 내용도 모을까요"
        caption="끄면 숫자만 세고, 적은 글자는 한 자도 남기지 않아요">
        <Card>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Txt variant="subtitle">사다리에 적은 후보 모으기</Txt>
              <Txt variant="caption" color="textTertiary" style={styles.gap}>
                가게 이름을 모아 앱에 추가하는 데 써요. 사람 이름처럼 보이는 건 저장하지
                않고, 끄면 이미 모인 것도 지워져요.
              </Txt>
            </View>
            <Switch value={consent} onValueChange={toggle} />
          </View>
        </Card>
      </Section>

      <Section title="숫자로 모인 것" caption="적은 글자는 들어가지 않아요">
        <Card>
          <Txt variant="body" color="textSecondary">
            사다리타기 {ladderRuns}번 · 여행지 뽑기{' '}
            {picks.reduce((s, p) => s + p.n, 0)}번
          </Txt>
        </Card>
      </Section>

      {picks.length > 0 ? (
        <Section title="많이 뽑힌 곳">
          <RowGroup>
            {picks.slice(0, 10).map((p, i) => (
              <Row
                key={p.place!.id}
                title={p.place!.name}
                subtitle={p.place!.city}
                trailing={`${p.n}번`}
                last={i === Math.min(picks.length, 10) - 1}
              />
            ))}
          </RowGroup>
        </Section>
      ) : null}

      {terms.length > 0 ? (
        <Section title="적으신 후보" caption={`${terms.length}개`}>
          <Card>
            <Txt variant="body" color="textSecondary">
              {terms
                .map((t) => t.text)
                .filter((t, i, arr) => arr.indexOf(t) === i)
                .join(' · ')}
            </Txt>
          </Card>
        </Section>
      ) : null}

      <Button label="기록 모두 지우기" onPress={wipe} tone="secondary" />

      <Txt variant="caption" color="textTertiary" style={styles.foot}>
        기기를 알아보는 값은 앱을 설치할 때 무작위로 만들어요. 광고 식별자나 기기
        고유번호는 쓰지 않고, 앱을 지우면 함께 사라져요.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.three,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  switchText: {
    flex: 1,
  },
  gap: {
    marginTop: Spacing.two,
  },
  foot: {
    marginTop: Spacing.four,
  },
});
