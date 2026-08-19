import { IconCircle, Row, RowGroup, Section } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export function BeforeLeavingSection() {
  const theme = useTheme();

  return (
    <>
      {/* 두 가지 일을 한 목록에 섞어 두면 훑다가 놓친다 — 「방을 나서기 전에
          하는 일」과 「가방을 쌀 때 지켜야 하는 규정」은 하는 시점도 다르고
          틀렸을 때 벌어지는 일도 다르다. */}
      <Section title="숙소를 나오기 전에" caption="여기서 놓치면 되돌리기 어려워요">
        <RowGroup>
          {/* 목록 맨 위에 둔다. 되돌릴 수 없기로는 이만한 게 없다 — 공항에서
              알게 되면 숙소까지 왕복하는 시간이 통째로 사라진다. */}
          <Row
            leading={<IconCircle emoji="🛂" tone={theme.dangerSoft} />}
            title="여권 · 방 금고를 꼭 열어보세요"
            subtitle="금고에 넣어둔 여권을 두고 나오는 일이 가장 많아요. 문 닫기 전에 한 번 더"
          />
          <Row
            leading={<IconCircle emoji="🔑" tone={theme.primarySoft} />}
            title="숙소 열쇠 반납 · 방 한 번 더 확인"
            subtitle="충전기와 어댑터를 콘센트에 두고 오는 일이 제일 흔해요"
          />
          <Row
            leading={<IconCircle emoji="📶" tone={theme.warningSoft} />}
            title="빌린 와이파이 · 유심 챙기기"
            subtitle="공항 반납함에 넣어야 해요. 두고 오면 연체료가 붙어요"
          />
          <Row
            leading={<IconCircle emoji="🪙" tone={theme.primarySoft} />}
            title="남은 동전 털기"
            subtitle="편의점이나 자판기에서 쓰는 게 나아요. 동전은 환전이 안 돼요"
            last
          />
        </RowGroup>
      </Section>
    </>
  );
}
