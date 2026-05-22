import { Ray, QueryFilterFlags } from 'rapier';
import { Raycaster, Vector2, Vector3, Plane } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGameState } from "~/game/store";
import { COLLISION_GROUP_RAY_DYNAMIC } from "~/system/constants";

interface ControlProps {
  graphics: IGraphics;
  physics: IPhysics;
}

type Controls = OrbitControls & {
  destroy: () => void;
};


// TODO optimize this whole monstrosity

/**
 * Handles mouse interaction with World entities.
 *
 * In smash mode:
 * - Allows user to manipulate orbit (camera) controls
 *
 * In edit mode:
 * - Allows selecting and dragging objects
 * - Allows user to manipulate orbit (camera) controls
 * - Disables orbit controls when dragging
 *
 * @param {Object} props - The control properties
 * @param {IGraphics} props.graphics - The graphics system containing camera and renderer
 * @param {IPhysics} props.physics - The physics system containing the world
 * @returns {Object} Control functions for interacting with the world
 */
function createControls({ graphics, physics }: ControlProps) {
  const [gameState] = useGameState();
  const { camera, renderer } = graphics;
  const canvas    = renderer.domElement;
  const controls  = new OrbitControls(camera, canvas);
  const dragger   = physics.dragger;
  const raycaster = new Raycaster();
  const mouse     = new Vector2();
  const dragPlane = new Plane();



  // controls.enableDamping = true;
  controls.minDistance = 0.1; // not smaller than the camera's near clipping plane
  controls.maxDistance = 100; // not greater than far clipping
  controls.maxPolarAngle = Math.PI / 2 - (10 * Math.PI / 180); // stop 10 degrees above the horizon
  controls.enabled = true;




  /**
   * Converts mouse coordinates to normalized device coordinates and updates the raycaster
   * Note: This assumes the canvas is full-window size.
   *
   * @param {MouseEvent} event - The mouse event containing client coordinates
   */
  function raycast(event: MouseEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;  // note: pre-supposes <canvas> is full-window size
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }

  /**
   * Handles mouse down events for entity selection and dragging.
   * @param {MouseEvent} event - The mouse event containing client coordinates
   */
  function onMouseDown(event: MouseEvent) {
    // In smash mode, no entity interaction - only camera controls
    if (gameState.mode !== 'edit') return;

    raycast(event);

    const origin = raycaster.ray.origin;
    const direction = raycaster.ray.direction;
    const maxDistance = 100;
    const solid = true;
    const ray = new Ray(origin, direction);

    const filterFlags = QueryFilterFlags.EXCLUDE_SENSORS;
    const filterGroups = COLLISION_GROUP_RAY_DYNAMIC;
    const hit = physics.world.castRay(ray, maxDistance, solid, filterFlags, filterGroups);

    if (hit) {
      const hitPoint = new Vector3().copy(origin).addScaledVector(direction, hit.timeOfImpact);
      const normal = new Vector3();

      controls.enabled = false; // disable OrbitControls when we actually hit an entity to drag
      physics.markEdited(); // Flag that the user modified the level layout
      camera.getWorldDirection(normal);
      dragPlane.setFromNormalAndCoplanarPoint(normal, hitPoint);
      dragger.start(hit.collider, { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z });
    }
  }

  function onMouseMove(event: MouseEvent) {
    if (!dragger.isDragging()) return;
    if (gameState.mode !== 'edit') return;

    raycast(event);

    const worldPos = new Vector3();
    raycaster.ray.intersectPlane(dragPlane, worldPos);

    if (worldPos) {
      dragger.move({ x: worldPos.x, y: worldPos.y, z: worldPos.z });
    }
  }

  function onMouseUp() {
    controls.enabled = true;
    dragger.stop();
  }

  /**
   * Destroys the controls and removes event listeners.
   */
  function destroy() {
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    controls.dispose();
  }


  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  (controls as any).destroy = destroy;

  return controls as Controls
}

export { createControls };
