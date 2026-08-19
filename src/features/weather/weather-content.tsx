import { useEffect, useState } from 'react';

import { Card, Empty, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { WeatherData, fetchWeather } from '@/lib/weather';

import { styles } from './styles';
import { WeatherBody } from './weather-body';

export interface WeatherContentProps {
  city: { name: string; prefecture: string; lat: number; lng: number };
}

/**
 * 날씨를 받아 와서 그린다 — 불러오는 중과 실패까지 여기서 책임진다.
 *
 * 화면에서 떼어낸 이유는 **되돌릴 자리를 만들기 위해서**다. 예전에는 화면이
 * 직접 들고 있으면서 도시가 바뀌면 효과 안에서 `setLoading(true)` 로 되돌렸다.
 * 효과 안의 동기 setState 는 렌더를 한 번 더 돌게 만든다.
 *
 * 조각으로 빼면 라우트가 `key={city.id}` 를 걸 수 있고, 도시가 바뀌면 통째로
 * 새로 만들어져 되돌릴 것이 없어진다. 라우트에서 이 컴포넌트는 **자식이
 * 하나뿐**이라 key 가 형제와 겹칠 일도 없다.
 */
export function WeatherContent({ city }: WeatherContentProps) {
  const theme = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather(city.lat, city.lng)
      .then(setWeather)
      .finally(() => setLoading(false));
  }, [city]);

  if (loading) {
    // 다른 화면의 로딩 문구와 같은 말을 쓴다. 여기만 줄임표까지 붙어 있어서
    // 같은 상태가 화면마다 다르게 보였다.
    return <Empty text="불러오고 있어요" />;
  }

  if (!weather) {
    return (
      <Card accent={theme.warning}>
        <Txt variant="subtitle">날씨를 못 가져왔어요</Txt>
        <Txt variant="body" color="textSecondary" style={styles.gap}>
          인터넷 연결을 확인하고 다시 열어봐 주세요.
        </Txt>
      </Card>
    );
  }

  return <WeatherBody city={city} weather={weather} />;
}
