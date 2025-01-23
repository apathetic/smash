import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  DirectionalLight,
  HemisphereLight,
  Color,
} from 'three';


function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setClearColor( 0x000000, 0 );
  // renderer.physicallyCorrectLights = true;

  return renderer;
};

function createCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new PerspectiveCamera(
    70,     // fov = Field Of View
    aspect, // aspect ratio
    0.01,   // near clipping plane
    10,     // far clipping plane
  );

  camera.position.set(0, 0, 1);

  return camera;
};

function createLights() {
  const light = new DirectionalLight('white', 8);
  const ambientLight = new HemisphereLight(
    'white', // bright sky color
    'darkslategrey', // dim ground color
    5, // intensity
  );

  light.position.set(10, 10, 10);

  return { light, ambientLight };
};

function createScene() {
  const scene = new Scene();

  // scene.background = new Color('papayawhip');

  return scene;
};


export {
  createScene,
  createRenderer,
  createCamera,
  createLights,
};
