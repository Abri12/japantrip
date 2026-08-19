import { Pressable, View } from 'react-native';

import { Badge, Card, Section, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { Review } from '@/lib/reviews';

import { styles } from './styles';

export interface ReviewListSectionProps {
  reviews: Review[];
  /** 내 리뷰 지우기. 서버가 없으면 넘기지 않는다 */
  onRemove?: (id: string) => void;
}

export function ReviewListSection({ reviews, onRemove }: ReviewListSectionProps) {
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
          {/* 지우기는 **내 리뷰에만** 보인다. 남의 것에 버튼이 보이면 눌렀다가
              거부당하는데, 그건 기능이 아니라 혼란이다. 권한은 서버가 다시
              확인하므로 여기 표시는 편의일 뿐이다. */}
          {r.mine && onRemove ? (
            <Pressable onPress={() => onRemove(r.id)} hitSlop={8}>
              <Txt variant="caption" color="textTertiary" style={styles.reviewDelete}>
                내 리뷰 지우기
              </Txt>
            </Pressable>
          ) : null}
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
