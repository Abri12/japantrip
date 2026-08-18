import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Card, Screen, Section, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { ETIQUETTE, EtiquettePoint } from '@/data/etiquette';
import { useTheme } from '@/hooks/use-theme';

/**
 * 현지 예절 · 생존 회화.
 *
 * 원래는 가로 캐러셀이었는데 세로 목록으로 바꿨다. 가로 넘김은 "몇 장이
 * 남았는지"가 안 보여서 사용자가 끝까지 볼지 판단을 못 하고, 앱의 다른
 * 화면(공항·패스·관광지)이 전부 세로 스크롤이라 여기만 조작 방식이 달랐다.
 * 급하게 확인하는 화면이라 스크롤로 훑는 편이 낫다.
 */
export default function EtiquetteScreen() {
  return (
    <Screen back title="현지 예절 · 생존 회화" subtitle="이 넷만 알면 대부분 해결돼요">
      {/* 다른 화면은 모두 섹션에 제목이 있다. 여기만 없으면 큰 제목 바로 아래
          카드가 붙어서 화면 구조가 한 단 얕아 보인다. */}
      <Section title="이건 알고 가세요" caption="식당·가게에서 바로 쓰는 순서로 뒀어요">
        {ETIQUETTE.map((point, i) => (
          <EtiquetteCard
            key={point.id}
            point={point}
            index={i + 1}
            total={ETIQUETTE.length}
            last={i === ETIQUETTE.length - 1}
          />
        ))}
      </Section>
    </Screen>
  );
}

function EtiquetteCard({
  point,
  index,
  total,
  last,
}: {
  point: EtiquettePoint;
  index: number;
  total: number;
  last: boolean;
}) {
  const theme = useTheme();
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (!point.phraseJa) return;
    setSpeaking(true);
    Speech.speak(point.phraseJa, {
      language: 'ja-JP',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <Card style={last ? undefined : styles.card}>
      <View style={styles.head}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
          <Txt style={styles.emoji}>{point.emoji}</Txt>
        </View>
        <Txt variant="label" color="textTertiary">
          {index} / {total}
        </Txt>
      </View>

      <Txt variant="title" style={styles.title}>
        {point.title}
      </Txt>
      <Txt variant="body" color="textSecondary" style={styles.body}>
        {point.body}
      </Txt>

      {point.phraseJa ? (
        <View style={[styles.phraseBox, { backgroundColor: theme.primarySoft }]}>
          <Txt variant="title" tint={theme.primary}>
            {point.phraseJa}
          </Txt>
          <Txt variant="bodyBold" style={styles.romaji}>
            {point.phraseRomaji}
          </Txt>
          <Txt variant="caption" color="textSecondary">
            {point.phraseKo}
          </Txt>

          <Pressable onPress={speak} style={({ pressed }) => [pressed && styles.pressed]}>
            <View style={[styles.audioButton, { backgroundColor: theme.primary }]}>
              <Txt variant="bodyBold" tint={theme.onPrimary}>
                {speaking ? '🔊 재생 중' : '🔊 발음 듣기'}
              </Txt>
            </View>
          </Pressable>

          {Platform.OS === 'web' ? (
            <Txt variant="caption" color="textTertiary">
              소리가 안 나면 기기에 일본어 음성이 없는 거예요. 발음 표기를 보고 읽어보세요.
            </Txt>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.three,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  title: {
    marginTop: Spacing.four,
  },
  body: {
    marginTop: Spacing.two,
  },
  phraseBox: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.md,
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  romaji: {
    marginTop: Spacing.two,
  },
  audioButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.pill,
    marginTop: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
