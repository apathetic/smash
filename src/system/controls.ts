import { Ball, QueryFilterFlags } from 'rapier';
import { Raycaster, Vector2, Vector3, Plane } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGameState } from "~/game/store";
import { registry } from "~/game/store/registry";
import { COLLISION_GROUP_RAY_DYNAMIC } from "~/system/constants";
import type { Collider } from 'rapier';

type ControlProps = {
  graphics: IGraphics;
  physics: IPhysics;
};

type Controls = OrbitControls & {
  destroy: () => void;
};

/**
 * How far off a grab may land, in CSS pixels, and still take hold.
 *
 * A ray has no width; a fingertip covers ~40px. On a phone a ragdoll's
 * grab handles are a ~36px-wide strip, so a pick that has to land dead on
 * one is a coin flip -- and a miss isn't silent, it falls through to
 * OrbitControls and swings the camera, which reads as dragging being
 * broken rather than as having missed.
 */
const GRAB_TOLERANCE_PX = 20;

/** The grab shape is a sphere, so its orientation never matters. */
const NO_ROTATION = { x: 0, y: 0, z: 0, w: 1 };


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
  const dragger    = physics.dragger;
  const controls   = new OrbitControls(camera, canvas);
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
   * Converts pointer coordinates to normalized device coordinates and updates the raycaster
   * Note: This assumes the canvas is full-window size.
   *
   * @param {PointerEvent} event - The pointer event containing client coordinates
   */
  function raycast(event: PointerEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;  // note: pre-supposes <canvas> is full-window size
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }

  /**
   * The grab tolerance in world units.
   *
   * GRAB_TOLERANCE_PX is a *screen*-space budget, so it has to be
   * converted through the camera at the distance it is orbiting -- a
   * fixed world radius would be a generous grab zoomed out and a
   * pixel-perfect one zoomed in, when what should stay constant is the
   * size of the fingertip.
   */
  function grabRadius() {
    const distance = camera.position.distanceTo(controls.target);
    const worldPerPixel = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * distance / window.innerHeight;
    return GRAB_TOLERANCE_PX * worldPerPixel;
  }

  /**
   * Whether a collider may be grabbed (a ragdoll's limbs may not -- see
   * DRAGGABLE_PARTS in Ragdoll.ts).
   *
   * This is handed to the cast as its filter rather than checked on the
   * result, because a shape cast reports whatever it lands on *first*. An
   * arm hanging across the chest would otherwise be the hit, and the grab
   * would be refused even though the aim was on the chest. Filtered out
   * during the cast, limbs neither grab nor occlude: the cast finds the
   * nearest real handle within a fingertip of the aim, or nothing.
   */
  function isGrabbable(collider: Collider) {
    const body = collider.parent();
    return !!body && registry.findPart(body.handle)?.draggable !== false;
  }

  /**
   * Handles pointer down events for entity selection and dragging.
   * @param {PointerEvent} event - The pointer event containing client coordinates
   */
  function onPointerDown(event: PointerEvent) {
    // In smash mode, no entity interaction - only camera controls
    if (gameState.mode !== 'edit') return;

    // Only process clicks that originate directly on the canvas -- not menus, buttons, etc
    if (event.target !== canvas) return;


    raycast(event);

    const origin = raycaster.ray.origin;
    const direction = raycaster.ray.direction;
    const maxDistance = 100;
    const targetDistance = 0;
    const stopAtPenetration = true;
    const filterFlags = QueryFilterFlags.EXCLUDE_SENSORS;
    const filterGroups = COLLISION_GROUP_RAY_DYNAMIC;

    // Swept as a small ball rather than a ray, so a grab that lands near a
    // part still takes hold. Nothing about *what* gets grabbed changes --
    // only how precisely it has to be aimed at.
    const hit = physics.world.castShape(
      origin, NO_ROTATION, direction, new Ball(grabRadius()),
      targetDistance, maxDistance, stopAtPenetration,
      filterFlags, filterGroups, undefined, undefined, isGrabbable
    );

    if (hit) {
      // The contact point on the grabbed collider, in world space.
      //
      // NOT `origin + direction * time_of_impact` -- that is where the
      // ball's *centre* stopped, a full radius clear of the surface and,
      // for a grab that lands off to one side, a full radius to the side
      // of the body. The grab point is the pivot `dragger.rotate()` turns
      // the assembly around, so a centre-of-ball point swings the entity
      // around a column floating beside it instead of spinning it in place.
      const hitPoint = new Vector3().copy(hit.witness1);

      dragPosition.copy(hitPoint);
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;

      controls.enabled = false; // disable OrbitControls when we actually hit an entity to drag
      physics.markEdited(); // Flag that the user modified the level layout. TODO does this belong on `physics`, or in a store?
      camera.getWorldDirection(normal);
      dragPlane.setFromNormalAndCoplanarPoint(normal, hitPoint);
      dragger.start(hit.collider, { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z });

      canvas.setPointerCapture(event.pointerId);
    }
  }

  /**
   * Handles pointer move events during entity dragging.
   * @param {PointerEvent} event - The pointer event containing client coordinates
   */
  function onPointerMove(event: PointerEvent) {
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
   * Handles pointer up and cancel events during entity dragging.
   */
  function onPointerUp(event: PointerEvent) {
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    controls.enabled = true;
    dragger.stop();
  }

  /**
   * Destroys the controls and removes event listeners.
   */
  function destroy() {
    canvas.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    controls.dispose();
  }


  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  (controls as any).destroy = destroy;

  return controls as Controls
}

export { createControls };
