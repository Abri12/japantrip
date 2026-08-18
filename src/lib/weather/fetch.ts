

export interface HourlyRain {
  time: string[];
  precipitation_probability: number[];
  temperature_2m: number[];
  /**
   * 시간별 체감온도와 습도.
   *
   * 예전에는 기온과 강수확률만 받았다. 그런데 여행자가 날씨를 보는 이유는
   * 「지금 몇 도」가 아니라 **하루를 어떻게 짤지**다 — 몇 시부터 더워지고
   * 몇 시에 꺾이는지를 알아야 일정을 옮길 수 있다.
   *
   * 습도까지 받는 건 시간마다 위험도를 계산해야 하기 때문이다. 더위 등급은
   * 기온만으로 안 나오고 기온+습도로 추정한 WBGT 가 필요하다.
   */
  apparent_temperature: number[];
  relative_humidity_2m: number[];
}

export interface WeatherData {
  tempC: number;
  /** 체감온도. 기온보다 이 값을 기준으로 옷차림을 정한다 */
  feelsLikeC: number;
  humidity: number;
  weatherCode: number;
  hourly: HourlyRain;
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
  try {
    // forecast_days=2 — 해가 진 뒤에 내일 값을 안내하려면 이틀치가 필요하다.
    // hourly 도 48시간으로 늘어나므로 rainWindows() 가 날짜까지 보고 걸러야 한다.
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&hourly=precipitation_probability,temperature_2m,apparent_temperature,relative_humidity_2m` +
      `&daily=uv_index_max,wind_gusts_10m_max,sunrise,sunset` +
      `&timezone=Asia%2FTokyo&forecast_days=2`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    return {
      tempC: data.current.temperature_2m,
      feelsLikeC: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      hourly: data.hourly,
      uvIndexMax: data.daily?.uv_index_max?.[0] ?? 0,
      windSpeedKmh: data.current.wind_speed_10m ?? 0,
      windGustsMaxKmh: data.daily?.wind_gusts_10m_max?.[0] ?? 0,
      sunrise: data.daily?.sunrise?.[0] ?? '',
      sunset: data.daily?.sunset?.[0] ?? '',
      // 내일 값이 없으면(응답 형식 변경 등) 오늘 값으로 떨어뜨린다. 밤 화면에서
      // 0으로 두면 "내일은 자외선이 약해요" 같은 틀린 안심을 주게 된다.
      uvIndexMaxTomorrow: data.daily?.uv_index_max?.[1] ?? data.daily?.uv_index_max?.[0] ?? 0,
      windGustsMaxTomorrowKmh:
        data.daily?.wind_gusts_10m_max?.[1] ?? data.daily?.wind_gusts_10m_max?.[0] ?? 0,
    };
  } catch {
    // 오프라인이거나 API 장애 — 날씨 없이도 앱의 나머지는 정상 동작해야 한다
    return null;
  }
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
