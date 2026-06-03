import { Vector3, Quaternion } from "three";
import { RigidBody, Collider, RigidBodyType, ImpulseJointHandle } from "rapier";
import { useGameState } from "~/game/store";


/**
 * Creates a dragger for the physics world.
 * @param physics The physics instance.
 * @returns An object containing the dragger.
 */
export function createDragger(physics: IPhysics) {
  const [game] = useGameState();
  const settlingIntervals = new Map<RigidBody, ReturnType<typeof setInterval>>();
  const connectedBodiesCache = new Map<number, RigidBody[]>();

  let characterController: any = null;
  let grabbedCollider: Collider | null = null;
  let grabbedBody: RigidBody | null = null;
  let draggedBodies: RigidBody[] = [];
  let grabOffset: Vector3 | null = null;

  /**
   * Finds all rigid bodies connected to `startbody` via joints.
   */
  function getConnectedBodies(startBody: RigidBody): RigidBody[] {
    if (connectedBodiesCache.has(startBody.handle)) {
      return connectedBodiesCache.get(startBody.handle)!;
    }
    const connected = new Set<RigidBody>();
    const queue = [startBody];
    connected.add(startBody);

    while (queue.length > 0) {
      const current = queue.shift()!;
      physics.world.impulseJoints.forEachJointHandleAttachedToRigidBody(current.handle, (jointHandle: ImpulseJointHandle) => {
        const joint = physics.world.impulseJoints.get(jointHandle);
        if (joint) {
          const b1 = joint.body1();
          const b2 = joint.body2();
          const neighbor = (b1.handle === current.handle) ? b2 : b1;
          if (!connected.has(neighbor)) {
            connected.add(neighbor);
            queue.push(neighbor);
          }
        }
      });
    }

    const arr = Array.from(connected);

    arr.forEach(b => {
      connectedBodiesCache.set(b.handle, arr);
    });

    return arr;
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
      if (settlingIntervals.has(b)) {
        clearInterval(settlingIntervals.get(b));
        settlingIntervals.delete(b);
      }

      if (b === grabbedBody) {
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

    const currentPos = new Vector3().copy(grabbedBody.translation() as any);
    const desiredPos = new Vector3(targetPoint.x, targetPoint.y, targetPoint.z).add(grabOffset);
    const movement = new Vector3().subVectors(desiredPos, currentPos);
    const minComputedMovement = movement.clone();
    const numColliders = grabbedBody.numColliders();

    for (let i = 0; i < numColliders; i++) {
      const c = grabbedBody.collider(i);
      // Compute movement to avoid obstacles, ignore other bodies in this entity group
      characterController.computeColliderMovement(
        c,
        movement,
        undefined,
        undefined,
        (col: Collider) => {
          const parent = col.parent();
          if (parent) {
             const draggedHandles = draggedBodies.map(b => b.handle);
             return !draggedHandles.includes(parent.handle);
          }
          return true;
        }
      );
      const cm = characterController.computedMovement();

      // Take the most restrictive movement along each axis
      if (Math.abs(cm.x) < Math.abs(minComputedMovement.x)) minComputedMovement.x = cm.x;
      if (Math.abs(cm.y) < Math.abs(minComputedMovement.y)) minComputedMovement.y = cm.y;
      if (Math.abs(cm.z) < Math.abs(minComputedMovement.z)) minComputedMovement.z = cm.z;
    }

    grabbedBody.setNextKinematicTranslation({
      x: currentPos.x + minComputedMovement.x,
      y: currentPos.y + minComputedMovement.y,
      z: currentPos.z + minComputedMovement.z
    });
  }

  /**
   * Stops dragging and runs the settling animation logic.
   */
  function stop() {
    if (!grabbedBody) return;

    draggedBodies.forEach((b) => {
      if (game.mode !== 'edit') {
        // In smash mode, the global setEditMode(false) forces bodies to Dynamic and resets damping.
        return;
      }

      if (b === grabbedBody) {
        b.setBodyType(RigidBodyType.KinematicPositionBased, true);
        b.setLinearDamping(0);
        b.setAngularDamping(0);
      } else {
        // Attached bodies stop normally, heavily damped
        b.setBodyType(RigidBodyType.Dynamic, true);
        b.setLinearDamping(10.0);
        b.setAngularDamping(10.0);

        const interval = setInterval(() => {
          try {
            if (game.mode !== 'edit') {
               // Game switched to smash mode while settling! Global setEditMode handles cleanup.
               clearInterval(interval);
               settlingIntervals.delete(b);
               return;
            }

            const lv = b.linvel();
            const av = b.angvel();
            const speedSq = lv.x * lv.x + lv.y * lv.y + lv.z * lv.z;
            const angSq = av.x * av.x + av.y * av.y + av.z * av.z;
            if (speedSq < 0.005 && angSq < 0.005) {
              b.setBodyType(RigidBodyType.KinematicPositionBased, true);
              b.setLinearDamping(0);
              b.setAngularDamping(0);
              clearInterval(interval);
              settlingIntervals.delete(b);
            }
          } catch (_err) {
            // Body was likely destroyed
            clearInterval(interval);
            settlingIntervals.delete(b);
            console.error(_err);
          }
        }, 100);
        settlingIntervals.set(b, interval);
      }
    });

    grabbedCollider = null;
    grabbedBody = null;
    grabOffset = null;
    draggedBodies = [];
  }

  /**
   * Cleans up all active intervals, caches, and controller references.
   */
  function cleanup() {
    settlingIntervals.forEach((interval) => clearInterval(interval));
    settlingIntervals.clear();
    connectedBodiesCache.clear();
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
