import { DayPhase } from './phase';

export type TempHazardKind = 'heat' | 'cold';
export type TempHazardLevel = 'safe' | 'caution' | 'warning' | 'severe' | 'danger';

/**
 * 온도를 칠할 색 — 팔레트 이름으로 돌려준다.
 *
 * 기준은 **체감온도** 하나다. 35℃ 이상이면 빨강, 30℃ 이상이면 노랑,
 * 그 아래는 색을 주지 않는다.
 *
 * ── 왜 WBGT 추정을 그만뒀나 ────────────────────────────
 *
 * 전에는 기온·습도로 WBGT(暑さ指数)를 추정해 환경성 5단계 구간
 * (21·25·28·31℃)에 맞췄다. 등급 경계는 공식 기준이 맞았지만 그 숫자를
 * 만드는 근사식(호주 기상청 WBGT 식)이 「중간 정도의 일사량 + 약한 바람」을
 * 가정해서, 습한 일본 여름에는 통째로 위쪽으로 밀렸다. 실제로 계산해 보면
 * **습도 80%에서 기온 27.5℃부터 이미 최고 등급(위험)**이 켜졌다.
 * 27.5℃도, 31℃도, 35℃도 전부 「매우 위험한 더위 · 외출을 피하세요」라
 * 등급이 하나로 뭉개져서, 정작 진짜 위험한 날을 구분해 주지 못했다.
 * 그리고 여름 내내 최고 경보가 떠 있으면 사용자는 그 카드를 안 읽게 된다.
 *
 * 그래서 체감온도(Open-Meteo `apparent_temperature`)를 그대로 쓴다.
 * **습도와 바람이 이미 반영된 값**이라 습도를 버리는 게 아니고, 무엇보다
 * 사용자가 화면에서 **눈으로 확인할 수 있는 숫자**다. 「체감 36°라서 빨강」은
 * 납득이 되지만 「WBGT 32라서 빨강」은 그 수치 체계를 아는 사람에게만 뜻이 있다.
 * 추위 쪽이 원래 체감온도를 쓰고 있었으므로 더위와 추위의 판단 근거도 같아진다.
 *
 * 색을 정하는 값과 화면에 큰 숫자로 찍히는 값이 같아야 한다. 다르면
 * 「31°인데 왜 빨강이지」가 생기고, 그게 이 판정을 못 믿게 만든 원인이었다.
 * 그래서 이 값을 쓰는 화면은 체감온도를 **반드시 함께 보여준다.**
 *
 * 색만으로 뜻을 전달하지는 않는다. 화면은 이 색과 함께 등급 이름(`shortLabel`)을
 * 글로 같이 보여줘야 한다 — 노선 색 점에 색 이름을 붙인 것과 같은 이유다.
 */
export function tempHazardColorName(
  info: TempHazardInfo,
): 'text' | 'warning' | 'danger' | 'cold' {
  // 추위는 파랑. 다만 체감 -15℃ 미만은 동상이 실제로 생기는 구간이라
  // 파랑으로는 위험이 전달되지 않아 빨강으로 올린다.
  if (info.kind === 'cold') return info.level === 'danger' ? 'danger' : 'cold';
  // 더위는 체감 35℃(danger) 빨강 · 30℃(severe) 노랑. 그 아래 등급은 문구로만
  // 말하고 색을 주지 않는다 — 색이 흔해지면 색이 뜻을 잃는다.
  if (info.level === 'danger') return 'danger';
  if (info.level === 'severe') return 'warning';
  return 'text';
}

export interface TempHazardInfo {
  kind: TempHazardKind;
  level: TempHazardLevel;
  emoji: string;
  /**
   * 한 줄 요약 — 옷차림 카드와 같은 톤. 이게 화면의 주인공이다.
   *
   * 여기에 체감온도를 괄호로 붙이지 않는다. 날씨 화면에는 이미 체감온도가
   * 큰 숫자로 따로 있어서 같은 값이 두 번 나오고, 문장만 길어진다.
   * 숫자가 필요한 화면은 feelsLikeC 를 직접 조합해서 쓴다.
   */
  headline: string;
  /** 판단에 쓰인 체감온도(℃, 반올림) — 화면이 필요하면 직접 붙여 쓴다 */
  feelsLikeC: number;
  /** 지금 뭘 하면 되는지 */
  advice: string;
  /**
   * 뱃지에 쓰는 아주 짧은 한 마디.
   *
   * 원래는 일본 환경성 공식 등급명(안전·주의·경계·엄중경계·위험)을 그대로
   * 썼는데, 「엄중경계」같은 말은 한국에서 쓰지 않아 오히려 뜻이 흐려졌다.
   * 한국 기상청이 쓰는 익숙한 3단(주의·경고·위험) 안에서 고른다.
   */
  shortLabel: string;
}

