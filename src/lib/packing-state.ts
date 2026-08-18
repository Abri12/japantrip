/**
 * 체크리스트 완료 상태 저장.
 *
 * 리뷰·프로필과 달리 서버로 옮길 이유가 없는 데이터다 — 순전히 이 기기,
 * 이 여행 한 번을 위한 상태라 기기 저장소로 충분하다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'packingChecked:v1';

export async function loadChecked(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export async function saveChecked(checked: Set<string>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify([...checked]));
}
