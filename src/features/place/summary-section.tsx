import { Linking, Pressable, View } from 'react-native';

import { Card, Section, Txt } from '@/components/ui';
import { Place } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

export interface SummarySectionProps {
  place: Place;
}

export function SummarySection({ place }: SummarySectionProps) {
  const theme = useTheme();

  return (
    <Section>
      <Card>
        <Txt variant="body">{place.summary}</Txt>

        {/* 좌표는 이미 갖고 있는데 지도로 갈 방법이 없었다. 장소를 읽고 나면
            다음 행동은 「거기로 간다」인데, 그 자리에서 앱을 나가 다시
            검색하게 만들고 있었다. 일본어 이름으로 열어야 현지 지도에서
            정확히 잡힌다. */}
        <Pressable
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}` +
                `&query_place_id=&z=17`,
            )
          }>
          <View style={[styles.mapBtn, { backgroundColor: theme.primarySoft }]}>
            <Txt variant="bodyBold" tint={theme.primary}>
              🗺 지도에서 열기 →
            </Txt>
            <Txt variant="caption" color="textSecondary" style={styles.mapSub}>
              {place.nameJa}
            </Txt>
          </View>
        </Pressable>
      </Card>
    </Section>
  );
}
