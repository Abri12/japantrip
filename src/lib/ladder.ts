/**
 * 사다리타기.
 *
 * 결과만 무작위로 뽑고 그림은 흉내만 내는 구현이 흔한데, 그러면 사다리를
 * 눈으로 따라간 사람과 결과가 어긋난다. 여기서는 **가로줄을 먼저 만들고 실제로
 * 따라 내려간다.** 그래야 화면에 그린 선과 결과가 반드시 일치한다.
 *
 * 가로줄은 같은 높이에 이웃하게 놓지 않는다. 그러면 한 지점에서 두 번 이동해
 * 실제로는 제자리로 돌아오고, 사람이 눈으로 따라갈 수도 없다.
 */

export interface LadderRung {
  /** 몇 번째 세로줄과 그 오른쪽 줄을 잇는지 (0부터) */
  left: number;
  /** 위에서 몇 번째 칸인지 (0부터) */
  row: number;
}

export interface LadderResult {
  rungs: LadderRung[];
  rows: number;
  /** 출발 i 번이 도착하는 자리 */
  mapping: number[];
}

/** 균등한 무작위 순열 (피셔–예이츠). `perm[i]` 는 출발 i 가 도착할 자리. */
function shuffle(count: number, random: () => number): number[] {
  const a = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 순열을 인접 교환들로 분해한다.
 *
 * 사다리의 가로줄은 이웃한 두 줄만 바꿀 수 있으므로, 원하는 결과를 「옆자리끼리
 * 맞바꾸기」의 나열로 바꿔야 한다. 거품 정렬과 같은 방식이라 교환 횟수는 뒤집힌
 * 쌍의 수와 같고, 그게 곧 화면에 그릴 가로줄 개수가 된다.
 */
function decompose(perm: number[]): number[] {
  const n = perm.length;

  // want[자리] = 그 자리에 도착해야 하는 출발 번호
  const want: number[] = new Array(n);
  perm.forEach((dest, start) => {
    want[dest] = start;
  });

  const cur = Array.from({ length: n }, (_, i) => i);
  const swaps: number[] = [];

  for (let pos = 0; pos < n; pos++) {
    let j = cur.indexOf(want[pos]);
    // 제자리로 한 칸씩 끌어온다. 각 칸 이동이 가로줄 하나다.
    while (j > pos) {
      [cur[j - 1], cur[j]] = [cur[j], cur[j - 1]];
      swaps.push(j - 1);
      j--;
    }
  }

  return swaps;
}

/**
 * 결과를 바꾸지 않는 가로줄을 섞어 넣는다.
 *
 * 분해만 하면 필요한 최소 개수만 남는다. 2명일 때는 절반이 가로줄 0개라 세로선
 * 두 개만 덩그러니 놓이고, 그건 사다리로 보이지 않아 아무도 믿지 않는다.
 *
 * 같은 자리의 교환을 **두 번 잇달아** 넣으면 갔다가 되돌아오므로 결과가 그대로다.
 * 눈으로 따라가도 앞뒤가 맞고, 실제 사다리에서도 흔한 모양이라 어색하지 않다.
 */
function padWithDecoys(swaps: number[], count: number, random: () => number): number[] {
  const seq = [...swaps];

  /** 같은 자리의 교환을 두 번 붙여 넣는다. 갔다가 되돌아오므로 결과는 그대로다. */
  const insertPair = (left: number) => {
    // 반드시 붙여서 넣는다. 사이에 다른 교환이 끼면 서로 상쇄되지 않는다.
    seq.splice(Math.floor(random() * (seq.length + 1)), 0, left, left);
  };

  const pairs = Math.max(1, Math.ceil((count * 2 - swaps.length) / 2));
  for (let k = 0; k < pairs; k++) insertPair(Math.floor(random() * (count - 1)));

  /*
   * 가로줄이 하나도 안 닿는 세로줄이 없게 한다.
   *
   * 어떤 줄에 가로줄이 하나도 없으면 그 사람은 곧장 아래로 내려가고, 그건
   * **타보지 않아도 결과가 보인다**는 뜻이다. 실제로 4명 중 맨 오른쪽 줄이
   * 그렇게 나온 적이 있는데, 사다리를 타기 전부터 자기가 꽝인 걸 알 수 있으면
   * 게임이 성립하지 않는다.
   *
   * 위에서 쓴 상쇄 쌍으로 채우면 결과를 건드리지 않고 줄만 이어 붙일 수 있다.
   */
  for (let col = 0; col < count; col++) {
    // col 에 닿는 가로줄은 왼쪽(col-1)이나 오른쪽(col)에 걸린 것뿐이다.
    if (seq.some((left) => left === col || left === col - 1)) continue;
    insertPair(col === count - 1 ? col - 1 : col);
  }

  return seq;
}

/**
 * 사다리를 만든다.
 *
 * @param count 참가자 수 (2 이상)
 * @param random 테스트에서 결과를 고정할 수 있게 주입받는다
 */
export function buildLadder(count: number, random: () => number = Math.random): LadderResult {
  if (count < 2) return { rungs: [], rows: 0, mapping: [0] };

  /*
   * 가로줄을 무작위로 뿌리지 않고, **결과를 먼저 정한 뒤 역산한다.**
   *
   * 처음에는 가로줄을 아무 데나 놓고 내려가게 했는데, 4명 기준 1번이 도착하는
   * 자리가 32/29/21/17% 로 치우쳤다. 가로줄이 적으면 출발점에서 멀리 못 가
   * 제자리 근처에 남기 때문이다. 행을 56줄까지 늘리니 편차는 1%p 로 잡혔지만,
   * 이번엔 220px 안에 가로줄 31개가 들어차서 **눈으로 따라갈 수가 없었다.**
   *
   * 둘은 맞바꿀 필요가 없다. 균등한 순열을 먼저 뽑고 그 순열이 나오도록 인접
   * 교환으로 분해하면, 결과는 정확히 균등하면서 가로줄은 뒤집힌 쌍의 수(4명이면
   * 평균 3개)만 남는다. 공정성과 가독성을 동시에 얻는다.
   */
  const perm = shuffle(count, random);
  const seq = padWithDecoys(decompose(perm), count, random);

  // 교환을 행에 흩어 놓는다. 순서를 지켜야 하므로 행 번호는 계속 커진다.
  // 사이를 무작위로 띄워야 기계로 찍은 듯한 계단 모양이 되지 않는다.
  const rungs: LadderRung[] = [];
  let row = 1;
  for (const left of seq) {
    rungs.push({ left, row });
    row += 1 + Math.floor(random() * 3);
  }
  const rows = Math.max(row, 8);

  // 실제로 따라 내려간다. 그림과 결과가 어긋날 수 없는 유일한 방법이다.
  const mapping: number[] = [];
  for (let start = 0; start < count; start++) {
    let pos = start;
    for (let row = 0; row < rows; row++) {
      const rung = rungs.find((r) => r.row === row);
      if (!rung) continue;
      if (rung.left === pos) pos += 1;
      else if (rung.left === pos - 1) pos -= 1;
    }
    mapping.push(pos);
  }

  return { rungs, rows, mapping };
}

/** 한 사람이 지나간 세로 구간 */
export interface PathDown {
  col: number;
  /** 행 단위. 그리는 쪽에서 픽셀로 환산한다 */
  fromRow: number;
  toRow: number;
}

/** 한 사람이 건너간 가로 구간 */
export interface PathAcross {
  row: number;
  fromCol: number;
  toCol: number;
}

export interface LadderPath {
  downs: PathDown[];
  acrosses: PathAcross[];
  end: number;
}

/**
 * 한 사람이 실제로 지나간 길을 뽑아낸다.
 *
 * 처음에는 출발 열의 세로선 전체에 색을 칠했는데, 그건 경로가 아니라 그냥 그
 * 열이다. 「3번 → 1번 자리」라는 결과가 나와도 선은 3번 자리에서 곧게 내려가
 * 있어서, 화면이 결과와 다른 말을 하고 있었다.
 *
 * `buildLadder` 와 **똑같은 규칙으로** 내려가며 지나온 구간을 기록한다. 판정과
 * 그림이 같은 코드를 쓰지 않으면 언제든 다시 어긋난다.
 */
export function tracePath(result: LadderResult, start: number): LadderPath {
  const downs: PathDown[] = [];
  const acrosses: PathAcross[] = [];

  let pos = start;
  let lastRow = 0;

  for (let row = 0; row < result.rows; row++) {
    const rung = result.rungs.find((r) => r.row === row);
    if (!rung) continue;

    const next = rung.left === pos ? pos + 1 : rung.left === pos - 1 ? pos - 1 : pos;
    if (next === pos) continue;

    downs.push({ col: pos, fromRow: lastRow, toRow: row });
    acrosses.push({ row, fromCol: pos, toCol: next });
    pos = next;
    lastRow = row;
  }

  // 마지막 가로줄에서 바닥까지 내려오는 구간.
  downs.push({ col: pos, fromRow: lastRow, toRow: result.rows });

  return { downs, acrosses, end: pos };
}
