// Metro가 CSS를 번들에 직접 넣기 때문에 런타임에는 문제가 없지만,
// tsc는 이 모듈들을 알지 못한다. 타입 선언만 채워 준다.
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.css';
