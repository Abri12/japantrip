/**
 * 경로 정보를 목록에서 쓸 한 줄로 줄인다.
 *
 * 목록과 상세는 하는 일이 다르다. 목록에서는 **어디를 갈지** 고르고, 상세에서
 * **어떻게 갈지** 정한다. 그래서 목록에는 역 이름과 걸리는 시간만 넣고, 노선
 * 색은 상세로 넘긴다. 목록 줄마다 색 이름까지 붙이면 이름·뱃지·도시·요금이
 * 이미 있는 줄이 더 빽빽해져서 정작 장소 이름이 안 읽힌다.
 *
 * 수단 이모지는 목록에도 남긴다. JR인지 지하철인지가 패스를 살지 말지와 바로
 * 이어지는 정보라서, 훑는 단계에서 이미 눈에 들어와야 한다.
 */
import { Access } from '@/data/places';
import { MODE } from '@/data/lines';

/**
 * @param ja 일본어 원문을 붙일지.
 *
 * 원문이 필요한 순간은 **역에 서서 안내판과 대조할 때**다. 그건 상세 화면을
 * 열어 둔 상태이지, 목록을 훑는 중이 아니다.
 *
 * 그런데 원문이 붙으면 줄이 길어진다 — `다니마치욘초메역(谷町四丁目駅)` 은
 * 한글만 쓸 때의 두 배다. 폰 폭에서는 그 한 줄이 세 줄로 쪼개지면서 오른쪽
 * 요금과 뒤엉킨다. **아직 고르지도 않은 곳의 원문 때문에 고르는 일이
 * 어려워지는 셈이다.**
 *
 * 그래서 목록은 한글만, 상세는 원문까지. 위의 「노선 색은 상세로 넘긴다」와
 * 같은 이유다.
 */
export function accessSummary(access: Access, { ja = true }: { ja?: boolean } = {}): string {
  const emoji = MODE[access.mode].emoji;
  const station = ja && access.stationJa ? `${access.station}(${access.stationJa})` : access.station;
  const parts = [station, access.leg].filter((p): p is string => !!p);
  return `${emoji} ${parts.join(' · ')}`;
}
