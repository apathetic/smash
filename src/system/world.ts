import { createCamera, createRenderer, createLights, createScene } from './scene';
import { createResizer } from './resizer';
import { createTimeline } from './loop';
import { createControls } from './controls';
import { createPhysics } from './physics';

// import Ground from '../assets/models/ground/ground';
import { Floor } from '~/game/ground/Floor';

/**
 * A reference to a world instance.
 * The return object exposes a number of function for interacting
 * with the World: `add` `start`, `physics`, etc
 */
let worldHandle: ReturnType<typeof initWorld>;


function initWorld(canvas: HTMLCanvasElement) {
  const scene = createScene(); // or graphicsWorld ?
  const camera = createCamera();
  const physics = createPhysics(); // physicsWorld ?
  const renderer = createRenderer(canvas);
  const controls = createControls(camera, canvas);
  const xxremove = createResizer({ camera, renderer });
  const timeline = createTimeline({ camera, scene, renderer, physics });
  const { ambientLight, light } = createLights();

  // const ground = Ground();
  const floor = Floor(); // this ground by default? or dynamic / per level?

  scene.add(light, ambientLight, floor.mesh);
  physics.add(floor);
  timeline.add(controls as any);


  function add(item: any) {
    console.log("WORLD:", item);

    timeline.add(item);
    physics.add(item);
    scene.add(item.mesh);
  }

  function remove(item: any) {
    //
  }

  function start() {
    timeline.start();
  }

  function stop() {
    //
  }

  function reset() {
    //
  }

  return { add, start, stop, reset };
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
    worldHandle = initWorld(canvas);
  }

  if (!worldHandle) {
    throw new Error('useWorld needs to be called with a `canvas` before use');
  }

  return worldHandle;
}


export { useWorld };
