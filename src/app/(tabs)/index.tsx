import { Screen } from '@/components/ui';
import { useSelectedCity } from '@/lib/selected-city';
import { CityHome, CityPicker } from '@/components/home';

export default function HomeScreen() {
  const { city, loading, select, clear } = useSelectedCity();

  // 저장소에서 고른 도시를 읽어오는 동안은 아무것도 그리지 않는다.
  // 여기서 도시 선택 화면을 먼저 보여주면, 이미 도시를 고른 사람은 앱을 열 때마다
  // "어디로 가세요?"가 한 번 번쩍이고 사라지는 걸 보게 된다.
  if (loading) return <Screen />;

  if (!city) return <CityPicker onSelect={select} />;

  return <CityHome city={city} onChangeCity={clear} />;
}