/** 어느 쪽 극단에도 안 걸치는 온화한 날씨. safe 온열질환 위험만 반환한다. */
const MILD_COLD_CUTOFF_C = 5;

/**
 * 더위·추위 위험도를 한 번에 판단한다.
 *
 * 이전에는 더위(온열질환)만 다뤘다 — 그러다 보니 겨울에 홋카이도 같은 곳을
 * 가도 늘 "더위 걱정 없다"는 메시지만 나왔다. 체감온도가 낮으면 그건 안심
 * 신호가 아니라 **다른 위험(저체온·동상)**의 시작인데도 앱이 그 방향은
 * 아예 보지 않았던 셈이다. 그래서 체감온도가 충분히 낮으면(5℃ 미만)
 * 추위 쪽 판정으로 넘어가도록 갈래를 나눴다.
 */
export function tempHazard(feelsLikeC: number, phase: DayPhase = 'day'): TempHazardInfo {
  if (feelsLikeC < MILD_COLD_CUTOFF_C) return coldHazard(feelsLikeC);
  return heatHazard(feelsLikeC, phase);
}

/**
 * 이 위험도 카드의 제목에 붙일 시간 범위.
 *
 * 밤 10시에 「오늘 무더위」라고 적혀 있으면 낮 이야기처럼 읽힌다. 실제로는
 * 지금 이 순간의 열기를 말하고 있으니 제목도 그렇게 바뀌어야 한다.
 * 추위는 밤에 더 심해지는 쪽이라 같은 원칙이 그대로 통한다.
 */
export function tempHazardTitle(info: TempHazardInfo, phase: DayPhase): string {
  const what = info.kind === 'cold' ? '추위' : '무더위';
  return phase === 'night' ? `오늘 밤 ${what}` : `오늘 ${what}`;
}

/**
 * 더위(온열질환) 방향 — **체감온도** 기준.
 *
 * 구간은 35 · 30 · 27 · 23℃다. 색이 붙는 두 자리(35 빨강 · 30 노랑)가 판단의
 * 중심이고, 나머지는 문구로만 말한다. 왜 WBGT 추정을 쓰지 않는지는
 * `tempHazardColorName()` 주석에 적어 두었다.
 *
 * 체감온도는 Open-Meteo 의 `apparent_temperature` 로, 기온에 습도와 바람을
 * 반영한 값이다(호주 기상청 체감온도 모델). 그래서 같은 31℃라도 습한 날은
 * 체감이 35℃를 넘어 빨강이 되고, 건조하고 바람 부는 날은 30℃대 초반에
 * 머문다 — 습도를 판단에서 뺀 것이 아니라 사용자가 볼 수 있는 숫자 하나로
 * 합친 것이다.
 *
 * ⚠️ 이 구간은 공식 기준이 아니라 **한국 여행자가 납득할 수 있는 눈금**이다.
 * 환경성 열중증 경보(熱中症警戒アラート)는 관측된 WBGT 로 발령되는 별개의
 * 정보이고, 그 공식 경보가 필요하면 관측망 API 를 붙여야 한다. 여기 값은
 * 「지금 나가도 되나」에 답하는 참고 눈금이라는 점을 화면에서도 흐리지 않는다.
 */
