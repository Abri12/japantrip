/**
 * 크레딧 화면 — 현재 비활성.
 *
 * 초기 버전은 정보 제공에 집중하므로 탭에서 빠져 있다. 화면과 경제 로직은
 * 그대로 두어 나중에 `FEATURES.credits` 만 켜면 되도록 한다.
 * 켜기 전에 반드시 원장을 서버로 옮겨야 한다 — docs/SERVER.md 참조.
 */

import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Card, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { FEATURES } from '@/constants/features';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ProfileSummary, loadSummary } from '@/lib/contributions';
import { CONTRIBUTIONS, REWARDS, REWARD_KIND_LABEL, RewardKind, TIERS } from '@/lib/credits';

const KIND_ORDER: RewardKind[] = ['travel', 'transport', 'cashout'];

export default function RewardsScreen() {
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const theme = useTheme();

  const reload = useCallback(async () => {
    setSummary(await loadSummary());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <Screen back title="크레딧" subtitle="정보를 남기면 쌓이고, 여행 중에 바로 써요">
      {!FEATURES.credits ? (
        <Section>
          <Card accent={theme.warning}>
            <Txt variant="subtitle">아직 준비 중인 기능이에요</Txt>
            <Txt variant="body" color="textSecondary" style={styles.gap}>
              지금은 여행 정보를 채우는 데 집중하고 있어요. 아래는 앞으로 열릴 모습이에요.
            </Txt>
          </Card>
        </Section>
      ) : null}

      {summary && FEATURES.credits ? (
        <Section>
          <Card>
            <View style={styles.head}>
              <Txt variant="subtitle">
                {summary.tierEmoji} {summary.tierName}
              </Txt>
              <Badge label={`×${summary.multiplier}`} tone="primary" />
            </View>
            <Txt variant="display" style={styles.gap}>
              {summary.balance.toLocaleString()}
            </Txt>
            <Txt variant="caption" color="textTertiary">
              사용 가능 · 누적 획득 {summary.lifetimeEarned.toLocaleString()}
            </Txt>
          </Card>
        </Section>
      ) : null}

      <Section title="모으는 방법" caption="손이 더 가는 일일수록 많이 받아요">
        <RowGroup>
          {CONTRIBUTIONS.map((spec, i) => (
            <Row
              key={spec.type}
              title={spec.label}
              subtitle={spec.description}
              trailing={`+${spec.baseCredits}`}
              last={i === CONTRIBUTIONS.length - 1}
            />
          ))}
        </RowGroup>
      </Section>

      {KIND_ORDER.map((kind) => (
        <Section key={kind} title={REWARD_KIND_LABEL[kind]}>
          <RowGroup>
            {REWARDS.filter((r) => r.kind === kind).map((r, i, arr) => (
              <Row
                key={r.id}
                title={r.name}
                subtitle={r.detail}
                trailing={r.cost.toLocaleString()}
                trailingSub={r.timing}
                last={i === arr.length - 1}
              />
            ))}
          </RowGroup>
        </Section>
      ))}

      <Section title="등급" caption="활동이 쌓이면 더 많은 혜택을 받아요">
        <RowGroup>
          {TIERS.map((t, i) => (
            <Row
              key={t.id}
              title={`${t.emoji} ${t.name}`}
              subtitle={t.perk}
              trailing={`${t.threshold.toLocaleString()}+`}
              last={i === TIERS.length - 1}
            />
          ))}
        </RowGroup>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gap: {
    marginTop: Spacing.two,
  },
});
