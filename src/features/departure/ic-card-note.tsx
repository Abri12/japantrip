import { Txt } from '@/components/ui';

/**
 * IC카드 보증금 안내.
 *
 * 귀국일에 「반납해야 하나」로 한 번 멈추는 지점이다. 500엔을 돌려받으려고
 * 창구에 줄을 서는 사람이 있는데, 다음에 또 올 거면 그냥 들고 가는 편이 낫다.
 */
export function IcCardNote() {
  return (
    <Txt variant="caption" color="textTertiary">
      IC카드(ICOCA·SUGOCA)는 반납하면 보증금 500엔을 돌려받지만, 다음에 또 올 거면 그냥
      들고 가도 돼요. 잔액은 10년간 유효해요.
    </Txt>
  );
}
