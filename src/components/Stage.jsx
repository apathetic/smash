import { animate } from "animejs";
import { onMount, onCleanup, createEffect } from "solid-js";
import { useWorld } from "~/system/world";
import { useGameState } from "~/game/store";


/**
 * The Stage component.
 * @returns {JSX.Element}
 */
const Stage = () => {
  let canvas;
  const [gameState] = useGameState();

  onMount(() => {
    // initialize World only when the <canvas> is available
    const { destroy } = useWorld(canvas);
    onCleanup(() => destroy());
  });

  createEffect(() => {
    // Track level changes to trigger the quick fade-in
    gameState.level;
    animate(canvas, {
      opacity: [0, 1],
      duration: 350,
      ease: "outQuad"
    });
  });

  return <canvas ref={canvas} style="opacity: 0;" class="fixed inset-0 z-1"></canvas>;
}

export { Stage };
