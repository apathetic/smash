import { Ray, QueryFilterFlags } from 'rapier';
import { Raycaster, Vector2, Vector3, Plane } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createDragger } from "~/system/physics";
import { useGameState } from "~/game/store";



interface ControlProps {
  graphics: IGraphics;
  physics: IPhysics;
}


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
  const { world } = physics;
  const canvas = renderer.domElement;
  const controls = new OrbitControls(camera, canvas);

  const raycaster = new Raycaster();
  const mouse = new Vector2();
  const dragPlane = new Plane();
  const dragger = createDragger(world);



  // controls.enableDamping = true;
  controls.minDistance = 0.1; // not smaller than the camera's near clipping plane
  controls.maxDistance = 100; // not greater than far clipping
  controls.maxPolarAngle = Math.PI / 2; // don't allow to look below the horizon
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
   *
   * @param event
   * @returns
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

    // In edit mode (Kinematic), we want to hit the kinematic bodies.
    const filterFlags = QueryFilterFlags.EXCLUDE_FIXED | QueryFilterFlags.EXCLUDE_SENSORS;
    // let filterGroups = 0x00010003;
    // let filterExcludeCollider;
    // let filterExcludeRigidBody; // = RAGDOLL / player_rigid_body;
    // let filterPredicate = (collider: rapier.Collider) => {}; // data.get(collider.handle) == 10.0;

    // TODO cannot we use a COLLISION_GROUP to filter out non-draggable bodies?
    // const hit = world.castRay(ray, maxDistance, solid, filterFlags, filterGroups, filterExcludeCollider, filterExcludeRigidBody);
    const hit = world.castRay(ray, maxDistance, solid, filterFlags);

    if (hit) {
      const body = hit.collider.parent();
      if (!body) return;

      controls.enabled = false; // Only disable OrbitControls when we actually hit an entity to drag

      const hitPoint = new Vector3().copy(origin).addScaledVector(direction, hit.timeOfImpact);
      const normal = new Vector3();

      camera.getWorldDirection(normal);
      dragPlane.setFromNormalAndCoplanarPoint(normal, hitPoint);
      dragger.start(body, { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z });
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


  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return controls;
}

export { createControls };
