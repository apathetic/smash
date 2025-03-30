import { onCleanup } from "solid-js";

export function useKeyPress(key: string, callback: (e: KeyboardEvent) => void) {
  const hasModifier = key.split('+').length > 1;
  const baseKey = hasModifier ? key.split('+')[1] : key;
  const modifier: string | undefined = hasModifier ? key.split('+')[0] : undefined;

  const onKeyPress = (e: KeyboardEvent) => {
    if (hasModifier) {
      const modifierState = e.getModifierState(modifier!);
      if (!modifierState) return;
    }
    if (e.key !== baseKey) return;
    callback(e);
  }

  window.addEventListener('keypress', onKeyPress);

  onCleanup(() => {
    window.removeEventListener('keypress', onKeyPress);
  });
}
