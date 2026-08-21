/**
 * 도시 카드가 **한눈에 구분되는가.**
 *
 * 도시 선택 화면은 열 장을 한 번에 늘어놓는 자리다. 카드에서 눈이 먼저 닿는
 * 것은 글자가 아니라 그림이라, 같은 그림이 둘이면 훑을 때 구분이 안 된다.
 *
 * 실제로 그럴 뻔했다 — 다카마쓰를 「우동의 성지」에 맞춰 🍜 로 바꾸는 순간
 * 후쿠오카와 겹쳤다. 눈으로는 두 카드가 멀리 떨어져 있어 알아채기 어렵다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CITIES } from '@/data/cities';

describe('도시 카드', () => {
  it('랜드마크 이모지가 겹치지 않는다', () => {
    const seen = new Map<string, string>();
    for (const c of CITIES) {
      const owner = seen.get(c.landmark.emoji);
      ok(!owner, `${c.name}과 ${owner}가 같은 이모지(${c.landmark.emoji})를 써요`);
      seen.set(c.landmark.emoji, c.name);
    }
  });

  it('이모지가 컬러로 그려진다', () => {
    /*
     * `⛩` 와 `⛩️` 는 눈으로 거의 같아 보이는데 뒤에 U+FE0F 가 붙어야 컬러가
     * 된다. 빠지면 흑백 글리프로 떨어지고, 코드를 봐야만 안다 — 장소 화면의
     * 지도 아이콘에서 실제로 겪었다.
     *
     * ## 왜 목록인가 — 범위로는 안 갈린다
     *
     * 처음엔 `[☀-➿]` 같은 범위로 「이 블록이면 선택자가 필요하다」고 봤다가
     * **시험 쪽이 틀렸다.** 같은 블록 안에서도 문자마다 다르다 —
     * `⛄`(U+26C4)는 기본이 컬러라 선택자가 필요 없고, 바로 옆의
     * `⛩`(U+26E9)는 기본이 흑백이라 필요하다. 유니코드의
     * `Emoji_Presentation` 속성이 문자 단위로 정해져 있어서, 표를 들고
     * 있지 않으면 계산할 수 없다.
     *
     * 그래서 **기본이 흑백인 문자만** 적어 둔다. 도시 랜드마크로 쓸 만한
     * 것 위주라 전부는 아니다 — 목록에 없는 문자를 새로 쓰면 이 시험은
     * 잡지 못한다. 그때는 화면에서 흑백으로 보이는 걸로 알아채야 한다.
     */
    const TEXT_BY_DEFAULT = new Set([
      '☀', '☁', '☂', '☃', '☘', '★', '♨', '⚓', '⚡', '⚠', '⛰', '⛱', '⛴', '⛩',
      '✈', '✉', '❄', '⛏', '⛲', '⛺', '🌡', '🌤', '🌦', '🌧', '🌨', '🌪', '🌫',
      '🌶', '🍽', '🎖', '🎗', '🎞', '🎟', '🏔', '🏕', '🏖', '🏗', '🏘', '🏙',
      '🏚', '🏛', '🏜', '🏝', '🏞', '🏟', '🏵', '🏷', '🕉', '🕌', '🕍', '🕰',
      '🕳', '🖼', '🗺', '🛖', '🛣', '🛤', '🛩', '🛳',
    ]);

    for (const c of CITIES) {
      const e = c.landmark.emoji;
      const base = [...e][0];
      if (!TEXT_BY_DEFAULT.has(base)) continue;
      ok(
        e.includes('️'),
        `${c.name}의 ${e} 에 변이 선택자가 없어요 — 흑백으로 그려져요`,
      );
    }
  });

  it('배경 색이 여섯 자리 hex 다', () => {
    /* 세 자리 표기나 오타가 섞이면 카드 하나만 배경이 사라지는데,
       그 도시를 열어 보기 전까지 모른다. */
    for (const c of CITIES) {
      ok(
        /^#[0-9A-Fa-f]{6}$/.test(c.landmark.tint),
        `${c.name}의 tint ${c.landmark.tint} 가 형식에 안 맞아요`,
      );
    }
  });

  it('도시 id 가 겹치지 않는다', () => {
    const seen = new Set<string>();
    for (const c of CITIES) {
      ok(!seen.has(c.id), `${c.id} 가 두 번 쓰였어요`);
      seen.add(c.id);
    }
  });

  it('소개문이 있고 너무 길지 않다', () => {
    /* 카드 안에서 두 줄을 넘기면 카드 높이가 들쭉날쭉해진다. */
    for (const c of CITIES) {
      ok(c.blurb.length > 0, `${c.name}에 소개문이 없어요`);
      ok(c.blurb.length <= 45, `${c.name}의 소개문이 ${c.blurb.length}자예요 (45자 이하)`);
    }
  });

  it('열 도시가 전부 있다', () => {
    strictEqual(CITIES.length, 10);
  });
});
