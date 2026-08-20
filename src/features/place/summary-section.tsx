import { Card, Section, Txt } from '@/components/ui';
import { Place } from '@/data/places';

export interface SummarySectionProps {
  place: Place;
}

/**
 * 이 장소가 뭐 하는 곳인지 한 문단.
 *
 * 예전에는 여기 「지도에서 열기」 버튼이 파란 덩어리로 붙어 있었다. 두 가지가
 * 어긋나 있었다 —
 *
 *   ① 이 화면의 다른 줄은 전부 `Row`(왼쪽 이모지 · 오른쪽 값 · 셰브런)인데
 *      혼자만 색을 채운 배너라, 정보가 아니라 광고처럼 읽혔다.
 *   ② **설명 카드에 행동 버튼이 들어 있었다.** 「어떻게 가는지」는 아래
 *      구역의 주제고, 같은 것이 두 군데 있으면 어느 쪽이 본체인지 흐려진다.
 *
 * 지도 열기는 「가는 방법 · 관람 정보」의 한 줄로 옮겼다(access-section.tsx).
 * 여기는 설명만 남긴다.
 */
export function SummarySection({ place }: SummarySectionProps) {
  return (
    <Section>
      <Card>
        <Txt variant="body">{place.summary}</Txt>
      </Card>
    </Section>
  );
}
