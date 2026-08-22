# 안드로이드 출시

> 이 문서는 **사람만 할 수 있는 일**을 적는다. 코드로 자동화할 수 있는 것은
> 코드에 있고, 여기 남는 것은 계정을 만들고 콘솔에서 클릭해야 하는 절차다.
> 절차를 기억에 두면 반드시 어긋난다 — 특히 1년에 한 번 하는 일은.

## 지금 어디까지 왔나

| # | 할 일 | 상태 |
|---|---|---|
| 1 | **FCM 자격증명** — 지진 알림 | 🟡 코드는 준비됨 · 콘솔 작업 남음 |
| 2 | **서버 배포 + HTTPS** | 🟡 설정 파일 준비됨 · VPS 작업 남음 |
| 3 | `expo-updates` (OTA) | ⬜ |
| 4 | 스플래시·아이콘 교체 | ⬜ |
| 5 | 실기기 훑기 (뒤로가기 · edge-to-edge) | ⬜ |
| 6 | 위치 권한 고지 + Play 폼 · **알림 끄기 스위치** | ⬜ |
| 7 | 스토어 등록물 | ⬜ |

---

# 1. FCM — 지진 알림이 실제로 가게 하기

## 왜 이게 1번인가

이 앱에서 **알림은 편의 기능이 아니라 안전 기능**이다. 긴급지진속보는 흔들림
도달까지 수 초~수십 초가 전부라, 앱을 열어 봐야 아는 정보는 쓸모가 없다.

그런데 이 경로는 **고장나도 아무 소리가 안 난다.** 빌드도 되고 심사도 통과하고
설치도 되는데 알림만 안 온다. 지진이 나야 알게 되고, 그때는 늦다.

## 무엇이 필요한가

Expo 푸시 서버는 안드로이드로 직접 못 보낸다. 구글의 FCM 이 유일한 통로다.

```
앱 → Expo 푸시 서버 → FCM → 기기
                       ↑
              여기를 통과하려면 자격증명이 필요하다
```

**두 개가 필요하고, 사는 곳이 다르다.**

| 무엇 | 어디에 두나 | 비밀인가 | 없으면 |
|---|---|---|---|
| `google-services.json` | 저장소 루트 · **커밋한다** | 아니다 (앱 안에 그대로 들어간다) | 빌드가 실패한다 |
| FCM V1 서비스 계정 키 (`.json`) | EAS credentials · **커밋 안 한다** | **그렇다** | 빌드는 되고 알림만 안 온다 |

> ⚠ 서비스 계정 키가 새면 **누구든 이 앱 이름으로 푸시를 보낼 수 있다.**
> `.gitignore` 에 `*-firebase-adminsdk-*.json` 등을 넣어 뒀지만, 파일 이름이
> 다르면 안 걸린다. EAS 에 올리고 나면 로컬 파일은 지우는 게 가장 안전하다.

## 절차

### 1-A. Expo 계정 · 프로젝트 연결

```bash
npx eas login      # 계정이 없으면 expo.dev 에서 먼저 만든다
npx eas init       # app.json 의 extra.eas.projectId 에 값을 적어 준다
```

`eas init` 이 만드는 `projectId` 가 **푸시 토큰을 받는 데 필요하다.**
이 값이 없으면 릴리스 빌드에서 토큰 요청이 던지고, 알림이 조용히 안 켜진다
(`src/lib/push.ts`). 개발 중에는 개발 서버가 대신 알려 줘서 티가 안 난다 —
**개발자에게만 잘 돌고 사용자에게만 안 도는** 종류의 고장이다.

빠졌으면 콘솔에 경고가 뜬다:

```
[push] EAS 프로젝트 id 가 없어서 지진 알림을 켤 수 없어요.
```

### 1-B. Firebase 프로젝트 · google-services.json

1. https://console.firebase.google.com → **프로젝트 추가**
   - 애널리틱스는 **끈다.** 이 앱은 사용 기록을 안 모은다(`PRIVACY.md`).
     켜면 데이터 세이프티 폼의 답이 통째로 달라진다.
2. **Android 앱 추가**
   - 패키지 이름: `com.hyun.japantrip` ← **정확히 이것.** 틀리면 조용히 안 온다
   - 닉네임·SHA-1 은 안 넣어도 된다 (푸시에는 필요 없다)
