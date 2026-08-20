import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * 차단한 작성자 — 「이 사람 글은 안 볼래」.
 *
 * ## 왜 신고와 따로 있나
 *
 * 둘은 다른 말이다.
 *
 *   신고 — 「이 글은 문제가 있으니 **모두에게서** 치워 달라」
 *   차단 — 「문제까지는 아닌데 **나는** 안 보고 싶다」
 *
 * 신고만 있으면, 취향이 안 맞는 글을 치우고 싶은 사람이 신고를 쓰게 된다.
 * 그러면 신고가 「부적절함」이 아니라 「마음에 안 듦」을 뜻하게 되고, 운영자가
 * 검토할 때 아무것도 판단할 수 없다. 차단이 있어야 신고가 신고로 남는다.
 *
 * 애플 심사지침 1.2 도 사용자 콘텐츠가 있는 앱에 신고와 **차단을 둘 다**
 * 요구한다.
 *
 * ## 기기에만 저장한다 — 서버는 모른다
 *
 * 차단 목록을 서버로 보내면 **「누가 누구를 차단했나」라는 관계망**이 서버에
 * 쌓인다. 이 앱이 계정도 사용 기록도 없애 온 이유가 정확히 그런 것을 안 만들기
 * 위해서다. 차단은 순전히 이 기기의 화면 문제이므로 여기서 끝낸다.
 *
 * 대가로 기기를 바꾸면 차단이 따라가지 않는다. 계정이 없는 구조의 대가이고,
 * 저장한 장소·일정과 같은 성질이다.
 *
 * ## 무엇을 저장하나
 *
 * 서버가 준 **작성자 태그**(되돌릴 수 없는 해시)다. 원본 id 는 앱도 모른다.
 */

const KEY = 'blockedAuthors:v1';

interface BlockedAuthorsValue {
  /** 차단한 작성자 태그 */
  blocked: Set<string>;
  /** 저장소에서 읽어오는 중인지 — 깜빡임을 막는 데 쓴다 */
  loading: boolean;
  block: (authorTag: string) => void;
  /** 전부 푼다. 태그에는 이름이 없어서 하나씩 고르게 해도 무엇인지 알 수 없다 */
  unblockAll: () => void;
}

const Ctx = createContext<BlockedAuthorsValue>({
  blocked: new Set(),
  loading: true,
  block: () => {},
  unblockAll: () => {},
});

export function BlockedAuthorsProvider({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setBlocked(new Set(JSON.parse(raw) as string[]));
      })
      .catch(() => {
        // 저장소를 못 읽었다. 차단이 안 걸린 채로 시작할 뿐 앱은 그대로 돈다.
      })
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback((next: Set<string>) => {
    setBlocked(next);
    AsyncStorage.setItem(KEY, JSON.stringify([...next])).catch(() => {});
  }, []);

  const block = useCallback(
    (authorTag: string) => {
      if (!authorTag) return;
      setBlocked((prev) => {
        if (prev.has(authorTag)) return prev;
        const next = new Set(prev).add(authorTag);
        AsyncStorage.setItem(KEY, JSON.stringify([...next])).catch(() => {});
        return next;
      });
    },
    [],
  );

  const unblockAll = useCallback(() => save(new Set()), [save]);

  return (
    <Ctx.Provider value={{ blocked, loading, block, unblockAll }}>{children}</Ctx.Provider>
  );
}

export function useBlockedAuthors(): BlockedAuthorsValue {
  return useContext(Ctx);
}
