import { Empty, Screen } from '@/components/ui';
import { WeatherContent } from '@/features/weather';
import { useSelectedCity } from '@/lib/selected-city';

/**
 * 오늘 날씨 — 조립만 한다.
 *
 * `key={city.id}` 로 도시를 묶는다. 도시가 바뀌면 같은 인스턴스를 재사용하지
 * 않고 새로 만들어서, 이전 도시의 기온이 새 도시 제목 아래 잠깐 남는 일이
 * 없다. 자식이 효과 안에서 상태를 되돌리는 것보다 확실하다.
 *
 * 여기서는 key 를 단 자식이 **하나뿐**이라 형제와 겹칠 일이 없다. 안전 탭에서
 * 형제 둘에게 같은 key 를 줬다가 같은 구역이 두 번 그려진 적이 있는데, 그때
 * 배운 것을 여기 미리 적용했다.
 */
export default function WeatherScreen() {
  const { city } = useSelectedCity();

  if (!city) {
    return (
      <Screen back title="오늘 날씨">
        <Empty text="먼저 홈에서 도시를 골라 주세요." />
      </Screen>
    );
  }

  return (
    <Screen back title={`${city.name} 오늘 날씨`} subtitle="체감온도와 습도로 옷차림을 알려드려요">
      <WeatherContent key={city.id} city={city} />
    </Screen>
  );
}
