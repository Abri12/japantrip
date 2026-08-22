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
 *
 * ## 실제로 어긋났었다
 *
 * 리뷰 인증 판정을 서버로 옮겼을 때 `PRIVACY.md` 는 고쳤는데 **이 화면은 안
 * 고쳤다.** 그래서 여기만 「위치를 전송하지 않아요」라고 말하고 있었다 —
 * 좌표가 실제로 서버로 가는데도.
 *
 * 사용자가 읽는 것은 이 화면이지 저장소의 마크다운이 아니다. 둘 중 하나만
 * 맞다면 **틀린 쪽이 사용자에게 보이는 쪽**이었던 셈이다.
 *
 * 그래서 이 화면은 「없다」를 세는 자리가 아니라 **나가는 것을 빠짐없이 세는
 * 자리**로 다시 썼다. 없는 것을 자랑하다 있는 것을 빠뜨리면, 문장 하나가
 * 틀린 게 아니라 방침 전체가 거짓이 된다.
 */
export default function PrivacyScreen() {
  const theme = useTheme();

  return (
    <Screen back title="개인정보처리방침" subtitle="2026년 8월 22일 기준">
      <Section>
        <Card accent={theme.success}>
          <Txt variant="title">당신이 누구인지 몰라요</Txt>
          <Txt variant="body" color="textSecondary" style={{ marginTop: 8 }}>
            회원가입이 없어요. 이름·이메일·전화번호를 묻지 않고, 광고 식별자나 기기 고유
            번호도 쓰지 않아요. 검색어나 어느 화면을 봤는지도 모으지 않아요.
          </Txt>
          <Txt variant="body" color="textSecondary" style={{ marginTop: 12 }}>
            서버로 나가는 것이 세 가지 있어요 — 리뷰를 남길 때의 위치, 지진 알림을 켰을
            때의 알림 주소, 앱이 죽었을 때의 오류 내용이에요. 아래에 하나씩 적었어요.
          </Txt>
        </Card>
      </Section>

      <Section title="위치 정보" caption="이 앱이 권한을 요청하는 유일한 항목이에요">
        <RowGroup>
          <Row title="언제 쓰나요" subtitle="「지금 여기 있어요」를 직접 누를 때만" />
          <Row title="왜 쓰나요" subtitle="그 장소 반경 안에 있는지 확인해서 리뷰 신뢰도를 지키려고요" />
          <Row
            title="전송하나요"
            subtitleProminent
            subtitle="네. 좌표를 서버로 보내 거리를 다시 계산해요"
          />
          <Row title="리뷰에 남는 건" subtitle="「인증됨」과 장소까지의 거리(m)뿐이에요" />
          <Row
            title="보관하나요"
            subtitle="직전 한 건만 24시간. 위치를 꾸며내는 걸 막으려고요"
          />
          <Row
            title="거부하면요"
            subtitle="리뷰 인증만 못 하고, 나머지 기능은 그대로 다 써요"
            last
          />
        </RowGroup>
        {/*
          「판정만 하고 버리니 수집이 아니다」가 아니다. 기기 밖으로 나갔으면
          나간 것이다 — 이 화면이 한동안 그 반대로 말하고 있었다.
        */}
        <Txt variant="caption" color="textTertiary" style={{ marginTop: 12 }}>
          판정을 서버가 다시 하는 이유는, 앱에서만 판정하면 앱을 거치지 않고 서버를 직접
          불러 「인증됨」을 만들 수 있어서예요. 그러면 인증이 뜻을 잃어요.
        </Txt>
      </Section>

      <Section title="지진 알림" caption="켠 사람만 해당돼요. 기본은 꺼져 있어요">
        <RowGroup>
          <Row title="언제 켜지나요" subtitle="안전 화면의 스위치를 직접 켤 때만" />
          <Row title="보내는 것" subtitle="알림 주소(토큰)와 머무는 도도부현, 받을 진도" />
          <Row title="좌표를 보내나요" trailing="아니요" />
          <Row
            title="누가 켰는지 아나요"
            subtitleProminent
            subtitle="몰라요. 리뷰에 쓰는 기기 값과 묶지 않아요"
          />
          <Row title="끄면요" subtitle="명부에서 지워요. 스위치를 끄면 바로요" last />
        </RowGroup>
        <Txt variant="caption" color="textTertiary" style={{ marginTop: 12 }}>
          도도부현만 있으면 「이 지진을 누구에게 보낼지」를 고를 수 있어요. 그보다 자세한
          위치는 알 이유가 없어서 받지 않아요. 도도부현은 고르신 도시에서 그대로 나오는
          값이라 위치 권한도 필요 없어요.
        </Txt>
      </Section>

      <Section title="오류 보고" caption="앱이 죽었을 때만이에요">
        <RowGroup>
          <Row title="보내는 것" subtitle="오류 내용과 어느 화면이었는지, 앱 버전" />
          <Row
            title="기기를 구분하나요"
            subtitleProminent
            subtitle="아니요. 「이 오류가 세 번 났다」만 알고 「이 사람이 세 번 겪었다」는 몰라요"
          />
          <Row title="화면에 뜬 내용은요" subtitle="보내지 않아요. 화면 이름까지만이에요" last />
        </RowGroup>
        <Txt variant="caption" color="textTertiary" style={{ marginTop: 12 }}>
          센트리 같은 외부 오류 추적 서비스를 쓰지 않아요. 운영자 서버로 바로 가요.
        </Txt>
      </Section>

      <Section title="폰에만 저장되는 것" caption="앱을 지우면 함께 사라져요">
        <RowGroup>
          <Row title="선택한 도시" />
          <Row title="여행 준비물 체크 상태" />
          <Row title="작성한 리뷰" subtitle="서버가 있으면 서버에도 남아요" />
          <Row title="저장한 장소" />
          <Row title="내 일정" />
          <Row title="여행 중 쓴 돈" />
          <Row title="차단한 작성자" />
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
