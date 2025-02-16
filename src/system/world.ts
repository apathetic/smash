import { createScene, createLights } from './scene';
import { createResizer } from './resizer';
import { createTimeline } from './timeline';
import { createControls } from './controls';
import { createPhysics } from './physics';


/**
 * A reference to a World instance.
 * The return object exposes a number of functions for interacting
 * with the World: `add` `start`, `stop`, etc
 */
let worldHandle: ReturnType<typeof createWorld>;


/**
 * Creates a new World, which contains visual elements (ThreeJS) and
 * physical rules (Rapier). Also creates a loop for managing the time-
 * evolution of these items and controls for interactivity.
 * @param canvas
 * @returns ...
 */
function createWorld(canvas: HTMLCanvasElement) {
  const graphics = createScene(canvas); // graphics = { scene, camera, renderer }
  const physics  = createPhysics();     // physics = { world, update, collisions }
  const lights   = createLights();
  const controls = createControls(graphics.camera, canvas);
  const timeline = createTimeline({ graphics, physics });

  createResizer(graphics);
  graphics.scene.add(...lights);
  timeline.add(controls as any);


  function add(item: IWorldEntity) {
    timeline.add(item);
    item.setup(graphics.scene, physics.world);
  }

  function remove(item: IWorldEntity) {
    timeline.remove(item);
    item.destroy();
  }

  return { ...timeline, add, remove };
};


/**
 * A hook to provide access to the world instance.
 * This is a singleton pattern, so the world instance is
 * created once and then returned on subsequent calls.
 *
 * @param canvas
 * @returns
 */
function useWorld(canvas?: HTMLCanvasElement) {
  if (canvas) {
    worldHandle = createWorld(canvas);
  }

  if (!worldHandle) {
    throw new Error('[useWorld]: was not initialized with a `canvas`');
  }

  return worldHandle;
}


export { useWorld };
