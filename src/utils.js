export function isEmpty(value) {
  if (value == null) return true; // null 또는 undefined

  if (Array.isArray(value) || typeof value === 'string') {
    return value.length === 0;      // 배열이나 문자열이면 길이 체크
  }

  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;        // Map, Set이면 size 체크
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0; // 객체이면 key 체크
  }

  return false; // 그 외 숫자, boolean 등은 empty가 아님
}
