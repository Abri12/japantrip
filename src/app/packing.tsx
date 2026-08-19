import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Badge, Card, Screen, Section, Txt } from '@/components/ui';
import {
  PACKING_CATEGORY_CAPTION,
  PACKING_CATEGORY_LABEL,
  PACKING_ITEMS,
  PackingItem,
} from '@/data/packing';
import { CATEGORIES, styles } from '@/features/packing';
import { useTheme } from '@/hooks/use-theme';
import { loadChecked, saveChecked } from '@/lib/packing-state';

/**
 * 여행 준비물 체크리스트.
 *
 * ── 왜 본문을 접어 두나 ────────────────────────────────
 *
 * 예전에는 항목이 각각 카드였고, 체크하지 않은 항목은 **본문이 항상 펼쳐져**
 * 있었다. 시작 상태가 곧 전부 펼쳐진 상태라, 처음 여는 사람이 가장 긴 화면을
 * 보게 됐다. 훑으면서 지워 나가는 화면인데 문단 열몇 개를 스크롤하는 화면이
 * 되어 있었다.
 *
 * 그래서 기본은 **한 줄**이다. 제목만 보고 「이건 챙겼다」가 되는 항목이
 * 대부분이고(여권·현금·동전 지갑), 설명이 필요한 건 몇 개뿐이다. 필요한
 * 사람만 오른쪽 「자세히」로 펼친다.
 *
 * 줄 전체를 누르면 체크된다. 체크가 이 화면에서 가장 잦은 동작이라 가장 큰
 * 표적을 줘야 한다 — 작은 체크박스를 조준하게 만들면 걸으면서 못 쓴다.
 */
export default function PackingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
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

  const toggleOpen = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const done = checked.size;
  const total = PACKING_ITEMS.length;

  return (
    <Screen back title="여행 준비물" subtitle="일본이라서 특히 챙겨야 하는 것들만 모았어요">
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

      {CATEGORIES.map((cat) => {
        const items = PACKING_ITEMS.filter((i) => i.category === cat);
        return (
          <Section
            key={cat}
            title={PACKING_CATEGORY_LABEL[cat]}
            caption={PACKING_CATEGORY_CAPTION[cat]}>
            {/* 카테고리마다 카드 하나. 그 안에 항목을 줄로 넣는다.
                항목마다 카드를 두면 화면이 카드 열몇 장으로 보인다. */}
            <Card>
              {items.map((item, i) => (
                <View key={item.id}>
                  <ItemRow
                    item={item}
                    checked={checked.has(item.id)}
                    open={open.has(item.id)}
                    onToggle={() => toggle(item.id)}
                    onToggleOpen={() => toggleOpen(item.id)}
                    onOpenLink={() => item.linkUrl && Linking.openURL(item.linkUrl)}
                    onOpenRoute={() => item.route && router.push(item.route as never)}
                  />
                  {i < items.length - 1 ? (
                    <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />
                  ) : null}
                </View>
              ))}
            </Card>
          </Section>
        );
      })}
    </Screen>
  );
}

interface ItemRowProps {
  item: PackingItem;
  checked: boolean;
  open: boolean;
  onToggle: () => void;
  onToggleOpen: () => void;
  onOpenLink: () => void;
  onOpenRoute: () => void;
}

function ItemRow({
  item,
  checked,
  open,
  onToggle,
  onToggleOpen,
  onOpenLink,
  onOpenRoute,
}: ItemRowProps) {
  const theme = useTheme();

  /* 체크한 항목은 펼치지 않는다. 끝낸 일의 설명은 더 읽을 이유가 없고,
     펼쳐진 채로 체크하면 화면이 줄지 않아 진행한 느낌이 안 난다. */
  const expanded = open && !checked;

  return (
    <>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}>
        {/* 체크되면 이모지 자리를 체크 표시가 대신한다. 이모지와 체크박스를
            나란히 두면 같은 자리에 동그라미가 두 개 생겨서, 줄이 이어지는
            목록에서 시선이 어디에 걸릴지 흐려진다. */}
        <View
          style={[
            styles.mark,
            checked
              ? { backgroundColor: theme.success }
              : { backgroundColor: item.warn ? theme.warningSoft : theme.primarySoft },
          ]}>
          {checked ? (
            <Txt variant="bodyBold" tint={theme.onPrimary}>
              ✓
            </Txt>
          ) : (
            <Txt style={styles.markEmoji}>{item.emoji}</Txt>
          )}
        </View>

        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <Txt
              variant="subtitle"
              color={checked ? 'textTertiary' : 'text'}
              style={checked ? styles.strike : undefined}>
              {item.title}
            </Txt>
            {/* 경고 뱃지를 제목 옆에 둔다. 아래 줄로 내리면 줄 하나가 통째로
                늘어나는데, 뱃지는 짧아서 대개 제목 옆에 그대로 들어간다. */}
            {item.warn && !checked ? (
              <Badge label={item.warnLabel ?? '미리 확인하세요'} tone="warning" />
            ) : null}
          </View>
        </View>

        {/* 「자세히」는 줄 전체(체크)와 다른 동작이라 눌린 이벤트가 위로
            번지지 않게 막는다. 안 하면 설명을 펴려다 항목이 체크된다.
            체크된 항목에는 아예 안 그린다 — 끝난 일이다. */}
        {!checked ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onToggleOpen();
            }}
            hitSlop={8}
            style={styles.moreBtn}>
            <Txt variant="label" tint={theme.textTertiary}>
              {expanded ? '접기 ▴' : '자세히 ▾'}
            </Txt>
          </Pressable>
        ) : null}
      </Pressable>

      {expanded ? (
        <View style={styles.detail}>
          <Txt variant="body" color="textSecondary">
            {item.body}
          </Txt>

          {item.linkUrl ? (
            <Pressable onPress={onOpenLink}>
              <Txt variant="label" tint={theme.primary}>
                {item.linkLabel} 열기 →
              </Txt>
            </Pressable>
          ) : null}

          {item.route ? (
            <Pressable onPress={onOpenRoute}>
              <View style={[styles.routeChip, { backgroundColor: theme.primarySoft }]}>
                <Txt variant="label" tint={theme.primary}>
                  {item.routeLabel} ›
                </Txt>
              </View>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
