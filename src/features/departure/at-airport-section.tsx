import { IconCircle, Row, RowGroup, Section } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export interface AtAirportSectionProps {
  onOpenTaxFree: () => void;
}

export function AtAirportSection({ onOpenTaxFree }: AtAirportSectionProps) {
  const theme = useTheme();

  return (
    <Section title="공항에서 할 일">
      <RowGroup>
        <Row
          leading={<IconCircle emoji="🛍️" tone={theme.primarySoft} />}
          title="면세 환급"
          subtitle="2026년 11월부터 방식이 바뀌어요"
          chevron
          last
          onPress={onOpenTaxFree}
        />
      </RowGroup>
    </Section>
  );
}
