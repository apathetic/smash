import * as rapier from '@dimforge/rapier3d';
import { Raycaster, Vector2, Vector3, Plane } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGameState } from "~/game/store";

interface ControlProps {
  graphics: IGraphics;
  physics: IPhysics;
  // entities: IUpdatable[];
}


// TODO optimize this whole monstrosity
function createControls({ graphics, physics }: ControlProps) {
  const [game] = useGameState();
  const { camera, renderer } = graphics;
  const { world } = physics;
  const canvas = renderer.domElement;
  const controls = new OrbitControls(camera, canvas);

  const raycaster = new Raycaster();
  const mouse = new Vector2();
  const planeZ = new Plane(new Vector3(0, 0, 1), 0);
  let selectedBody: rapier.RigidBody | null = null;


  // controls.enableDamping = true;
  controls.minDistance = 0.1; // not smaller than the camera’s near clipping plane
  controls.maxDistance = 100; // not greater than far clipping




  function raycast(event: MouseEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;  // note: pre-supposes <canvas> is full-window size
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }

  function onMouseDown(event: MouseEvent) {
    if (game.isRunning) return;

    raycast(event);

    const origin = raycaster.ray.origin;
    const direction = raycaster.ray.direction;
    const maxDistance = 100; // Set an appropriate max distance
    const ray = new rapier.Ray(origin, direction);
    const hit = world.castRay(ray, maxDistance, true);

    if (hit) {
      controls.enabled = false;
      selectedBody = hit.collider.parent();
    }
  }

  function onMouseMove(event: MouseEvent) {
    if (!selectedBody) return;
    if (game.isRunning) return;

    raycast(event);

    const worldPos = new Vector3();
    raycaster.ray.intersectPlane(planeZ, worldPos);

    // Move object to world position
    selectedBody.setTranslation(new rapier.Vector3(worldPos.x, worldPos.y, 0), true); // note: z=0 because don't want to move in z-axis, i guess?
  }

  function onMouseUp() {
    controls.enabled = true;
    selectedBody = null;
  }


  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return controls;
}

export { createControls };
