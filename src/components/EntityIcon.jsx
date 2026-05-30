import { onMount, onCleanup } from "solid-js";
import { WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight, Box3, Vector3 } from "three";
import { Cube } from "~/game/entities/Cube";
import { Truck } from "~/game/entities/Truck";
import { Rocket } from "~/game/entities/Rocket";

const ENTITY_MAP = {
  Cube,
  Truck,
  Rocket
};

export function EntityIcon(props) {
  let canvas;
  let renderer;

  onMount(() => {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(80, 80);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    const scene = new Scene();
    const camera = new PerspectiveCamera(40, 1, 0.1, 100);

    const ambientLight = new AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const dirLight = new DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const EntityClass = ENTITY_MAP[props.type];
    if (EntityClass) {
      const entity = new EntityClass();
      const fakePhysics = {
        createRigidBody: () => ({}),
        createCollider: () => ({})
      };
      
      entity.setup(scene, fakePhysics);
      
      const mainMesh = entity.dynamicBodies[0]?.mesh;
      if (mainMesh) {
        // Reset position to origin so we can frame it easily
        mainMesh.position.set(0, 0, 0);

        const box = new Box3().setFromObject(mainMesh);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Offset the camera based on entity size
        camera.position.set(center.x + maxDim * 1.5, center.y + maxDim * 1.2, center.z + maxDim * 1.5);
        camera.lookAt(center);
      }
    }

    requestAnimationFrame(() => {
      renderer.render(scene, camera);
    });
  });

  onCleanup(() => {
    renderer?.dispose();
  });

  return (
    <canvas ref={canvas} class="w-16 h-16 drop-shadow-md" />
  );
}
