import { Linking } from 'react-native';


/**
 * 전화 걸기.
 *
 * tel: 은 하이픈이 섞여 있어도 대부분 동작하지만, 기기에 따라 그대로 넘기면
 * 실패하는 경우가 있어 숫자와 맨 앞 + 만 남긴다.
 */
export function call(number: string) {
  const dialable = number.replace(/[^\d+]/g, '');
  Linking.openURL(`tel:${dialable}`);
}

/**
 * 「22:15」 형태의 24시간 표기.
 *
 * `toLocaleTimeString('ko-KR')` 은 「오후 10:15:32」처럼 초까지 붙고 오전/오후를
 * 쓴다. 앱의 다른 시간 표기(막차·환율·우산 시간대)는 전부 24시간이라 이 한 곳만
 * 형식이 달랐다.
 */
export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
