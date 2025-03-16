import { onMount, onCleanup } from "solid-js";
import { useWorld } from "~/system/world";
import { Terrain } from "~/game/ground/Terrain";


/**
 * The Stage component.
 * @returns {JSX.Element}
 */
const Stage = () => {
  let canvas;

  onMount(() => {
    // NOTE: useWorld must be init'd here, in hook, only after canvas is set
    const { start } = useWorld(canvas);
    start();
  });

  onCleanup(() => {
    const { stop } = useWorld();
    stop();
  });

  return <canvas ref={canvas} class="fixed inset-0 z-1"></canvas>;
}

export { Stage };
