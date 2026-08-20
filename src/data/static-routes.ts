import { AIRPORTS } from '@/data/airports';
import { COURSES } from '@/data/courses';
import { PLACES } from '@/data/places';

/**
 * 미리 그릴 상세 화면을 여기서 정한다.
 *
 * ## 무엇을 고치는 건가
 *
 * `/place/dotonbori` 같은 주소는 내보내기에 없었다. 정적 호스팅은 모르는
 * 주소에 `404.html` 을 주고, 그 안에는 내용이 없다. 리액트가 붙일 것이 없어
 * **하이드레이션이 어긋나고**(React #418) 첫 화면이 한 번 깜빡인다.
 * 화면은 정상으로 그려지지만, 미리 그리는 이점이 통째로 사라진다.
 *
 * 주소마다 HTML 을 내보내면 그 문제가 없어진다. 첫 화면이 바로 뜨고,
 * 검색엔진도 내용을 읽는다.
 *
 * ## 왜 목록을 한곳에 모으나
 *
 * 라우트 파일 세 개가 각자 「전부 다」를 돌려주게 두면, **정책이 세 곳에
 * 흩어진다.** 나중에 「장소가 1,000개가 되면 어쩌지」를 고민할 때 세 파일을
 * 다 열어 봐야 하고, 한 곳만 고치면 나머지가 남는다. 이 저장소에서 같은
 * 규칙이 여러 벌로 갈라져 사고가 난 적이 이미 여러 번 있었다.
 *
 * ## 늘어날 것을 전제로 둔다
 *
 * 지금은 125개(장소 108 · 공항 9 · 코스 8)라 전부 그려도 빌드가 몇 초 는다.
 * 그런데 이 값은 **콘텐츠가 늘면 같이 는다.** 장소가 1,000개가 되면 HTML
 * 1,000장이 되고, 그것이 배포 브랜치에 쌓인다(gh-pages 는 이력이 지워지지
 * 않는다).
 *
 * 그래서 상한을 둔다. 상한을 넘으면 **넘긴다는 사실을 빌드 로그에 남기고**
 * 그때 정책을 다시 정하게 한다 — 조용히 느려지는 것이 가장 나쁘다.
 *
 * 상한에 걸린 화면은 예전처럼 404 폴백으로 뜬다. 동작은 하고 깜빡일 뿐이라,
 * 안전한 쪽으로 degrade 된다.
 */

/**
 * 미리 그릴 상세 화면의 상한.
 *
 * 125개에서 여유를 두고 잡았다. 이 값에 닿으면 「전부 그리기」를 계속할지,
 * 도시별로 나눌지, 인기 있는 곳만 그릴지를 그때 정한다.
 */
const MAX_PRERENDER = 400;

/** 상한을 넘었을 때 빌드 로그에 한 번만 알린다 */
let warned = false;

function capped(ids: string[], what: string): { id: string }[] {
  if (ids.length > MAX_PRERENDER && !warned) {
    warned = true;
    console.warn(
      `[static-routes] ${what} 가 ${ids.length}개라 상한(${MAX_PRERENDER})을 넘었어요.\n` +
        `  넘은 화면은 미리 그려지지 않고 404 폴백으로 떠요 — 동작은 하지만 첫 화면이 깜빡여요.\n` +
        `  src/data/static-routes.ts 에서 정책을 다시 정할 때가 됐어요.`,
    );
  }
  return ids.slice(0, MAX_PRERENDER).map((id) => ({ id }));
}

/** 장소 상세 — 가장 많고 가장 빨리 는다 */
export function placeParams(): { id: string }[] {
  return capped(
    PLACES.map((p) => p.id),
    '장소',
  );
}

/** 공항 상세 — 아홉 개에서 크게 늘지 않는다 */
export function airportParams(): { id: string }[] {
  return capped(
    AIRPORTS.map((a) => a.id),
    '공항',
  );
}

/** 추천 코스 */
export function courseParams(): { id: string }[] {
  return capped(
    COURSES.map((c) => c.id),
    '코스',
  );
}
