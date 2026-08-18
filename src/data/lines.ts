/**
 * 노선 색과 교통수단.
 *
 * 일본 지하철은 노선마다 색이 정해져 있고, 역 안내판·바닥 화살표·차량·표지가
 * 전부 그 색을 쓴다. 일본어를 못 읽는 여행자가 환승할 때 실제로 따라가는 단서는
 * 노선 이름이 아니라 색이다. 그래서 색을 두 가지 방식으로 같이 준다:
 *
 * 1. `color` — 목록에 찍는 점. 훑을 때 눈에 먼저 들어온다.
 * 2. `colorLabel` — 「빨간 미도스지선」처럼 글로 읽히는 색 이름.
 *
 * 2번이 없으면 안 된다. 점은 색약이면 구분이 안 되고, 작은 화면에서는 갈색과
 * 빨강이 비슷하게 보인다. 글로 적어두면 어느 쪽이든 통한다.
 *
 * `color` 는 공식 브랜드 hex 를 그대로 옮긴 값이 아니다. 공개된 hex 가 없는
 * 노선도 있고, 원래 색 그대로는 다크 테마에서 안 보이는 경우가 있어서
 * **공식 색 계열을 유지하면서 두 테마에서 다 읽히는 값**으로 골랐다.
 * 여행자에게 중요한 건 정확한 색상값이 아니라 「빨간 노선」이 맞는다는 사실이다.
 *
 * 색 이름 출처는 각 운영사·위키백과의 공식 라인컬러 표기다.
 * (오사카 메트로 = 臙脂/京紫/緑/紅梅色/ビビッドブラウン 등)
 *
 * JR 과 사철은 여기 넣지 않는다. JR 은 한 회사가 색이 다른 노선을 여러 개
 * 운영하고, 사철은 노선색 체계가 지하철만큼 일관되지 않다. 확실하지 않은 색을
 * 찍으면 「그 색 따라가세요」가 틀린 안내가 되므로, 그런 경우는 색 없이
 * 회사 이름만 보여준다.
 */

/** 그 장소까지 실제로 타는 것 */
export type TransitMode =
  | 'subway'
  | 'jr'
  | 'private'
  | 'monorail'
  | 'bus'
  | 'ferry'
  | 'walk'
  | 'car';

export interface ModeStyle {
  emoji: string;
  /** 그 수단으로 갈 때 상세 화면 항목에 붙는 제목 */
  rowTitle: string;
}

export const MODE: Record<TransitMode, ModeStyle> = {
  subway: { emoji: '🚇', rowTitle: '가장 가까운 역' },
  jr: { emoji: '🚄', rowTitle: '가장 가까운 역' },
  private: { emoji: '🚃', rowTitle: '가장 가까운 역' },
  monorail: { emoji: '🚝', rowTitle: '가장 가까운 역' },
  bus: { emoji: '🚌', rowTitle: '가는 방법' },
  ferry: { emoji: '⛴️', rowTitle: '가는 방법' },
  walk: { emoji: '🚶', rowTitle: '가는 방법' },
  car: { emoji: '🚗', rowTitle: '가는 방법' },
};

export interface RailLine {
  /** 한국어 노선명 */
  name: string;
  /** 「빨간」처럼 문장에 그대로 끼워 쓸 수 있는 색 이름 */
  colorLabel: string;
  /** 목록에 찍는 점 색 */
  color: string;
}

