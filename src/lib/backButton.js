/**
 * Стек обработчиков аппаратной/жестовой кнопки «назад» на Android.
 * Экран (или открытая шторка) может перехватить жест — например, поиск
 * должен сначала очиститься, а не сразу закрыть приложение. Работает
 * последним зарегистрированным: он и решает, обработал ли событие.
 */
const stack = [];

/** Возвращает функцию отписки. */
export function registerBackHandler(handler) {
  stack.push(handler);
  return () => {
    const i = stack.indexOf(handler);
    if (i !== -1) stack.splice(i, 1);
  };
}

/** true, если верхний обработчик сам справился с нажатием. */
export function runBackHandlers() {
  if (!stack.length) return false;
  return Boolean(stack[stack.length - 1]());
}
