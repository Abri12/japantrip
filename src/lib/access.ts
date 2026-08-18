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

export function accessSummary(access: Access): string {
  const emoji = MODE[access.mode].emoji;
  // 역 안내판·전광판에는 한글이 없다. 「난바역」만 적어 두면 실제로 지하철에서
  // 내려서 대조할 표기가 없으니, 원문을 괄호로 바로 붙여 둔다.
  const station = access.stationJa ? `${access.station}(${access.stationJa})` : access.station;
  const parts = [station, access.leg].filter((p): p is string => !!p);
  return `${emoji} ${parts.join(' · ')}`;
}
