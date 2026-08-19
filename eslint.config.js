// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const globals = require('globals');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    /*
     * 검사하지 않는 것.
     *
     * `dist` 는 빌드 산출물이고, `.expo` 는 expo-router 가 만드는 타입 파일이다.
     * 둘 다 우리가 쓴 코드가 아니라서 고칠 수 있는 대상이 아니다 — 여기 걸리면
     * 실제로 봐야 할 경고가 그 사이에 묻힌다.
     */
    ignores: ['dist/*', '.expo/*'],
  },
  {
    /*
     * 서버는 브라우저가 아니라 **Node** 에서 돈다.
     *
     * expo 기본 설정은 앱 코드를 전제로 브라우저·RN 전역만 알고 있어서,
     * `Buffer` 나 `process` 같은 Node 전역을 「없는 이름」으로 본다.
     * 파일이 도는 곳이 다르면 전역도 다르다는 사실을 여기서 알려 준다.
     */
    files: ['server/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
    },
  },
]);
