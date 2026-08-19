import { Pressable, TextInput, View } from 'react-native';

import { Badge, Button, Card, Section, Txt } from '@/components/ui';
import { FEATURES } from '@/constants/features';
import { useTheme } from '@/hooks/use-theme';
import { ProximityResult } from '@/lib/reviews';

import { styles } from './styles';

export interface ReviewFormSectionProps {
  /** 위치 확인 결과. 아직 안 눌렀으면 null */
  proximity: ProximityResult | null;
  /** 위치를 확인하는 중 — 버튼을 잠근다 */
  checking: boolean;
  /** 권한 거부·측위 실패처럼 사용자가 손쓸 수 있는 오류 */
  locError: string | null;
  /** 서버가 다시 판정해 거부한 이유 */
  submitError: string | null;
  rating: number;
  onRating: (n: number) => void;
  text: string;
  onText: (t: string) => void;
  onVerify: () => void;
  onSubmit: () => void;
}

/**
 * 현장 인증 리뷰 작성.
 *
 * 기능 플래그가 꺼져 있으면 구역째 그리지 않는다. 판단을 컴포넌트가 삼켜야
 * 라우트에 조립 순서만 남는다.
 */
export function ReviewFormSection({
  proximity,
  checking,
  locError,
  submitError,
  rating,
  onRating,
  text,
  onText,
  onVerify,
  onSubmit,
}: ReviewFormSectionProps) {
  const theme = useTheme();

  if (!FEATURES.verifiedReviews) return null;

  return (
    <Section title="리뷰 남기기" caption="현장에 있을 때만 남길 수 있어요">
      <Card>
        <Txt variant="caption" color="textTertiary">
          가보지 않은 사람이 별점을 매기는 걸 막기 위해서예요. 실내에서 위치가 잘 안 잡히면
          조금 넉넉하게 봐드려요.
        </Txt>

        <View style={styles.buttonGap}>
          <Button
            label={checking ? '위치 확인하고 있어요' : '지금 여기 있어요'}
            tone="secondary"
            disabled={checking}
            onPress={onVerify}
          />
        </View>

        {/* 서버 거부는 위치 오류와 다른 종류다 — 위치는 못 가져온 것이고
            이건 가져왔는데 조건에 안 맞은 것이다. 둘을 한 자리에 뭉뚱그리면
            무엇을 고쳐야 하는지 흐려진다. */}
        {submitError ? (
          <Txt variant="body" tint={theme.danger} style={styles.formError}>
            {submitError}
          </Txt>
        ) : null}
        {locError ? (
          <Txt variant="caption" tint={theme.danger} style={styles.msg}>
            {locError}
          </Txt>
        ) : null}

        {proximity ? (
          <View style={styles.msg}>
            <Badge
              label={proximity.ok ? '인증됐어요' : '인증 안 됐어요'}
              tone={proximity.ok ? 'success' : 'warning'}
            />
            <Txt variant="caption" color="textSecondary" style={styles.msgText}>
              {proximity.message}
            </Txt>
          </View>
        ) : null}

        {proximity?.ok ? (
          <View style={styles.form}>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => onRating(n)} hitSlop={8}>
                  <Txt
                    variant="display"
                    tint={n <= rating ? theme.warning : theme.border}>
                    ★
                  </Txt>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={text}
              onChangeText={onText}
              placeholder="어떤 점이 좋았나요? (안 쓰셔도 돼요)"
              placeholderTextColor={theme.textTertiary}
              multiline
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            />

            <Button label="리뷰 등록" onPress={onSubmit} />
          </View>
        ) : null}
      </Card>
    </Section>
  );
}
