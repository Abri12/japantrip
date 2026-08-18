/**
 * 디자인 시스템.
 *
 * 이 앱의 원칙은 하나다 — **화면이 정보의 위계를 그대로 보여줄 것.**
 * 여행 중 급하게 훑는 화면이라, 꾸밈이 늘수록 판단이 느려진다.
 *
 * - 그림자를 쓰지 않는다. 카드는 배경색 대비와 **테두리**로 경계를 만든다.
 * - 제목은 굵고 크게, 설명은 한 단계 작고 흐리게. 중간 톤을 만들지 않는다.
 * - 여백으로 구획하되, 카드에는 경계선을 준다.
 * - 강조색은 인디고 하나. 나머지 색은 상태(위험·주의·안전)에만 쓴다.
 * - 모서리를 넉넉히 둥글린다. 정보 밀도가 높아도 부드럽게 읽히도록.
 *
 * ── 여백만으로 나누던 방식을 고친 이유 ──────────────
 *
 * 원래 원칙은 「선으로 나누는 대신 간격으로 나눈다」였고, 카드 배경(#F4F5F8)과
 * 화면 바탕(#FFFFFF)의 차이만으로 카드를 띄웠다. 디자인 시안에서는 정갈해
 * 보이지만, 실제 기기에서 밝기를 낮추거나 햇빛 아래에서 보면 그 차이가 사라져
 * **카드 경계가 아예 안 보인다.** 그러면 글이 화면에 그냥 흩뿌려진 것처럼 읽힌다.
 *
 * 실제로 「정리를 좀 해라 · 박스도 치고」라는 피드백이 나왔다. 여백은 경계를
 * 암시할 뿐이고, 정보가 빽빽한 화면에서는 암시만으로 부족하다. 그래서 카드에
 * 테두리를 주고 경계선을 눈에 보이게 올렸다.
 *
 * 색 값은 이 앱의 고유 팔레트다. 특정 서비스의 브랜드 색을 그대로 쓰지 않는다 —
 * 비슷해 보이는 것과 같은 값을 쓰는 것은 다른 문제이고, 후자는 분쟁의 빌미가 된다.
 */

import '@/global.css';

export const Palette = {
  light: {
    /** 화면 바탕 */
    background: '#FFFFFF',
    /** 카드·입력창 바탕 */
    surface: '#F7F8FA',
    /** 눌렸거나 선택된 상태 */
    surfaceStrong: '#E7E9EF',
    /** 본문 — 순검정 대신 살짝 파란 먹색 */
    text: '#1A1D26',
    /** 설명문 */
    textSecondary: '#525A6B',
    /** 부가 정보 · 캡션 */
    textTertiary: '#8E949F',
    /**
     * 카드 테두리 · 구분선.
     *
     * 카드 바탕(#F7F8FA)보다 확실히 어두워야 경계로 읽힌다. 예전 값(#E7E9EF)은
     * 바탕과 거의 같아서 테두리를 켜도 보이지 않았다.
     */
    border: '#D9DEE7',
    /** 강조 — 인디고 */
    primary: '#4C5FD7',
    primarySoft: '#EDEFFC',
    danger: '#E14356',
    dangerSoft: '#FCEBEE',
    warning: '#E8850F',
    warningSoft: '#FDF2E3',
    success: '#12A87A',
    successSoft: '#E4F6F0',
    /**
     * 추위 위험 — 파랑.
     *
     * 추위에 danger/warning(빨강·주황)을 쓰면 「더운데 위험」과 「추운데 위험」이
     * 같은 색으로 보인다. 온도는 색으로 방향까지 읽히는 정보라 반대쪽 극단은
     * 반대쪽 색이어야 한다. 브랜드 인디고(primary)와는 구분되게 조금 더
     * 시원한 파랑으로 잡았다.
     */
    cold: '#1F76CE',
    coldSoft: '#E6F1FB',
    /** 강조색 위에 얹는 글자 */
    onPrimary: '#FFFFFF',
  },
  dark: {
    background: '#15161B',
    surface: '#23252D',
    surfaceStrong: '#30323C',
    text: '#F6F7F9',
    textSecondary: '#C2C7D0',
    textTertiary: '#8E949F',
    border: '#3A3D4A',
    primary: '#8B96EC',
    primarySoft: '#262A47',
    danger: '#F2707F',
    dangerSoft: '#3A2228',
    warning: '#F0A44A',
    warningSoft: '#382C1C',
    success: '#3CCB9C',
    successSoft: '#153229',
    cold: '#5FA8EE',
    coldSoft: '#152738',
    onPrimary: '#15161B',
  },
} as const;

