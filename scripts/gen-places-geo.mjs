/**
 * 서버가 쓸 장소 좌표를 앱 데이터에서 뽑아낸다.
 *
 * ## 왜 서버에 좌표가 따로 필요한가
 *
 * 현장 인증을 **서버가 다시 판정**해야 하기 때문이다. 클라이언트가 「인증됨」
 * 이라고 보내온 값을 믿으면, 앱을 거치지 않고 API 를 직접 부르는 것만으로
 * 인증 리뷰를 만들 수 있다. 판정의 기준이 되는 좌표와 반경은 **서버가 가진
 * 값**이어야 한다 — 그것도 클라이언트가 보내오면 같이 조작하면 그만이다.
 *
 * ## 왜 손으로 안 적고 뽑아내나
 *
 * 좌표를 두 곳에 적어 두면 언젠가 어긋난다. 장소를 옮기거나 반경을 넓혔을 때
 * 한쪽만 고치면, 앱은 통과인데 서버는 거부하는(또는 그 반대) 상태가 된다.
 * 원본은 `src/data/places/` 하나로 두고 여기서 뽑는다.
 *
 * 실행: npm run gen:geo   (장소 데이터를 고쳤으면 다시 돌린다)
 */

import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/*
 * 서버는 TypeScript 를 읽지 못하므로 tsx 로 앱 데이터를 로드해 JSON 을 찍는다.
 * 빌드 파이프라인을 새로 만드는 것보다 이 편이 가볍다 — 좌표는 자주 바뀌지
 * 않고, 바뀌면 이 명령 한 번이면 된다.
 */
const script = `
import { PLACES } from './src/data/places';
const out = {};
for (const p of PLACES) {
  out[p.id] = { lat: p.lat, lng: p.lng, radiusM: p.radiusM ?? 10, name: p.name };
}
process.stdout.write(JSON.stringify(out));
`;

writeFileSync('.gen-geo.ts', script);
try {
  const json = execSync('npx tsx .gen-geo.ts', { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const data = JSON.parse(json);
  writeFileSync('server/places-geo.json', JSON.stringify(data, null, 0) + '\n');
  console.log(`장소 좌표 ${Object.keys(data).length}곳 → server/places-geo.json`);
} finally {
  execSync('node -e "require(\'fs\').unlinkSync(\'.gen-geo.ts\')"');
}
