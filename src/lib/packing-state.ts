/**
 * 체크리스트 완료 상태 저장.
 *
 * 리뷰·프로필과 달리 서버로 옮길 이유가 없는 데이터다 — 순전히 이 기기,
 * 이 여행 한 번을 위한 상태라 기기 저장소로 충분하다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PACKING_ITEMS } from '@/data/packing';

const KEY = 'packingChecked:v1';

export async function loadChecked(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const saved: string[] = raw ? (JSON.parse(raw) as string[]) : [];

    /*
     * 지금 목록에 없는 id 는 버린다.
     *
     * 항목을 합치거나 지우면 예전 id 가 저장소에 남는다. 화면은 체크 **개수**로
     * 진행률을 내는데(`checked.size / PACKING_ITEMS.length`), 유령 id 가 섞이면
     * 「14 / 13」처럼 말이 안 되는 값이 나오고 진행 막대가 넘친다.
     *
     * 실제로 eSIM 두 항목과 모바일 교통카드 두 항목을 각각 하나로 합쳤을 때
     * 이 문제가 생겼다. 그때 이미 체크해 둔 사람의 화면이 깨진다.
     */
    const known = new Set(PACKING_ITEMS.map((i) => i.id));
    return new Set(saved.filter((id) => known.has(id)));
  } catch {
    return new Set();
  }
}

export async function saveChecked(checked: Set<string>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify([...checked]));
}
