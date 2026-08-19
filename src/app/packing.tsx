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
 * ── 무엇을 누르면 무엇이 되나 ──────────────────────────
 *
 * **왼쪽 네모 = 체크, 나머지 줄 = 설명 펼치기.**
 *
 * 한동안은 줄 전체가 체크였고 오른쪽에 「자세히」 단추를 따로 뒀다. 체크가
 * 가장 잦은 동작이니 가장 큰 표적을 준다는 계산이었는데, 두 동작이 같은 줄에
 * 붙어 있어서 **오조작이 양방향으로** 났다 — 설명을 펴려다 체크되고, 체크하려다
 * 펴졌다. 표적을 키우면 한쪽이 다른 쪽을 더 많이 뺏을 뿐 문제가 그대로였다.
 *
 * 그래서 크기가 아니라 **경계**를 바꿨다. 두 표적을 줄의 양 끝으로 갈라 놓고,
 * 각각 줄 높이를 통째로 쓰게 했다. 이제 손가락이 애매한 자리에 떨어질 일이
 * 줄어든다.
 *
 * 어느 쪽에 「안전한 실수」를 몰아줄지도 정했다. 잘못 눌렀을 때 —
 *
 *   설명이 펼쳐진다   → 화면만 늘어난다. 다시 누르면 그만이고 남는 게 없다
 *   체크가 켜진다     → 「이건 챙겼다」가 기록된다. 여권을 안 넣고 넣은 줄 안다
 *
 * 뒤쪽이 훨씬 나쁘다. 그래서 넓은 쪽(줄 전체)을 안전한 동작에 주고, 체크는
 * 왼쪽 네모라는 **또렷한 자리**로 옮겼다. 체크리스트 앱들이 대체로 이렇게
 * 하는 이유이기도 하다.
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
      {/* 줄 전체 = 설명 펼치기. 잘못 눌러도 화면만 늘었다 줄 뿐이다 */}
      <Pressable
        onPress={onToggleOpen}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} 설명 ${expanded ? '접기' : '펼치기'}`}
        style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}>
        {/* 왼쪽 네모 = 체크. 줄 높이를 통째로 먹어서 조준할 필요가 없고,
            줄 전체(펼치기)와 다른 동작이라 이벤트가 위로 번지지 않게 막는다. */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={item.title}
          hitSlop={8}
          style={({ pressed }) => [styles.checkHit, pressed && styles.pressed]}>
          {/* 체크되면 이모지 자리를 체크 표시가 대신한다. 이모지와 체크박스를
              나란히 두면 같은 자리에 동그라미가 두 개 생겨서, 줄이 이어지는
              목록에서 시선이 어디에 걸릴지 흐려진다. */}
          <View
            style={[
              styles.mark,
              checked
                ? { backgroundColor: theme.success }
                : {
                    backgroundColor: item.warn ? theme.warningSoft : theme.primarySoft,
                    borderWidth: 1,
                    borderColor: theme.border,
                  },
            ]}>
            {checked ? (
              <Txt variant="bodyBold" tint={theme.onPrimary}>
                ✓
              </Txt>
            ) : (
              <Txt style={styles.markEmoji}>{item.emoji}</Txt>
            )}
          </View>
        </Pressable>

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

        {/* 펼침 표시는 **표적이 아니라 표시**다. 줄 전체가 이미 그 동작이라
            여기에 또 누를 곳을 만들면 경계가 다시 흐려진다. 체크된 항목에는
            그리지 않는다 — 펼칠 수 없는 상태다. */}
        {!checked ? (
          <Txt variant="label" tint={theme.textTertiary} style={styles.chevron}>
            {expanded ? '▴' : '▾'}
          </Txt>
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
