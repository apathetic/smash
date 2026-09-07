import { createSignal } from 'solid-js';
import { Ball, QueryFilterFlags } from 'rapier';
import { Raycaster, Vector2, Vector3, Plane, Box3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGameState } from "~/game/store";
import { registry } from "~/game/store/registry";
import { COLLISION_GROUP_RAY_DYNAMIC } from "~/system/constants";
import type { Collider } from 'rapier';
import type { Object3D } from 'three';

type ControlProps = {
  graphics: IGraphics;
  physics: IPhysics;
};

type Controls = OrbitControls & {
  canSpawn: () => boolean;
  pickUp: (entity: WorldEntity, event: PointerEvent) => void;
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
 * How big an entity pulled from the inventory tray looks when it appears,
 * in CSS pixels across: about the tile it came off. It is placed as deep
 * as it can be and still look this big, so it never arrives tiny.
 */
const SPAWN_SIZE_PX = 90;

/**
 * Nearest the camera may orbit and still allow spawning from the tray.
 * Zoomed in closer than this, a spawned entity would arrive larger than
 * its tile with nowhere to go, so the tray hides itself instead.
 */
const SPAWN_MIN_DISTANCE = 12;

/**
 * How much of its own distance an entity is pushed away from the camera
 * per pixel of pointer travel. A fraction rather than a fixed distance, so
 * the drag covers ground when the entity is far off and grows fine as it
 * comes in -- and so equal and opposite drags cancel exactly.
 */
const DISTANCE_PER_PIXEL = 0.006;

/** How near and how far a depth drag may put an entity, in world units. */
const MIN_DRAG_DISTANCE = 2;
const MAX_DRAG_DISTANCE = 90;


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
  const spawnPoint = new Vector3();
  const spawnSize  = new Vector3();
  const dragPosition = new Vector3();
  const cameraDir  = new Vector3();
  const normal     = new Vector3();
  const worldPos   = new Vector3();
  const [orbitDistance, setOrbitDistance] = createSignal(camera.position.distanceTo(controls.target));
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
    return GRAB_TOLERANCE_PX * worldPerPixel(camera.position.distanceTo(controls.target));
  }

  /**
   * The width of one CSS pixel, in world units, at a given distance from the camera.
   */
  function worldPerPixel(distance: number) {
    return 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * distance / window.innerHeight;
  }

  /**
   * How far along the pointer's ray an entity from the tray appears.
   *
   * Along the ray, not on the ground: from the tray at the screen's edge
   * the ground under the pointer is far off, or beyond the horizon, so the
   * entity would arrive tiny and distant, or not at all. Instead it appears
   * at the orbit's focus -- the depth the camera is looking at -- or nearer
   * if it must be to look SPAWN_SIZE_PX across.
   */
  function spawnDistance(mesh: Object3D) {
    const size = new Box3().setFromObject(mesh).getSize(spawnSize);
    const extent = Math.max(size.x, size.y, size.z);
    const focal = camera.position.distanceTo(controls.target);
    const fitted = extent / (worldPerPixel(1) * SPAWN_SIZE_PX);
    return Math.min(focal, fitted);
  }

  /**
   * Whether the tray may spawn an entity at the current zoom. Reactive, so
   * the tray can hide itself while it is false.
   */
  function canSpawn() {
    return orbitDistance() >= SPAWN_MIN_DISTANCE;
  }

  /**
   * Keeps `orbitDistance` current. OrbitControls fires 'change' whenever
   * the camera moves under it.
   */
  function onOrbitChange() {
    setOrbitDistance(camera.position.distanceTo(controls.target));
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
   * Takes hold of a collider at a world-space point: orbit is handed off to
   * the dragger, and the pointer is captured so the drag keeps following it
   * after it leaves the canvas.
   */
  function grab(collider: Collider, hitPoint: Vector3, event: PointerEvent) {
    dragPosition.copy(hitPoint);
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

    controls.enabled = false; // disable OrbitControls when we actually hit an entity to drag
    physics.markEdited(); // Flag that the user modified the level layout. TODO does this belong on `physics`, or in a store?
    camera.getWorldDirection(normal);
    dragPlane.setFromNormalAndCoplanarPoint(normal, hitPoint);
    dragger.start(collider, { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z });

    canvas.setPointerCapture(event.pointerId);
  }

  /**
   * Picks up an entity the pointer never hit -- one just pulled from the
   * inventory tray -- and drags it exactly as a grabbed one.
   *
   * The entity appears under the pointer, at the depth `spawnDistance`
   * picks, and from there it is carried on the same camera-facing plane
   * as any other drag.
   *
   * @param {WorldEntity} entity - Already added to the world. Its first body is the one held
   * @param {PointerEvent} event - The event the tray handed off; the pointer must still be down
   */
  function pickUp(entity: WorldEntity, event: PointerEvent) {
    const part = entity.dynamicBodies[0];

    if (gameState.mode !== 'edit') return;
    if (!part?.body) return;

    raycast(event);
    raycaster.ray.at(spawnDistance(part.mesh), spawnPoint);

    part.body.setTranslation(spawnPoint, true);
    part.mesh.position.copy(spawnPoint);

    grab(part.body.collider(0), spawnPoint, event);
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
      // of the body. That offset becomes the drag's `grabOffset`, so a
      // centre-of-ball point hangs the entity off the cursor by a radius.
      const hitPoint = new Vector3().copy(hit.witness1);

      grab(hit.collider, hitPoint, event);
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
      // Depth: slide the entity along the line it already sits on, from the
      // camera out through it, changing only how far away it is. Nothing
      // but that distance moves, so the entity holds the same point on
      // screen and merely grows or shrinks -- and dragging back the same
      // distance returns it exactly where it started.
      //
      // The pointer's *live* ray is deliberately not used, though it is
      // what the plain drag follows. Steering by it means the entity
      // tracks the pointer's new screen position as well as its distance,
      // so it visibly climbs or sinks on the way in, and a drag back up
      // lands it somewhere else entirely.
      //
      // Sliding along the line cannot change the line, so the reading and
      // the writing agree step after step; and the scaling is
      // multiplicative, so equal and opposite drags cancel to exactly 1.
      const offset = worldPos.subVectors(dragPosition, camera.position);
      const distance = offset.length();

      if (distance > 0.001) {
        const scaled = distance * Math.exp(-deltaY * DISTANCE_PER_PIXEL);
        const next = Math.min(Math.max(scaled, MIN_DRAG_DISTANCE), MAX_DRAG_DISTANCE);

        dragPosition.copy(camera.position).addScaledVector(offset, next / distance);
        dragger.move(dragPosition);
        camera.getWorldDirection(cameraDir);
        dragPlane.setFromNormalAndCoplanarPoint(cameraDir, dragPosition);
      }
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
    controls.removeEventListener("change", onOrbitChange);
    controls.dispose();
  }


  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  controls.addEventListener("change", onOrbitChange);

  (controls as any).canSpawn = canSpawn;
  (controls as any).pickUp = pickUp;
  (controls as any).destroy = destroy;

  return controls as Controls
}

export { createControls };
