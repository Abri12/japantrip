import { View } from 'react-native';

import { Card, Section, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { PlaceRating } from '@/lib/reviews';

import { styles } from './styles';

export interface RatingSectionProps {
  /** 인증 리뷰만 반영한 평점 요약 */
  agg: PlaceRating;
}

export function RatingSection({ agg }: RatingSectionProps) {
  const theme = useTheme();

  return (
    <Section
      title="현장 인증 평점"
      caption={agg.verifiedCount > 0 ? `인증 리뷰 ${agg.verifiedCount}건` : undefined}>
      <Card>
        {agg.average !== null ? (
          <View style={styles.ratingRow}>
            <Txt variant="display">{agg.average.toFixed(1)}</Txt>
            <View style={styles.flex}>
              <Txt variant="body" tint={theme.warning}>
                {'★'.repeat(Math.round(agg.average))}
                <Txt variant="body" color="textTertiary">
                  {'★'.repeat(5 - Math.round(agg.average))}
                </Txt>
              </Txt>
              <Txt variant="caption" color="textTertiary">
                현장에서 확인된 리뷰만 반영해요
              </Txt>
            </View>
          </View>
        ) : (
          <Txt variant="body" color="textTertiary">
            아직 인증된 리뷰가 없어요. 현장에서 첫 리뷰를 남겨보시겠어요?
          </Txt>
        )}
      </Card>
    </Section>
  );
}
