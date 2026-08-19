import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, Txt } from '@/components/ui';
import { findAirport } from '@/data/airports';
import {
  AccessSection,
  ContactlessSection,
  FareDisclaimer,
  OtherOptionsSection,
  OtherRoutesSection,
  ReturnTripSection,
  TipsSection,
  useAirportDetail,
} from '@/features/airport';

/**
 * 공항 상세 — 조립만 한다.
 *
 * 무엇을 어떤 순서로 보여줄지가 이 파일의 전부다. 각 구역이 실제로 어떻게
 * 생겼는지는 `features/airport` 에 있다. 순서에는 뜻이 있다.
 *
 * 1. 시내 가는 방법 — 비행기에서 막 내린 사람이 유일하게 급한 것
 * 2. 이 공항의 다른 노선 — 거점으로 안 가는 것. 있을 때만
 * 3. 공항 갈 때는 — 방향이 반대인 유일한 구역. 귀국일 아침에 쓴다
 * 4. 컨택리스 — **표를 사기 전에** 봐야 의미가 있어서 노선 바로 뒤에
 * 5. 다른 방법 · 조심할 점 — 고르고 난 뒤에 읽는 것
 */
export default function AirportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const airport = findAirport(id);
  const router = useRouter();

  /* 훅은 이른 return 보다 위에서 부른다. 아래로 내리면 「공항을 못 찾음」
     경로에서 훅 개수가 달라진다. */
  const view = useAirportDetail(airport);

  if (!airport) {
    return (
      <Screen back backFallback="/airports" title="공항을 찾을 수 없어요">
        <Txt variant="body" color="textTertiary">
          잘못된 주소예요.
        </Txt>
      </Screen>
    );
  }

  return (
    <>
      {/* 헤더는 숨겨져 있고, 이 title 은 웹 브라우저 탭 제목으로만 쓰인다. */}
      <Stack.Screen options={{ title: `${airport.name} (${airport.code})` }} />
      <Screen
        back
        backFallback="/airports"
        title={airport.name}
        subtitle={`${airport.nameJa} · ${airport.city}`}>
        <AccessSection
          hubs={airport.hubs}
          selected={view.hub}
          onSelectHub={view.selectHub}
          routes={view.routes}
          hasApproxLastTrain={view.hasApproxLastTrain}
        />

        <OtherRoutesSection routes={view.orphanRoutes} />

        <ReturnTripSection
          airportNameJa={airport.nameJa}
          hasReservedRoute={view.hasReservedRoute}
          firstTrains={view.firstTrains}
          onOpenDeparture={() => router.push('/departure')}
        />

        <ContactlessSection info={airport.contactless} />

        <OtherOptionsSection options={airport.otherOptions} />

        <TipsSection tips={airport.tips} />

        <FareDisclaimer />
      </Screen>
    </>
  );
}
