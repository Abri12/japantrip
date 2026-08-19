import { Section } from '@/components/ui';
import { CityHub, TransitRoute } from '@/data/airports';

import { HubPicker } from './hub-picker';
import { TransitCard } from './transit-card';

export interface AccessSectionProps {
  /** 이 공항의 도착 거점. 거점이 없는 공항은 노선을 그대로 늘어놓는다 */
  hubs?: CityHub[];
  /** 지금 펼쳐 둔 거점. `hubs` 가 있으면 반드시 함께 온다 */
  selected?: CityHub;
  onSelectHub: (hubId: string) => void;
  /** 공항의 전체 노선. 거점 카드가 `routeId` 로 상세를 끌어다 쓴다 */
  routes: TransitRoute[];
  /**
   * 막차 시각이 「약」으로만 확인된 노선이 있는지.
   *
   * 거점이 없는 공항에서만 캡션에 쓴다. 거점이 있으면 캡션 자리에
   * 「어느 동네인지부터 고르세요」가 먼저 와야 해서 자리를 못 준다.
   */
  hasApproxLastTrain: boolean;
}

/**
 * 목록은 **하나만** 둔다.
 *
 * 「어디까지 가세요」를 넣으면서 거점 칸과 노선 칸을 따로 뒀더니, 같은
 * 탈것이 한 화면에 두 번 나왔다. 위에서는 「JR 하루카 80분 ¥3,640」,
 * 아래에서는 「JR 하루카 50분 ¥3,110」. 기준점이 달라 둘 다 맞는 값인데,
 * 읽는 사람에게는 앱이 두 소리를 하는 것이었다. 생김새도 갈렸다 —
 * 한쪽에만 이모지가 있고 뱃지 규칙도 달랐다.
 *
 * 역할을 나누는 것만으로는 부족했다. 고르는 단위가 「노선」이 아니라
 * **「내 숙소까지 가는 한 가지 방법」**이라서, 카드도 그 단위여야 한다.
 * 거점을 고르면 거기까지 가는 방법이 카드로 늘어서고, 막차·정차역·
 * 타는 순서처럼 거점과 무관한 것은 그 카드 **안에** 들어간다.
 */
export function AccessSection({
  hubs,
  selected,
  onSelectHub,
  routes,
  hasApproxLastTrain,
}: AccessSectionProps) {
  return (
    <Section
      title="시내 가는 방법"
      caption={
        hubs
          ? '숙소가 어느 동네인지부터 고르세요'
          : hasApproxLastTrain
            ? '막차는 참고용이니 출발 전 재확인하세요'
            : undefined
      }>
      {hubs && selected ? (
        <HubPicker hubs={hubs} selected={selected} onSelect={onSelectHub} routes={routes} />
      ) : (
        routes.map((route) => <TransitCard key={route.id} route={route} />)
      )}
    </Section>
  );
}