3. `google-services.json` 다운로드 → **저장소 루트에 둔다**
4. 커밋한다 — EAS 는 저장소에서 파일을 꺼내 쓰므로 안 올리면 빌드가 실패한다

`app.json` 은 이미 이 파일을 가리키고 있다:

```json
"android": { "googleServicesFile": "./google-services.json" }
```

> 파일이 없으면 `expo prebuild` / EAS 빌드가 **명확한 에러로 멈춘다.**
> 조용히 넘어가는 것보다 낫다 — 이 자리는 조용히 넘어가면 안 되는 자리다.

### 1-C. 서비스 계정 키를 EAS 에 올리기

1. Firebase Console → ⚙ **프로젝트 설정** → **서비스 계정** 탭
2. **새 비공개 키 생성** → JSON 파일이 받아진다
3. 올린다:

```bash
npx eas credentials
#   platform         → Android
#   profile          → production
#   what to do       → Google Service Account
#                    → Manage your Google Service Account Key for Push Notifications (FCM V1)
#                    → Set up a Google Service Account Key
#   경로를 묻거든 방금 받은 JSON 을 가리킨다
```

4. **로컬 JSON 파일을 지운다.** EAS 에 올라갔으면 더 필요 없다

## 확인 — 실제로 오는지

여기까지 하고 나면 **반드시 실기기에서 확인한다.** 이 경로는 시뮬레이터로도
웹으로도 검증되지 않는다(`Device.isDevice` 에서 끊긴다).

```bash
npx eas build -p android --profile preview   # APK 가 나온다
```

1. APK 를 실기기에 설치
2. 도시를 하나 고른다 → 알림 권한 창이 뜨는지
3. 서버 명부에 토큰이 들어왔는지 확인 (`.data/subscribers.json`)
4. Expo 푸시 도구로 한 발 쏴 본다 — https://expo.dev/notifications
   - `ExponentPushToken[...]` 을 붙여넣고 전송
   - **소리와 함께 뜨는지**, 잠금화면에서도 뜨는지 (`eew` 채널은 `bypassDnd`)

3번까지만 되고 4번이 안 되면 **FCM 자격증명 문제**다. 3번이 안 되면
`projectId` 나 권한 문제다 — 이 둘은 증상이 같아서 순서대로 갈라야 한다.

> ⚠ **2번(서버 배포)이 안 끝나면 3·4번을 못 한다.** 등록할 서버가 없으면
> `registerQuakePush` 가 권한도 묻지 않고 나간다. FCM 설정만으로는 여기까지가
> 끝이고, 진짜 확인은 2번 뒤에 한 번 더 해야 한다.

## 아직 안 된 것 — 알림을 끌 방법이 없다 (6번으로 미룸)

`unregisterQuakePush()` 는 **아무 데서도 안 불린다.** 화면에 알림을 끄는
스위치가 없다.

그래서 지금 두 가지가 사실과 다르다:

- 시스템 설정에서 알림을 꺼도 **서버 명부에서는 토큰이 안 빠진다.** 계속 보내고
  기기가 버린다
- `docs/PLAY-DATA-SAFETY.md` 의 「사용자가 삭제를 요청할 수 있나 → 예, 알림은
  끄면 지워진다」가 **현재는 거짓**이다

출시 전에 스위치를 만들거나, 문서의 답을 고쳐야 한다. 스위치를 만드는 쪽이 맞다.

**6번에서 같이 하기로 했다**(2026-08-22). 위치 권한 고지 문구와 같은 성질의 일이고
— 둘 다 「사용자에게 무엇을 언제 묻고, 어떻게 무를 수 있게 하나」 — Play 폼을
채우는 자리에서 함께 봐야 답이 어긋나지 않는다.

같이 볼 것이 하나 더 있다. 지금은 **도시를 고르는 순간 알림 권한 창이 뜬다**
(`selected-city.tsx`). 사용자는 왜 뜨는지 모른 채 창을 만난다. 스위치를 만들면
그 스위치가 묻는 자리가 되므로, 이 문제도 같이 사라진다.

---

# 2. 서버 배포 — HTTPS 로 띄우기

## 왜 이게 2번인가

