/**
 * 원판에 올릴 후보를 골라낸다.
 *
 * 앱에는 50곳 넘게 있는데 원판 칸이 그만큼 늘면 글자가 겹쳐 아무것도 못 읽는다.
 * 무작위로 몇 곳만 올리고 「다른 후보로」를 주는 편이, 다 올려 두고 못 읽는
 * 것보다 낫다. 어차피 뽑기는 후보를 다 보고 고르는 기능이 아니다.
 */
export function sample<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
