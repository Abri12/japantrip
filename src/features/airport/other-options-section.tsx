import { Section } from '@/components/ui';
import { OtherOption } from '@/data/airports';

import { OtherOptionCard } from './other-option-card';

export interface OtherOptionsSectionProps {
  /** 택시·렌터카처럼 정기 노선표 밖의 대안. 조사가 끝난 공항만 채워져 있다 */
  options?: OtherOption[];
}

export function OtherOptionsSection({ options }: OtherOptionsSectionProps) {
  if (!options?.length) return null;

  return (
    <Section title="다른 방법도 있어요" caption="시간표에 없는 대안이에요">
      {options.map((opt) => (
        <OtherOptionCard key={opt.id} option={opt} />
      ))}
    </Section>
  );
}
