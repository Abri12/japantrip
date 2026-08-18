import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CityScopeBar } from '@/components/city-scope';
import { Badge, Card, Chip, Empty, KrwEstimate, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import {
  BuyLink,
  DISCLOSURE,
  PARTNERS,
  buildBuyUrl,
  hasAnyReferral,
} from '@/constants/affiliates';
import { Radius, Spacing } from '@/constants/theme';
import { CITIES, City } from '@/data/cities';
import {
  IC_CARDS,
  IC_CARD_GUIDE,
  PASSES,
  PASS_CHECKED_AT,
  TransitPass,
  tipsForCity,
} from '@/data/transit';
import { useTheme } from '@/hooks/use-theme';
import { useSelectedCity } from '@/lib/selected-city';

/** 패스 정보가 실제로 있는 도시만 고른다. */
const PASS_CITIES: City[] = CITIES.filter((c) => PASSES.some((p) => p.cityIds.includes(c.id)));

export default function TransitScreen() {
  const { city: selected } = useSelectedCity();
  const [showAll, setShowAll] = useState(false);

  // 고른 도시에 패스가 없으면 처음부터 전체를 보여준다 — 빈 화면보다 낫다.
  const selectedHasPasses = selected
    ? PASSES.some((p) => p.cityIds.includes(selected.id))
    : false;
  const scoped = !showAll && selectedHasPasses && selected !== null;

  const [manualCityId, setManualCityId] = useState<string>(PASS_CITIES[0]?.id ?? 'osaka');
  const cityId = scoped ? selected!.id : manualCityId;
  const city = CITIES.find((c) => c.id === cityId);

  const passes = PASSES.filter((p) => p.cityIds.includes(cityId));
  const tips = tipsForCity(cityId);

  return (
    <Screen title="이동수단" subtitle="어떤 패스를 사야 할지, 어떻게 쓰는지 알려드릴게요">
      {selectedHasPasses ? (
        <CityScopeBar
          city={selected}
          showAll={showAll}
          onToggle={() => setShowAll((v) => !v)}
        />
      ) : null}

      {!scoped ? (
        <Section>
          <View style={styles.chipRow}>
            {PASS_CITIES.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                active={cityId === c.id}
                onPress={() => setManualCityId(c.id)}
              />
            ))}
          </View>
        </Section>
      ) : null}

      <Section title={`${city?.name ?? ''} 교통패스`} caption={PASS_CHECKED_AT}>
        {passes.length === 0 ? (
          <Empty text="이 도시는 아직 교통패스 정보가 없어요." />
        ) : (
          passes.map((pass) => <PassCard key={pass.id} pass={pass} />)
        )}
      </Section>

      {tips.length > 0 ? (
        <Section title="현지에서 헷갈리는 것들">
          {tips.map((tip, i) => (
            <Card key={i} style={i < tips.length - 1 ? styles.spaced : undefined}>
              <Txt variant="subtitle">{tip.title}</Txt>
              <Txt variant="body" color="textSecondary" style={styles.gap}>
                {tip.body}
              </Txt>
            </Card>
          ))}
        </Section>
      ) : null}

      <Section title="IC 교통카드" caption="패스를 안 살 거라면 이쪽이 편해요">
        <Card style={styles.spaced}>
          {IC_CARD_GUIDE.map((line, i) => (
            <Txt
              key={i}
              variant="body"
              color="textSecondary"
              style={i > 0 ? styles.gap : undefined}>
              · {line}
            </Txt>
          ))}
        </Card>
        <RowGroup>
          {IC_CARDS.map((c, i) => (
            <Row
              key={c.id}
              title={c.name}
              subtitle={c.note}
              trailing={c.region}
              last={i === IC_CARDS.length - 1}
            />
          ))}
        </RowGroup>
      </Section>

      <Txt variant="caption" color="textTertiary">
        요금은 바뀔 수 있어요. 「변동 가능」이 붙은 건 사기 전에 판매처에서 한 번 확인해 주세요.
      </Txt>
    </Screen>
  );
}

