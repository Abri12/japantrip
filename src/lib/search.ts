/**
 * 장소 검색.
 *
 * ## 왜 단순 `includes` 로는 부족한가
 *
 * 여행 중에 검색창을 쓰는 상황은 대개 급하다 — 지하철 안에서 한 손으로,
 * 이름이 정확히 기억나지 않는 채로 친다. 그래서 세 가지를 견뎌야 한다.
 *
 * **① 초성** — 「ㄷㅌㅂㄹ」로 도톤보리를 찾는다. 한국 사용자에게는 검색의
 * 기본 동작이라, 안 되면 「검색이 안 된다」고 느낀다.
 *
 * **② 일본어 원문** — 현지 간판이나 구글맵에서 본 `金閣寺` 를 그대로 붙여넣는
 * 경우가 있다. 데이터에 `nameJa` 가 이미 있으니 안 쓸 이유가 없다.
 *
 * **③ 띄어쓰기** — 「오사카 성」과 「오사카성」이 같아야 한다. 사람마다 다르게
 * 띄우는데 그걸로 결과가 갈리면 안 된다.
 *
 * ## 순위
 *
 * 찾는 것과 정확히 맞을수록 위로 올린다. 「이름이 그 글자로 시작」이 가장 위고,
 * 설명에만 걸린 것은 아래다. 검색 결과가 관련 없는 것부터 나오면 목록을 다시
 * 훑게 되고, 그러면 검색을 안 쓴 것과 같다.
 */

import { Place } from '@/data/places';

/** 초성 19자. 유니코드 한글 음절 블록의 배열 순서 그대로다 */
const CHO = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;

/** 「도톤보리」 → 「ㄷㅌㅂㄹ」. 한글이 아닌 글자는 그대로 둔다 */
function toChoseong(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= HANGUL_BASE && code <= HANGUL_LAST) {
      out += CHO[Math.floor((code - HANGUL_BASE) / 588)];
    } else {
      out += ch;
    }
  }
  return out;
}

/** 비교하기 좋게 다듬는다 — 소문자, 공백·가운뎃점 제거 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s·・]/g, '');
}

/**
 * 검색어가 초성만으로 이루어졌는지.
 *
 * 「ㄷㅌㅂㄹ」처럼 초성만 쳤을 때만 초성 비교를 한다. 섞여 있을 때(「도ㅌ보리」)
 * 까지 다루면 규칙이 복잡해지는데, 실제로 그렇게 치는 사람은 드물다.
 */
function isChoseongQuery(q: string): boolean {
  return /^[ㄱ-ㅎ]+$/.test(q);
}

export interface PlaceMatch {
  place: Place;
  /** 낮을수록 위. 0 = 이름이 그 글자로 시작 */
  rank: number;
}

/**
 * 장소 목록에서 검색어에 맞는 것만 골라 순위대로 돌려준다.
 *
 * 빈 검색어면 원본을 그대로 돌려준다 — 검색창을 비웠을 때 목록이 사라지면
 * 안 되고, 호출부가 빈 문자열을 따로 다루지 않아도 되게 한다.
 */
export function searchPlaces(places: Place[], query: string): Place[] {
  const q = normalize(query);
  if (!q) return places;

  const choseong = isChoseongQuery(q);
  const matches: PlaceMatch[] = [];

  for (const place of places) {
    const name = normalize(place.name);
    const nameJa = normalize(place.nameJa);
    const city = normalize(place.city);
    const summary = normalize(place.summary);

    let rank = -1;

    if (choseong) {
      // 초성 검색은 이름에만 건다. 설명까지 초성으로 훑으면 「ㅅ」 한 글자에
      // 거의 모든 장소가 걸려서 결과가 뜻을 잃는다.
      const nameCho = toChoseong(name);
      if (nameCho.startsWith(q)) rank = 0;
      else if (nameCho.includes(q)) rank = 1;
    } else {
      if (name.startsWith(q)) rank = 0;
      else if (name.includes(q)) rank = 1;
      else if (nameJa.includes(q)) rank = 2;
      else if (city.includes(q)) rank = 3;
      else if (summary.includes(q)) rank = 4;
    }

    if (rank >= 0) matches.push({ place, rank });
  }

  /*
   * 같은 순위 안에서는 **원래 순서를 지킨다.**
   *
   * 넘겨받은 목록은 이미 뜻이 있는 순서다(시내 먼저·근교 뒤, 1단계 도시 먼저).
   * 순위가 같은데 굳이 다시 세우면 그 뜻이 사라진다. `sort` 는 안정 정렬이라
   * 순위만 비교하면 나머지는 그대로 남는다.
   */
  return matches.sort((a, b) => a.rank - b.rank).map((m) => m.place);
}
