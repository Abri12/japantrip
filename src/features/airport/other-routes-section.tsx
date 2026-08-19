import { Section } from '@/components/ui';
import { TransitRoute } from '@/data/airports';

import { TransitCard } from './transit-card';

export interface OtherRoutesSectionProps {
  /**
   * 어느 거점에도 안 걸리는 노선.
   *
   * 나하의 렌터카 셔틀이 그렇다 — 시내가 아니라 렌터카 영업소로 간다.
   * 비어 있으면 이 구역 자체를 그리지 않는다.
   */
  routes: TransitRoute[];
}

export function OtherRoutesSection({ routes }: OtherRoutesSectionProps) {
  if (routes.length === 0) return null;

  return (
    <Section title="이 공항의 다른 노선" caption="시내 거점으로 가는 길은 아니에요">
      {routes.map((route) => (
        <TransitCard key={route.id} route={route} />
      ))}
    </Section>
  );
}
