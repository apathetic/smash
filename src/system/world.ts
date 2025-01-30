import { Scene } from 'three';
import { createCamera, createRenderer, createLights, createScene } from './scene';
import { createResizer } from './resizer';
import { createTimeline } from './loop';
import { createControls } from './controls';
import { createPhysics } from './physics';

// import Ground from '../assets/models/ground/ground';

/**
 * A reference to a world instance.
 * The return object exposes a number of function for interacting
 * with the World: `add` `start`, `physics`, etc
 */
// let worldHandle: World;
let worldHandle: ReturnType<typeof initWorld>;


function initWorld(canvas: HTMLCanvasElement) {
  const scene = createScene();
  const camera = createCamera();
  const physics = createPhysics();
  const renderer = createRenderer(canvas);
  const controls = createControls(camera, canvas);
  const xxremove = createResizer({ camera, renderer });
  const timeline = createTimeline({ camera, scene, renderer, physics });
  const { ambientLight, light } = createLights();

  // const ground = Ground();

  scene.add(light, ambientLight/* , ground */);
  timeline.add(controls as any);

  function add(item: any) {
    console.log("WORLD:", item);

    timeline.add(item);
    physics.add(item);
    scene.add(item.mesh);
  }

  function start() {
    timeline.start();
  }

  return { add, start, /* stop, reset */ physics };
};

/*
class World {
  public scene: Scene; // or graphicsWorld ?
  public timeline: ReturnType<typeof createTimeline>;
  public physics: ReturnType<typeof createPhysics>;

  constructor(canvas: HTMLCanvasElement) {
    const scene = createScene();
    const camera = createCamera();
    const physics = createPhysics();
    const renderer = createRenderer(canvas);
    const controls = createControls(camera, canvas);
    const xxremove = createResizer({ camera, renderer });
    const timeline = createTimeline({ camera, scene, renderer, physics });
    const { ambientLight, light } = createLights();

    // const ground = Ground();

    scene.add(light, ambientLight/* , ground * /);
    timeline.add(controls as any);

    this.scene = scene;
    this.timeline = timeline;
    this.physics = physics;
  }

  add(item: any) {
    // this.physics.add(item);
    this.timeline.add(item);
    this.scene.add(item);
  }

  start() {
    // this.physics.start();
    this.timeline.start();
  }
};

*/








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

  // if (!worldHandle) {
  //   console.log('world init needs to be called with a canvas before use');
  // }

  return worldHandle;
}


export { useWorld };
