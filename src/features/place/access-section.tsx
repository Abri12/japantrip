import { AccessDetail, stationLabel } from '@/components/line-badge';
import { Row, RowGroup, Section } from '@/components/ui';
import { cityNames } from '@/data/cities';
import { MODE } from '@/data/lines';
import { Place } from '@/data/places';

import { RowEmoji } from './row-emoji';

export interface AccessSectionProps {
  place: Place;
}

/**
 * 아이콘은 전부 넣거나 전부 빼야 한다. 한 줄에만 있으면 그 줄이 특별해
 * 보이고, 나머지 줄은 왼쪽이 비어서 제목이 들쭉날쭉하게 읽힌다.
 */
export function AccessSection({ place }: AccessSectionProps) {
  return (
    <Section title="가는 방법 · 관람 정보">
      <RowGroup>
        {/* 근교는 이동 시간이 사실상 첫 번째 판단 기준이라 역보다 위에 둔다.
            출발 거점이 여러 곳인 곳(나라·우지)은 그 사실도 같이 알려준다. */}
        {place.dayTrip ? (
          <Row
            leading={<RowEmoji emoji="🗺️" />}
            title="근교 당일치기"
            subtitle={`${cityNames(place.dayTrip.from)}에서 갈 수 있어요`}
            trailing={place.dayTrip.travel}
            trailingSub="편도"
          />
        ) : null}
        {/* 역 이름을 오른쪽으로 보내고, 노선은 색 점 + 색 이름으로 아래에
            붙인다. 왼쪽에 「난바역 (미도스지선) 도보 5분」을 한 줄로 깔면
            제목과 값이 뒤섞여서 어느 쪽이 답인지 안 보인다.

            역 이름 뒤에 일본어 원문을 괄호로 붙인다. 실제로 지하철에서
            내릴 때 승강장·전광판에 보이는 건 한글이 아니라 이 표기라서,
            한글만 있으면 안내판과 대조할 방법이 없다. */}
        {place.access ? (
          <Row
            leading={<RowEmoji emoji={MODE[place.access.mode].emoji} />}
            title={MODE[place.access.mode].rowTitle}
            trailing={stationLabel(place.access)}
            trailingSub={<AccessDetail route={place.access} />}
          />
        ) : null}
        {/* 대안 경로도 주 경로와 똑같이 그린다 — 노선 색 점과 일본어 원문이
            한쪽에만 붙어 있으면 같은 정보인데 아래 줄이 반쪽처럼 보인다. */}
        {place.access?.alt ? (
          <Row
            leading={<RowEmoji emoji={MODE[place.access.alt.mode].emoji} />}
            title="이렇게도 가요"
            trailing={stationLabel(place.access.alt)}
            trailingSub={<AccessDetail route={place.access.alt} />}
          />
        ) : null}
        {place.access?.note ? (
          <Row
            leading={<RowEmoji emoji="🔀" />}
            title="이렇게도 가요"
            subtitle={place.access.note}
            subtitleProminent
          />
        ) : null}
        {/* 「권장 소요시간」은 확정된 수치처럼 읽히지만 실제로는 눈금이다.
            방문자 통계가 아니라 "이 정도면 한 바퀴 돈다"는 추정이라,
            입장료·역 이름과 같은 무게로 두면 일정을 이 숫자에 맞춰 짜게
            된다. 제목과 보조 문구로 추정임을 드러낸다. */}
        {place.duration ? (
          <Row
            leading={<RowEmoji emoji="⏱️" />}
            title="둘러보는 시간"
            trailing={place.duration}
            trailingSub="사람마다 달라요"
            last={!place.admission}
          />
        ) : null}
        {place.admission ? (
          <Row
            leading={<RowEmoji emoji="🎟️" />}
            title="입장료"
            trailing={place.admission}
            last
          />
        ) : null}
      </RowGroup>
    </Section>
  );
}
