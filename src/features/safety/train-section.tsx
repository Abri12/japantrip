import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Badge, Card, Row, RowGroup, Section, Txt } from '@/components/ui';
import { City } from '@/data/cities';
import { autoCheckableArea, trainStatusFor } from '@/data/train-status';
import { useTheme } from '@/hooks/use-theme';
import { fromServer } from '@/lib/api';

import { styles } from './styles';

interface TrainStatusResponse {
  abnormal: number;
  lines: { id: string; [k: string]: unknown }[];
  express: { id: string; [k: string]: unknown }[];
}

/**
 * 교통 운행정보.
 *
 * ## 왜 안전 탭인가
 *
 * 이 앱은 지진·기상특보를 다루면서 정작 **교통 마비**는 안 다루고 있었다.
 * 태풍이나 폭설 때 여행자가 가장 급하게 찾는 것이 「지금 전철이 다니나」인데,
 * 그때 일본어로 회사 이름부터 찾아 헤맨다. 재난과 같은 자리에 있어야 한다.
 *
 * ## 확인되는 것만 확인한다
 *
 * 철도는 회사마다 공개 정도가 다르다. JR서일본만 키 없이 JSON 을 주고
 * JR동일본은 막혀 있다. 그래서 전 도시에 같은 수준을 약속하지 않는다 —
 * 자동으로 볼 수 있으면 보고, 아니면 공식 페이지로 보낸다. 없는 것을 있는
 * 척하느니 어디를 봐야 하는지라도 정확히 아는 편이 낫다.
 *
 * ## 이상이 없을 때는 조용하다
 *
 * 「이상 없음」이 화면의 주인공이 되지 않게 한다는 이 앱의 원칙 그대로,
 * 평상시에는 한 줄로 접힌다. 진짜 멈췄을 때만 위로 올라온다.
 */
export function TrainSection({ city }: { city: City | null }) {
  const theme = useTheme();
  /*
   * 결과를 **한 덩어리**로 들고 있는다.
   *
   * 예전에는 `status` 와 `checked` 를 따로 뒀는데, 도시를 바꿀 때 옛 결과를
   * 지우려면 효과 안에서 곧바로 setState 해야 했다. 그건 렌더 직후 한 번 더
   * 그리게 만들고(린트가 잡은 그 문제다), 무엇보다 두 값이 잠깐 어긋난다 —
   * 「확인 끝났는데 옛 도시 결과」가 보이는 순간이 생긴다.
   *
   * 어느 지역의 결과인지를 값 안에 넣으면 그 어긋남이 사라진다. 지금 보는
   * 지역과 다르면 아직 안 온 것으로 치면 되고, 지우는 일 자체가 없어진다.
   */
  const [result, setResult] = useState<{ area: string; data: TrainStatusResponse | null } | null>(
    null,
  );

  const sources = city ? trainStatusFor(city.id) : [];
  const area = city ? autoCheckableArea(city.id) : undefined;

  useEffect(() => {
    if (!area) return;

    let alive = true;
    fromServer<TrainStatusResponse>('/api/train-status', { area }).then((data) => {
      if (alive) setResult({ area, data });
    });
    return () => {
      alive = false;
    };
  }, [area]);

  /* 지금 보는 지역의 결과일 때만 쓴다. 도시를 막 바꿨으면 아직 안 온 것이다. */
  const fresh = result && result.area === area ? result : null;
  const status = fresh?.data ?? null;

  if (sources.length === 0) return null;

  const abnormal = status ? status.abnormal > 0 : false;

  return (
    <Section
      title="교통 운행정보"
      caption={
        area
          ? '앱이 확인할 수 있는 노선은 자동으로 확인해요'
          : '이 도시는 회사 공식 페이지에서 확인하세요'
      }>
      {/* 자동 확인이 되는 도시에만 판정 줄을 그린다. 안 되는 도시에 「확인 중」을
          띄우면 영원히 확인 중인 화면이 된다. */}
      {area ? (
        <Card accent={abnormal ? theme.warning : undefined} style={styles.trainCard}>
          {!fresh ? (
            <Txt variant="body" color="textTertiary">
              운행정보를 확인하고 있어요
            </Txt>
          ) : status === null ? (
            /* 서버가 없거나 죽었다. 확인 못 했다는 사실을 적는다 —
               조용히 비우면 「이상 없음」으로 읽힌다. */
            <Txt variant="body" color="textSecondary">
              지금은 자동 확인이 안 돼요. 아래 공식 페이지에서 봐주세요.
            </Txt>
          ) : abnormal ? (
            <>
              <View style={styles.trainHead}>
                <Txt variant="subtitle">지연·운휴가 있어요</Txt>
                <Badge label={`${status.abnormal}건`} tone="warning" />
              </View>
              <Txt variant="body" color="textSecondary" style={styles.trainBody}>
                자세한 구간과 시각은 아래 공식 페이지에서 확인하세요. 일정이 촘촘하면
                여유를 두고 움직이세요.
              </Txt>
            </>
          ) : (
            <Txt variant="body" color="textSecondary">
              JR 간사이 구간에 알려진 지연·운휴가 없어요.
            </Txt>
          )}
        </Card>
      ) : null}

      <RowGroup>
        {sources.map((s, i) => (
          <Row
            key={s.url}
            title={s.operator}
            subtitle={s.westjrArea ? '앱이 자동으로 확인하는 곳이에요' : '공식 운행정보 페이지'}
            trailing="열기"
            chevron
            last={i === sources.length - 1}
            onPress={() => Linking.openURL(s.url)}
          />
        ))}
      </RowGroup>

      {/* 오키나와는 철도보다 항공이 먼저 멈춘다. 도시마다 다른 이 사실을
          데이터에 넣기엔 예외가 하나뿐이라, 여기서 한 줄로 말한다. */}
      {city?.id === 'okinawa' ? (
        <Pressable onPress={() => Linking.openURL('https://www.naha-airport.co.jp/')}>
          <Txt variant="caption" color="textTertiary" style={styles.trainNote}>
            태풍이 오면 유이레일보다 항공편이 먼저 멈춰요. 나하공항 안내도 함께 보세요 →
          </Txt>
        </Pressable>
      ) : null}
    </Section>
  );
}
