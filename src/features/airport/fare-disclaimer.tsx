import { Txt } from '@/components/ui';
import { FARE_BASELINE } from '@/data/airports';

/**
 * 이 화면의 숫자가 언제 기준인지.
 *
 * 요금은 조용히 오른다. 기준 시점을 안 적으면 사용자가 낡은 값인지 판단할
 * 방법이 없어서, 화면 맨 아래에 한 번 못 박는다.
 */
export function FareDisclaimer() {
  return (
    <Txt variant="caption" color="textTertiary">
      요금과 소요시간은 {FARE_BASELINE}이에요. 시기나 구간에 따라 달라질 수 있어요.
      원화 환산은 실시간 환율을 반영한 참고용이에요.
    </Txt>
  );
}
