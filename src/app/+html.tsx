import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * 웹으로 내보낼 때만 쓰이는 HTML 껍데기.
 *
 * 앱에서는 보이지 않는 부분이라 없어도 돌아가지만, 링크를 주고받는 순간부터
 * 이게 첫인상이 된다. 제목이 비어 있으면 브라우저 탭에 주소만 뜨고, 메신저로
 * 보내면 미리보기가 안 잡힌다.
 *
 * `lang="ko"` 은 접근성 문제이기도 하다. 이게 없으면 화면 낭독기가 한글을
 * 영어 발음으로 읽으려 든다.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>일본 여행 안전 가이드</title>
        <meta
          name="description"
          content="오사카 · 교토 · 후쿠오카 여행을 위한 한국어 가이드. 공항에서 시내 가는 법, 교통패스, 관광지와 맛집, 실시간 날씨 · 환율 · 지진 정보."
        />

        {/* 메신저로 링크를 보냈을 때 뜨는 미리보기 */}
        <meta property="og:title" content="일본 여행 안전 가이드" />
        <meta
          property="og:description"
          content="공항에서 시내 가는 법부터 교통패스 · 관광지 · 실시간 날씨까지, 한국어로."
        />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#4C5FD7" />

        {/*
          본문 서체 — Pretendard **동적 서브셋**.

          웹에서 폰트를 잘못 걸면 첫인상이 아니라 첫 8MB 가 된다. expo-font 로
          TTF 3종을 로드하면 그대로 preload 로 승격돼서, 사용자가 아무것도 보기
          전에 8MB 를 받는다. 여행지에서 로밍으로 여는 앱에서는 치명적이다.

          동적 서브셋은 한글을 유니코드 구간별로 쪼갠 조각(12~18KB)으로 나눠
          두고, 브라우저가 **화면에 실제로 나온 글자**에 해당하는 조각만 받는다.
          한국어 화면 하나에 보통 100~300KB 다.

          CDN 을 쓰는 것이 이 앱의 「오프라인에서도 열린다」와 부딪히지 않는다 —
          폰트를 못 받으면 시스템 폰트로 그려질 뿐 화면은 그대로 뜬다. 오히려
          8MB 를 안고 있는 쪽이 오프라인·저속 회선에서 훨씬 나쁘다.

          preconnect 를 함께 거는 이유는 CSS 를 받은 뒤에야 폰트 조각 요청이
          시작되기 때문이다. 연결을 미리 열어 두면 그 왕복이 겹쳐진다.
        */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />

        {/*
          네이티브에서는 스크롤이 화면 단위로 나뉘는데 웹은 body 전체가 스크롤된다.
          이 초기화가 없으면 화면이 두 겹으로 스크롤돼 스크롤바가 두 개 생긴다.
        */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
