import { CITIES, City } from '@/data/cities';
import { PASSES } from '@/data/transit';

/** 패스 정보가 실제로 있는 도시만 고른다. */
export const PASS_CITIES: City[] = CITIES.filter((c) => PASSES.some((p) => p.cityIds.includes(c.id)));
