import * as Location from 'expo-location';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, TextInput, View } from 'react-native';

import { AccessDetail, stationLabel } from '@/components/line-badge';
import { Badge, Button, Card, Row, RowGroup, Screen, Section, Txt } from '@/components/ui';
import { FEATURES } from '@/constants/features';
import { cityNames } from '@/data/cities';
import { MODE } from '@/data/lines';
import { findPlace } from '@/data/places';
import { findPass } from '@/data/transit';
import { LocalCaveats, RowEmoji, styles } from '@/features/place';
import { useTheme } from '@/hooks/use-theme';
import { submitContribution } from '@/lib/contributions';
import {
  ProximityResult,
  Review,
  VERIFY_RADIUS_M,
  aggregate,
  checkProximity,
  loadReviews,
  saveReview,
} from '@/lib/reviews';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = findPlace(id);
  const theme = useTheme();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [proximity, setProximity] = useState<ProximityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if (place) loadReviews(place.id).then(setReviews);
  }, [place]);

  const verify = useCallback(async () => {
    if (!place) return;
    setChecking(true);
    setLocError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('위치 권한이 필요해요. 설정에서 허용해 주세요.');
        return;
      }

      // 반경이 좁으므로 최고 정확도를 요청한다.
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      setProximity(
        checkProximity(
          place,
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy ?? null,
        ),
      );
    } catch {
      setLocError('위치를 못 가져왔어요. 밖으로 나가서 다시 시도해 주세요.');
    } finally {
      setChecking(false);
    }
  }, [place]);

  const submit = useCallback(async () => {
    if (!place || !proximity?.ok) return;

    await saveReview({
      placeId: place.id,
      rating,
      text: text.trim(),
      verified: true,
      distanceM: proximity.distanceM,
    });

    // 크레딧 기능이 꺼져 있어도 기여 기록은 남긴다. 나중에 켤 때 이어진다.
    if (FEATURES.credits) {
      await submitContribution({
        type: 'verified_review',
        placeId: place.id,
        cityId: place.cityId,
        note: text.trim(),
      });
    }

    setText('');
    setReviews(await loadReviews(place.id));
  }, [place, proximity, rating, text]);

  if (!place) {
    return (
      <Screen back backFallback="/places" title="장소를 찾을 수 없어요">
        <Txt variant="body" color="textTertiary">
          잘못된 주소예요.
        </Txt>
      </Screen>
    );
  }

  const agg = aggregate(reviews);
  const radius = place.radiusM ?? VERIFY_RADIUS_M;

  return (
    <>
      {/* 헤더는 숨겨져 있고, 이 title 은 웹 브라우저 탭 제목으로만 쓰인다.
          장소 이름을 넣어 여러 탭을 열어 두고 비교할 때 구분되게 한다. */}
      <Stack.Screen options={{ title: `${place.name} · ${place.city}` }} />
      <Screen back backFallback="/places" title={place.name} subtitle={place.nameJa}>
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

        {/* 모르면 문 앞에서 돌아서는 정보다. 산문에 묻어두면 훑을 때 안 보인다 —
            「오후 5시면 닫아요」가 세 문장 가운데 있으면 4시 반에 나서는 사람은
            그 문장을 못 읽는다. */}
        {place.local ? <LocalCaveats local={place.local} /> : null}

        {/* 아이콘은 전부 넣거나 전부 빼야 한다. 한 줄에만 있으면 그 줄이 특별해
            보이고, 나머지 줄은 왼쪽이 비어서 제목이 들쭉날쭉하게 읽힌다. */}
        <Section title="가는 방법 · 관람 정보">
          <RowGroup>
            {/* 근교는 이동 시간이 사실상 첫 번째 판단 기준이라 역보다 위에 둔다.
                출발 거점이 여러 곳인 곳(나라·우지)은 그 사실도 같이 알려준다. */}
            {place.dayTrip ? (
              <Row
                leading={<RowEmoji emoji="🗺️" />}
                title="근교 당일치기"
                subtitle={`${cityNames(place.dayTrip.from)}에서 갈 수 있어요`}
                trailing={place.dayTrip.travel}
                trailingSub="편도"
              />
            ) : null}
            {/* 역 이름을 오른쪽으로 보내고, 노선은 색 점 + 색 이름으로 아래에
                붙인다. 왼쪽에 「난바역 (미도스지선) 도보 5분」을 한 줄로 깔면
                제목과 값이 뒤섞여서 어느 쪽이 답인지 안 보인다.

                역 이름 뒤에 일본어 원문을 괄호로 붙인다. 실제로 지하철에서
                내릴 때 승강장·전광판에 보이는 건 한글이 아니라 이 표기라서,
                한글만 있으면 안내판과 대조할 방법이 없다. */}
            {place.access ? (
              <Row
                leading={<RowEmoji emoji={MODE[place.access.mode].emoji} />}
                title={MODE[place.access.mode].rowTitle}
                trailing={stationLabel(place.access)}
                trailingSub={<AccessDetail route={place.access} />}
              />
            ) : null}
            {/* 대안 경로도 주 경로와 똑같이 그린다 — 노선 색 점과 일본어 원문이
                한쪽에만 붙어 있으면 같은 정보인데 아래 줄이 반쪽처럼 보인다. */}
            {place.access?.alt ? (
              <Row
                leading={<RowEmoji emoji={MODE[place.access.alt.mode].emoji} />}
                title="이렇게도 가요"
                trailing={stationLabel(place.access.alt)}
                trailingSub={<AccessDetail route={place.access.alt} />}
              />
            ) : null}
            {place.access?.note ? (
              <Row
                leading={<RowEmoji emoji="🔀" />}
                title="이렇게도 가요"
                subtitle={place.access.note}
                subtitleProminent
              />
            ) : null}
            {/* 「권장 소요시간」은 확정된 수치처럼 읽히지만 실제로는 눈금이다.
                방문자 통계가 아니라 "이 정도면 한 바퀴 돈다"는 추정이라,
                입장료·역 이름과 같은 무게로 두면 일정을 이 숫자에 맞춰 짜게
                된다. 제목과 보조 문구로 추정임을 드러낸다. */}
            {place.duration ? (
              <Row
                leading={<RowEmoji emoji="⏱️" />}
                title="둘러보는 시간"
                trailing={place.duration}
                trailingSub="사람마다 달라요"
                last={!place.admission}
              />
            ) : null}
            {place.admission ? (
              <Row
                leading={<RowEmoji emoji="🎟️" />}
                title="입장료"
                trailing={place.admission}
                last
              />
            ) : null}
          </RowGroup>
        </Section>

        {/* 팁은 행 안의 작은 캡션으로 두기엔 너무 길다. 읽어야 하는 문장이라
            본문 크기로 올리고, 요금·시간처럼 훑는 값들과 자리를 분리한다. */}
        {place.tip ? (
          <Section title="알아둘 점">
            <Card>
              <View style={styles.tipRow}>
                <Txt style={styles.tipEmoji}>💡</Txt>
                <Txt variant="body" color="textSecondary" style={styles.flex}>
                  {place.tip}
                </Txt>
              </View>
            </Card>
          </Section>
        ) : null}

        {place.passes?.length ? (
          <Section title="교통패스로 되나요" caption="조건이 붙는 경우가 많으니 미리 보고 가세요">
            {place.passes.map((cov) => {
              const pass = findPass(cov.passId);
              if (!pass) return null;

              return (
                <Card
                  key={cov.passId}
                  accent={cov.condition ? theme.warning : theme.success}
                  style={styles.passCard}>
                  <View style={styles.passHead}>
                    <Txt variant="subtitle">{pass.name}</Txt>
                    <Badge
                      label={cov.condition ? '조건부' : '그냥 돼요'}
                      tone={cov.condition ? 'warning' : 'success'}
                    />
                  </View>
                  <Txt variant="body" color="textSecondary" style={styles.passBody}>
                    {cov.condition ?? '패스만 보여주면 무료로 들어갈 수 있어요.'}
                  </Txt>
                </Card>
              );
            })}
          </Section>
        ) : null}

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

        {FEATURES.verifiedReviews ? (
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
                  onPress={verify}
                />
              </View>

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
                      <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
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
                    onChangeText={setText}
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

                  <Button label="리뷰 등록" onPress={submit} />
                </View>
              ) : null}
            </Card>
          </Section>
        ) : null}

        {reviews.length > 0 ? (
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
        ) : null}
      </Screen>
    </>
  );
}
