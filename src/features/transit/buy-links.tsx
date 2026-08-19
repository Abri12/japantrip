import { Linking, Pressable, View } from 'react-native';

import { Txt } from '@/components/ui';
import { BuyLink, DISCLOSURE, PARTNERS, buildBuyUrl, hasAnyReferral } from '@/constants/affiliates';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/**
 * 구매처 버튼.
 *
 * 대가성 표시는 법적 의무라 링크 바로 아래에 항상 함께 노출한다.
 * (constants/affiliates.ts 참조)
 */
export function BuyLinks({ links }: { links: BuyLink[] }) {
  const theme = useTheme();

  return (
    <View style={styles.buyBox}>
      <Txt variant="label" color="textSecondary">
        온라인으로 사기
      </Txt>

      <View style={styles.buyRow}>
        {links.map((link) => (
          <Pressable
            key={link.partner}
            onPress={() => Linking.openURL(buildBuyUrl(link))}
            style={({ pressed }) => [styles.flex, pressed && styles.pressed]}>
            <View style={[styles.buyButton, { backgroundColor: theme.primarySoft }]}>
              <Txt variant="label" tint={theme.primary}>
                {PARTNERS[link.partner].name}
              </Txt>
            </View>
          </Pressable>
        ))}
      </View>

      <Txt variant="caption" color="textTertiary">
        {hasAnyReferral()
          ? DISCLOSURE
          : '판매처 검색 결과로 연결돼요. 가격과 판매 여부는 판매처 기준이에요.'}
      </Txt>
    </View>
  );
}
