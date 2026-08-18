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
          네이티브에서는 스크롤이 화면 단위로 나뉘는데 웹은 body 전체가 스크롤된다.
          이 초기화가 없으면 화면이 두 겹으로 스크롤돼 스크롤바가 두 개 생긴다.
        */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
