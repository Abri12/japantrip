import {
  TabList,
  TabListProps,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
  Tabs,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

const TABS = [
  { name: 'home', href: '/', label: '홈' },
  { name: 'airports', href: '/airports', label: '공항' },
  { name: 'transit', href: '/transit', label: '이동' },
  { name: 'places', href: '/places', label: '관광' },
  { name: 'safety', href: '/safety', label: '안전' },
] as const;

export default function AppTabs() {

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <TabBar>
          {TABS.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
              <TabButton>{t.label}</TabButton>
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}

/**
 * TabList 가 `asChild` 로 내려주는 props(ref 포함)를 그대로 받아 넘겨야 한다.
 * 이걸 흘리면 정적 렌더링에서 탭 슬롯 내용이 통째로 비어 버린다.
 */
function TabBar(props: TabListProps) {
  const theme = useTheme();

  return (
    <View {...props} style={styles.bar}>
      <View
        style={[styles.inner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {props.children}
      </View>
    </View>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();

  return (
    // 버튼이 남는 폭을 똑같이 나눠 갖게 한다(flex: 1). 예전에는 각 버튼이
    // 글자 폭만 차지하고 바깥에서 space-between 으로 밀었는데, 글자 수가
    // 다르면(홈 1자 / 공항 2자) 버튼 폭이 달라져서 글자 간격이 들쭉날쭉했다.
    <Pressable {...props} style={({ pressed }) => [styles.tabPress, pressed && styles.pressed]}>
      <View
        style={[
          styles.tab,
          { backgroundColor: isFocused ? theme.background : 'transparent' },
        ]}>
        <Txt variant="tab" tint={isFocused ? theme.primary : theme.textSecondary}>
          {children}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.four,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  tabPress: {
    // 다섯 칸을 정확히 똑같이 나눈다 — 글자 수가 달라도 중심이 어긋나지 않는다.
    flex: 1,
  },
  tab: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
