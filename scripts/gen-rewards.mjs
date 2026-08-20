/**
 * 서버가 쓸 보상 가격표를 앱 데이터에서 뽑아낸다.
 *
 * ## 왜 서버에 가격이 따로 필요한가
 *
 * 교환 요청이 이랬다.
 *
 *     POST /api/credits/redeem  { rewardId: 'starbucks', cost: 3000 }
 *
 * 서버가 그 `cost` 를 그대로 믿고 차감했다. 즉 **클라이언트가 자기 값을
 * 정했다.** `cost: 1` 을 보내면 1크레딧으로 3,000짜리 기프티콘이 나간다.
 *
 * 앱을 고쳐야 하는 것도 아니다. 주소로 요청 한 번 보내면 된다. 원장을 서버로
 * 옮기고 출금 게이트까지 세운 것이 이 한 줄로 전부 무의미해지는 자리였다.
 *
 * 그래서 **가격은 서버가 안다.** 요청은 무엇을 바꿀지(`rewardId`)만 말하고,
 * 얼마인지는 서버가 자기 표에서 찾는다.
 *
 * ## 왜 손으로 안 적고 뽑아내나
 *
 * 가격을 두 곳에 적어 두면 언젠가 어긋난다. 화면에는 500이라 적혀 있는데
 * 서버가 800을 깎는 상황이 생기고, 사용자는 이유를 알 수 없다.
 *
 * 원본은 `src/lib/credits.ts` 하나로 둔다. 거기에 이 경제를 왜 이렇게 짰는지가
 * 전부 적혀 있어서, 값만 따로 떼면 그 맥락이 끊긴다. `gen-places-geo.mjs` 와
 * 같은 방식이다.
 *
 * 실행: npm run gen:rewards   (보상 목록을 고쳤으면 다시 돌린다)
 */

import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/*
 * 서버는 TypeScript 를 읽지 못하므로 tsx 로 앱 데이터를 로드해 JSON 을 찍는다.
 *
 * 화면에 쓰는 설명·분류는 안 담는다. 서버가 판단에 쓰는 것은 **가격과 발행
 * 주체**뿐이고, 나머지를 담으면 서버가 화면 문구까지 들고 있게 된다.
 */
const script = `
import { REWARDS } from './src/lib/credits';
const out = {};
for (const r of REWARDS) {
  out[r.id] = { cost: r.cost, issuer: r.issuer, name: r.name };
}
process.stdout.write(JSON.stringify(out));
`;

writeFileSync('.gen-rewards.ts', script);
try {
  const json = execSync('npx tsx .gen-rewards.ts', { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const data = JSON.parse(json);
  writeFileSync('server/rewards.json', JSON.stringify(data, null, 0) + '\n');
  console.log(`보상 ${Object.keys(data).length}종 → server/rewards.json`);
} finally {
  execSync('node -e "require(\'fs\').unlinkSync(\'.gen-rewards.ts\')"');
}
