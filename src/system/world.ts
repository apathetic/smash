// import { createCamera, createRenderer, createLights, createScene } from './scene';
import { createScene, createLights } from './scene';
import { createResizer } from './resizer';
import { createTimeline } from './loop';
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
  const { scene, camera, renderer } = createScene(canvas); // or graphicsWorld
  const { ambientLight, light }     = createLights();
  const physics  = createPhysics();                     // physicsWorld ?
  const controls = createControls(camera, canvas);
  const timeline = createTimeline({ camera, scene, renderer, physics });

  createResizer({ camera, renderer });
  scene.add(light, ambientLight);
  timeline.add(controls as any);


  function add(item: IWorldEntity) {
    // timeline.add(item.update);
    timeline.add(item);
    scene.add(item.mesh);
  }

  function remove(item: IWorldEntity) {
    timeline.remove(item);
    scene.remove(item.mesh);

    // or, would we want to keep item around? For example, if the user removes
    // it from the scene, but then later re-adds it, and have it retain the
    // same properties, position, etc..
    // item.mesh.geometry.dispose();
    // item.mesh.material.dispose();
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
