import {
  MeshStandardMaterial,
  TextureLoader,
  BoxGeometry,
  Mesh,

  MathUtils
} from 'three';

const radsPerSecond = MathUtils.degToRad(30);

const createMaterial = () => {
  // const material = new MeshStandardMaterial({ color: 'purple' }); // MeshBasicMaterial
  const loader = new TextureLoader();
  const texture = loader.load(
    // '@/textures/uv-test-bw.png',
    '../../textures/uv-test-bw.png',
  );


  const material = new MeshStandardMaterial({
    color: 'purple',
    map: texture,
  });

  console.log(material);
  return material;
};

const Cube = () => {
  const material = createMaterial();
  const geometry = new BoxGeometry(1, 1, 1);
  const cube = new Mesh(geometry, material);

  // shadow ???

  cube.rotation.set(-0.5, -0.1, 0.8);

  cube.tick = (delta) => {
    cube.rotation.z += radsPerSecond * delta;
    cube.rotation.x += radsPerSecond * delta;
    cube.rotation.y += radsPerSecond * delta;
  };

  return cube;
};

export default Cube;

/** * /
class Cube {
  constructor() {
    // const material = this.createMaterial();
    const material = new MeshStandardMaterial({ color: 'purple' });
    const geometry = new BoxGeometry(1, 1, 1);
    const cube = new Mesh(geometry, material);

    cube.rotation.set(-0.5, -0.1, 0.8);

    this.cube = cube;
    this.object = cube;

    return this; // cube;
  }

  tick(delta) {
    this.cube.rotation.z += radsPerSecond * delta;
    this.cube.rotation.x += radsPerSecond * delta;
    this.cube.rotation.y += radsPerSecond * delta;

    // this.cube.rotation.x += 0.01;
    // this.cube.rotation.y += 0.01;
  }
}

export default Cube;
/** */
