# features — 화면 하나를 이루는 것들

`src/app` 아래 라우트 파일은 **껍데기**다. 무엇을 어떤 순서로 보여줄지만 고르고,
그 조각들은 여기 있다.

라우트 파일에 다 넣으면 처음엔 빠르지만, 공항 화면이 1,152줄이 되고 나서는
「타는 순서를 고치려면 어디를 봐야 하나」에 답하는 데만 스크롤을 한참 한다.
한 파일 안에서 컴포넌트 여덟 개가 하나의 거대한 `styles` 객체를 나눠 쓰면
어느 스타일이 어디 걸린 건지도 추적이 안 된다.

## 세 계층

무엇을 **아는가**로 가른다.

| 계층 | 위치 | 아는 것 | 모르는 것 |
| --- | --- | --- | --- |
| 디자인 시스템 | `src/components/ui/` | 색·간격·폰트 | 여행, 일본, 화면 |
| 앱 공용 | `src/components/` | 이 앱의 도메인 | 특정 화면 |
| 화면 전용 | `src/features/<name>/` | 그 화면의 전부 | — |

**`features/<a>` 가 `features/<b>` 를 import하면 그건 둘 중 하나다** — 그 조각이
실은 앱 공용이라 `src/components/` 로 올라가야 하거나, 두 화면이 사실 한 화면이거나.
그대로 두면 안 된다.

## 폴더 안에 무엇을 두나

```
features/airport/
  index.ts            배럴. 라우트는 여기서만 가져간다
  constants.ts        이 화면에서만 쓰는 상수 (ROUTE_EMOJI 등)
  styles.ts           이 화면 전용 StyleSheet
  use-*.ts            이 화면에서만 쓰는 훅
  *.tsx               UI 조각 하나당 파일 하나
```

두 화면이 같은 것을 쓰기 시작하면 위로 올린다 — 상수·타입은 `src/data`,
훅은 `src/hooks`, 컴포넌트는 `src/components`, 순수 함수는 `src/lib/util`.

## 하다가 데인 것 — key 는 형제 사이에서 유일해야 한다

도시가 바뀔 때 자식을 새로 만들려고 `key` 를 걸다가 두 번 데였다.

```tsx
{city ? <WarningSection key={city.id} city={city} /> : null}
{city ? <HeatSection    key={city.id} city={city} /> : null}
```

둘 다 `"tokyo"` 라 형제끼리 key 가 겹친다. React 는 둘을 한 자리로 보고
**같은 구역을 화면에 두 번 그린다.** 개발 중에는 코드를 고칠 때마다 한 벌씩
쌓여서, 나중엔 다섯 번까지 늘어 있었다.

접두사(`warning-` / `heat-`)를 붙이면 당장은 낫지만, 여기에 구역을 하나 더
넣는 사람이 같은 실수를 한다. **묶는 자리를 하나로 두는 편이 낫다.**

```tsx
{city ? (
  <Fragment key={city.id}>
    <WarningSection city={city} />
    <HeatSection city={city} />
  </Fragment>
) : null}
```

이러면 key 가 하나뿐이라 겹칠 상대가 없다. 자식이 원래 하나인 화면
(`weather.tsx`)은 그냥 그 자식에 key 를 걸면 된다.

**그리고 브라우저가 이상하면 콘솔부터 본다.** 위 문제를 화면만 보고
「HMR 잔상이겠지」라고 짐작해서 개발 서버를 다시 띄우고 탭을 새로 만들고
`git stash` 로 이등분까지 했는데, 콘솔에 답이 처음부터 있었다 —
`Encountered two children with the same key, tokyo`.

## 순수 함수를 어디 둘지

`src/lib/util/` 은 **도메인을 모르는** 함수의 자리다 — `sample<T>` 처럼
여행도 일본도 모르는 것.

도메인을 아는 순수 함수(`dayCostYen` 은 코스와 장소를 둘 다 안다,
`durationLabel` 은 이 화면의 표기 규칙이다)는 소비자가 하나뿐인 동안
그 화면 옆에 둔다. 두 번째 소비자가 생기면 그때 올린다. 먼저 올려 두면
`util/` 이 도메인 로직 서랍이 된다.
