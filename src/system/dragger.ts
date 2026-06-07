import { Vector3, Quaternion } from "three";
import { RigidBody, Collider, RigidBodyType } from "rapier";
import { useGameState } from "~/game/store";

/**
 * Creates a dragger for the physics world.
 * @param physics The physics instance.
 * @returns An object containing the dragger.
 */
export function createDragger(physics: IPhysics) {
  const [game] = useGameState();
  const settlingBodies = new Map<number, RigidBody>();

  let characterController: any = null;
  let grabbedCollider: Collider | null = null;
  let grabbedBody: RigidBody | null = null;
  let draggedBodies: RigidBody[] = [];
  let grabOffset: Vector3 | null = null;
  let settlingInterval: ReturnType<typeof setInterval> | null = null;


  /**
   * Applies damping to bodies after dragging so they quickly stop moving
   */
  function startSettlingLoop() {
    if (settlingInterval) return;
    settlingInterval = setInterval(() => {
      if (game.mode !== 'edit' || settlingBodies.size === 0) {
        clearInterval(settlingInterval!);
        settlingInterval = null;
        settlingBodies.clear();
        return;
      }

      for (const [handle, b] of settlingBodies.entries()) {
        try {
          const lv = b.linvel();
          const av = b.angvel();
          const speedSq = lv.x * lv.x + lv.y * lv.y + lv.z * lv.z;
          const angSq = av.x * av.x + av.y * av.y + av.z * av.z;

          if (speedSq < 0.005 && angSq < 0.005) {
            b.setBodyType(RigidBodyType.KinematicPositionBased, true);
            b.setLinearDamping(0);
            b.setAngularDamping(0);
            settlingBodies.delete(handle);
          }
        } catch (e) {
          // Body was likely destroyed
          settlingBodies.delete(handle);
        }
      }
    }, 100);
  }

  /**
   * Finds all rigid bodies connected to `startBody`. Uses a joints BFS.
   */
  function getConnectedBodies(startBody: RigidBody): RigidBody[] {
    const bodies = new Map<number, RigidBody>([[startBody.handle, startBody]]);
    const queue = [startBody];

    while (queue.length > 0) {
      const current = queue.shift()!;
      physics.world.impulseJoints.forEachJointHandleAttachedToRigidBody(current.handle, (handle) => {
        const joint = physics.world.impulseJoints.get(handle);
        if (!joint) return;

        const b1 = joint.body1();
        const b2 = joint.body2();
        const neighbor = b1.handle === current.handle ? b2 : b1;

        if (!bodies.has(neighbor.handle)) {
          bodies.set(neighbor.handle, neighbor);
          queue.push(neighbor);
        }
      });
    }

    return Array.from(bodies.values());
  }

  /**
   * Starts dragging a target collider
   */
  function start(collider: Collider, hitPoint: { x: number, y: number, z: number }) {
    stop(); // Ensure cleanup

    grabbedCollider = collider;
    grabbedBody = collider.parent() as RigidBody;
    if (!grabbedBody) return;

    const bodyPos = grabbedBody.translation();
    grabOffset = new Vector3(bodyPos.x, bodyPos.y, bodyPos.z).sub(new Vector3(hitPoint.x, hitPoint.y, hitPoint.z));

    if (!characterController) {
      characterController = physics.world.createCharacterController(0.01);
      characterController.setApplyImpulsesToDynamicBodies(false);
    }

    draggedBodies = getConnectedBodies(grabbedBody);

    draggedBodies.forEach((b) => {
      settlingBodies.delete(b.handle);

      if (b.handle === grabbedBody!.handle) {
        b.setBodyType(RigidBodyType.KinematicPositionBased, true);
      } else {
        b.setBodyType(RigidBodyType.Dynamic, true);
        b.setLinearDamping(10.0);
        b.setAngularDamping(10.0);
      }

      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      b.wakeUp();
    });
  }

  /**
   * Moves the dragged entity to a target 3D position, avoiding obstacles.
   */
  function move(targetPoint: { x: number, y: number, z: number }) {
    if (!grabbedBody || !grabbedCollider || !grabOffset) return;

    const currentPos = grabbedBody.translation();
    const movement = new Vector3(targetPoint.x, targetPoint.y, targetPoint.z)
      .add(grabOffset)
      .sub(new Vector3(currentPos.x, currentPos.y, currentPos.z));

    const minMove = movement.clone();
    const numColliders = grabbedBody.numColliders();

    for (let i = 0; i < numColliders; i++) {
      characterController.computeColliderMovement(
        grabbedBody.collider(i),
        movement,
        undefined,
        undefined,
        (col: Collider) => {
          const parentHandle = col.parent()?.handle;
          return parentHandle === undefined || !draggedBodies.some(b => b.handle === parentHandle);
        }
      );

      const cm = characterController.computedMovement();
      // Take the most restrictive movement along each axis
      if (Math.abs(cm.x) < Math.abs(minMove.x)) minMove.x = cm.x;
      if (Math.abs(cm.y) < Math.abs(minMove.y)) minMove.y = cm.y;
      if (Math.abs(cm.z) < Math.abs(minMove.z)) minMove.z = cm.z;
    }

    grabbedBody.setNextKinematicTranslation({
      x: currentPos.x + minMove.x,
      y: currentPos.y + minMove.y,
      z: currentPos.z + minMove.z
    });
  }

  /**
   * Stops dragging and runs the settling animation logic.
   */
  function stop() {
    if (!grabbedBody) return;

    draggedBodies.forEach((b) => {
      if (game.mode !== 'edit') return;

      if (b.handle === grabbedBody!.handle) {
        b.setBodyType(RigidBodyType.KinematicPositionBased, true);
        b.setLinearDamping(0);
        b.setAngularDamping(0);
      } else {
        // Attached bodies stop normally, heavily damped
        b.setBodyType(RigidBodyType.Dynamic, true);
        b.setLinearDamping(10.0);
        b.setAngularDamping(10.0);
        settlingBodies.set(b.handle, b);
      }
    });

    if (settlingBodies.size > 0) {
      startSettlingLoop();
    }

    grabbedCollider = null;
    grabbedBody = null;
    grabOffset = null;
    draggedBodies = [];
  }

  /**
   * Cleans up all active intervals, caches, and controller references.
   */
  function cleanup() {
    if (settlingInterval) {
      clearInterval(settlingInterval);
      settlingInterval = null;
    }
    settlingBodies.clear();
    grabbedCollider = null;
    grabbedBody = null;
    draggedBodies = [];
    grabOffset = null;
    characterController = null;
  }

  /**
   * Checks if there is an entity currently being dragged.
   */
  function isDragging() {
    return !!grabbedBody;
  }

  /**
   * Rotates the entity around the Y-axis.
   */
  function rotate(deltaAngle: number) {
    if (!grabbedBody) return;
    const currentRot = grabbedBody.rotation();
    const threeRot = new Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
    const rotAxis = new Vector3(0, 1, 0);
    const deltaRot = new Quaternion().setFromAxisAngle(rotAxis, deltaAngle);
    threeRot.premultiply(deltaRot);
    grabbedBody.setNextKinematicRotation({
      x: threeRot.x,
      y: threeRot.y,
      z: threeRot.z,
      w: threeRot.w
    });
  }


  return {
    start,
    move,
    stop,
    cleanup,
    isDragging,
    rotate
  };
}
