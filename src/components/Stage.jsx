import { onMount, onCleanup } from "solid-js";
import { useWorld } from "~/system/world";


/**
 * The Stage component.
 * @returns {JSX.Element}
 */
const Stage = () => {
  let canvas;

  onMount(() => {
    // NOTE: useWorld must be init'd here, in hook, only after canvas is set
    const { destroy } = useWorld(canvas);

    onCleanup(() => destroy());
  });

  return <canvas ref={canvas} class="fixed inset-0 z-1"></canvas>;
}

export { Stage };
