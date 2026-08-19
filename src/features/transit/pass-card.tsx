import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Card, KrwEstimate, Txt } from '@/components/ui';
import { TransitPass } from '@/data/transit';
import { useTheme } from '@/hooks/use-theme';

import { BuyLinks } from './buy-links';
import { MiniTab } from './mini-tab';
import { styles } from './styles';

export function PassCard({ pass }: { pass: TransitPass }) {
  const theme = useTheme();
  const [tab, setTab] = useState<'none' | 'covers' | 'buy' | 'use'>('none');

  const toggle = (t: 'covers' | 'buy' | 'use') => setTab((cur) => (cur === t ? 'none' : t));

  return (
    <Card style={styles.spaced}>
      <View style={styles.passHead}>
        <View style={styles.flex}>
          <Txt variant="subtitle">{pass.name}</Txt>
          <Txt variant="caption" color="textTertiary" style={styles.tiny}>
            {pass.nameJa}
          </Txt>
        </View>
        {pass.scope === 'wide' ? <Badge label="광역" tone="neutral" /> : null}
      </View>

      {/* 손익 한 줄을 가장 먼저. 이 화면에서 사용자가 하는 질문은 하나다 —
          「내가 이걸 사면 이득인가?」 예전에는 그 답이 문단 안에 묻혀 있어서
          훑을 때 읽히지 않았다. */}
      <View style={[styles.verdict, { backgroundColor: theme.primarySoft }]}>
        <Txt variant="bodyBold" tint={theme.primary}>
          {pass.breakEven}
        </Txt>
      </View>

      {/* 가격을 카드에서 가장 큰 글씨로 둔다. 판단에 실제로 쓰는 숫자가
          설명글과 같은 크기면 위계가 없는 것과 같다.

          미확인 가격은 숫자 대신 안내를 띄운다 — 틀린 숫자보다 없는 편이 낫다. */}
      {pass.verified ? (
        <View style={styles.priceRow}>
          {pass.tiers.map((t) => (
            <View key={t.label} style={styles.priceItem}>
              <Txt variant="numeric">¥{t.yen.toLocaleString()}</Txt>
              <Txt variant="caption" color="textTertiary" style={styles.priceLabel}>
                {t.label}
              </Txt>
              {t.yen > 0 ? <KrwEstimate yen={t.yen} /> : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.priceRow}>
          <Badge label="가격 변동 가능" tone="warning" />
        </View>
      )}

      {/* 설명은 색 박스를 쓰지 않는다. 예전에는 파란 박스와 주황 박스가 연달아
          쌓여서, 색이 둘이면 어느 쪽이 중요한지 사라지고 카드만 무거워졌다.
          경고는 아래 「알아둘 점」 한 곳으로 모았다. */}
      <Txt variant="body" color="textSecondary" style={styles.worth}>
        {pass.worthIt}
      </Txt>

      {/* 접기 라벨에 안에 뭐가 들었는지 숫자로 적는다. 「되는 것」만으론 열기 전에
          몇 개인지, 안 되는 게 있는지 알 수 없어 매번 눌러 봐야 했다. */}
      <View style={styles.tabRow}>
        <MiniTab
          label={`탈 수 있는 것 ${pass.covers.length}`}
          active={tab === 'covers'}
          onPress={() => toggle('covers')}
        />
        <MiniTab label="사는 곳" active={tab === 'buy'} onPress={() => toggle('buy')} />
        <MiniTab
          label={`쓰는 법 ${pass.howToUse.length}단계`}
          active={tab === 'use'}
          onPress={() => toggle('use')}
        />
      </View>

      {/* 되는 것과 안 되는 것을 기호로 가른다. 예전에는 「탈 수 있어요」라는
          색 글자 제목 아래 가운뎃점 목록이 이어져서, 스크롤하다 보면 지금 읽는
          줄이 어느 쪽 목록인지 놓쳤다. 줄마다 ✓·✕ 가 붙으면 그 자리에서 안다. */}
      {tab === 'covers' ? (
        <View style={styles.detail}>
          {pass.covers.map((c, i) => (
            <View key={`c${i}`} style={styles.markRow}>
              <Txt variant="bodyBold" tint={theme.success} style={styles.mark}>
                ✓
              </Txt>
              <Txt variant="body" color="textSecondary" style={styles.flex}>
                {c}
              </Txt>
            </View>
          ))}
          {pass.excludes.map((c, i) => (
            <View key={`e${i}`} style={styles.markRow}>
              <Txt variant="bodyBold" tint={theme.danger} style={styles.mark}>
                ✕
              </Txt>
              <Txt variant="body" color="textSecondary" style={styles.flex}>
                {c}
              </Txt>
            </View>
          ))}
        </View>
      ) : null}

      {tab === 'buy' ? (
        <View style={styles.detail}>
          {pass.whereToBuy.map((w, i) => (
            <Txt key={i} variant="body" color="textSecondary">
              · {w}
            </Txt>
          ))}
          {pass.buyLinks?.length ? <BuyLinks links={pass.buyLinks} /> : null}
        </View>
      ) : null}

      {tab === 'use' ? (
        <View style={styles.detail}>
          {pass.howToUse.map((h, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: theme.surfaceStrong }]}>
                <Txt variant="label" color="textSecondary">
                  {i + 1}
                </Txt>
              </View>
              <Txt variant="body" color="textSecondary" style={styles.flex}>
                {h}
              </Txt>
            </View>
          ))}
        </View>
      ) : null}

      {/* 함정은 카드 맨 아래 한 곳에만 둔다. 위쪽에 색 박스로 띄우면 손익 판단
          문구와 색이 경쟁해서 둘 다 눈에 안 들어온다. 여기서는 접힌 내용을
          펼치든 말든 항상 보이면서, 시선의 마지막에 걸린다. */}
      {pass.caution ? (
        <View style={[styles.caution, { borderTopColor: theme.border }]}>
          <Txt variant="caption" tint={theme.warning}>
            ⚠ {pass.caution}
          </Txt>
        </View>
      ) : null}
    </Card>
  );
}
