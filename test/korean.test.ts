/**
 * 조사 — 화면 전체의 문장이 여기에 기댄다.
 *
 * 도시·장소 이름을 문장에 끼워 넣는 자리가 많아서, 여기가 틀리면
 * 「오사카은 …」 같은 문장이 앱 곳곳에 흩어져 나온다. 한 곳에서 틀리는
 * 게 아니라 **전부 한꺼번에** 틀린다.
 */

import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { euroRo, eulReul, eunNeun, gwaWa, iGa, withEunNeun } from '@/lib/korean';

describe('받침', () => {
  /* 이 앱의 도시 이름은 대부분 받침이 없다 — 일본어 음차라 모음으로 끝난다.
     역 이름에 「역」이 붙는 순간 받침이 생긴다. */
  const open = ['후쿠오카', '오사카', '고베', '삿포로', '도쿄', '교토', '신주쿠', '난바'];

  it('받침 없으면 는/가/를/와', () => {
    for (const w of open) {
      strictEqual(eunNeun(w), '는', w);
      strictEqual(iGa(w), '가', w);
      strictEqual(eulReul(w), '를', w);
      strictEqual(gwaWa(w), '와', w);
    }
  });

  it('받침 있으면 은/이/을/과', () => {
    for (const w of ['다카마쓰역', '도쿄역', '공항', '하카타역', '오사카성']) {
      strictEqual(eunNeun(w), '은', w);
      strictEqual(iGa(w), '이', w);
      strictEqual(eulReul(w), '을', w);
      strictEqual(gwaWa(w), '과', w);
    }
  });
});

describe('(으)로 — 규칙이 다르다', () => {
  it('받침 없으면 로', () => {
    strictEqual(euroRo('오사카'), '로');
    strictEqual(euroRo('교토'), '로');
  });

  it('ㄹ받침도 로 — 은/는과 다른 지점이다', () => {
    /* 「서울으로」가 아니라 「서울로」다. 받침 유무만 보면 여기서 틀린다. */
    strictEqual(euroRo('서울'), '로');
    strictEqual(euroRo('하늘'), '로');
    // 대조 — 같은 단어라도 은/는은 받침 규칙을 그대로 따른다
    strictEqual(eunNeun('서울'), '은');
  });

  it('그 밖의 받침은 으로', () => {
    strictEqual(euroRo('신주쿠역'), '으로');
    strictEqual(euroRo('공항'), '으로');
  });
});

describe('한글이 아닌 것', () => {
  it('영문·숫자는 받침 없음으로 본다', () => {
    /* 완벽하지 않다(「USJ로」는 맞고 「JR은」은 「JR는」이 된다). 다만
       어느 쪽으로 정하든 하나는 어색해지므로, 적어도 앱 전체가 같은
       선택을 하도록 규칙을 하나로 둔다. */
    for (const w of ['USJ', 'N’EX', '2026', 'eSIM']) {
      strictEqual(eunNeun(w), '는', w);
      strictEqual(euroRo(w), '로', w);
    }
  });

  it('빈 문자열에도 던지지 않고, 함수끼리 답이 어긋나지 않는다', () => {
    /*
     * 이름이 비는 일은 없어야 하지만, 여기서 던지면 화면 하나가 통째로
     * 죽는다. 조사 하나 때문에 그럴 수는 없다.
     *
     * euroRo 는 여기서 「으로」를 주고 있었다. charCodeAt(-1) 이 NaN 인데
     * NaN 은 어떤 비교에도 거짓이라 범위 검사를 그냥 통과했다.
     */
    strictEqual(eunNeun(''), '는');
    strictEqual(iGa(''), '가');
    strictEqual(euroRo(''), '로');
    strictEqual(euroRo('   '), '로');
  });

  it('앞뒤 공백을 무시한다', () => {
    strictEqual(eunNeun(' 도쿄역 '), '은');
    strictEqual(eunNeun(' 오사카 '), '는');
  });
});

describe('붙여 주는 형태', () => {
  it('단어와 조사를 한 번에 준다', () => {
    strictEqual(withEunNeun('오사카'), '오사카는');
    strictEqual(withEunNeun('도쿄역'), '도쿄역은');
  });
});
