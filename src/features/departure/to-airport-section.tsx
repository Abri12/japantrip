import { IconCircle, Row, RowGroup, Section } from '@/components/ui';
import { FirstTrain, HubWay } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';

export interface ToAirportSectionProps {
  /** 도시를 안 골랐거나 공항이 없으면 구역째 그리지 않는다 */
  airportName?: string;
  /** 고른 도시까지 가는 법 */
  best?: HubWay;
  /** 시간을 재기 시작하는 거점 이름 */
  hubName?: string;
  /** 시내 → 공항 첫차 */
  firstTrain?: FirstTrain;
  onOpen: () => void;
}

/**
 * 「공항 가는 방법」 줄은 원래 아래 「공항에서 할 일」 안에 있었다. 공항에
 * 가는 일은 공항에 **닿기 전에** 하는 일이라 자리가 어긋나 있었고, 정작
 * 나서는 시각을 본 직후에는 무엇을 타는지 알 길이 없었다. 나서는 시각
 * 바로 뒤로 옮기고, 첫차 시각을 함께 적는다.
 */
export function ToAirportSection({
  airportName,
  best,
  hubName,
  firstTrain,
  onOpen,
}: ToAirportSectionProps) {
  const theme = useTheme();

  if (!airportName) return null;

  return (
    <Section title="공항 가는 길">
      <RowGroup>
        <Row
          leading={<IconCircle emoji="🚃" tone={theme.primarySoft} />}
          title={`${airportName}까지 가는 노선`}
          subtitle={
            best
              ? `${best.label} · ${hubName ?? '시내'}에서 ${best.minutes}분${
                  firstTrain ? ` · 첫차 ${firstTrain.from} ${firstTrain.time}` : ''
                }`
              : '노선별 소요시간과 요금을 비교해 보세요'
          }
          chevron
          last
          onPress={onOpen}
        />
      </RowGroup>
    </Section>
  );
}
