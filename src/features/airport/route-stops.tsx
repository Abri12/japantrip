import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui';
import { RouteStop } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/**
 * 시내 정차역 — 접었다 펴는 목록.
 *
 * 접혀 있을 때도 역 이름은 한 줄로 보여준다. 「내 숙소 근처에 서나」는 노선을
 * 고르는 기준이라, 펼치기 전에 눈에 들어와야 판단이 된다. 펼치면 각 역에서
 * 무엇으로 갈아타는지가 나온다.
 */
export interface RouteStopsProps {
  stops: RouteStop[];
  /**
   * `stops` 가 그 노선의 **전체 정차역**인지.
   *
   * 개수를 단정하는 건 전체 목록일 때만 한다. 골라 담은 목록에 「서는 역
   * 7곳」이라고 적으면 딱 그만큼만 선다는 뜻이 되어 사실이 틀린다.
   */
  complete?: boolean;
}

export function RouteStops({ stops, complete }: RouteStopsProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  /*
   * 개수를 단정하는 건 전체 목록일 때만 한다.
   *
   * 공항급행은 12개역에 서는데 여행자에게 쓸모 있는 7곳만 담았다. 그런데
   * 「서는 역 7곳」이라고 적어 두면 딱 그만큼만 선다는 뜻이 되어 사실이 틀린다.
   * 라피트는 공식 FAQ 가 8개역이라고 못 박아서 전부 나열할 수 있다.
   */
  const label = complete ? `서는 역 ${stops.length}곳` : '주요 역';

  return (
    <View style={styles.stopsWrap}>
      <Pressable onPress={() => setOpen((v) => !v)}>
        <View style={[styles.stopsBar, { backgroundColor: theme.background }]}>
          <Txt variant="caption" color="textTertiary">
            {label} {open ? '⌃' : '⌄'}
          </Txt>
          {!open ? (
            <Txt variant="caption" color="textSecondary" style={styles.stopsPreview}>
              {stops.map((x) => x.name).join(' · ')}
            </Txt>
          ) : null}
        </View>
      </Pressable>

      {open ? (
        <View style={styles.stopList}>
          {stops.map((stop, i) => (
            <View key={stop.nameJa} style={styles.stopRow}>
              <View style={styles.stopRail}>
                <View style={[styles.stopDot, { backgroundColor: theme.primary }]} />
                {i < stops.length - 1 ? (
                  <View style={[styles.stopLine, { backgroundColor: theme.border }]} />
                ) : null}
              </View>
              <View style={styles.stopBody}>
                <Txt variant="bodyBold">
                  {stop.name} ({stop.nameJa})
                </Txt>
                {stop.transfer ? (
                  <Txt variant="caption" color="textSecondary" style={styles.stopMeta}>
                    {stop.transfer}
                  </Txt>
                ) : null}
              </View>
            </View>
          ))}

          {/* 골라 담은 목록이면 그 사실을 끝에 적는다. 안 적으면 펼쳐 본 사람은
              이게 전부라고 믿고, 목록에 없는 역에서 내릴 생각을 못 한다. */}
          {complete ? null : (
            <Txt variant="caption" color="textTertiary" style={styles.stopNote}>
              이 밖에도 몇 개 역에 더 서요. 갈아타거나 걸어갈 만한 곳만 골랐어요.
            </Txt>
          )}
        </View>
      ) : null}
    </View>
  );
}
