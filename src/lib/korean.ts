/**
 * 한국어 조사 자동 선택.
 *
 * 도시·장소 이름을 문장에 끼워 넣는 곳이 많은데("오사카는", "후쿠오카는"),
 * 조사를 하드코딩해 두면 이름이 바뀌거나 새 도시가 추가될 때마다 문법이 깨진다.
 * 받침 유무로 조사를 정해서, 이름이 무엇이든 항상 맞는 조사가 붙게 한다.
 */

/** 완성형 한글 음절의 마지막 글자에 받침이 있는지. 한글이 아니면 받침 없음으로 본다. */
function hasBatchim(word: string): boolean {
  const trimmed = word.trim();
  if (!trimmed) return false;

  const last = trimmed.charCodeAt(trimmed.length - 1);
  // 완성형 한글 음절 범위: 가(0xAC00) ~ 힣(0xD7A3)
  if (last < 0xac00 || last > 0xd7a3) return false;

  // (코드 - 시작값)을 21(모음 수) x 28(받침 수)로 나눈 나머지가 받침 인덱스.
  // 0이면 받침 없음.
  return (last - 0xac00) % 28 !== 0;
}

/** 은/는 */
export function eunNeun(word: string): string {
  return hasBatchim(word) ? '은' : '는';
}

/** 이/가 */
export function iGa(word: string): string {
  return hasBatchim(word) ? '이' : '가';
}

/** 을/를 */
export function eulReul(word: string): string {
  return hasBatchim(word) ? '을' : '를';
}

/** 과/와 */
export function gwaWa(word: string): string {
  return hasBatchim(word) ? '과' : '와';
}

/** (으)로 — 방향·수단. ㄹ받침은 은/는과 달리 받침 없는 쪽(로) 취급이 원칙이다. */
export function euroRo(word: string): string {
  const trimmed = word.trim();
  const last = trimmed.charCodeAt(trimmed.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return '로';
  const jongseong = (last - 0xac00) % 28;
  if (jongseong === 0 || jongseong === 8) return '로'; // 받침 없음 또는 ㄹ받침
  return '으로';
}

/** "{단어}{은/는}" 처럼 단어와 조사를 한 번에 붙여 반환한다. */
export function withEunNeun(word: string): string {
  return `${word}${eunNeun(word)}`;
}

export function withIGa(word: string): string {
  return `${word}${iGa(word)}`;
}

export function withEulReul(word: string): string {
  return `${word}${eulReul(word)}`;
}
