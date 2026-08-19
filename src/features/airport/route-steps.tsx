import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Chip, ContactlessMark, Txt } from '@/components/ui';
import { RouteStep } from '@/data/airports';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/**
 * 타는 순서 — 접었다 펴는 흐름도.
 *
 * 기본으로 접어 둔다. 노선이 다섯 개인 화면에서 순서까지 전부 펼쳐져 있으면
 * 정작 **어느 노선을 탈지** 고르는 일이 어려워진다. 고르고 나서 펼치는 게
 * 실제 순서다.
 *
 * 각 단계에 일본어 표지판 문구를 같이 둔다. 공항에서 눈에 들어오는 건 한국어
 * 설명이 아니라 표지판이라, 그대로 대조할 수 있어야 길을 찾는다.
 */
/**
 * 타는 순서.
 *
 * ── 왜 간략·자세히로 나눴나 ──────────────────────────
 *
 * 단계마다 위치·표지판·요금·주의·복구 방법이 다 붙어 있어서, 10단계짜리 노선은
 * 펼치는 순간 화면이 글로 가득 찼다. 「번잡해서 못 보겠다」는 말이 그 얘기였다.
 *
 * 그렇다고 설명을 줄일 수는 없다. 이 화면은 **처음 가는 사람이 인터넷 없이**
 * 보는 것이라, 현장에서 필요한 건 오히려 그 세부다. 줄이면 정작 필요할 때
 * 찾을 곳이 없어진다.
 *
 * 그래서 지우는 대신 **두 가지 읽는 방식**을 뒀다.
 *
 * - **간략히** — **갈림길만.** 「1층엔 역이 없으니 2층으로」, 「JR 말고 난카이
 *   개찰구로」처럼 모르면 틀리는 지점만 남긴다(`step.key`). 사이의 걷는 구간은
 *   눈앞에 길이 하나뿐이라 안 적어도 알아서 간다.
 * - **자세히** — 위치·표지판·요금·복구 방법까지. 「지금 이 자리에서 무엇을
 *   봐야 하는지」를 묻는 순간에 켠다.
 *
 * 둘 다 이미 받아 둔 것이라 **전환에 인터넷이 필요 없다.** 자세히가 서버에서
 * 더 받아오는 방식이었다면 정작 필요한 현장에서 못 열렸을 것이다.
 *
 * ── 다만 경고는 접지 않는다 ─────────────────────────
 *
 * `caution` 은 간략히에서도 그대로 보인다. 나머지는 몰라도 헤매기만 하지만
 * 경고는 모르면 **틀린 열차를 탄다.** 화면을 줄이자고 위험을 숨기는 건
 * 다른 종류의 결정이다.
 */
