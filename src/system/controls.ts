import * as rapier from '@dimforge/rapier3d';
import { Raycaster, Vector2, Vector3, Plane } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGameState } from "~/game/store";


import { ActiveCollisionTypes } from '@dimforge/rapier3d';
import { RigidBodyType } from '@dimforge/rapier3d';

interface ControlProps {
  graphics: IGraphics;
  physics: IPhysics;
}


// TODO optimize this whole monstrosity

/**
 * Handles mouse interaction with World entities.
 *
 * In edit mode:
 * - Allows selecting and dragging objects
 * - Freezes objects in place when positioned
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
  const planeZ = new Plane(new Vector3(0, 0, 1), 0);
  let selectedBody: rapier.RigidBody | null = null;


  // controls.enableDamping = true;
  controls.minDistance = 0.1; // not smaller than the camera's near clipping plane
  controls.maxDistance = 100; // not greater than far clipping
  controls.maxPolarAngle = Math.PI / 2; // don't allow to look below the horizon




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




  function onMouseDown(event: MouseEvent) {
    if (gameState.mode !== 'edit') return;

    raycast(event);

    const origin = raycaster.ray.origin;
    const direction = raycaster.ray.direction;
    const maxDistance = 100;
    const solid = true;
    const ray = new rapier.Ray(origin, direction);

    // https://rapier.rs/javascript3d/enums/QueryFilterFlags.html
    const filterFlags = rapier.QueryFilterFlags.ONLY_DYNAMIC;
    // let filterGroups = 0x00010003;
    // let filterExcludeCollider;
    // let filterExcludeRigidBody; // = RAGDOLL / player_rigid_body;
    // let filterPredicate = (collider: rapier.Collider) => {}; // data.get(collider.handle) == 10.0;

    // const hit = world.castRay(ray, maxDistance, solid, filterFlags, filterGroups, filterExcludeCollider, filterExcludeRigidBody);
    const hit = world.castRay(ray, maxDistance, solid, filterFlags);

    if (hit) {
      controls.enabled = false;
      selectedBody = hit.collider.parent();

      // So that the collider will still interact with other non-dynamic colliders.
      // This is the case when this collider gets set to kinematic so that it may be dragged around.
      // https://rapier.rs/docs/user_guides/javascript/colliders/#active-collision-types
      hit.collider.setActiveCollisionTypes(ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_FIXED);

      const type = RigidBodyType.KinematicPositionBased;
      selectedBody!.setBodyType(type, true);


    }
  }

  function onMouseMove(event: MouseEvent) {
    if (!selectedBody) return;
    if (gameState.mode !== 'edit') return;

    raycast(event);

    const worldPos = new Vector3();
    raycaster.ray.intersectPlane(planeZ, worldPos);

    const position = new rapier.Vector3(worldPos.x, worldPos.y, 0);
    selectedBody.setTranslation(position, true); // note: z=0 because don't want to move in z-axis, i guess?
  }

  function onMouseUp() {
    controls.enabled = true;
    if (!selectedBody) return;



    // does this need to get reset...?
    // hit.collider.setActiveCollisionTypes(ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_FIXED);


    // restore rigidBody to `Dynamic`
    const type = RigidBodyType.Dynamic;
    selectedBody.setBodyType(type, true);

    // destroy reference
    selectedBody = null;
  }


  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return controls;
}

export { createControls };
