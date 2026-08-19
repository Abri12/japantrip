import { View } from 'react-native';

import { Badge, Card, Section, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { Review } from '@/lib/reviews';

import { styles } from './styles';

export interface ReviewListSectionProps {
  reviews: Review[];
}

export function ReviewListSection({ reviews }: ReviewListSectionProps) {
  const theme = useTheme();

  if (reviews.length === 0) return null;

  return (
    <Section title={`리뷰 ${reviews.length}건`}>
      {reviews.map((r) => (
        <Card key={r.id} style={styles.reviewCard}>
          <View style={styles.reviewHead}>
            <Txt variant="bodyBold" tint={theme.warning}>
              {'★'.repeat(r.rating)}
            </Txt>
            {r.verified ? <Badge label="현장 인증" tone="success" /> : null}
          </View>
          {r.text ? (
            <Txt variant="body" style={styles.reviewText}>
              {r.text}
            </Txt>
          ) : null}
          <Txt variant="caption" color="textTertiary" style={styles.reviewMeta}>
            {new Date(r.createdAt).toLocaleDateString('ko-KR')}
            {r.distanceM !== null ? ` · ${r.distanceM}m 지점` : ''}
          </Txt>
        </Card>
      ))}
    </Section>
  );
}
