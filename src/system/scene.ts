import { Scene, WebGLRenderer, PerspectiveCamera, DirectionalLight, HemisphereLight, PCFSoftShadowMap } from 'three';


function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setClearColor( 0x000000, 0 );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  return renderer;
};

function createCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new PerspectiveCamera(
    70,     // fov = Field Of View
    aspect, // aspect ratio
    0.1,    // near clipping plane
    100,    // far clipping plane
  );

  camera.position.set(2, 4, 10);

  return camera;
};

function createLights() {
  const light = new DirectionalLight('white', 8);
  const ambientLight = new HemisphereLight(
    'white', // bright sky color
    'darkslategrey', // dim ground color
    5, // intensity
  );

  light.position.set(10, 20, 10);
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 100;
  light.shadow.camera.left = -25;
  light.shadow.camera.right = 25;
  light.shadow.camera.top = 25;
  light.shadow.camera.bottom = -25;
  light.shadow.bias = -0.001; // Prevent shadow acne/lines on surfaces
  light.shadow.normalBias = 0.05; // Prevent shadow acne on flat surfaces

  return [ light, ambientLight ];
};


function createScene(canvas: HTMLCanvasElement) {
  const scene = new Scene();
  const camera = createCamera();
  const renderer = createRenderer(canvas);

  return { scene, camera, renderer };
}


export {
  createScene,
  createLights,
};
