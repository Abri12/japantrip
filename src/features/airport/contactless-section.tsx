import { Section } from '@/components/ui';
import { ContactlessInfo } from '@/data/airports';

import { ContactlessCard } from './contactless-card';

export interface ContactlessSectionProps {
  /** 확인이 끝난 공항만 채워져 있다. 없으면 구역째 그리지 않는다 */
  info?: ContactlessInfo;
}

/**
 * 컨택리스는 「몰라서 못 쓰는」 대표적인 것이다. 카드에 ))) 표시만 있으면
 * 충전도 보증금도 없이 바로 타는데, 대부분 IC카드를 사러 줄을 선다. 그래서
 * 노선을 고르는 자리 바로 아래에 둔다 — 표를 사기 전에 봐야 의미가 있다.
 */
export function ContactlessSection({ info }: ContactlessSectionProps) {
  if (!info) return null;

  return (
    <Section title="컨택리스 카드 사용법" caption="가진 카드로 그냥 타는 방법이에요">
      <ContactlessCard info={info} />
    </Section>
  );
}
