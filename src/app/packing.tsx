import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Badge, Card, Screen, Section, Txt } from '@/components/ui';
import {
  PACKING_CATEGORY_CAPTION,
  PACKING_CATEGORY_LABEL,
  PACKING_ITEMS,
  PackingCategory,
} from '@/data/packing';
import { CATEGORIES, styles } from '@/features/packing';
import { useTheme } from '@/hooks/use-theme';
import { loadChecked, saveChecked } from '@/lib/packing-state';

export default function PackingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadChecked().then((c) => {
      setChecked(c);
      setLoaded(true);
    });
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveChecked(next);
      return next;
    });
  };

  const done = checked.size;
  const total = PACKING_ITEMS.length;

  return (
    <Screen
      back
      title="여행 준비물"
      subtitle="일본이라서 특히 챙겨야 하는 것들만 모았어요">
      {loaded ? (
        <Section>
          <Card>
            {/* 남은 개수를 말로 알려준다. 「3 / 12」만 있으면 몇 개가 남았는지
                머리로 빼야 한다. 다 끝냈을 때는 축하 문구로 바뀐다. */}
            <View style={styles.progressRow}>
              <Txt variant="subtitle">
                {done === total ? '🎉 다 챙겼어요!' : `🧳 ${total - done}개 남았어요`}
              </Txt>
              <Txt variant="bodyBold" tint={done === total ? theme.success : theme.primary}>
                {done} / {total}
              </Txt>
            </View>
            <View style={[styles.track, { backgroundColor: theme.surfaceStrong }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: done === total ? theme.success : theme.primary,
                    width: `${(done / total) * 100}%`,
                  },
                ]}
              />
            </View>
          </Card>
        </Section>
      ) : null}

      {CATEGORIES.map((cat) => (
        <Section
          key={cat}
          title={PACKING_CATEGORY_LABEL[cat]}
          caption={PACKING_CATEGORY_CAPTION[cat]}>
          {PACKING_ITEMS.filter((i) => i.category === cat).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggle(item.id)}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <Card
                style={styles.itemCard}
                accent={
                  checked.has(item.id)
                    ? theme.success
                    : item.warn
                      ? theme.warning
                      : undefined
                }>
                <View style={styles.itemRow}>
                  {/* 체크되면 이모지 자리를 체크 표시가 대신한다. 이모지와
                      체크박스를 나란히 두면 같은 자리에 동그라미가 두 개 생겨서,
                      12개가 이어지는 목록에서 시선이 어디에 걸릴지 흐려진다. */}
                  <View
                    style={[
                      styles.mark,
                      checked.has(item.id)
                        ? { backgroundColor: theme.success }
                        : { backgroundColor: item.warn ? theme.warningSoft : theme.primarySoft },
                    ]}>
                    {checked.has(item.id) ? (
                      <Txt variant="subtitle" tint={theme.onPrimary}>
                        ✓
                      </Txt>
                    ) : (
                      <Txt style={styles.markEmoji}>{item.emoji}</Txt>
                    )}
                  </View>

                  <View style={styles.flex}>
                    <Txt
                      variant="subtitle"
                      color={checked.has(item.id) ? 'textTertiary' : 'text'}
                      style={checked.has(item.id) ? styles.strike : undefined}>
                      {item.title}
                    </Txt>
                    {item.warn && !checked.has(item.id) ? (
                      <View style={styles.warnRow}>
                        <Badge label={item.warnLabel ?? '미리 확인하세요'} tone="warning" />
                      </View>
                    ) : null}

                    {/* 다 챙긴 항목은 설명을 접는다. 12개의 긴 본문이 항상 펼쳐져
                        있으면 훑는 화면인데 스크롤이 끝없이 길어지고, 끝낸 일의
                        설명은 더 읽을 이유가 없다. */}
                    {checked.has(item.id) ? null : (
                      <Txt variant="body" color="textSecondary" style={styles.itemBody}>
                        {item.body}
                      </Txt>
                    )}

                    {/* 카드 전체가 체크 토글이라, 링크는 눌린 이벤트가 위로
                        번지지 않게 stopPropagation 해야 한다. 안 하면 링크를
                        누를 때 항목이 같이 체크된다.

                        링크도 본문과 함께 접는다 — 이미 끝낸 준비에 「구글 지도
                        열기」 버튼이 남아 있으면 아직 할 일이 있는 것처럼 보인다. */}
                    {item.linkUrl && !checked.has(item.id) ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          Linking.openURL(item.linkUrl!);
                        }}
                        style={styles.linkWrap}>
                        <Txt variant="label" tint={theme.primary}>
                          {item.linkLabel} 열기 →
                        </Txt>
                      </Pressable>
                    ) : null}

                    {item.route && !checked.has(item.id) ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(item.route as never);
                        }}
                        style={styles.linkWrap}>
                        <View style={[styles.routeChip, { backgroundColor: theme.primarySoft }]}>
                          <Txt variant="label" tint={theme.primary}>
                            {item.routeLabel} ›
                          </Txt>
                        </View>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </Section>
      ))}
    </Screen>
  );
}
