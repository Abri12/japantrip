import { Linking, Pressable, View } from 'react-native';

import { Card, Section, Txt } from '@/components/ui';
import { Place } from '@/data/places';
import { mapsUrl } from '@/lib/maps';
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
        {/*
          주석은 「일본어 이름으로 열어야 정확히 잡힌다」고 적혀 있는데 정작
          좌표를 넘기고 있었다. 좌표로 열면 지도의 그 지점에 **핀만** 꽂혀서,
          정작 보내고 싶은 가게 정보 화면(오늘 영업시간·최근 사진)이 안 나온다.
          빈 `query_place_id=` 도 붙어 있었다 — 값 없는 파라미터라 아무 일도
          안 하고, 언젠가 구글이 형식을 조일 때 걸릴 여지만 남긴다.

          주소 만드는 일을 lib/maps.ts 한 곳으로 모았다. 같은 링크를 화면 두
          곳에서 쓰는데 규칙이 갈라지면 한쪽만 고치게 된다.
        */}
        <Pressable onPress={() => Linking.openURL(mapsUrl(place))}>
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