앱은 서버가 없어도 죽지 않는다(`src/lib/api.ts`). 하지만 **없으면 조용히 사라지는
것들**이 있다.

| 기능 | 서버 없으면 |
|---|---|
| 지진 푸시 | 등록 자체가 안 된다 — 권한도 안 묻는다 |
| 운행정보 (ODPT · JR서일본) | 없음 |
| 시간당 환율 | 하루 1회 소스로 떨어짐 |
| 리뷰 · 신고 | 전부 불가 |
| 크래시 리포트 | **앱이 죽어도 모른다** |

그리고 **1번(FCM)의 확인이 여기 걸려 있다.** 등록할 서버가 없으면 알림이 실제로
오는지 볼 방법이 없다.

## 이 서버가 요구하는 것 — 선택지가 좁은 이유

```
의존성 0 · Node 22 내장 http/fetch      → 빌드 단계가 없다. git pull 이면 끝
파일 기반 저장 (원자적 rename)          → 영구 디스크가 필요하다
P2PQuake WebSocket 상주 · IP당 동시 2연결 → 서버리스 불가 · 인스턴스 하나만
HTTPS                                    → 데이터 세이프티 답이 여기 걸린다
```

WebSocket 을 계속 물고 있어야 해서 **Cloudflare Workers · Vercel 같은 서버리스가
전부 탈락**한다. 무료 티어의 sleep 도 안 된다 — 자는 동안 지진을 놓친다.

인스턴스를 둘 이상 띄우게 되면 하나만 `QUAKE_WATCH=on` 으로 두고 나머지는 꺼야
한다. P2PQuake 가 IP당 동시 2연결이라 그냥 늘리면 전부 막힌다.

## ⚠ 주소 문제 — VPS 는 이름을 안 준다

**VPS 는 IP 만 준다.** `fly.dev` 나 `onrender.com` 처럼 딸려 오는 주소가 없고,
Let's Encrypt 는 **IP 주소에 인증서를 안 내준다.** 이름이 어디선가는 와야 한다.

| 방법 | 비용 | 문제 |
|---|---|---|
| **DuckDNS** (`japantrip.duckdns.org`) | 무료 | 없음. 공개 접미사 목록에 있어서 인증서 발급 한도를 남과 안 나눈다 |
| `sslip.io` / `nip.io` (`1-2-3-4.sslip.io`) | 무료 · 가입 없음 | 공개 접미사 목록에 **없다.** 한도를 전 세계 사용자와 나눠 써서 「이미 너무 많이 발급됨」으로 막힐 수 있다 |
| 도메인 구입 | 연 1~2만원 | 없음. 호스팅을 옮겨도 앱 안의 주소가 안 바뀐다 |

**DuckDNS 로 시작하고, 나중에 도메인을 사면 그때 옮기는 것**을 권한다. 다만 옮기는
순간 앱을 새로 배포해야 한다 — `EXPO_PUBLIC_API_BASE` 는 **번들에 박히는 값**이라
서버 주소를 바꾸면 스토어 심사를 다시 거친다. 3번(OTA)이 없는 동안에는 이게 아프다.

> 이 순서가 뜻하는 것: **3번을 먼저 하면 주소를 나중에 바꿔도 싸진다.**
> 도메인을 안 살 거라면 3번을 2번보다 먼저 하는 게 나을 수 있다.

## 절차

### 2-A. VPS 와 이름

1. VPS 를 만든다 (Hetzner CX22 · Vultr · Oracle Cloud 평생 무료 ARM 중 아무거나)
   - **Ubuntu 24.04 LTS**, 1vCPU / 1GB 면 충분하다. 이 서버는 캐시 몇 개와
     WebSocket 하나가 전부다
2. https://www.duckdns.org 에서 이름 하나 만들고 VPS 의 IP 를 넣는다
3. 방화벽은 **80 · 443 만** 연다. 8787 은 절대 열지 않는다 — 프록시를 건너뛰는
   경로가 되고, 거기엔 TLS 도 없다

### 2-B. Node 22 · 사용자 · 코드