function heatHazard(feelsLikeC: number, phase: DayPhase): TempHazardInfo {
  const f = Math.round(feelsLikeC);
  const night = phase === 'night';

  if (feelsLikeC >= 35) {
    return {
      kind: 'heat',
      level: 'danger',
      emoji: '🚨',
      headline: night ? '밤에도 위험한 더위예요' : '매우 위험한 더위예요',
      advice: night
        ? '열대야예요. 숙소 냉방을 켜두고 자는 게 안전해요. 자기 전과 자다 깼을 때 물을 한 잔씩 드세요. 어지럽거나 머리가 아프면 바로 시원한 곳으로 가세요.'
        : '가능하면 한낮 외출을 피하세요. 나가야 한다면 30분마다 실내나 그늘에서 쉬고, 물을 계속 드세요. 어지럽거나 두통이 있으면 바로 시원한 곳으로 가세요.',
      feelsLikeC: f,
      shortLabel: '위험',
    };
  }
  if (feelsLikeC >= 30) {
    return {
      kind: 'heat',
      level: 'severe',
      emoji: '🥵',
      // 밤에는 「한낮을 피하세요」가 이미 지난 조언이다. 지금 할 수 있는 일과
      // 내일 아침에 쓸 수 있는 이야기로 바꿔야 한다.
      headline: night ? '밤에도 열기가 안 빠져요' : '한낮에는 야외 활동을 줄이세요',
      advice: night
        ? '해가 져도 후텁지근해요. 숙소 냉방을 미리 켜두고, 자기 전에 물을 드세요. 내일도 이 정도면 한낮 야외 일정은 줄이는 게 좋아요.'
        : '땡볕 아래 오래 있지 마세요. 그늘이나 실내에서 자주 쉬고, 물을 계속 마시세요.',
      feelsLikeC: f,
      shortLabel: '경고',
    };
  }
  if (feelsLikeC >= 27) {
    return {
      kind: 'heat',
      level: 'warning',
      emoji: '😓',
      headline: night ? '밤에도 후텁지근해요' : '더위에 지치기 쉬운 날이에요',
      advice: night
        ? '걸어 다니면 여전히 땀이 나요. 물을 챙기고, 숙소에서는 냉방이나 선풍기를 켜두세요.'
        : '많이 걷는 일정이라면 중간중간 그늘에서 쉬어가세요. 물을 평소보다 자주 드세요.',
      feelsLikeC: f,
      shortLabel: '주의',
    };
  }
  if (feelsLikeC >= 23) {
    return {
      kind: 'heat',
      level: 'caution',
      emoji: '🙂',
      headline: night ? '밤 공기는 지내기 괜찮아요' : '조금 더울 수 있어요',
      advice: night ? '가볍게 다니셔도 돼요.' : '물병 하나 챙기는 정도면 충분해요.',
      feelsLikeC: f,
      shortLabel: '주의',
    };
  }
  return {
    kind: 'heat',
    level: 'safe',
    emoji: night ? '🌙' : '😌',
    headline: night ? '밤에는 선선해요' : '더위 걱정은 안 하셔도 돼요',
    advice: night
      ? '늦게 돌아다녀도 덥지 않아요. 얇은 겉옷 하나만 있으면 충분해요.'
      : '평소처럼 다니시면 돼요.',
    feelsLikeC: f,
    shortLabel: '괜찮음',
  };
}

/**
 * 추위 방향 — 체감온도(feelsLikeC) 기준.
 *
 * Open-Meteo 의 apparent_temperature 는 바람까지 반영한 호주 기상청 체감온도
 * 모델이라, 추위 쪽에서는 별도 근사식 없이 이 값을 그대로 등급 판단에 쓴다.
 * 구간(0·-5·-15℃)은 캐나다·미국 기상청이 쓰는 체감온도 동상 경고 기준을
 * 참고해, 일본의 실제 겨울 체감온도 범위(삿포로 기준 대략 -20~5℃)에
 * 맞춰 잡았다.
 */
function coldHazard(feelsLikeC: number): TempHazardInfo {
  const f = Math.round(feelsLikeC);

  if (feelsLikeC < -15) {
    return {
      kind: 'cold',
      level: 'danger',
      emoji: '🥶',
      headline: '매우 위험한 추위예요',
      advice: '동상 위험이 있어요. 피부 노출을 최소화하고, 실내에서 자주 몸을 녹이세요. 장시간 야외 활동은 피하세요.',
      feelsLikeC: f,

      shortLabel: '위험',
    };
  }
  if (feelsLikeC < -5) {
    return {
      kind: 'cold',
      level: 'severe',
      emoji: '🧊',
      headline: '매우 추운 날씨예요',
      advice: '장갑·목도리로 노출 부위를 꼭 가리세요. 야외 활동은 짧게 끊어서 하는 게 좋아요.',
      feelsLikeC: f,

      shortLabel: '경고',
    };
  }
  if (feelsLikeC < 0) {
    return {
      kind: 'cold',
      level: 'warning',
      emoji: '🥶',
      headline: '많이 추운 날씨예요',
      advice: '따뜻하게 껴입고 나가세요. 바람이 불면 체감이 더 낮아져요.',
      feelsLikeC: f,

      shortLabel: '주의',
    };
  }
  return {
    kind: 'cold',
    level: 'caution',
    emoji: '🧣',
    headline: '쌀쌀한 날씨예요',
    advice: '목도리나 장갑을 챙기면 좋아요.',
    feelsLikeC: f,

    shortLabel: '주의',
  };
}

