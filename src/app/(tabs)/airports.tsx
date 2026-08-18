import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CityScopeBar } from '@/components/city-scope';
import { IconCircle, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { AIRPORTS, REGIONS } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';
import { euroRo } from '@/lib/korean';
import { useSelectedCity } from '@/lib/selected-city';

export default function AirportsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { city } = useSelectedCity();
  const [showAll, setShowAll] = useState(false);

  const cityAirports = city ? AIRPORTS.filter((a) => city.airportIds.includes(a.id)) : [];
  const scoped = !showAll && cityAirports.length > 0;

  return (
    <Screen
      title="공항 → 시내"
      subtitle="도착하는 공항을 고르면 어떻게 가는 게 나은지 비교해드려요">
      {cityAirports.length > 0 ? (
        <CityScopeBar city={city} showAll={showAll} onToggle={() => setShowAll((v) => !v)} />
      ) : null}

      {scoped ? (
        <Section
          title={`${city!.name}${euroRo(city!.name)} 들어오는 공항`}
          caption={cityAirports.length > 1 ? '어느 공항에 내리는지 확인하세요' : undefined}>
          <RowGroup>
            {cityAirports.map((airport, i) => {
              const best = airport.routes.find((r) => r.recommended) ?? airport.routes[0];
              return (
                <Row
                  key={airport.id}
                  leading={<IconCircle emoji="🛬" tone={theme.primarySoft} />}
                  title={airport.name}
                  subtitle={`추천 · ${best.name} ${best.minutes}분`}
                  trailing={airport.code}
                  trailingSub={best.yen === 0 ? '무료' : `¥${best.yen.toLocaleString()}`}
                  chevron
                  last={i === cityAirports.length - 1}
                  onPress={() => router.push(`/airport/${airport.id}`)}
                />
              );
            })}
          </RowGroup>
        </Section>
      ) : (
        REGIONS.map((region) => {
          const airports = AIRPORTS.filter((a) => a.region === region.id);
          if (airports.length === 0) return null;

          return (
            <Section key={region.id} title={`${region.emoji} ${region.name}`}>
              <RowGroup>
                {airports.map((airport, i) => {
                  const best = airport.routes.find((r) => r.recommended) ?? airport.routes[0];
                  return (
                    <Row
                      key={airport.id}
                      leading={<IconCircle emoji="🛬" tone={theme.primarySoft} />}
                      title={airport.name}
                      subtitle={`추천 · ${best.name} ${best.minutes}분`}
                      trailing={airport.code}
                      trailingSub={best.yen === 0 ? '무료' : `¥${best.yen.toLocaleString()}`}
                      chevron
                      last={i === airports.length - 1}
                      onPress={() => router.push(`/airport/${airport.id}`)}
                    />
                  );
                })}
              </RowGroup>
            </Section>
          );
        })
      )}

      {/* 화면 끝 안내 문구는 이동수단·라이선스 화면과 같은 형태로 둔다
          (Section 없이 캡션 한 줄). 여기만 View 로 한 겹 싸여 있어서 위쪽
          여백이 다르게 잡혔다. */}
      <Txt variant="caption" color="textTertiary">
        비행기에서 내려 데이터가 안 터져도 이 화면은 열려요. 공항 정보는 전부 앱 안에 들어
        있거든요.
      </Txt>
    </Screen>
  );
}
