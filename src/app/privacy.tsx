import { Card, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

/**
 * 개인정보처리방침.
 *
 * 위치 권한을 쓰는 앱은 스토어 등록에 이 화면이 필요하다. 다만 형식만 갖추는
 * 문서로 만들지 않았다 — 이 앱은 실제로 **개인정보를 서버로 보내지 않으므로**,
 * 그 사실을 가장 먼저 크게 적는 편이 사용자에게도 정확하다.
 *
 * 문서 전문은 저장소의 PRIVACY.md 와 같은 내용이다. 둘이 어긋나지 않게 바꿀 때
 * 함께 고쳐야 한다.
 */
export default function PrivacyScreen() {
  const theme = useTheme();

  return (
    <Screen back title="개인정보처리방침" subtitle="2026년 8월 18일 기준">
      <Section>
        <Card accent={theme.success}>
          <Txt variant="title">서버로 보내는 게 없어요</Txt>
          <Txt variant="body" color="textSecondary" style={{ marginTop: 8 }}>
            회원가입이 없고, 이름·이메일·전화번호를 묻지 않아요. 위치는 리뷰를 남길 때
            「지금 그 장소에 있는지」를 폰 안에서 확인하는 데만 쓰고, 저장하거나 보내지
            않아요.
          </Txt>
        </Card>
      </Section>

      <Section title="위치 정보" caption="이 앱이 권한을 요청하는 유일한 항목이에요">
        <RowGroup>
          <Row title="언제 쓰나요" subtitle="「지금 여기 있어요」를 직접 누를 때만" />
          <Row title="왜 쓰나요" subtitle="그 장소 반경 안에 있는지 확인해서 리뷰 신뢰도를 지키려고요" />
          <Row title="저장하나요" trailing="아니요" />
          <Row title="전송하나요" trailing="아니요" />
          <Row
            title="거부하면요"
            subtitle="리뷰 인증만 못 하고, 나머지 기능은 그대로 다 써요"
            last
          />
        </RowGroup>
      </Section>

      <Section title="폰에만 저장되는 것" caption="앱을 지우면 함께 사라져요">
        <RowGroup>
          <Row title="선택한 도시" />
          <Row title="여행 준비물 체크 상태" />
          <Row title="작성한 리뷰" />
          <Row title="공항 화면에서 고른 거점" last />
        </RowGroup>
      </Section>

      <Section title="외부에서 받아오는 정보" caption="받아오기만 하고, 보내는 정보는 없어요">
        <RowGroup>
          <Row title="지진 · 쓰나미" subtitle="P2P지진정보" trailing="보내는 정보 없음" />
          <Row title="기상 경보" subtitle="일본 기상청(JMA)" trailing="지역 코드" />
          <Row title="날씨" subtitle="Open-Meteo" trailing="도시 좌표" />
          <Row
            title="환율"
            subtitle="ExchangeRate-API · Frankfurter"
            trailing="보내는 정보 없음"
            last
          />
        </RowGroup>
        <Txt variant="caption" color="textTertiary" style={{ marginTop: 12 }}>
          날씨에 쓰는 좌표는 사용자의 위치가 아니라 앱에 미리 저장된 도시 중심 좌표예요.
          실제 위치와는 상관이 없어요.
        </Txt>
      </Section>

      {/* 「안 모은다」는 사실은 짧게 적는다. 없는 것을 길게 설명하면 오히려
          뭔가 있는 것처럼 읽힌다. 다만 예전에 있던 기능이라 왜 없앴는지는
          한 줄 남긴다 — 쓰던 사람이 사라진 화면을 찾을 수 있다. */}
      <Section title="사용 기록">
        <Card>
          <Txt variant="body" color="textSecondary">
            뽑기·사다리타기에 적으신 글자는 어디에도 저장하지 않아요. 화면을 벗어나면
            사라져요. 사용 횟수도 세지 않고요.
          </Txt>
          <Txt variant="body" color="textSecondary" style={{ marginTop: 12 }}>
            예전에는 동의를 받아 후보칸의 가게 이름을 모았는데, 사다리타기에는 다른
            사람의 이름이 적히는 일이 많았어요. 그분들께는 동의를 받을 방법이 없어서
            수집 자체를 없앴어요. 「내 사용 기록」 화면도 함께 사라졌어요.
          </Txt>
        </Card>
      </Section>

      <Section title="광고 · 분석">
        <Card>
          <Txt variant="body" color="textSecondary">
            광고를 넣지 않고, 구글 애널리틱스 같은 외부 분석 도구도 넣지 않았어요. 광고
            식별자나 기기 고유 식별자를 수집하지 않고, 기기를 구분하는 값은 설치할 때
            무작위로 만들어요.
          </Txt>
        </Card>
      </Section>

      <Section title="문의">
        <Card>
          <Txt variant="body" color="textSecondary">
            개인정보 처리에 관한 문의는 hyun64400@gmail.com 으로 보내주세요.
          </Txt>
        </Card>
      </Section>
    </Screen>
  );
}
