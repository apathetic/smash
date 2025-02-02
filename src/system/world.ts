import { createCamera, createRenderer, createLights, createScene } from './scene';
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


function createWorld(canvas: HTMLCanvasElement) {
     const scene = createScene(); // or graphicsWorld ?
    const camera = createCamera();
   const physics = createPhysics(); // physicsWorld ?
  const renderer = createRenderer(canvas);
  const controls = createControls(camera, canvas);
  const timeline = createTimeline({ camera, scene, renderer, physics });
  const xxremove = createResizer({ camera, renderer });
  const { ambientLight, light } = createLights();

  scene.add(light, ambientLight);
  timeline.add(controls as any);


  function add(item: IWorldEntity) {
    console.log("WORLD:", item);

    timeline.add(item);
    physics.add(item);
    scene.add(item.mesh);
  }

  function remove(item: IWorldEntity) {
    timeline.remove(item);
    physics.remove(item);
    scene.remove(item.mesh);
    // item.destroy();  // or, would we want to keep this around? For example, if the user removes it from the scene, but then later re-adds it, and have it retain the same properties, position, etc..
  }

  // function start() {
  //   timeline.start();
  // }

  // function stop() {
  //   timeline.stop();
  // }

  // function reset() {
  //   timeline.reset();
  // }

  return { ...timeline, add, remove };
  // return { add, remove, start, stop, reset };
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
