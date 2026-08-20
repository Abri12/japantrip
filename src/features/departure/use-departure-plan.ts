import { Airport, FirstTrain, HubWay } from '@/data/airports';
import { AirportContextInput, useAirportContext } from '@/lib/airport-context';

export type { AirportContextInput as DeparturePlanInput };

export interface DeparturePlan {
  /** 계산 기준이 되는 공항. 맥락이 아무것도 없으면 없다 */
  airport?: Airport;
  /** 그 공항에서 **기준 거점까지** 가는 법 */
  best?: HubWay;
  /** 시간을 재기 시작하는 거점 */
  hubName?: string;
  cityName?: string;
  /** `best` 가 쓰는 노선의 시내 → 공항 첫차 */
  firstTrain?: FirstTrain;
}

/**
 * 귀국일 계산이 딛고 서는 값들.
 *
 * 「어느 공항 · 어느 거점이냐」는 이 훅이 정하지 않는다. 그건 앱 전체에서
 * 한 자리(`lib/airport-context`)가 정하고, 여기는 그 답을 이 화면이 쓰는
 * 이름으로 옮기기만 한다.
 *
 * 예전에는 이 훅이 직접 정했다. 그래서 공항 상세 화면과 **같은 규칙을 따로
 * 구현**하고 있었고, 두 구현이 어긋나 있었다 — 공항 탭의 「전체 보기」로
 * 후쿠오카 공항을 열고 「몇 시에 숙소를 나서야 하나요」를 누르면, 도쿄를
 * 고른 사람에게 나리타 기준 「비행기 4시간 20분 전」이 나왔다. 후쿠오카는
 * 2시간 55분인데도. 방향이 반대면 1시간 25분을 모자라게 답한다.
 */
export function useDeparturePlan(input: AirportContextInput = {}): DeparturePlan {
  const { airport, hub, best, cityName, firstTrain } = useAirportContext(input);
  return { airport, best, hubName: hub?.name, cityName, firstTrain };
}
