import { buildLadder } from '@/lib/ladder';



export type WithConsent = (run: () => void) => void;

// ── 뽑기 ───────────────────────────────────────────

export interface LadderGame {
  ladder: ReturnType<typeof buildLadder>;
  /** 당첨 자리 (도착 지점 기준) */
  winner: number;
}