```bash
# Node 22 (Ubuntu 기본 저장소는 낡았다)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git

# 앱 전용 사용자 — 로그인 못 하게
sudo useradd --system --home /srv/japantrip --shell /usr/sbin/nologin japantrip
sudo mkdir -p /srv/japantrip
sudo chown japantrip:japantrip /srv/japantrip

sudo -u japantrip git clone https://github.com/Abri12/japantrip.git /srv/japantrip
sudo -u japantrip mkdir -p /srv/japantrip/.data
```

`npm install` 이 없다. 이 서버는 **의존성이 0** 이라 `node server/index.mjs` 로 바로 뜬다.

### 2-C. `.env`

`/srv/japantrip/.env` 에 둔다. 이 파일 하나가 유일한 설정 자리다.

```bash
PORT=8787

# 바깥에 열지 않는다. 프록시가 같은 기계에 있다
HOST=127.0.0.1

# 프록시 뒤에 있다고 알려 준다.
# 이게 꺼져 있으면 모든 요청이 127.0.0.1 에서 온 것으로 보여
# 요청 제한이 통째로 한 양동이가 된다 — 한 명이 많이 쓰면 전부 막힌다.
TRUST_PROXY=1

# 웹 버전(GitHub Pages)이 이 서버를 부를 수 있게. 네이티브 앱은 CORS 와 무관하다
ALLOWED_ORIGIN=https://abri12.github.io

QUAKE_WATCH=on
SUBSCRIBERS_FILE=/srv/japantrip/.data/subscribers.json

# 있으면 환율이 시간당 갱신된다. 없어도 동작한다
OPEN_EXCHANGE_RATES_APP_ID=
# 도쿄메트로·JR동일본 운행정보까지 넓히려면 (무료·상업 이용 가능)
ODPT_TOKEN=
```

```bash
sudo chown japantrip:japantrip /srv/japantrip/.env
sudo chmod 600 /srv/japantrip/.env
```

### 2-D. systemd

```bash
sudo cp /srv/japantrip/deploy/japantrip.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now japantrip
sudo systemctl status japantrip
curl -s localhost:8787/api/fx | head -c 200      # 여기서 JSON 이 나와야 한다
```

### 2-E. Caddy

```bash
sudo apt install -y caddy
sudo cp /srv/japantrip/deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile        # 도메인을 실제 주소로
sudo systemctl reload caddy
```

인증서는 자동으로 받는다. 확인:

```bash
curl -s https://japantrip.duckdns.org/api/fx | head -c 200
```

### 2-F. 앱이 서버를 보게 하기

`.env` (저장소 루트, 앱 쪽):

```
EXPO_PUBLIC_API_BASE=https://japantrip.duckdns.org
```

> ⚠ **이 값은 번들에 박힌다.** 앱을 다시 빌드해야 반영된다. 그리고 `.env` 는
> `.gitignore` 에 있으므로 EAS 빌드에서는 이 값을 따로 넣어야 한다:
> `eas env:create --name EXPO_PUBLIC_API_BASE --value https://... --scope project`

## 배포한 뒤 — 코드를 고쳤을 때

```bash
sudo -u japantrip git -C /srv/japantrip pull
sudo systemctl restart japantrip
```

두 줄이 전부다. 빌드도 `npm install` 도 없다.

## 확인 — 프록시 뒤에서 진짜로 도는지

```bash
# ① 지어낸 헤더가 안 먹는지. 두 번 다 같은 양동이여야 한다
for i in 1 2; do curl -s -o /dev/null -w "%{http_code}\n" \
  -H "X-Forwarded-For: 9.9.9.$i" https://japantrip.duckdns.org/api/fx; done

# ② 8787 이 바깥에서 안 열리는지 — 연결이 거부돼야 정상이다
curl -m 5 http://<VPS-IP>:8787/api/fx

# ③ 지진 감시가 붙었는지
sudo journalctl -u japantrip -n 50 | grep -i quake
```

②가 응답하면 **방화벽이나 `HOST` 설정이 잘못된 것**이다. 그 경로로는 TLS 없이
평문이 오가고, `x-forwarded-for` 를 마음대로 적어 보낼 수 있다.

## 그리고 1번으로 돌아간다

서버가 뜨면 **FCM 확인을 마저 한다** (§1 「확인 — 실제로 오는지」의 3·4번).
여기까지 와야 지진 알림이 실제로 도는 것을 처음 보게 된다.
