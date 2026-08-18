import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.background}
      indicatorColor={theme.surface}
      // 웹 탭바와 같은 크기를 쓴다. 플랫폼마다 탭 글자 크기가 다르면 같은
      // 앱인데 조작부의 무게가 달라 보인다.
      labelStyle={{ fontSize: Type.tab.fontSize, selected: { color: theme.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="airports">
        <NativeTabs.Trigger.Label>공항</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="airplane.arrival" md="flight_land" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="transit">
        <NativeTabs.Trigger.Label>이동</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tram.fill" md="train" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="places">
        <NativeTabs.Trigger.Label>관광</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="safety">
        <NativeTabs.Trigger.Label>안전</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bell.fill" md="notifications" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
