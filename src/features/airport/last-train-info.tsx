import { useEffect, useState } from 'react';

import { Badge, Txt } from '@/components/ui';
import { TransitRoute } from '@/data/airports';
import { LastTrainState, lastTrainState } from '@/lib/last-train';

/**
 * 막차 정보. 1분마다 다시 계산한다.
 *
 * 시간이 넉넉히 남았을 때(status: normal)도 **막차 자체는 항상 보여야 한다.**
 * 색깔 뱃지만 조건부로 띄우고 평소엔 아무것도 안 보이면, 사용자는 이 노선에
 * 막차가 있다는 사실조차 알 길이 없다. 그래서 시간 표시는 항상 그리고,
 * 임박·종료일 때만 눈에 띄는 뱃지를 추가로 얹는다.
 */
export interface LastTrainInfoProps {
  /** 막차 시각. 없는 노선(택시 등)에는 이 컴포넌트를 붙이지 않는다 */
  lastTrain: NonNullable<TransitRoute['lastTrain']>;
}

export function LastTrainInfo({ lastTrain }: LastTrainInfoProps) {
  const [state, setState] = useState<LastTrainState>(() => lastTrainState(lastTrain));

  useEffect(() => {
    const timer = setInterval(() => setState(lastTrainState(lastTrain)), 60_000);
    return () => clearInterval(timer);
  }, [lastTrain]);

  const prefix = lastTrain.confidence === 'approx' ? '약 ' : '';

  if (state.status === 'gone') {
    return <Badge label={`운행 종료 · 막차 ${prefix}${lastTrain.time}`} tone="danger" />;
  }
  if (state.status === 'soon') {
    return <Badge label={`막차 ${prefix}${lastTrain.time} 임박`} tone="warning" />;
  }
  return (
    <Txt variant="caption" color="textTertiary">
      막차 {prefix}
      {lastTrain.time}
    </Txt>
  );
}
