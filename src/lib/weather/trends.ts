import { HourlyRain, WeatherData } from './fetch';
import { TempHazardInfo, tempHazard } from './hazard';

/** 시간별 추이의 한 칸 */
export interface HourPoint {
  /** 0~23 (JST) */
  hour: number;
  tempC: number;
  feelsLikeC: number;
  rainProbability: number;
  /** 이 시각의 더위·추위 등급 — 색을 여기서 가져온다 */
  hazard: TempHazardInfo;
  /** 지금 시각인지 (오늘 그래프에서만 true 가 될 수 있다) */
  now: boolean;
}

export interface DayTrend {
  /** 'YYYY-MM-DD' (JST) */
  date: string;
  hours: HourPoint[];
  /** 체감온도 최저·최고와 그 시각 */
  minFeels: HourPoint;
  maxFeels: HourPoint;
}

/**
 * 오늘·내일의 시간별 추이.
 *
 * 「지금 31도」만으로는 하루를 못 짠다. 몇 시부터 더워지고 몇 시에 꺾이는지,
 * 내일이 오늘보다 나은지를 봐야 일정을 옮길 수 있다.
 *
 * 각 시각의 등급은 `tempHazard()` 를 그대로 쓴다 — 큰 숫자에 칠한 색과 같은
 * 기준이어야 「지금은 빨강, 18시부터 주황」이 한 화면에서 말이 된다.
 *
 * 밤 시간대는 `dayPhase` 를 시각별로 다시 판단하지 않는다. 등급 자체는 기온·습도로
 * 정해지고 phase 는 문구만 바꾸는데, 추이 그래프는 문구를 쓰지 않기 때문이다.
 */
export function dayTrends(weather: WeatherData, now: Date = new Date()): DayTrend[] {
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', ...opts }).format(now);
  const today = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });
  const nowHour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(now),
  );

  const h = weather.hourly;
  const byDate = new Map<string, HourPoint[]>();

  h.time.forEach((t, i) => {
    const date = t.slice(0, 10);
    const hour = Number(t.slice(11, 13));
    const tempC = h.temperature_2m[i];
    const feelsLikeC = h.apparent_temperature?.[i] ?? tempC;
    const humidity = h.relative_humidity_2m?.[i] ?? 60;

    const point: HourPoint = {
      hour,
      tempC,
      feelsLikeC,
      rainProbability: h.precipitation_probability[i] ?? 0,
      hazard: tempHazard(tempC, humidity, feelsLikeC, 'day'),
      now: date === today && hour === nowHour,
    };

    const list = byDate.get(date);
    if (list) list.push(point);
    else byDate.set(date, [point]);
  });

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 2)
    .map(([date, hours]) => {
      let minFeels = hours[0];
      let maxFeels = hours[0];
      for (const p of hours) {
        if (p.feelsLikeC < minFeels.feelsLikeC) minFeels = p;
        if (p.feelsLikeC > maxFeels.feelsLikeC) maxFeels = p;
      }
      return { date, hours, minFeels, maxFeels };
    });
}

export interface RainWindow {
  /** 24시간제 */
  startHour: number;
  endHour: number;
  maxProbability: number;
}

/**
 * 오늘 남은 시간 중 우산이 필요한 구간만 뽑는다.
 *
 * 확률을 시간별로 죽 나열하면 여행자가 직접 훑어야 한다. 50% 이상인 시간을
 * 이어 붙여 "14~17시"처럼 구간으로 묶어야 일정 짤 때 바로 쓸 수 있다.
 */
export function rainWindows(hourly: HourlyRain, now: Date = new Date()): RainWindow[] {
  const nowHour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(now),
  );

  // hourly 는 이틀치(48시간)로 온다. 시(時)만 보고 걸러내면 내일 22시가
  // 오늘 22시로 섞여 들어가서, 오늘 비가 안 오는데도 우산 시간이 잡힌다.
  // 그래서 날짜가 오늘인 항목만 본다.
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const THRESHOLD = 50;
  const windows: RainWindow[] = [];
  let current: RainWindow | null = null;

  hourly.time.forEach((t, i) => {
    // API가 이미 timezone=Asia/Tokyo 로 준 "YYYY-MM-DDTHH:mm" 문자열이다.
    // new Date(t).getHours() 를 쓰면 이 코드가 실행되는 기기의 로컬 시간대로
    // 해석되어, JST가 아닌 환경(서버 빌드 등)에서는 엉뚱한 시간이 나온다.
    // 문자열에서 시(時)만 직접 잘라내면 시간대 문제 자체가 없어진다.
    if (t.slice(0, 10) !== today) return; // 오늘이 아닌 날은 제외
    const hour = Number(t.slice(11, 13));
    if (hour < nowHour) return; // 지난 시간은 건너뛴다

    const prob = hourly.precipitation_probability[i];
    if (prob >= THRESHOLD) {
      if (current && hour === current.endHour + 1) {
        current.endHour = hour;
        current.maxProbability = Math.max(current.maxProbability, prob);
      } else {
        current = { startHour: hour, endHour: hour, maxProbability: prob };
        windows.push(current);
      }
    } else {
      current = null;
    }
  });

  return windows;
}
