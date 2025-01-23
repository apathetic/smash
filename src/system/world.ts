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


  function addToWorld(item: any) {
    // physics.add(item);
    timeline.add(item);
    scene.add(item);
  }

  function startWorld() {
    // physics.start();
    timeline.start();
  }

  return { addToWorld, startWorld };
};


export { initWorld };
