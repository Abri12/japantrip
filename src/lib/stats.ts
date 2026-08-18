/**
 * 사용 통계 수집.
 *
 * 목적은 「사람들이 실제로 어디를 뽑고 뭘 먹으려 하는지」를 모아 데이터를 키우는
 * 것이다. 우리가 가진 53곳은 우리가 고른 53곳이지 사람들이 찾는 53곳이 아니다.
 * 사다리 후보칸에 적히는 가게 이름 중 **우리 목록에 없는 것**이 사실상 이 앱의
 * 가장 값진 신호다 — 뭘 추가해야 하는지 알려주기 때문이다.
 *
 * ── 두 갈래로 나눈 이유 ─────────────────────────────
 *
 * 이 기능은 개인정보 문제를 안고 있다. 사다리타기는 음식만 적는 게 아니라 **사람
 * 이름을 적는 데 훨씬 많이 쓰인다.** 「민수·영희·철수」가 그대로 서버에 쌓이면
 * 그건 통계가 아니라 타인의 개인정보 수집이고, 앱 이용자가 아닌 제3자의 이름이라
 * 동의를 받을 수도 없다.
 *
 * 그래서 두 갈래로 나눈다:
 *
 *  ① **익명 카운터** — 우리 데이터의 id 만 센다 (어느 장소가 뽑혔나, 사다리를
 *     몇 번 돌렸나). 사용자가 적은 글자가 한 자도 들어가지 않으므로 항상 켜져
 *     있어도 안전하다.
 *
 *  ② **입력어 수집** — 사용자가 직접 적은 글자. 값지지만 위험하다. **명시적
 *     동의 없이는 한 건도 기록하지 않는다.** 동의해도 사람 이름으로 보이는
 *     짧은 한글은 걸러낸다.
 *
 * ── 지금은 기기 안에만 쌓인다 ───────────────────────
 *
 * 서버가 없으므로 전송하지 않는다. `flush()` 는 보낼 묶음을 만들어 주기만 하고,
 * 실제 업로드는 `STATS_ENDPOINT` 가 설정된 뒤에 붙인다. 서버 없이 수집만 켜 두면
 * 데이터는 기기에 갇힌 채 방침만 위반하게 되므로, 순서를 이렇게 잡았다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** 서버가 준비되면 여기에 주소를 넣는다. null 인 동안에는 전송하지 않는다. */
export const STATS_ENDPOINT: string | null = null;

const COUNTER_KEY = 'stats:counters:v1';
const TERMS_KEY = 'stats:terms:v1';
const CONSENT_KEY = 'stats:consent:v1';
const SNOOZE_KEY = 'stats:snooze:v1';
const INSTALL_KEY = 'stats:install:v1';

/** 한 번에 들고 있을 입력어 상한. 무한정 쌓이면 저장소를 잡아먹는다. */
const MAX_TERMS = 500;

export type CounterEvent =
  /** 여행지 뽑기에서 어느 장소가 나왔나 */
  | { kind: 'pick'; placeId: string }
  /** 사다리를 돌렸다 (참가자 수만) */
  | { kind: 'ladder'; count: number }
  /** 사다리 후보를 맛집 데이터로 자동 채웠다 */
  | { kind: 'ladder_autofill'; cityId: string }
  /** 직접 적은 후보로 가챠를 돌렸다 */
  | { kind: 'custom_pick'; count: number };

/** 익명 카운터. 키는 전부 우리가 만든 문자열이라 사용자 입력이 섞이지 않는다. */
export type Counters = Record<string, number>;

