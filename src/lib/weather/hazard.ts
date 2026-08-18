import { DayPhase } from './phase';

export type TempHazardKind = 'heat' | 'cold';
export type TempHazardLevel = 'safe' | 'caution' | 'warning' | 'severe' | 'danger';

/**
 * 온도를 칠할 색 — 팔레트 이름으로 돌려준다.
 *
 * 색 기준을 새로 만들지 않고 `tempHazard()` 의 등급을 그대로 쓴다. 이유가 있다:
 *
 * 1. **근거가 이미 있다.** 더위 쪽은 일본 환경성 열중증 예방 지침의 WBGT 구분
 *    (21·25·28·31℃ — 注意/警戒/厳重警戒/危険)을 그대로 따르고, 추위 쪽은
 *    체감온도 동상 경고 기준(0·-5·-15℃)을 쓴다. 체감온도 몇 도부터 빨강인지를
 *    새로 정하면 그 숫자에는 아무 근거가 없다.
 * 2. **색과 글이 어긋날 수 없다.** 숫자를 체감온도만 보고 칠하면, 습도가 낮은
 *    35℃에서 숫자는 빨간데 아래 문구는 「경고」로 나오는 모순이 생긴다.
 *    실제로 예전에 홈 뱃지와 상세 화면 등급이 어긋난 문제가 있었다.
 *
 * 그래서 더위는 기온+습도로 추정한 WBGT 등급을 따르고, 추위는 체감온도를
 * 따른다 — 판단 근거가 다른 것은 원래 판정 방식이 다르기 때문이다.
 *
 * 색만으로 뜻을 전달하지는 않는다. 화면은 이 색과 함께 등급 이름(`shortLabel`)을
 * 글로 같이 보여줘야 한다 — 노선 색 점에 색 이름을 붙인 것과 같은 이유다.
 *
 * ⚠️ 알려진 한계: 더위 등급의 바탕인 WBGT 는 관측값이 아니라 기온·습도로 낸
 * 추정값이다. 호주 기상청은 이 근사식이 **중간 정도의 일사량과 약한 바람을
 * 가정**하며, 흐리거나 바람이 강한 날과 **해가 낮거나 진 시간대에는 과대평가**
 * 한다고 명시한다. 그래서 빨강이 생각보다 이른 체감온도에서 켜진다(습한 여름
 * 일본에서는 체감 34℃ 근처부터). 안전 기능이라 낮게 잡히는 것보다는 낫다고
 * 판단했지만, 실제 관측망(환경성 WBGT 실황)을 붙이면 이 편향이 사라진다.
 * 근거: https://www.bom.gov.au/info/thermal_stress/
 */
export function tempHazardColorName(
  info: TempHazardInfo,
): 'text' | 'warning' | 'danger' | 'cold' {
  // 추위는 파랑. 다만 체감 -15℃ 미만은 동상이 실제로 생기는 구간이라
  // 파랑으로는 위험이 전달되지 않아 빨강으로 올린다.
  if (info.kind === 'cold') return info.level === 'danger' ? 'danger' : 'cold';
  if (info.level === 'danger') return 'danger';
  if (info.level === 'severe' || info.level === 'warning') return 'warning';
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
export function tempHazard(
  tempC: number,
  humidity: number,
  feelsLikeC: number,
  phase: DayPhase = 'day',
): TempHazardInfo {
  if (feelsLikeC < MILD_COLD_CUTOFF_C) return coldHazard(feelsLikeC);
  return heatHazard(tempC, humidity, feelsLikeC, phase);
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
 * 더위(온열질환) 방향 — 추정 WBGT(暑さ指数) 기준.
 *
 * 일본 환경성이 실제로 발표하는 「熱中症警戒アラート」는 흑구온도(직사광선 노출
 * 열)까지 측정한 정식 WBGT 관측망을 쓴다. 이 앱은 그 관측망 API를 아직 붙이지
 * 않았고, 대신 기온·습도만으로 WBGT를 **추정**한다(호주 기상청 공식 근사식:
 * WBGT ≈ 0.567×기온 + 0.393×수증기압 + 3.94, 수증기압은 기온·습도로 계산).
 * 이 근사식은 "중간 정도의 일사량 + 약한 바람"을 가정하기 때문에, 실제로
 * 흐리거나 바람이 강한 날에는 실제보다 높게(위험 쪽으로) 나올 수 있다 —
 * 안전 기능이니 낮게 잡히는 것보다 이쪽이 낫다고 판단했다.
 *
 * 등급 구간(21·25·28·31℃)은 환경성 공식 5단계와 같지만, 화면에는 WBGT 숫자
 * 대신 체감온도(feelsLikeC, Open-Meteo apparent_temperature)를 보여준다.
 * "WBGT 31도"는 그 수치 체계를 아는 사람에게만 의미가 있다.
 */
function heatHazard(
  tempC: number,
  humidity: number,
  feelsLikeC: number,
  phase: DayPhase,
): TempHazardInfo {
  const vaporPressure = (humidity / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  const wbgt = 0.567 * tempC + 0.393 * vaporPressure + 3.94;
  const f = Math.round(feelsLikeC);
  const night = phase === 'night';

  if (wbgt >= 31) {
    return {
      kind: 'heat',
      level: 'danger',
      emoji: '🚨',
      headline: night ? '밤에도 위험한 더위예요' : '매우 위험한 더위예요',
      advice: night
        ? '열대야예요. 숙소 냉방을 켜두고 자는 게 안전해요. 자기 전과 자다 깼을 때 물을 한 잔씩 드세요. 어지럽거나 머리가 아프면 바로 시원한 곳으로 가세요.'
        : '가능하면 외출을 피하세요. 실내라도 냉방이 없으면 위험해요. 어지럽거나 두통이 있으면 바로 그늘로 이동해서 물을 마시세요.',
      feelsLikeC: f,

      shortLabel: '위험',
    };
  }
  if (wbgt >= 28) {
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
  if (wbgt >= 25) {
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
  if (wbgt >= 21) {
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

