import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Card, ContactlessMark, Txt } from '@/components/ui';
import { CONTACTLESS_HOWTO, ContactlessInfo } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';

import { RouteSteps } from './route-steps';
import { styles } from './styles';

/**
 * 컨택리스 안내 — 눌러서 펼치는 카드.
 *
 * 접혀 있을 때도 **어디서 되는지**는 보여준다. 완전히 닫아 두면 이 기능이
 * 있다는 것조차 모르고 지나간다. 펼치면 쓰는 법과 안 되는 곳이 나온다.
 *
 * 「안 되는 곳」을 되는 곳만큼 크게 다룬다. 「일본은 이제 카드로 탄다」고만
 * 알고 가면 JR 개찰구 앞에서 줄을 다시 서게 된다.
 */
export function ContactlessCard({ info }: { info: ContactlessInfo }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Card accent={theme.primary}>
      <Pressable onPress={() => setOpen((v) => !v)}>
        <View style={styles.head}>
          <View style={styles.contactlessHead}>
            <ContactlessMark size={40} />
            <View style={styles.flex}>
              <Txt variant="subtitle">카드만 대면 바로 타요</Txt>
              <Txt variant="caption" color="textTertiary" style={styles.ja}>
                충전도 보증금도 필요 없어요
              </Txt>
            </View>
          </View>
          <Txt variant="body" color="textTertiary">
            {open ? '⌃' : '⌄'}
          </Txt>
        </View>
      </Pressable>

      {/* 접혀 있어도 되는 노선 이름은 보인다 */}
      <View style={styles.badgeRow}>
        {info.supported.map((s) => (
          <Badge key={s.name} label={s.name} tone="success" />
        ))}
        {info.unsupported.length > 0 && !open ? (
          <Badge label={`안 되는 곳 ${info.unsupported.length}`} tone="warning" />
        ) : null}
      </View>

      {open ? (
        <View style={styles.contactlessBody}>
          {info.supported.some((s) => s.perk) ? (
            <View style={styles.contactlessGroup}>
              {info.supported
                .filter((s) => s.perk)
                .map((s) => (
                  <View
                    key={s.name}
                    style={[styles.perkBox, { backgroundColor: theme.successSoft }]}>
                    <Txt variant="bodyBold" tint={theme.success}>
                      {s.name}
                    </Txt>
                    <Txt variant="caption" color="textSecondary" style={styles.stepMeta}>
                      {s.perk}
                    </Txt>
                  </View>
                ))}
            </View>
          ) : null}

          <Txt variant="bodyBold" style={styles.contactlessHeading}>
            쓰는 법
          </Txt>
          <RouteSteps steps={CONTACTLESS_HOWTO} alwaysOpen />

          {info.unsupported.length > 0 ? (
            <>
              <Txt variant="bodyBold" style={styles.contactlessHeading}>
                여기선 안 돼요
              </Txt>
              {info.unsupported.map((u) => (
                <View
                  key={u.name}
                  style={[styles.perkBox, { backgroundColor: theme.warningSoft }]}>
                  <Txt variant="bodyBold" tint={theme.warning}>
                    {u.name}
                  </Txt>
                  <Txt variant="caption" color="textSecondary" style={styles.stepMeta}>
                    {u.reason}
                  </Txt>
                </View>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