export interface CollectedTerm {
  /** 사용자가 적은 원문 */
  text: string;
  /** 어느 화면에서 나왔나 */
  from: 'ladder' | 'pick';
  cityId: string | null;
  at: string;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ── 동의 ───────────────────────────────────────────

/**
 * 입력어 수집 동의 여부.
 *
 * 기본값은 `false` 다. 통계가 아쉽더라도 기본 켜짐으로 두면 「동의를 받았다」고
 * 말할 수 없다.
 */
export async function hasConsent(): Promise<boolean> {
  return (await AsyncStorage.getItem(CONSENT_KEY)) === 'yes';
}

/**
 * 지금 물어봐야 하는가.
 *
 * ── 거절을 영구 저장하지 않는 이유 ──────────────────
 *
 * 처음에는 「거절함」을 저장해 두고 다시 묻지 않았다. 조르지 않는다는 점에서는
 * 옳지만, 한 번의 무심한 거절이 영원히 굳는다는 문제가 있다. 사람은 상황에 따라
 * 마음이 바뀌고, 특히 이 동의는 **그때그때 적은 내용에 대한 것**이라 한 번의 답을
 * 평생의 답으로 취급하는 게 오히려 부자연스럽다.
 *
 * 그래서 거절은 그 회차에만 적용하고, 대신 **「오늘 하루 안 묻기」**를 준다.
 * 귀찮은 사람은 하루를 통째로 끄면 되고, 그 사이 앱은 한 번도 묻지 않는다.
 * 조르지 않으면서 기회는 남기는 절충이다.
 *
 * 동의(`yes`)는 저장한다. 이미 좋다고 한 사람에게 다시 묻는 건 마찰일 뿐이고,
 * 철회는 「내 사용 기록」에서 언제든 할 수 있다.
 */
export type ConsentGate =
  /** 이미 동의함 — 묻지 않고 모은다 */
  | 'collect'
  /** 오늘은 묻지 않기로 함 — 묻지도, 모으지도 않는다 */
  | 'quiet'
  /** 물어봐야 한다 */
  | 'ask';

/** 오늘 날짜. 기기 시간대 기준이라 자정이 지나면 다시 묻게 된다. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export async function consentGate(): Promise<ConsentGate> {
  if ((await AsyncStorage.getItem(CONSENT_KEY)) === 'yes') return 'collect';
  if ((await AsyncStorage.getItem(SNOOZE_KEY)) === today()) return 'quiet';
  return 'ask';
}

/** 오늘 하루 묻지 않는다. 동의도 거절도 아니고, 그냥 조용히 있는 것이다. */
export async function snoozeToday(): Promise<void> {
  await AsyncStorage.setItem(SNOOZE_KEY, today());
}

export async function setConsent(agreed: boolean): Promise<void> {
  if (agreed) {
    await AsyncStorage.setItem(CONSENT_KEY, 'yes');
    return;
  }
  // 거절은 저장하지 않는다. 다음에 또 물어볼 수 있어야 하기 때문이다.
  await AsyncStorage.removeItem(CONSENT_KEY);
  // 철회하면 이미 모은 것도 지운다. 남겨 두면 철회가 아니다.
  await AsyncStorage.removeItem(TERMS_KEY);
}

/**
 * 설치 단위 식별자.
 *
 * 기기 고유값(광고 ID·IMEI 등)을 쓰지 않는다. 무작위로 만들어 저장할 뿐이라
 * 앱을 지우면 사라지고, 다른 앱이나 서비스의 기록과 이어 붙일 수 없다.
 * 「같은 사람이 여러 번 뽑은 것」과 「여러 사람이 한 번씩 뽑은 것」을 구분하는
 * 용도로만 쓴다.
 */
export async function installId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALL_KEY);
  if (existing) return existing;
  const id = `i_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  await AsyncStorage.setItem(INSTALL_KEY, id);
  return id;
}

// ── ① 익명 카운터 ───────────────────────────────────

function counterKey(e: CounterEvent): string {
  switch (e.kind) {
    case 'pick':
      return `pick:${e.placeId}`;
    case 'ladder':
      return `ladder:${e.count}`;
    case 'ladder_autofill':
      return `autofill:${e.cityId}`;
    case 'custom_pick':
      return `custom:${e.count}`;
  }
}

/**
 * 익명 이벤트를 센다.
 *
 * 실패해도 조용히 넘어간다. 통계 수집이 실패했다고 뽑기가 멈추면 본말이 전도된다.
 */
export async function count(e: CounterEvent): Promise<void> {
  try {
    const c = await readJson<Counters>(COUNTER_KEY, {});
    const k = counterKey(e);
    c[k] = (c[k] ?? 0) + 1;
    await AsyncStorage.setItem(COUNTER_KEY, JSON.stringify(c));
  } catch {
    // 무시
  }
}

export async function loadCounters(): Promise<Counters> {
  return readJson<Counters>(COUNTER_KEY, {});
}

// ── ② 입력어 수집 ───────────────────────────────────

/**
 * 성씨로 시작하지만 사람 이름일 리 없는 낱말.
 *
 * 규칙만으로는 못 거르는 예외를 손으로 적어 둔다. 길게 만들 필요는 없다 —
 * 여기 없어서 한둘 놓치는 건 통계가 조금 줄어드는 일이지만, 규칙을 느슨하게
 * 풀어 이름이 새는 건 되돌릴 수 없다.
 */
const FOOD_WORDS = new Set([
  '우동', '오뎅', '이자카야', '오코노미야키', '장어', '전골', '고기', '문어',
  '오차즈케', '조개', '한잔', '안주', '해장', '백반', '숯불', '고로케', '유부',
  '차슈', '오무라이스', '나베', '노미호다이', '하이볼', '초밥', '주먹밥',
]);

/**
 * 사람 이름으로 보이는 입력을 걸러낸다.
 *
 * 사다리타기에 적히는 건 음식만이 아니다. 한글 2~4자 이름이 압도적으로 많고,
 * 그건 이용자 본인도 아닌 **제3자의 개인정보**라 동의를 받을 방법이 없다.
 *
 * 완벽하지 않다 — 「초밥」은 이름이 아닌데 걸러지고, 「김치찌개」는 통과한다.
 * 하지만 이 방향의 오차가 옳다. 음식 몇 개를 놓치는 것보다 이름 몇 개를 모으는
 * 쪽이 훨씬 비싸다.
 */
export function looksLikePersonName(text: string): boolean {
  const t = text.trim();
  // 한글만으로 된 2~4자. 성씨로 시작하면 이름일 가능성이 높다.
  if (!/^[가-힣]{2,4}$/.test(t)) return false;

  // 음식이 분명하면 성씨로 시작해도 통과시킨다. 「우동·오뎅·이자카야」는
  // 오·장·이로 시작해 이름 규칙에 걸리지만 사람 이름일 리가 없다.
  if (FOOD_WORDS.has(t)) return false;
  if (/(?:덮밥|볶음|구이|튀김|찌개|전골|정식|국수|라멘|우동|소바|초밥|말이)$/.test(t)) return false;

  const SURNAMES =
    '김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구';
  return SURNAMES.includes(t[0]);
}

/**
 * 사용자가 적은 후보를 모은다.
 *
 * 동의가 없으면 아무 일도 하지 않는다. 호출하는 쪽에서 동의 여부를 확인할
 * 필요가 없도록 여기서 막는다 — 확인을 잊는 실수가 곧 방침 위반이 되기 때문이다.
 */
export async function collectTerms(
  texts: string[],
  meta: { from: 'ladder' | 'pick'; cityId: string | null },
): Promise<void> {
  if (!(await hasConsent())) return;

  const clean = texts
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 30)
    // 「1번」처럼 우리가 넣은 기본값은 통계 가치가 없다.
    .filter((t) => !/^\d+번$/.test(t))
    .filter((t) => !looksLikePersonName(t));

  if (clean.length === 0) return;

  try {
    const prev = await readJson<CollectedTerm[]>(TERMS_KEY, []);
    const at = new Date().toISOString();
    const next = [...prev, ...clean.map((text) => ({ text, from: meta.from, cityId: meta.cityId, at }))];
    // 오래된 것부터 버린다.
    await AsyncStorage.setItem(TERMS_KEY, JSON.stringify(next.slice(-MAX_TERMS)));
  } catch {
    // 무시
  }
}

export async function loadTerms(): Promise<CollectedTerm[]> {
  return readJson<CollectedTerm[]>(TERMS_KEY, []);
}

/** 사용자가 직접 지울 수 있어야 한다. 통계보다 이쪽이 우선이다. */
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([COUNTER_KEY, TERMS_KEY]);
}

// ── 전송 ───────────────────────────────────────────

export interface StatsBundle {
  installId: string;
  counters: Counters;
  terms: CollectedTerm[];
  at: string;
}

/**
 * 보낼 묶음을 만든다.
 *
 * 서버가 없는 동안에는 `null` 을 돌려주고 아무것도 지우지 않는다. 전송에
 * 성공했을 때만 비우도록 해야, 실패한 데이터가 사라지지 않는다.
 */
export async function flush(): Promise<StatsBundle | null> {
  if (!STATS_ENDPOINT) return null;

  const bundle: StatsBundle = {
    installId: await installId(),
    counters: await loadCounters(),
    terms: await loadTerms(),
    at: new Date().toISOString(),
  };

  const res = await fetch(STATS_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) throw new Error(`통계 전송 실패: ${res.status}`);

  await clearAll();
  return bundle;
}
