import { useEffect, useState } from 'react';
import { Platform, Switch, View } from 'react-native';

import { Card, Section, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { isQuakePushOn, turnOffQuakePush, turnOnQuakePush } from '@/lib/push';

import { styles } from './styles';

/**
 * 지진 알림 스위치.
 *
 * ## 왜 이 화면인가
 *
 * 설정 화면이 없다. 만들 수도 있었지만, 켜고 끌 것이 이것 하나뿐인데 화면을
 * 하나 여는 건 **찾아 들어가야 하는 자리**를 만드는 일이다. 지진 알림을
 * 생각하는 사람이 있는 곳은 안전 탭이고, 그 사람이 여기서 지진 목록을 보다가
 * 「알림으로 받고 싶다」고 생각한다.
 *
 * ## 권한은 여기서만 묻는다
 *
 * 예전에는 **도시를 고르는 것만으로** 알림 권한 창이 떴다. 사용자는 도시를
 * 골랐을 뿐인데 창을 만나고, 왜 뜨는지 모른 채 「허용 안 함」을 누른다.
 * 한 번 거절하면 시스템이 다시 묻지 않으므로, 그 뒤에는 켜고 싶어져도 설정
 * 앱까지 들어가야 한다 — 그 순간에 사용자를 잃는다.
 *
 * 그래서 묻는 자리를 **스위치 하나**로 모았다. 켜겠다고 누른 사람에게 묻는다.
 *
 * ## 끄기가 왜 중요한가
 *
 * 시스템 설정에서 알림을 꺼도 서버 명부에서는 토큰이 안 빠진다. 계속 보내고
 * 기기가 버릴 뿐이다. 여기서 꺼야 명부에서 지워진다 — 개인정보처리방침이
 * 「끄면 지워진다」고 적고 있으므로, 스위치가 없으면 그 문장이 거짓이 된다.
 */
export function PushSection({ prefecture, cityName }: { prefecture: string; cityName: string }) {
  const theme = useTheme();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    isQuakePushOn().then(setOn);
  }, []);

  /*
   * 웹에서는 그리지 않는다.
   *
   * Expo 푸시는 네이티브 빌드에서만 동작한다. 웹에 스위치를 두면 켜도 아무
   * 일이 안 일어나는데, 그건 「안 되는 기능」이 아니라 **고장난 기능**으로
   * 보인다.
   */
  if (Platform.OS === 'web') return null;

  const toggle = async (next: boolean) => {
    setBusy(true);
    setFailed(false);
    try {
      if (next) {
        const ok = await turnOnQuakePush(prefecture);
        setOn(ok);
        setFailed(!ok);
      } else {
        await turnOffQuakePush();
        setOn(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="지진 알림">
      <Card>
        <View style={styles.pushHead}>
          <View style={styles.pushText}>
            <Txt variant="subtitle">진도 4 이상이면 알려드려요</Txt>
            <Txt variant="caption" color="textSecondary" style={styles.tiny}>
              {cityName}에 흔들림이 오면 잠금화면에도 떠요. 앱이 꺼져 있어도 와요.
            </Txt>
          </View>
          <Switch
            value={on}
            onValueChange={toggle}
            disabled={busy}
            trackColor={{ true: theme.primary, false: theme.border }}
          />
        </View>

        {/*
          켜기 **전에** 무엇이 서버로 가는지 밝힌다. 위치 인증과 같은 규칙이다
          (`features/place/review-form-section.tsx`) — 민감 권한을 묻기 전에
          어디로 가는지까지 말한다.
        */}
        <Txt variant="caption" color="textTertiary" style={styles.pushNotice}>
          켜면 알림 토큰과 머무는 도도부현({prefecture})을 서버에 보내요. 계정도 좌표도
          보내지 않고, 누가 켰는지는 서버가 몰라요. 끄면 명부에서 지워요.
        </Txt>

        {failed ? (
          <Txt variant="caption" tint={theme.danger} style={styles.tiny}>
            알림을 못 켰어요. 권한을 거절했거나 아직 서버가 없을 때예요 — 설정 앱의
            알림 권한을 확인해 주세요.
          </Txt>
        ) : null}
      </Card>
    </Section>
  );
}
