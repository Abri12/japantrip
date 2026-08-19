import { useState } from 'react';
import { View } from 'react-native';
import { CityScopeBar } from '@/components/city-scope';
import { Card, Chip, Empty, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { CITIES } from '@/data/cities';
import {
  IC_CARDS,
  IC_CARD_GUIDE,
  PASSES,
  advisoryForCity,
  tipsForCity,
} from '@/data/transit';
import { AdvisoryCard, PASS_CITIES, PassCard, styles } from '@/features/transit';
import { useSelectedCity } from '@/lib/selected-city';
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
  const advisory = advisoryForCity(cityId);

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

      {/* 확인 시점은 패스마다 다르다. 구역 제목에 하나로 적으면 갱신한 것과
          낡은 것이 같은 날짜를 달고 나간다 — 카드 안에서 각자 말하게 한다. */}
      <Section title={`${city?.name ?? ''} 교통패스`} caption="요금은 개정될 수 있어요">
        {/* 목록보다 먼저 온다. 다섯 장을 다 읽고 나서 「살 필요가 없었네」를
            알게 되면 그 시간이 통째로 낭비다. */}
        {advisory ? <AdvisoryCard advisory={advisory} /> : null}
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
