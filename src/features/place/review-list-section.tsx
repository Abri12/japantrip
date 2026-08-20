import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Card, Section, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { REPORT_REASONS, Review } from '@/lib/reviews';

import { styles } from './styles';

export interface ReviewListSectionProps {
  reviews: Review[];
  /** 내 리뷰 지우기. 서버가 없으면 넘기지 않는다 */
  onRemove?: (id: string) => void;
  /** 남의 리뷰 신고하기. 접수 여부를 돌려준다. 서버가 없으면 넘기지 않는다 */
  onReport?: (id: string, reason: string) => Promise<boolean>;
  /** 이 작성자 차단 */
  onBlock?: (authorTag: string) => void;
  /** 차단으로 가려진 리뷰 수 */
  hiddenByBlock?: number;
  /** 차단을 전부 푼다 */
  onUnblockAll?: () => void;
}

export function ReviewListSection({
  reviews,
  onRemove,
  onReport,
  onBlock,
  hiddenByBlock = 0,
  onUnblockAll,
}: ReviewListSectionProps) {
  const theme = useTheme();

  /*
   * 지금 사유를 고르는 중인 리뷰.
   *
   * 「신고」를 누르자마자 신고되면 잘못 눌렀을 때 되돌릴 수 없다. 사유를
   * 고르는 한 단계가 확인 절차를 겸한다 — 확인 창을 따로 띄우는 것보다
   * 단계가 적으면서 실수도 막는다.
   */
  const [reporting, setReporting] = useState<string | null>(null);
  /** 이미 신고한 것. 서버가 한 번으로 세지만, 화면이 반응을 안 하면 또 누른다 */
  const [reported, setReported] = useState<Set<string>>(new Set());
  /** 접수에 실패한 것 */
  const [failed, setFailed] = useState<Set<string>>(new Set());

  /* 전부 차단해 하나도 안 남았을 때도 구역은 그려야 한다 — 안 그리면
     「해제」할 방법이 사라진다. */
  if (reviews.length === 0 && hiddenByBlock === 0) return null;

  const send = async (id: string, reason: string) => {
    setReporting(null);
    /*
     * 접수됐는지 확인하고 나서 말한다.
     *
     * 예전에는 누르자마자 「신고했어요」를 띄웠다. 서버가 죽었거나 그 사이
     * 리뷰가 지워졌으면 아무것도 접수되지 않았는데 사용자는 처리된 줄 안다 —
     * 그러면 같은 글을 계속 보면서 「신고해도 그대로네」라고 여기게 된다.
     */
    const ok = await onReport?.(id, reason);
    if (ok) setReported((prev) => new Set(prev).add(id));
    else setFailed((prev) => new Set(prev).add(id));
  };

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

          {/*
            신고로 가려진 내 리뷰.

            남에게는 아예 안 보이지만 쓴 사람에게는 보인다. 조용히 사라지면
            앱이 먹은 줄 알고 같은 글을 다시 쓰게 되고, 그러면 신고도 다시
            쌓이는데 아무도 이유를 모른 채 반복된다.
          */}
          {r.hidden ? (
            <Txt variant="caption" tint={theme.warning} style={styles.reviewMeta}>
              신고가 접수돼 다른 분에게는 보이지 않아요. 검토 중이에요.
            </Txt>
          ) : null}

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

          {/*
            신고는 **남의 리뷰에만.** 자기 글은 신고가 아니라 삭제이고, 그
            버튼은 위에 이미 있다.
          */}
          {!r.mine && onReport ? (
            reported.has(r.id) ? (
              <Txt variant="caption" color="textTertiary" style={styles.reviewDelete}>
                신고했어요. 검토할게요.
              </Txt>
            ) : failed.has(r.id) ? (
              <Pressable onPress={() => setReporting(r.id)} hitSlop={8}>
                <Txt variant="caption" tint={theme.danger} style={styles.reviewDelete}>
                  접수하지 못했어요. 다시 눌러 주세요.
                </Txt>
              </Pressable>
            ) : reporting === r.id ? (
              <View style={styles.reportReasons}>
                <Txt variant="caption" color="textSecondary">
                  어떤 점이 문제인가요?
                </Txt>
                {REPORT_REASONS.map((reason) => (
                  <Pressable key={reason.id} onPress={() => send(r.id, reason.id)} hitSlop={4}>
                    <Txt variant="caption" tint={theme.primary} style={styles.reportReason}>
                      {reason.label}
                    </Txt>
                  </Pressable>
                ))}
                <Pressable onPress={() => setReporting(null)} hitSlop={4}>
                  <Txt variant="caption" color="textTertiary" style={styles.reportReason}>
                    취소
                  </Txt>
                </Pressable>
              </View>
            ) : (
              <View style={styles.reviewActions}>
                <Pressable onPress={() => setReporting(r.id)} hitSlop={8}>
                  <Txt variant="caption" color="textTertiary" style={styles.reviewDelete}>
                    신고
                  </Txt>
                </Pressable>
                {/*
                  신고와 차단은 다른 말이다. 신고는 「이 글은 문제가 있으니
                  모두에게서 치워 달라」이고, 차단은 「문제까지는 아닌데 나는
                  안 보고 싶다」이다. 차단이 없으면 취향이 안 맞는 글을 치우려고
                  신고를 쓰게 되고, 그러면 신고가 판단 근거로 못 쓰게 된다.
                */}
                {onBlock && r.authorTag ? (
                  <Pressable onPress={() => onBlock(r.authorTag!)} hitSlop={8}>
                    <Txt variant="caption" color="textTertiary" style={styles.reviewDelete}>
                      이 사용자 차단
                    </Txt>
                  </Pressable>
                ) : null}
              </View>
            )
          ) : null}
        </Card>
      ))}

      {/*
        차단으로 가린 것이 몇 건인지 밝히고 되돌릴 길을 둔다.

        말없이 빼면 「리뷰가 원래 없는 곳」과 구분이 안 되고, 실수로 차단했을 때
        되돌릴 방법도 사라진다. 태그에는 이름이 없어서 하나씩 고르게 해 봐야
        무엇인지 알 수 없으므로 전부 풀기만 둔다.
      */}
      {hiddenByBlock > 0 ? (
        <Card>
          <Txt variant="caption" color="textSecondary">
            차단한 분의 리뷰 {hiddenByBlock}건을 가렸어요.
          </Txt>
          {onUnblockAll ? (
            <Pressable onPress={onUnblockAll} hitSlop={8}>
              <Txt variant="caption" tint={theme.primary} style={styles.reviewDelete}>
                차단 모두 풀기
              </Txt>
            </Pressable>
          ) : null}
        </Card>
      ) : null}
    </Section>
  );
}