export type ThemeColor = keyof typeof Palette.light;

/** 이전 이름과의 호환. 새 코드는 Palette 를 쓴다. */
export const Colors = Palette;

/**
 * 폰트.
 *
 * Pretendard — SIL Open Font License 1.1. 상업 이용을 포함해 자유롭게 쓸 수 있는
 * 오픈소스 서체다. 한글과 라틴 문자의 높이가 잘 맞고 숫자 폭이 일정해서,
 * 요금·소요시간을 나열하는 이 앱의 화면과 특히 잘 맞는다.
 *
 * 라이선스 전문은 assets/fonts/Pretendard-LICENSE.txt 에 함께 배포한다.
 */
export const FontFamily = {
  regular: 'Pretendard-Regular',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

/**
 * 타이포 스케일.
 *
 * 단계를 일부러 적게 뒀다. 크기가 많아지면 위계가 아니라 소음이 된다.
 * `letterSpacing` 이 음수인 이유는 Pretendard 가 큰 크기에서 다소 성기게
 * 보이기 때문이다 — 제목일수록 조금 좁혀야 단단해 보인다.
 */
export const Type = {
  /** 화면 제목 */
  display: { fontSize: 26, lineHeight: 34, fontFamily: FontFamily.bold, letterSpacing: -0.6 },
  /** 섹션 제목 · 카드 제목 */
  title: { fontSize: 19, lineHeight: 26, fontFamily: FontFamily.bold, letterSpacing: -0.4 },
  /** 리스트 항목 이름 */
  subtitle: { fontSize: 16, lineHeight: 23, fontFamily: FontFamily.semibold, letterSpacing: -0.3 },
  /** 본문 */
  body: { fontSize: 15, lineHeight: 22, fontFamily: FontFamily.regular, letterSpacing: -0.2 },
  /** 강조된 본문 */
  bodyBold: { fontSize: 15, lineHeight: 22, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  /** 설명 · 보조 정보 */
  caption: { fontSize: 13, lineHeight: 19, fontFamily: FontFamily.regular, letterSpacing: -0.1 },
  /** 라벨 · 뱃지 */
  label: { fontSize: 12, lineHeight: 17, fontFamily: FontFamily.semibold, letterSpacing: -0.1 },
  /**
   * 하단 탭 이름.
   *
   * 뱃지와 같은 12px 을 쓰다가 키웠다. 뱃지는 카드 안에서 곁들여 읽는 글자지만
   * 탭은 앱을 옮겨다니는 주 조작부라, 걸으면서 한 손으로 누르는 상황을 생각하면
   * 뱃지와 같은 크기여선 안 된다.
   */
  tab: { fontSize: 14, lineHeight: 20, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  /** 숫자 강조 (요금·시간) */
  numeric: { fontSize: 22, lineHeight: 28, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
} as const;

export type TypeVariant = keyof typeof Type;

/** 4의 배수. 간격을 눈대중으로 정하지 않기 위한 척도다. */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 56,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** 카드 왼쪽 상태 띠의 두께. 이 앱의 시각적 표식이다. */
export const AccentBarWidth = 4;

export const BottomTabInset = 84;
export const MaxContentWidth = 720;
