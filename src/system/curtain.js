import { onMount, onCleanup, sharedConfig } from 'solid-js';
import { useIsRouting } from '@solidjs/router';


/**
 * Creates a custom helper for animating an element's mount and unmount transitions.
 * When the element is unmounted, it is cloned, appended, animated out, and removed.
 */
export const createCurtain = ({
  navigate = true,
  hydrate = false,
  onEnter,
  onExit,
}) => (target) => {
  const isHydrating = !!sharedConfig.context;
  const isRouting = useIsRouting();
  let cancel;

  onMount(() => {
    if ((!isHydrating || hydrate) && (!isRouting || navigate)) {
      cancel = onEnter?.(target);
    }
  });

  onCleanup(() => {
    const cancelled = cancel ? cancel() !== false : false;
    if (!onExit) return;

    // Clone target node to perform exit transition
    const clone = target.cloneNode(true);
    target.after(clone);

    onExit(clone, () => clone.remove(), cancelled);
  });
};
