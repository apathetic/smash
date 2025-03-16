import { createScene, createLights } from "./scene";
import { createResizer } from "./resizer";
import { createTimeline } from "./timeline";
import { createControls } from "./controls";
import { createPhysics } from "./physics";


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
  const entities: IWorldEntity[] = [];
  const graphics = createScene(canvas);
  const physics  = createPhysics();
  const lights   = createLights();
  const controls = createControls({ graphics, physics });
  const timeline = createTimeline({ graphics, physics, entities, controls });

  createResizer(graphics);
  graphics.scene.add(...lights);


  function add(item: IWorldEntity) {
    item.setup(graphics.scene, physics.world);
    entities.push(item);
  }

  function remove(item: IWorldEntity) {
    // TODO won't work; filter by id or uuid
    // entities = entities.filter((i) => i !== item);
    item.destroy();
  }

  function clear() {
    while (entities.length) {
      // remove( entities.pop() );
      let item = entities.pop();
      item?.destroy();
    }
  }

  return { ...timeline, add, remove, clear };
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
