import { createSignal, onMount, onCleanup, Show } from "solid-js";


/**
 * A phone or a tablet: a pointer that is coarse, and cannot hover.
 */
const isTouchDevice = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

/**
 * Whether the browser will actually let us go fullscreen.
 */
const isFullscreenAvailable = () => Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);

/**
 * Whatever is currently filling the screen, or nothing if we are windowed.
 */
const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;

/**
 * Asks for `el` to fill the screen. Only honoured from a user gesture.
 */
const enterFullscreen = (el) => (el.requestFullscreen || el.webkitRequestFullscreen).call(el);

/**
 * Hands the screen back, whichever element was holding it.
 */
const exitFullscreen = () => (document.exitFullscreen || document.webkitExitFullscreen).call(document);


/**
 * A fullscreen toggle, shown on touch devices only.
 * @returns {JSX.Element}
 */
const FullscreenButton = () => {
  const [isAvailable, setAvailable] = createSignal(false);
  const [isFullscreen, setFullscreen] = createSignal(false);
  const sync = () => setFullscreen(Boolean(fullscreenElement()));

  onMount(() => {
    setAvailable(isTouchDevice() && isFullscreenAvailable());
    sync();

    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);

    onCleanup(() => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    });
  });

  const toggle = async () => {
    try {
      if (fullscreenElement()) {
        await exitFullscreen();
      } else {
        await enterFullscreen(document.documentElement);
      }
    } catch (e) {
      console.warn("Fullscreen was refused", e);
    }
  };

  return (
    <Show when={isAvailable()}>
      <button
        class="fixed top-3 right-3 z-100 p-2 text-white bg-transparent border-none cursor-pointer outline-none"
        onClick={toggle}
        aria-label={isFullscreen() ? "Exit fullscreen" : "Enter fullscreen"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <Show
            when={isFullscreen()}
            fallback={<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />}
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </Show>
        </svg>
      </button>
    </Show>
  );
};

export { FullscreenButton };
