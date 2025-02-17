import { Raycaster, Vector2, Vector3, Plane } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ControlProps {
  graphics: IGraphics;
  physics: IPhysics;
  entities: IUpdatable[];
}


// TODO optimize this whole monstrosity
function createControls({ graphics, physics, entities }: ControlProps) {
  const { camera, scene, renderer } = graphics;
  const { world } = physics;
  const canvas = renderer.domElement;
  const controls = new OrbitControls(camera, canvas);

  const raycaster = new Raycaster();
  const mouse = new Vector2();
  const planeZ = new Plane(new Vector3(0, 0, 1), 0);

  // controls.enableDamping = true;
  controls.minDistance = 0.1; // not smaller than the camera’s near clipping plane
  controls.maxDistance = 100; // not greater than far clipping



  let grabbedBody: any = null; // Store the grabbed object
  let grabOffset = new Vector3(); // Offset for precise movement


  function raycast(event: MouseEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;  // note: pre-supposes <canvas> is full-window size
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }


  // Convert mouse event to Three.js normalized coordinates
  function onMouseDown(event: MouseEvent) {
    // if world.isRunning() return; // cannot move while things running

    raycast(event);


    // TODO move this out of here, make better way of calculation, make a signal, eg,
    const interactableObjects: Map<IDynamicBody['mesh'], any> = entities
      .filter(x => x.constructor.name != 'Terrain')
      .reduce((objs, x) => {
        x.dynamicBodies.forEach(({ mesh, body }) => objs.set(mesh, body));
        return objs;
      }, new Map());

    const intersects = raycaster.intersectObjects(scene.children, true);         // Check all objects
    // const intersects = raycaster.intersectObjects(interactableObjects.keys(), true); // check pre-defined objects.  These are 'mesh'es


    if (intersects.length > 0) {
      // Get the clicked object
      // unless it's Terrain. the nevermind.
      const mesh = intersects[0].object;

      const body = interactableObjects.get(mesh); // Find corresponding Rapier body

      if (body) {
        controls.enabled = false; // 🔥 Disable OrbitControls
        grabbedBody = body;
        const hitPoint = intersects[0].point; // Exact hit position
        grabOffset.subVectors(hitPoint, new Vector3(body.translation().x, body.translation().y, body.translation().z));
      }
    }
  }

  function onMouseMove(event: MouseEvent) {
    if (!grabbedBody) return;

    raycast(event);

    const newPosition = new Vector3();

    if (raycaster.ray.intersectPlane(planeZ, newPosition)) {
      newPosition.sub(grabOffset);
      grabbedBody.setTranslation(newPosition, true); // Directly set the position in Rapier
    }
  }

  function onMouseUp() {
    controls.enabled = true;
    grabbedBody = null;
  }


  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return controls;
}

export { createControls };
