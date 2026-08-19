import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui';
import {
  AtAirportSection,
  BeforeLeavingSection,
  IcCardNote,
  LeadTimeSection,
  LuggageSection,
  PackingRulesSection,
  ToAirportSection,
  useDeparturePlan,
} from '@/features/departure';

/**
 * 귀국하는 날 — 조립만 한다.
 *
 * 이 날의 일은 다른 날과 성격이 다르다. **되돌릴 수 없는 것들**이 몰려 있다:
 * 비행기를 놓치면 끝이고, 면세 환급은 공항을 나가면 못 받고, 짐을 잘못 부치면
 * 보조배터리가 압수된다. 그런데 앱은 이 정보를 여기저기 흩어 두고 있었다 —
 * 면세는 별도 화면, 짐 규정은 준비물, 공항 가는 법은 공항 화면. 정작 그날
 * 아침에 한 화면에서 훑을 곳이 없었다.
 *
 * 순서는 **하는 시점** 순이다. 시각을 먼저 알고, 방을 나서고, 가방을 싸고,
 * 공항으로 가고, 공항에서 할 일을 한다.
 */
export default function DepartureScreen() {
  const router = useRouter();
  const plan = useDeparturePlan();

  return (
    <Screen back title="귀국하는 날" subtitle="놓치면 되돌릴 수 없는 것들만 모았어요">
      <LeadTimeSection
        airportName={plan.airport?.name}
        best={plan.best}
        hubName={plan.hubName}
        cityName={plan.cityName}
        firstTrain={plan.firstTrain}
      />

      <BeforeLeavingSection />
      <PackingRulesSection />

      <ToAirportSection
        airportName={plan.airport?.name}
        best={plan.best}
        hubName={plan.hubName}
        firstTrain={plan.firstTrain}
        onOpen={() => router.push(`/airport/${plan.airport?.id}`)}
      />

      <LuggageSection />
      <AtAirportSection onOpenTaxFree={() => router.push('/tax-free')} />
      <IcCardNote />
    </Screen>
  );
}
