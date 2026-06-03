import { Ray, QueryFilterFlags } from 'rapier';
import { Raycaster, Vector2, Vector3, Plane } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGameState } from "~/game/store";
import { COLLISION_GROUP_RAY_DYNAMIC } from "~/system/constants";

type ControlProps = {
  graphics: IGraphics;
  physics: IPhysics;
};

type Controls = OrbitControls & {
  destroy: () => void;
};


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
  const canvas     = renderer.domElement;
  const controls   = new OrbitControls(camera, canvas);
  const dragger    = physics.dragger;
  const raycaster  = new Raycaster();
  const mouse      = new Vector2();
  const dragPlane  = new Plane();
  const dragPosition = new Vector3();
  const cameraDir  = new Vector3();
  const normal     = new Vector3();
  const forwardXZ  = new Vector3();
  const worldPos   = new Vector3();
  let lastMouseX   = 0;
  let lastMouseY   = 0;

  controls.minDistance = 2; // empirically chosen. Cannot be not smaller than 0.1 (camera's near clipping plane)
  controls.maxDistance = 25; // empirically chosen. Cannot be greater than 100 (far clipping)
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

    // Only process clicks that originate directly on the canvas -- not menus, buttons, etc
    if (event.target !== canvas) return;


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

      dragPosition.copy(hitPoint);
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;

      controls.enabled = false; // disable OrbitControls when we actually hit an entity to drag
      physics.markEdited(); // Flag that the user modified the level layout
      camera.getWorldDirection(normal);
      dragPlane.setFromNormalAndCoplanarPoint(normal, hitPoint);
      dragger.start(hit.collider, { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z });
    }
  }

  /**
   * Handles mouse move events during entity dragging.
   * @param {MouseEvent} event - The mouse event containing client coordinates
   */
  function onMouseMove(event: MouseEvent) {
    if (!dragger.isDragging()) return;
    if (gameState.mode !== 'edit') return;

    raycast(event);

    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    if (event.metaKey || event.ctrlKey) {
      // Rotation around global Y-axis
      const rotationSpeed = 0.005;
      dragger.rotate(deltaX * rotationSpeed);
    } else if (event.shiftKey) {
      // Height modification (Vertical Y axis)
      const verticalSensitivity = 0.02;
      dragPosition.y -= deltaY * verticalSensitivity;
      dragger.move(dragPosition);
      camera.getWorldDirection(normal);
      dragPlane.setFromNormalAndCoplanarPoint(normal, dragPosition);
    } else if (event.altKey) {
      // Depth modification: slide horizontally along the camera's forward direction
      const depthSensitivity = 0.03;
      camera.getWorldDirection(cameraDir);
      forwardXZ.set(cameraDir.x, 0, cameraDir.z);

      if (forwardXZ.lengthSq() < 0.001) {
        // Fallback if camera is looking straight down (reusing normal as cameraUp)
        normal.set(0, 1, 0).applyQuaternion(camera.quaternion);
        forwardXZ.set(normal.x, 0, normal.z).normalize();
      } else {
        forwardXZ.normalize();
      }

      dragPosition.addScaledVector(forwardXZ, -deltaY * depthSensitivity);
      dragger.move(dragPosition);
      camera.getWorldDirection(normal);
      dragPlane.setFromNormalAndCoplanarPoint(normal, dragPosition);
    } else {
      // Default: Drag along camera-aligned dragPlane
      const res = raycaster.ray.intersectPlane(dragPlane, worldPos);
      if (res) {
        dragPosition.copy(worldPos);
        dragger.move(dragPosition);
      }
    }

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }

  /**
   * Handles mouse-up events during entity dragging.
   */
  function onMouseUp() {
    controls.enabled = true;
    dragger.stop();
  }

  /**
   * Destroys the controls and removes event listeners.
   */
  function destroy() {
    canvas.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    controls.dispose();
  }


  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  (controls as any).destroy = destroy;

  return controls as Controls
}

export { createControls };