function PassCard({ pass }: { pass: TransitPass }) {
  const theme = useTheme();
  const [tab, setTab] = useState<'none' | 'covers' | 'buy' | 'use'>('none');

  const toggle = (t: 'covers' | 'buy' | 'use') => setTab((cur) => (cur === t ? 'none' : t));

  return (
    <Card style={styles.spaced}>
      <View style={styles.passHead}>
        <View style={styles.flex}>
          <Txt variant="subtitle">{pass.name}</Txt>
          <Txt variant="caption" color="textTertiary" style={styles.tiny}>
            {pass.nameJa}
          </Txt>
        </View>
        {pass.scope === 'wide' ? <Badge label="광역" tone="neutral" /> : null}
      </View>

      {/* 손익 한 줄을 가장 먼저. 이 화면에서 사용자가 하는 질문은 하나다 —
          「내가 이걸 사면 이득인가?」 예전에는 그 답이 문단 안에 묻혀 있어서
          훑을 때 읽히지 않았다. */}
      <View style={[styles.verdict, { backgroundColor: theme.primarySoft }]}>
        <Txt variant="bodyBold" tint={theme.primary}>
          {pass.breakEven}
        </Txt>
      </View>

      {/* 가격을 카드에서 가장 큰 글씨로 둔다. 판단에 실제로 쓰는 숫자가
          설명글과 같은 크기면 위계가 없는 것과 같다.

          미확인 가격은 숫자 대신 안내를 띄운다 — 틀린 숫자보다 없는 편이 낫다. */}
      {pass.verified ? (
        <View style={styles.priceRow}>
          {pass.tiers.map((t) => (
            <View key={t.label} style={styles.priceItem}>
              <Txt variant="numeric">¥{t.yen.toLocaleString()}</Txt>
              <Txt variant="caption" color="textTertiary" style={styles.priceLabel}>
                {t.label}
              </Txt>
              {t.yen > 0 ? <KrwEstimate yen={t.yen} /> : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.priceRow}>
          <Badge label="가격 변동 가능" tone="warning" />
        </View>
      )}

      {/* 설명은 색 박스를 쓰지 않는다. 예전에는 파란 박스와 주황 박스가 연달아
          쌓여서, 색이 둘이면 어느 쪽이 중요한지 사라지고 카드만 무거워졌다.
          경고는 아래 「알아둘 점」 한 곳으로 모았다. */}
      <Txt variant="body" color="textSecondary" style={styles.worth}>
        {pass.worthIt}
      </Txt>

      {/* 접기 라벨에 안에 뭐가 들었는지 숫자로 적는다. 「되는 것」만으론 열기 전에
          몇 개인지, 안 되는 게 있는지 알 수 없어 매번 눌러 봐야 했다. */}
      <View style={styles.tabRow}>
        <MiniTab
          label={`탈 수 있는 것 ${pass.covers.length}`}
          active={tab === 'covers'}
          onPress={() => toggle('covers')}
        />
        <MiniTab label="사는 곳" active={tab === 'buy'} onPress={() => toggle('buy')} />
        <MiniTab
          label={`쓰는 법 ${pass.howToUse.length}단계`}
          active={tab === 'use'}
          onPress={() => toggle('use')}
        />
      </View>

      {/* 되는 것과 안 되는 것을 기호로 가른다. 예전에는 「탈 수 있어요」라는
          색 글자 제목 아래 가운뎃점 목록이 이어져서, 스크롤하다 보면 지금 읽는
          줄이 어느 쪽 목록인지 놓쳤다. 줄마다 ✓·✕ 가 붙으면 그 자리에서 안다. */}
      {tab === 'covers' ? (
        <View style={styles.detail}>
          {pass.covers.map((c, i) => (
            <View key={`c${i}`} style={styles.markRow}>
              <Txt variant="bodyBold" tint={theme.success} style={styles.mark}>
                ✓
              </Txt>
              <Txt variant="body" color="textSecondary" style={styles.flex}>
                {c}
              </Txt>
            </View>
          ))}
          {pass.excludes.map((c, i) => (
            <View key={`e${i}`} style={styles.markRow}>
              <Txt variant="bodyBold" tint={theme.danger} style={styles.mark}>
                ✕
              </Txt>
              <Txt variant="body" color="textSecondary" style={styles.flex}>
                {c}
              </Txt>
            </View>
          ))}
        </View>
      ) : null}

      {tab === 'buy' ? (
        <View style={styles.detail}>
          {pass.whereToBuy.map((w, i) => (
            <Txt key={i} variant="body" color="textSecondary">
              · {w}
            </Txt>
          ))}
          {pass.buyLinks?.length ? <BuyLinks links={pass.buyLinks} /> : null}
        </View>
      ) : null}

      {tab === 'use' ? (
        <View style={styles.detail}>
          {pass.howToUse.map((h, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: theme.surfaceStrong }]}>
                <Txt variant="label" color="textSecondary">
                  {i + 1}
                </Txt>
              </View>
              <Txt variant="body" color="textSecondary" style={styles.flex}>
                {h}
              </Txt>
            </View>
          ))}
        </View>
      ) : null}

      {/* 함정은 카드 맨 아래 한 곳에만 둔다. 위쪽에 색 박스로 띄우면 손익 판단
          문구와 색이 경쟁해서 둘 다 눈에 안 들어온다. 여기서는 접힌 내용을
          펼치든 말든 항상 보이면서, 시선의 마지막에 걸린다. */}
      {pass.caution ? (
        <View style={[styles.caution, { borderTopColor: theme.border }]}>
          <Txt variant="caption" tint={theme.warning}>
            ⚠ {pass.caution}
          </Txt>
        </View>
      ) : null}
    </Card>
  );
}

function MiniTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.flex, pressed && styles.pressed]}>
      <View style={[styles.miniTab, { backgroundColor: active ? theme.text : theme.background }]}>
        <Txt variant="label" tint={active ? theme.background : theme.textSecondary}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

/**
 * 구매처 버튼.
 *
 * 대가성 표시는 법적 의무라 링크 바로 아래에 항상 함께 노출한다.
 * (constants/affiliates.ts 참조)
 */
function BuyLinks({ links }: { links: BuyLink[] }) {
  const theme = useTheme();

  return (
    <View style={styles.buyBox}>
      <Txt variant="label" color="textSecondary">
        온라인으로 사기
      </Txt>

      <View style={styles.buyRow}>
        {links.map((link) => (
          <Pressable
            key={link.partner}
            onPress={() => Linking.openURL(buildBuyUrl(link))}
            style={({ pressed }) => [styles.flex, pressed && styles.pressed]}>
            <View style={[styles.buyButton, { backgroundColor: theme.primarySoft }]}>
              <Txt variant="label" tint={theme.primary}>
                {PARTNERS[link.partner].name}
              </Txt>
            </View>
          </Pressable>
        ))}
      </View>

      <Txt variant="caption" color="textTertiary">
        {hasAnyReferral()
          ? DISCLOSURE
          : '판매처 검색 결과로 연결돼요. 가격과 판매 여부는 판매처 기준이에요.'}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  spaced: {
    marginBottom: Spacing.three,
  },
  gap: {
    marginTop: Spacing.two,
  },
  tiny: {
    marginTop: Spacing.half,
  },
  passHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  verdict: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    gap: Spacing.six,
    marginTop: Spacing.four,
  },
  priceItem: {
    gap: Spacing.half,
  },
  priceLabel: {
    marginTop: Spacing.half,
  },
  worth: {
    marginTop: Spacing.four,
  },
  caution: {
    marginTop: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  miniTab: {
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  detail: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  markRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  mark: {
    width: 16,
  },
  detailGap: {
    marginTop: Spacing.three,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.half,
  },
  buyBox: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  buyRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buyButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
