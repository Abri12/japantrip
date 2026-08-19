import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Badge, Card, Row, RowGroup, Section, Txt } from '@/components/ui';
import { City } from '@/data/cities';
import { autoCheckableArea, odptOperators, trainStatusFor } from '@/data/train-status';
import { useTheme } from '@/hooks/use-theme';
import { fromServer } from '@/lib/api';

import { styles } from './styles';

interface WestJrResponse {
  abnormal: number;
}

interface OdptItem {
  railway: string;
  operator: string;
  /** 이상이 있을 때만 값이 온다 */
  status: string | null;
  text: string;
}

interface OdptResponse {
  keyed: boolean;
  items: OdptItem[];
}

/** 두 소스를 한 모양으로 합친 결과 */
interface Checked {
  /** 확인한 노선 수. 0이면 「확인은 됐는데 대상이 없음」 */
  covered: number;
  /** 이상이 있는 노선 */
  abnormal: { label: string; text: string }[];
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
   * 예전에는 결과와 「확인 끝났나」를 따로 뒀는데, 도시를 바꿀 때 옛 결과를
   * 지우려면 효과 안에서 곧바로 setState 해야 했다. 그건 렌더 직후 한 번 더
   * 그리게 만들고, 무엇보다 두 값이 잠깐 어긋난다 — 「확인 끝났는데 옛 도시
   * 결과」가 보이는 순간이 생긴다.
   *
   * 어느 도시의 결과인지를 값 안에 넣으면 그 어긋남이 사라진다.
   */
  const [result, setResult] = useState<{ cityId: string; data: Checked | null } | null>(null);

  const sources = city ? trainStatusFor(city.id) : [];
  const area = city ? autoCheckableArea(city.id) : undefined;
  const operators = city ? odptOperators(city.id) : [];
  const cityId = city?.id;
  /* 자동 확인 대상이 하나라도 있는지. 없으면 링크만 그린다 */
  const autoCheckable = !!area || operators.length > 0;
  const opKey = operators.join(',');

  useEffect(() => {
    if (!cityId || (!area && !opKey)) return;
    let alive = true;

    /*
     * 두 소스를 함께 묻는다.
     *
     * 간사이는 JR서일본, 도쿄는 ODPT 로 갈리지만 화면에서는 「이 도시 전철이
     * 괜찮나」 하나의 질문이다. 소스가 늘어도 화면이 그걸 알 필요가 없게
     * 여기서 한 모양으로 합친다.
     */
    Promise.all([
      area ? fromServer<WestJrResponse>('/api/train-status', { area }) : null,
      opKey ? fromServer<OdptResponse>('/api/train-status/odpt') : null,
    ])
      .then(([west, odpt]) => {
        if (!alive) return;
        if (west === null && odpt === null) {
          setResult({ cityId, data: null });
          return;
        }

        const wanted = opKey.split(',').filter(Boolean);
        const mine = (odpt?.items ?? []).filter((i) => wanted.includes(i.operator));

        setResult({
          cityId,
          data: {
            covered: (west ? 1 : 0) + mine.length,
            abnormal: [
              // JR서일본은 노선 이름을 우리가 못 읽으므로 건수만 말한다.
              ...(west && west.abnormal > 0
                ? [{ label: 'JR 서일본', text: `지연·운휴 ${west.abnormal}건` }]
                : []),
              ...mine
                .filter((i) => i.status)
                .map((i) => ({ label: i.railway.replace(/^[^.]+\./, ''), text: i.text })),
            ],
          },
        });
      })
      .catch(() => {
        if (alive) setResult({ cityId, data: null });
      });

    return () => {
      alive = false;
    };
  }, [cityId, area, opKey]);

  /* 지금 보는 도시의 결과일 때만 쓴다. 막 바꿨으면 아직 안 온 것이다. */
  const fresh = result && result.cityId === cityId ? result : null;
  const checked = fresh?.data ?? null;

  if (sources.length === 0) return null;

  const abnormal = checked ? checked.abnormal.length > 0 : false;

  return (
    <Section
      title="교통 운행정보"
      caption={
        autoCheckable
          ? '확인할 수 있는 노선은 앱이 자동으로 확인해요'
          : '이 도시는 회사 공식 페이지에서 확인하세요'
      }>
      {/* 자동 확인 대상이 있는 도시에만 판정 줄을 그린다. 대상이 없는데
          「확인 중」을 띄우면 영원히 확인 중인 화면이 된다. */}
      {autoCheckable ? (
        <Card accent={abnormal ? theme.warning : undefined} style={styles.trainCard}>
          {!fresh ? (
            <Txt variant="body" color="textTertiary">
              운행정보를 확인하고 있어요
            </Txt>
          ) : checked === null ? (
            /* 서버가 없거나 죽었다. 확인 못 했다는 사실을 적는다 —
               조용히 비우면 「이상 없음」으로 읽히고, 그건 재난 상황에서
               가장 나쁜 종류의 틀린 안심이다. */
            <Txt variant="body" color="textSecondary">
              지금은 자동 확인이 안 돼요. 아래 공식 페이지에서 봐주세요.
            </Txt>
          ) : abnormal ? (
            <>
              <View style={styles.trainHead}>
                <Txt variant="subtitle">지연·운휴가 있어요</Txt>
                <Badge label={`${checked.abnormal.length}건`} tone="warning" />
              </View>
              {/* 일본어 원문을 그대로 옮긴다. 우리가 요약하면 틀릴 여지가
                  생기고, 급할 때 필요한 건 정확한 원문이다. */}
              {checked.abnormal.map((a) => (
                <Txt key={a.label} variant="body" color="textSecondary" style={styles.trainBody}>
                  {a.label} · {a.text}
                </Txt>
              ))}
              <Txt variant="caption" color="textTertiary" style={styles.trainBody}>
                자세한 구간과 시각은 아래 공식 페이지에서 확인하세요.
              </Txt>
            </>
          ) : (
            <Txt variant="body" color="textSecondary">
              확인한 노선에 지연·운휴가 없어요.
            </Txt>
          )}
        </Card>
      ) : null}

      <RowGroup>
        {sources.map((s, i) => (
          <Row
            key={s.url}
            title={s.operator}
            subtitle={
              /* ODPT 는 키가 있어야 나오는 사업자가 있다. 실제로 값이 왔는지를
                 보고 말한다 — 코드만 적혀 있다고 「자동 확인 중」이라 하면
                 키가 없을 때 거짓말이 된다. */
              s.westjrArea || (s.odptOperator && checked && checked.covered > 0)
                ? '앱이 자동으로 확인하는 곳이에요'
                : '공식 운행정보 페이지'
            }
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
