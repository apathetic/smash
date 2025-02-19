import { onMount, onCleanup } from "solid-js";
import { useWorld } from "~/system/world";


const Stage = ({ children }) => {
  let canvas;

  onMount(() => {
    const { start } = useWorld(canvas);
    // start();
  });

  onCleanup(() => {
    const { stop } = useWorld();
    stop();
  });

  return <canvas ref={canvas} class="fixed inset-0 z-1"></canvas>;
}

export { Stage };
