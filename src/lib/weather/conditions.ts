export interface WeatherCondition {
  emoji: string;
  label: string;
}

/**
 * WMO 날씨 코드 → 이모지·한국어.
 *
 * Open-Meteo는 세계기상기구(WMO) 공통 코드를 쓴다(0=맑음, 61~65=비, 71~75=눈 …).
 * 정확한 코드 표: https://open-meteo.com/en/docs
 */
const WEATHER_CONDITIONS: Record<number, WeatherCondition> = {
  0: { emoji: '☀️', label: '맑음' },
  1: { emoji: '🌤️', label: '대체로 맑음' },
  2: { emoji: '⛅', label: '구름 조금' },
  3: { emoji: '☁️', label: '흐림' },
  45: { emoji: '🌫️', label: '안개' },
  48: { emoji: '🌫️', label: '짙은 안개' },
  51: { emoji: '🌦️', label: '가벼운 이슬비' },
  53: { emoji: '🌦️', label: '이슬비' },
  55: { emoji: '🌧️', label: '강한 이슬비' },
  56: { emoji: '🌧️', label: '언 이슬비' },
  57: { emoji: '🌧️', label: '강한 언 이슬비' },
  61: { emoji: '🌧️', label: '가벼운 비' },
  63: { emoji: '🌧️', label: '비' },
  65: { emoji: '🌧️', label: '강한 비' },
  66: { emoji: '🌧️', label: '언 비' },
  67: { emoji: '🌧️', label: '강한 언 비' },
  71: { emoji: '🌨️', label: '가벼운 눈' },
  73: { emoji: '🌨️', label: '눈' },
  75: { emoji: '❄️', label: '강한 눈' },
  77: { emoji: '🌨️', label: '싸락눈' },
  80: { emoji: '🌦️', label: '소나기' },
  81: { emoji: '🌧️', label: '강한 소나기' },
  82: { emoji: '⛈️', label: '매우 강한 소나기' },
  85: { emoji: '🌨️', label: '눈 소나기' },
  86: { emoji: '❄️', label: '강한 눈 소나기' },
  95: { emoji: '⛈️', label: '천둥번개' },
  96: { emoji: '⛈️', label: '우박 동반 천둥번개' },
  99: { emoji: '⛈️', label: '강한 우박 동반 천둥번개' },
};

/** 목록에 없는 코드가 오면(신규 코드 추가 등) 구름 아이콘으로 조용히 대체한다. */
export function weatherCondition(code: number): WeatherCondition {
  return WEATHER_CONDITIONS[code] ?? { emoji: '☁️', label: '흐림' };
}

