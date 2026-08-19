import { PackingCategory } from '@/data/packing';

/**
 * 화면에 그리는 순서.
 *
 * 데이터(`PACKING_ITEMS`)의 등장 순서에 맡기지 않는다. 항목을 추가하다 보면
 * 순서가 흐트러지는데, 준비물은 **급한 순**으로 읽혀야 한다 — 여권을 빠뜨리면
 * 여행이 시작되지 않고, 보조배터리는 사면 그만이다.
 */
export const CATEGORIES: PackingCategory[] = ['document', 'money', 'app', 'gear'];