export const LINES: Record<string, RailLine> = {
  // ── 오사카 메트로 ────────────────────────────────────
  'osaka-midosuji': { name: '미도스지선', colorLabel: '빨간', color: '#C81E3C' },
  'osaka-tanimachi': { name: '다니마치선', colorLabel: '보라', color: '#7C3AED' },
  'osaka-yotsubashi': { name: '요츠바시선', colorLabel: '파란', color: '#2563EB' },
  'osaka-chuo': { name: '주오선', colorLabel: '초록', color: '#16A34A' },
  'osaka-sennichimae': { name: '센니치마에선', colorLabel: '분홍', color: '#EC4899' },
  'osaka-sakaisuji': { name: '사카이스지선', colorLabel: '갈색', color: '#A0522D' },
  'osaka-nagahori': { name: '나가호리츠루미료쿠치선', colorLabel: '연두', color: '#84CC16' },
  'osaka-imazatosuji': { name: '이마자토스지선', colorLabel: '귤색', color: '#F59E0B' },

  // ── 교토 시영 지하철 ─────────────────────────────────
  'kyoto-karasuma': { name: '가라스마선', colorLabel: '초록', color: '#16A34A' },
  // 朱色(주홍) — 주황보다 붉은 쪽이다. 교토는 노선이 둘뿐이라 초록과만
  // 구분되면 되므로 색 이름을 굳이 「주황」으로 뭉개지 않는다.
  'kyoto-tozai': { name: '도자이선', colorLabel: '주홍', color: '#E04E2A' },

  // ── 후쿠오카 시영 지하철 ─────────────────────────────
  'fukuoka-kuko': { name: '공항선', colorLabel: '주황', color: '#EA580C' },
  'fukuoka-hakozaki': { name: '하코자키선', colorLabel: '파란', color: '#2563EB' },
  'fukuoka-nanakuma': { name: '나나쿠마선', colorLabel: '초록', color: '#16A34A' },

  // ── 삿포로 시영 지하철 ───────────────────────────────
  'sapporo-namboku': { name: '난보쿠선', colorLabel: '초록', color: '#16A34A' },
  'sapporo-tozai': { name: '도자이선', colorLabel: '주황', color: '#EA580C' },
  'sapporo-toho': { name: '도호선', colorLabel: '파란', color: '#2563EB' },

  // ── 도쿄메트로 ───────────────────────────────────────
  // 도쿄는 지하철 회사가 둘이다(도쿄메트로 9개 · 도에이 4개). 갈아탈 때
  // 회사가 바뀌면 요금이 새로 붙는데, 승객이 그 경계를 알아채는 단서도 색이다.
  'tokyo-ginza': { name: '긴자선', colorLabel: '주황', color: '#EA580C' },
  'tokyo-marunouchi': { name: '마루노우치선', colorLabel: '빨간', color: '#DC2626' },
  // 日比谷線의 공식 색은 シルバー다. 「은색 히비야선」이라 적어야 안내판과 맞는다 —
  // 회색이라고 바꿔 부르면 역에서 찾는 색과 글이 어긋난다.
  'tokyo-hibiya': { name: '히비야선', colorLabel: '은색', color: '#94A3B8' },
  'tokyo-tozai': { name: '도자이선', colorLabel: '하늘색', color: '#0891B2' },
  'tokyo-chiyoda': { name: '지요다선', colorLabel: '초록', color: '#16A34A' },
  'tokyo-yurakucho': { name: '유라쿠초선', colorLabel: '금색', color: '#CA8A04' },
  'tokyo-hanzomon': { name: '한조몬선', colorLabel: '보라', color: '#7C3AED' },
  'tokyo-namboku': { name: '난보쿠선', colorLabel: '청록', color: '#0D9488' },
  'tokyo-fukutoshin': { name: '후쿠토신선', colorLabel: '갈색', color: '#92400E' },

  // ── 도쿄 도에이 지하철 ───────────────────────────────
  'toei-asakusa': { name: '아사쿠사선', colorLabel: '분홍', color: '#EC4899' },
  'toei-mita': { name: '미타선', colorLabel: '파란', color: '#2563EB' },
  'toei-shinjuku': { name: '신주쿠선', colorLabel: '연두', color: '#65A30D' },
  'toei-oedo': { name: '오에도선', colorLabel: '자홍', color: '#BE185D' },
};

export function findLine(id: string): RailLine | undefined {
  return LINES[id];
}

/**
 * 노선 여러 개를 「빨간 미도스지선」·「분홍 센니치마에선」처럼 읽히는 문구로.
 *
 * 환승역은 노선이 둘 이상인데, 색 이름을 노선마다 붙여야 뜻이 산다.
 * 「빨간 미도스지선·센니치마에선」이면 센니치마에선도 빨간 줄 알게 된다.
 */
export function lineLabels(lineIds: string[]): string {
  return lineIds
    .map((id) => {
      const line = LINES[id];
      if (!line) return null;
      return `${line.colorLabel} ${line.name}`;
    })
    .filter((s): s is string => s !== null)
    .join(' · ');
}
