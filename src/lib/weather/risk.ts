import { DayPhase } from './phase';

export interface DailyRisk {
  level: 'low' | 'moderate' | 'high' | 'veryHigh' | 'extreme';
  emoji: string;
  headline: string;
  advice: string;
  /** 뱃지용 짧은 한 마디. TempHazardInfo.shortLabel 과 같은 원칙이다 */
  shortLabel: string;
}

/**
 * 자외선지수 — WHO 국제 표준 5단계 구간(0·3·6·8·11)을 그대로 쓴다.
 * 오사카·교토 한여름 한낮은 7~9대까지 흔히 올라간다(2026-08-17 오사카 실측
 * 데이터로 확인: 정오 무렵 최고 7.45).
 */
/** 자외선지수 → 내일 아침에 챙길 것. 밤 화면 문구를 만드는 데 쓴다. */
function uvPrepHint(uv: number): string {
  if (uv >= 8) return '내일도 자외선이 매우 강할 전망이에요. 아침에 나가기 전 양산이나 모자를 챙기세요.';
  if (uv >= 6) return '내일도 햇빛이 강할 전망이에요. 선크림과 선글라스를 챙겨두면 좋아요.';
  if (uv >= 3) return '내일은 선크림 하나 챙기는 정도면 충분해요.';
  return '내일도 자외선은 약할 전망이에요.';
}

export function uvRisk(
  uvIndexMax: number,
  opts: { phase?: DayPhase; tomorrowMax?: number } = {},
): DailyRisk {
  // 해가 지면 자외선은 0이다. 그런데 uvIndexMax 는 하루 최댓값이라 밤 10시에도
  // 「자외선이 매우 강해요」가 그대로 떠 있는다. 정오에 8이었다는 사실은 그
  // 시간대에 어떤 행동으로도 이어지지 않으니, 내일 아침 준비로 시제를 옮긴다.
  if (opts.phase === 'night') {
    return {
      level: 'low',
      emoji: '🌙',
      headline: '지금은 자외선 걱정이 없어요',
      advice: uvPrepHint(opts.tomorrowMax ?? uvIndexMax),
      shortLabel: '없음',
    };
  }

  if (uvIndexMax >= 11) {
    return {
      level: 'extreme',
      emoji: '🆘',
      headline: '자외선이 위험한 수준이에요',
      advice: '한낮 야외 활동은 가능하면 피하세요. 나가야 한다면 긴팔·모자·선글라스로 최대한 가리세요.',

      shortLabel: '위험',
    };
  }
  if (uvIndexMax >= 8) {
    return {
      level: 'veryHigh',
      emoji: '☂️',
      headline: '자외선이 매우 강해요',
      advice: '양산이나 모자가 꼭 필요해요. 선크림은 2~3시간마다 덧발라 주세요.',
      shortLabel: '매우 강함',
    };
  }
  if (uvIndexMax >= 6) {
    return {
      level: 'high',
      emoji: '🕶️',
      headline: '햇빛이 강한 날이에요',
      advice: '선크림과 선글라스를 챙기세요. 그늘이 있는 길로 다니면 훨씬 나아요.',
      shortLabel: '강함',
    };
  }
  if (uvIndexMax >= 3) {
    return {
      level: 'moderate',
      emoji: '🧴',
      headline: '선크림을 발라두면 좋아요',
      advice: '한낮 야외 일정이 길다면 선크림 하나 챙기세요.',
      shortLabel: '보통',
    };
  }
  return {
    level: 'low',
    emoji: '🙂',
    headline: '자외선이 약한 날이에요',
    advice: '따로 챙길 건 없어요.',
    shortLabel: '약함',
  };
}

/**
 * 돌풍(순간 최대풍속) 기준 바람 위험도.
 *
 * JMA 강풍 경보·주의보는 지역마다 발령 기준 풍속이 달라 하나의 숫자로 못
 * 옮긴다(공식 경보 여부는 lib/jma-warnings.ts 가 지역별로 정확히 가져온다).
 * 여기 구간(50·72·90km/h)은 그 대신 "체감상 우산이 뒤집히는지, 걷기
 * 힘든지" 같은 실용적 기준으로 잡은 참고용 눈금이다. 순간풍속(돌풍)을 쓰는
 * 이유는 우산이 뒤집히거나 간판이 흔들리는 건 평균풍속이 아니라 그 순간의
 * 돌풍이 만드는 일이기 때문이다.
 */
export function windRisk(
  gustKmh: number,
  opts: { phase?: DayPhase; tomorrowGustKmh?: number } = {},
): DailyRisk {
  // 자외선과 같은 이유로, 밤에는 오늘 최대 돌풍이 아니라 내일 값을 본다.
  // 「지금 이 순간 위험한지」는 이 참고용 눈금이 아니라 JMA 공식 경보가
  // 답해야 하는 질문이고, 그건 lib/jma-warnings.ts 가 실시간으로 가져온다.
  const night = opts.phase === 'night';
  const gust = night ? (opts.tomorrowGustKmh ?? gustKmh) : gustKmh;

  if (night) {
    if (gust >= 90) {
      return {
        level: 'extreme',
        emoji: '🌀',
        headline: '내일 태풍급 강풍이 예상돼요',
        advice: '내일 야외 일정은 접는 게 좋아요. 오늘 밤 사이 경보가 나오면 안전 탭에 표시돼요.',
        shortLabel: '위험',
      };
    }
    if (gust >= 72) {
      return {
        level: 'veryHigh',
        emoji: '💨',
        headline: '내일 바람이 매우 강할 전망이에요',
        advice: '우산은 소용없어요. 우비를 준비하고, 실내 일정을 섞어 두세요.',
        shortLabel: '매우 강함',
      };
    }
    if (gust >= 50) {
      return {
        level: 'high',
        emoji: '🌬️',
        headline: '내일 바람이 꽤 강할 전망이에요',
        advice: '접이식 우산은 뒤집히기 쉬워요. 튼튼한 우산이나 우비가 나아요.',
        shortLabel: '강함',
      };
    }
    return {
      level: 'low',
      emoji: '🍃',
      headline: '내일도 바람은 잔잔한 편이에요',
      advice: '따로 신경 쓸 건 없어요.',
      shortLabel: '약함',
    };
  }

  if (gustKmh >= 90) {
    return {
      level: 'extreme',
      emoji: '🌀',
      headline: '태풍급 강풍이 예상돼요',
      advice: '외출을 피하세요. 간판·나뭇가지 낙하 위험이 있어요.',

      shortLabel: '위험',
    };
  }
  if (gustKmh >= 72) {
    return {
      level: 'veryHigh',
      emoji: '💨',
      headline: '바람이 매우 강해요',
      advice: '우산은 소용없어요, 우비를 쓰세요. 간판 아래나 다리 위는 피해서 다니세요.',
      shortLabel: '매우 강함',
    };
  }
  if (gustKmh >= 50) {
    return {
      level: 'high',
      emoji: '🌬️',
      headline: '바람이 꽤 강해요',
      advice: '우산이 뒤집히기 쉬워요. 접이식보다는 튼튼한 우산이나 우비가 나아요.',
      shortLabel: '강함',
    };
  }
  return {
    level: 'low',
    emoji: '🍃',
    headline: '바람은 잔잔한 편이에요',
    advice: '따로 신경 쓸 건 없어요.',
    shortLabel: '약함',
  };
}

