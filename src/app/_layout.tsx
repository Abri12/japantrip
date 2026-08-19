import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Palette } from '@/constants/theme';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { useIsDark } from '@/hooks/use-theme';
import { FxProvider } from '@/lib/fx';
import { SelectedCityProvider } from '@/lib/selected-city';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isDark = useIsDark();
  const palette = isDark ? Palette.dark : Palette.light;

  /* 플랫폼마다 방식이 다르다 — 네이티브는 번들 TTF, 웹은 CSS 동적 서브셋.
     이유는 hooks/use-app-fonts.web.ts 주석에 적었다. */
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    // 폰트가 준비되기 전까지는 스플래시로 가려 둔다. 글자가 시스템 폰트로
    // 한 번 그려졌다가 교체되는 것을 감추기 위해서다.
    //
    // 다만 로딩 중에 null 을 반환해서는 안 된다. 웹 정적 렌더링에는 폰트 로딩
    // 단계가 없어서, 그렇게 하면 본문이 통째로 빈 HTML 이 만들어진다.
    // 화면은 항상 그리고, 가리는 일만 스플래시에 맡긴다.
    //
    // 폰트를 못 불러온 경우에도 스플래시를 내린다 — 폰트 하나 때문에 앱이
    // 영원히 스플래시에 갇히는 편이 훨씬 나쁘다.
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // 헤더·배경까지 팔레트에 맞춘다. 기본 테마를 그대로 쓰면 화면 사이 배경색이 튄다.
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: palette.background,
      card: palette.background,
      text: palette.text,
      border: palette.border,
      primary: palette.primary,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <SelectedCityProvider>
        <FxProvider>
          {/*
            내비게이터 헤더는 쓰지 않는다(headerShown: false).
            뒤로 가기는 Screen 컴포넌트가 직접 그린다. 이유가 두 가지다.

            1. 헤더의 뒤로 버튼은 스택에 화면이 둘 이상 쌓였을 때만 나온다.
               웹에서 주소를 직접 열거나 새로고침하면 스택이 그 화면 하나로
               시작해서 버튼이 사라지고, 사용자가 화면에 갇힌다.
            2. 화면마다 Screen 이 이미 큰 제목을 그리고 있어서, 헤더 제목과
               같은 글이 위아래로 두 번 나왔다.

            `title` 은 그대로 남긴다 — 헤더를 숨겨도 웹 브라우저 탭 제목으로
            쓰이기 때문이다.
          */}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ title: '일본 여행 안전 가이드' }} />
            <Stack.Screen name="airport/[id]" options={{ title: '공항' }} />
            <Stack.Screen name="place/[id]" options={{ title: '관광 · 맛집' }} />
            <Stack.Screen name="course/[id]" options={{ title: '추천 코스' }} />
            <Stack.Screen name="roadmap" options={{ title: '오픈 로드맵' }} />
            <Stack.Screen name="licenses" options={{ title: '오픈소스 라이선스' }} />
            <Stack.Screen name="privacy" options={{ title: '개인정보처리방침' }} />
            <Stack.Screen name="etiquette" options={{ title: '현지 예절 · 생존 회화' }} />
            <Stack.Screen name="weather" options={{ title: '오늘 날씨' }} />
            <Stack.Screen name="entry-guide" options={{ title: '입국 심사 · 세관 신고' }} />
            <Stack.Screen name="tax-free" options={{ title: '면세 계산기' }} />
            <Stack.Screen name="prep" options={{ title: '여행 준비' }} />
            <Stack.Screen name="departure" options={{ title: '귀국하는 날' }} />
            <Stack.Screen name="pick" options={{ title: '못 정하겠을 때' }} />
            <Stack.Screen name="packing" options={{ title: '여행 준비물' }} />
            {/* 크레딧 기능이 꺼져 있어 앱 안에서는 아직 아무도 링크하지 않는다.
                그래도 등록해 둬야 주소로 직접 열었을 때 제목이 「rewards」로
                나오지 않는다. */}
            <Stack.Screen name="rewards" options={{ title: '크레딧' }} />
          </Stack>
        </FxProvider>
      </SelectedCityProvider>
    </ThemeProvider>
  );
}
