

import { fromServer } from '@/lib/api';

/** Open-Meteo 원본 응답 — 우리가 읽는 부분만 */
interface WeatherResponse {
  current?: Record<string, number>;
  hourly?: HourlyRain;
  daily?: Record<string, (number | string | null)[]>;
}

export interface HourlyRain {
  time: string[];
  precipitation_probability: number[];
  temperature_2m: number[];
  /**
   * 시간별 체감온도.
   *
   * 예전에는 기온과 강수확률만 받았다. 그런데 여행자가 날씨를 보는 이유는
   * 「지금 몇 도」가 아니라 **하루를 어떻게 짤지**다 — 몇 시부터 더워지고
   * 몇 시에 꺾이는지를 알아야 일정을 옮길 수 있다.
   *
   * 시간별 위험도 등급도 이 값으로 낸다(lib/weather/hazard.ts). 체감온도에
   * 습도와 바람이 이미 반영돼 있어서 시간별 습도를 따로 받지 않는다 —
   * 예전에는 WBGT 를 추정하느라 받았는데, 그 추정을 그만두면서 쓰는 곳이
   * 사라졌다. 안 쓰는 값을 계속 받으면 다음 사람이 「어딘가 쓰겠지」 하고
   * 남겨 둔다.
   */
  apparent_temperature: number[];
}

export interface WeatherData {
  tempC: number;
  /** 체감온도. 기온보다 이 값을 기준으로 옷차림을 정한다 */
  feelsLikeC: number;
  humidity: number;
  weatherCode: number;
  hourly: HourlyRain;
  /**
   * 오늘 최고·최저 기온.
   *
   * 홈의 「지금 상황」 카드가 휴대폰 날씨 위젯처럼 읽히려면 지금 기온만으로는
   * 모자란다. 「지금 31도」는 이 순간의 사실일 뿐이고, 여행자가 실제로 궁금한
   * 것은 **오늘 하루가 어떤 날이냐**다 — 아침에 보면 얼마나 더워질지, 저녁에
   * 보면 밤에 얼마나 식을지.
   *
   * 값을 못 받으면 null 이다. 0 으로 떨어뜨리면 화면에 「최저 0°」가 찍히는데,
   * 여름 오사카에서 그건 없는 정보가 아니라 **틀린 정보**다.
   */
  tempMaxC: number | null;
  tempMinC: number | null;
  /** 오늘 하루 중 최고 자외선지수 */
  uvIndexMax: number;
  /** 지금 풍속(km/h) */
  windSpeedKmh: number;
  /** 오늘 하루 중 최대 돌풍(km/h) — 우산·야외활동 위험 판단에 이 값을 쓴다 */
  windGustsMaxKmh: number;
  /**
   * 오늘 일출·일몰 (JST, "YYYY-MM-DDTHH:mm").
   *
   * 조언이 낮 기준인지 밤 기준인지 가르는 데 쓴다. 시각을 상수로 박으면 안 된다 —
   * 일본의 일몰은 여름 19시경, 겨울 16시 45분경으로 두 시간 이상 벌어진다.
   */
  sunrise: string;
  sunset: string;
  /**
   * 내일 최고 자외선지수 · 최대 돌풍.
   *
   * 해가 진 뒤에는 오늘 최댓값이 아무 쓸모가 없다. 정오에 자외선 8이었다는 건
   * 밤 10시에 아무 행동으로도 이어지지 않는다. 그 시간대에 실제로 도움이 되는
   * 건 내일 아침에 무엇을 챙길지다.
   */
  uvIndexMaxTomorrow: number;
  windGustsMaxTomorrowKmh: number;
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  /*
   * 서버가 있으면 서버를 먼저 본다.
   *
   * 같은 도시의 사용자는 좌표가 사실상 같아서 답도 같다. 기기가 각자 부르면
   * 사용자 수만큼 호출되지만, 서버가 받아 나눠 주면 도시당 10분에 한 번이다.
   * Open-Meteo 는 무료지만 무제한이 아니고 상업 이용에는 별도 조건이 붙는다.
   *
   * 서버가 없거나 죽으면 아래 공개 API 로 그대로 떨어진다 — 서버는 한도와
   * 성능을 위한 것이지 기능의 전제가 아니다.
   */
  const viaServer = await fromServer<WeatherResponse>('/api/weather', { lat, lng });
  if (viaServer?.current) return shape(viaServer);

  try {
    // forecast_days=2 — 해가 진 뒤에 내일 값을 안내하려면 이틀치가 필요하다.
    // hourly 도 48시간으로 늘어나므로 rainWindows() 가 날짜까지 보고 걸러야 한다.
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&hourly=precipitation_probability,temperature_2m,apparent_temperature` +
      `&daily=uv_index_max,wind_gusts_10m_max,sunrise,sunset,temperature_2m_max,temperature_2m_min` +
      `&timezone=Asia%2FTokyo&forecast_days=2`;

    const res = await fetch(url);
    if (!res.ok) return null;

    return shape(await res.json());
  } catch {
    // 오프라인이거나 API 장애 — 날씨 없이도 앱의 나머지는 정상 동작해야 한다
    return null;
  }
}

/** Open-Meteo 응답 → 앱이 쓰는 모양. 서버 경유든 직통이든 같은 함수를 탄다 */
function shape(data: WeatherResponse): WeatherData {
  const cur = data.current ?? {};
  const daily = data.daily ?? {};
  const num = (k: string, i = 0): number | null => {
    const v = daily[k]?.[i];
    return typeof v === 'number' ? v : null;
  };
  const str = (k: string, i = 0): string => {
    const v = daily[k]?.[i];
    return typeof v === 'string' ? v : '';
  };
  return {
    tempC: cur.temperature_2m,
    feelsLikeC: cur.apparent_temperature,
    humidity: cur.relative_humidity_2m,
    weatherCode: cur.weather_code,
    hourly: data.hourly as HourlyRain,
    tempMaxC: num('temperature_2m_max'),
    tempMinC: num('temperature_2m_min'),
    uvIndexMax: num('uv_index_max') ?? 0,
    windSpeedKmh: cur.wind_speed_10m ?? 0,
    windGustsMaxKmh: num('wind_gusts_10m_max') ?? 0,
    sunrise: str('sunrise'),
    sunset: str('sunset'),
      // 내일 값이 없으면(응답 형식 변경 등) 오늘 값으로 떨어뜨린다. 밤 화면에서
      // 0으로 두면 "내일은 자외선이 약해요" 같은 틀린 안심을 주게 된다.
    uvIndexMaxTomorrow: num('uv_index_max', 1) ?? num('uv_index_max') ?? 0,
    windGustsMaxTomorrowKmh: num('wind_gusts_10m_max', 1) ?? num('wind_gusts_10m_max') ?? 0,
  };
}

/**
 * 지금이 낮인지 밤인지.
 *
 * 「한낮에는 야외 활동을 줄이세요」 같은 조언은 아침에는 예고가 되지만 밤에는
 * 이미 지난 이야기다. 조언의 시제를 맞추려면 해가 떠 있는지부터 알아야 한다.
 *
 * 일출·일몰 시각은 API 가 JST 로 준 문자열을 그대로 쓴다. 앱이 도는 기기의
 * 시간대(한국·일본·빌드 서버)가 무엇이든 결과가 같아야 하므로, 양쪽 모두
 * "그날의 몇 분째"로 바꿔 비교한다.
 */
