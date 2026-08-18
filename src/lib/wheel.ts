/**
 * 원판 돌리기의 각도 계산.
 *
 * 그리는 코드에서 떼어 놓은 이유는 사다리에서 겪은 일 때문이다. 판정과 그림이
 * 따로 놀면 **바늘이 가리킨 칸과 결과가 다르게** 나오고, 그건 눈으로 바로
 * 들통나는 종류의 버그다. 각도만 순수 함수로 빼 두면 검증할 수 있다.
 *
 * ── 좌표 약속 ──────────────────────────────────────
 *
 * 각도는 **12시 방향이 0°, 시계 방향으로 증가**한다. 화면 회전(transform rotate)도
 * 시계 방향이 양수라 부호를 뒤집을 일이 없다.
 *
 * 칸 i 는 원판 기준으로 `[i*sweep, (i+1)*sweep)` 를 차지한다. 원판을 `rot` 만큼
 * 시계로 돌리면, 12시에 고정된 바늘 아래에는 원판 기준 `-rot` 위치가 온다.
 */

/** 칸 하나가 차지하는 각도 */
export function sweepOf(count: number): number {
  return 360 / count;
}

/**
 * 지금 각도에서 바늘이 가리키는 칸.
 *
 * 결과를 이걸로 판정하지는 않는다 — 결과는 먼저 정하고 각도를 역산한다. 이 함수는
 * **역산이 맞았는지 확인하는 용도**다.
 */
export function sectorUnderPointer(rotation: number, count: number): number {
  const local = (((-rotation % 360) + 360) % 360) / sweepOf(count);
  return Math.floor(local) % count;
}

/**
 * 원하는 칸에 멈추도록 최종 회전각을 구한다.
 *
 * 당첨을 먼저 뽑고 각도를 맞추는 순서다. 반대로 하면(멈춘 자리를 읽어서 결과로
 * 삼으면) 애니메이션이 중간에 끊기거나 소수점이 어긋날 때 결과가 흔들린다.
 *
 * @param current 지금 각도. 여기서 이어서 돌아야 튀지 않는다
 * @param winner  멈출 칸
 * @param turns   최소 몇 바퀴를 더 돌지
 */
export function targetRotation(
  current: number,
  winner: number,
  count: number,
  turns: number,
): number {
  const sweep = sweepOf(count);

  // 칸의 한가운데에 세운다. 경계에 세우면 소수점 오차로 옆 칸이 될 수 있다.
  const want = (360 - (winner * sweep + sweep / 2)) % 360;

  // 항상 앞으로만 돌린다. 뒤로 감기면 원판이 거꾸로 도는 것처럼 보인다.
  const delta = (((want - current) % 360) + 360) % 360;
  return current + turns * 360 + delta;
}
