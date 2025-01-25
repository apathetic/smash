import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PerspectiveCamera } from 'three';


function createControls(camera: PerspectiveCamera, canvas: HTMLCanvasElement) {
  const controls = new OrbitControls(camera, canvas);

  // controls.enableDamping = true;
  // controls.tick = () => controls.update(); // update already exists
  // controls.tick = () => {};

  controls.minDistance = 0.01; // not smaller than the camera’s near clipping plane
  controls.maxDistance = 10;   // not greater than far clipping

  return controls;
}

export { createControls };