export function RouteSteps({
  steps,
  alwaysOpen,
}: {
  steps: RouteStep[];
  /** 이미 펼쳐진 카드 안에서 쓸 때 — 접기 버튼 없이 순서만 그린다 */
  alwaysOpen?: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const shown = alwaysOpen || open;
  // 컨택리스 사용법처럼 이미 펼쳐 둔 짧은 순서는 나눌 것이 없다.
  const detail = alwaysOpen || detailed;

  /*
   * 간략히에서 무엇을 그릴지.
   *
   * 갈림길을 아직 고르지 않은 노선은 전부 그린다. 표시가 없다고 화면이 텅 비면
   * 그 노선만 순서가 없는 것처럼 보인다.
   *
   * 번호는 보이는 것만 1부터 다시 센다.
   *
   * 처음에는 원래 번호를 그대로 써서 2 · 4 · 7 · 9 로 나갔다. 「빈 번호가
   * 곧 걷기만 하는 구간」이라는 뜻이라고 봤는데, 실제로는 **번호가 깨진
   * 것처럼** 읽혔다. 화면에 1부터 세지 않는 목록이 있으면 사람은 먼저
   * 고장을 의심하지, 숨은 뜻을 찾지 않는다.
   *
   * 몇 개 중 몇 개인지는 바로 아래 안내 줄이 말해 주므로, 번호까지 그 일을
   * 맡을 필요가 없다.
   */
  const keyOnly = steps.filter((step) => step.key);
  const visible = detail || keyOnly.length === 0 ? steps : keyOnly;

  return (
    <View style={styles.stepsWrap}>
      {alwaysOpen ? null : (
        <Pressable onPress={() => setOpen((v) => !v)}>
          <View style={[styles.stepsToggle, { backgroundColor: theme.primarySoft }]}>
            <Txt variant="label" tint={theme.primary}>
              {open ? '순서 접기' : `타는 순서 ${steps.length}단계 보기`} {open ? '⌃' : '⌄'}
            </Txt>
          </View>
        </Pressable>
      )}

      {shown && !alwaysOpen ? (
        <View style={styles.stepsModes}>
          <Chip label="간략히" active={!detailed} onPress={() => setDetailed(false)} />
          <Chip label="자세히" active={detailed} onPress={() => setDetailed(true)} />
        </View>
      ) : null}

      {/* 몇 개 중 몇 개를 보고 있는지는 여기서만 말한다. 번호가 대신
          말하게 했더니 번호가 깨진 것처럼 읽혔다. */}
      {/* 안내는 **줄어든 게 있을 때만** 낸다. 모든 단계가 갈림길이면 간략히와
          자세히가 같은 목록인데, 그때도 이 줄을 내면 「3단계만 보여드려요 ·
          전체 3단계는 자세히에서」가 되어 말이 안 된다. */}
      {shown && !alwaysOpen && !detailed && keyOnly.length > 0 && keyOnly.length < steps.length ? (
        <Txt variant="caption" color="textTertiary" style={styles.stepsHint}>
          헷갈리기 쉬운 {keyOnly.length}단계만 보여드려요. 사이는 걷기만 하면 돼요 · 전체{' '}
          {steps.length}단계는 「자세히」에서
        </Txt>
      ) : null}

      {shown ? (
        <View style={styles.steps}>
          {visible.map((step, i) => (
            <View key={i} style={styles.step}>
              {/* 번호와 세로선으로 흐름을 만든다. 마지막 단계는 선을 그리지
                  않아야 다음에 뭔가 더 있는 것처럼 보이지 않는다. */}
              <View style={styles.stepRail}>
                <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                  <Txt variant="label" tint={theme.onPrimary}>
                    {i + 1}
                  </Txt>
                </View>
                {i < visible.length - 1 ? (
                  <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
                ) : null}
              </View>

              <View style={styles.stepBody}>
                <Txt variant="bodyBold">{step.action}</Txt>
                {/* 「지금 몇 층에서 어느 쪽으로」가 실제로 발을 움직이게 한다.
                    할 일만 적혀 있으면 초행자는 그 자리에서 두리번거린다. */}
                {detail && step.where ? (
                  <Txt variant="body" color="textSecondary" style={styles.stepMeta}>
                    📍 {step.where}
                  </Txt>
                ) : null}
                {/* 「이 표시」라고만 적으면 카드에서 뭘 찾아야 하는지 모른다.
                    실제 모양을 바로 아래 그려 둬야 대조가 된다. */}
                {detail && step.icon === 'contactless' ? (
                  <View style={styles.stepIcon}>
                    <ContactlessMark size={44} />
                  </View>
                ) : null}
                {detail && step.signJa ? (
                  <View style={[styles.signBox, { backgroundColor: theme.surfaceStrong }]}>
                    <Txt variant="caption" color="textSecondary">
                      표지판 · {step.signJa}
                    </Txt>
                  </View>
                ) : null}
                {detail && step.minutes ? (
                  <Txt variant="caption" color="textTertiary" style={styles.stepMeta}>
                    약 {step.minutes}분
                  </Txt>
                ) : null}
                {detail && step.cost ? (
                  <View style={[styles.costBox, { backgroundColor: theme.primarySoft }]}>
                    <Txt variant="caption" tint={theme.primary}>
                      💴 {step.cost}
                    </Txt>
                  </View>
                ) : null}
                {step.caution ? (
                  <Txt variant="caption" tint={theme.warning} style={styles.stepMeta}>
                    ⚠ {step.caution}
                  </Txt>
                ) : null}
                {/* 「틀리면 어떻게 되지」가 초행자를 가장 붙잡아 둔다. 되돌릴 수
                    있다는 걸 미리 알려주면 확신이 없어도 일단 움직이게 된다. */}
                {detail && step.recover ? (
                  <Txt variant="caption" tint={theme.success} style={styles.stepMeta}>
                    ↩ {step.recover}
                  </Txt>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
