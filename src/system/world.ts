import { createCamera, createRenderer, createLights, createScene } from './scene';
import { createResizer } from './resizer';
import { createTimeline } from './loop';
import { createControls } from './controls';
import { createPhysics } from './physics';


// import Ground from '../assets/models/ground/ground';


function initWorld(canvas: HTMLCanvasElement) {
  const scene = createScene();
  const camera = createCamera();
  const physics = createPhysics();
  const renderer = createRenderer(canvas);
  const controls = createControls(camera, canvas);
  const xxremove = createResizer({ camera, renderer });
  const timeline = createTimeline({ camera, scene, renderer /* physics */ });
  const { ambientLight, light } = createLights();

  // const ground = Ground();

  scene.add(light, ambientLight/* , ground */);
  timeline.add(controls as any);


  function add(item: any) {
    // physics.add(item);
    timeline.add(item);
    scene.add(item);
  }

  function start() {
    // physics.start();
    timeline.start();
  }

  return { add, start, /* stop, reset */ };
};




let worldHandle: ReturnType<typeof initWorld>;
function useWorld(canvas: HTMLCanvasElement) {

  // OPTION 1
  // if it hasn't yet been initialized
  // if (!worldHandle) {
  //   ....

  // OPTION 2
  // alternatively - we could assume that if there's a canvas, it'll need to be (re)initialized.
  // Could also use a flag or something more sophisticated in the args.
  // As it currently stands, this _will_ be (re)initialized each time the user clicks away from Play and back... b/c we pass in a new canvas in the onMount.
  if (canvas) {
    worldHandle = initWorld(canvas);
  }

  return worldHandle;
}



export { useWorld };
