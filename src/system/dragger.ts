import { Vector3, Quaternion } from "three";
import { RigidBodyType, RigidBodyDesc, JointData } from "rapier";
import { useGameState } from "~/game/store";
import type { RigidBody, Collider } from "rapier";

/**
 * Damping on the connected limbs while dragged. Deliberately low: the
 * limbs are never driven, so their inertia is what makes them trail and
 * flail behind a fast drag. Just enough to stop them ringing forever.
 */
const DRAG_LINEAR_DAMPING = 0.4;
const DRAG_ANGULAR_DAMPING = 1.0;

/**
 * The drag spring (a classic mouse joint): a kinematic anchor follows the
 * cursor and a stiff spring joint pulls the grabbed body's grab point to
 * it.
 *
 * - DRAG_FREQUENCY (rad/s) sets stiffness (k = m·ω²). High, so tracking
 *   error is a couple of centimetres — no visible rubber-banding.
 * - DRAG_DAMPING_RATIO ≥ 1 (c = 2ζmω) means the spring never overshoots,
 *   so the body cannot snap past the cursor and oscillate back.
 * - MAX_STRETCH (m) caps how far the anchor may lead the grab point. It
 *   is a max-force limit (F ≤ k · MAX_STRETCH): when a limb snags on
 *   terrain the spring simply stretches to its limit and the assembly
 *   stops, instead of the drag bulldozing parts through the world.
 * - GRAB_DAMPING damps the grabbed body itself. The spring's own damping
 *   only acts along its axis, so this is what stops the body circling the
 *   cursor sideways.
 */
const DRAG_FREQUENCY = 40;
const DRAG_DAMPING_RATIO = 1.2;
const MAX_STRETCH = 0.35;
const GRAB_DAMPING = 2.0;

const UP = new Vector3(0, 1, 0);

const isFiniteVec = (v: { x: number, y: number, z: number }) =>
  Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);


/**
 * Creates a dragger for the physics world.
 *
 * A kinematic anchor follows the cursor and a stiff, critically damped
 * spring joint pulls the grabbed body to it. Only the grabbed body is
 * driven — every connected limb is left completely free, so their inertia
 * makes them trail and flail behind the drag and hang under gravity.
 * Because the grabbed body is dynamic (finite mass) and the spring's
 * force is capped, nothing in the assembly can be driven hard enough to
 * detonate the solver or be bulldozed through the world.
 *
 * On release the grabbed body freezes exactly where it was dropped and
 * the limbs swing on until they fall asleep, then freeze too.
 *
 * @param physics The physics instance.
 * @returns An object containing the dragger.
 */
export function createDragger(physics: IPhysics) {
  const grabOffset = new Vector3(); // from the grab point to the grabbed body's center
  const grabWorldPoint = new Vector3();
  const dragTarget = new Vector3();
  const anchorNext = new Vector3();

  const [game] = useGameState();

  let anchorBody: RigidBody | null = null;
  let grabbedBody: RigidBody | null = null;
  let draggedBodies: RigidBody[] = [];
  let settlingBodies: RigidBody[] = [];

  /** The dragged entity can be destroyed mid-drag or mid-settle */
  const alive = (b: RigidBody) => !!physics.world.getRigidBody(b.handle);


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
   * Starts dragging a target collider.
   */
  function start(collider: Collider, hitPoint: { x: number, y: number, z: number }) {
    stop(); // Ensure cleanup

    grabbedBody = collider.parent();
    if (!grabbedBody) return;

    draggedBodies = getConnectedBodies(grabbedBody);
    settlingBodies = settlingBodies.filter((b) => !draggedBodies.some((d) => d.handle === b.handle));

    // The whole assembly goes dynamic. The limbs are then left alone —
    // no forces, no locks — so gravity and their own inertia animate them.
    //
    // NOTE: never enable CCD on these bodies. They are joined by stiff
    // joints, and CCD's time-of-impact repositioning fights the joint
    // solver and detonates the ragdoll (parts fly apart). No-explode is
    // the paramount constraint.
    draggedBodies.forEach((b) => {
      b.setBodyType(RigidBodyType.Dynamic, true);
      b.setLinearDamping(DRAG_LINEAR_DAMPING);
      b.setAngularDamping(DRAG_ANGULAR_DAMPING);
    });

    // Rotations of the grabbed part are locked so its orientation never
    // changes while held (a body-level lock — no second body involved, so
    // it cannot transmit an infinite inertia through the joint).
    grabbedBody.setLinearDamping(GRAB_DAMPING);
    grabbedBody.lockRotations(true, true);

    const pos = grabbedBody.translation();
    const rot = grabbedBody.rotation();
    grabOffset.set(pos.x - hitPoint.x, pos.y - hitPoint.y, pos.z - hitPoint.z);
    dragTarget.set(hitPoint.x, hitPoint.y, hitPoint.z);

    // Grab point in the grabbed body's local frame
    const localGrab = new Vector3(-grabOffset.x, -grabOffset.y, -grabOffset.z)
      .applyQuaternion(new Quaternion(rot.x, rot.y, rot.z, rot.w).invert());

    // Stiffness/damping scale with the grabbed body's mass, so the
    // response is identical whether you grab a hand or the torso. Gravity
    // sag is g/ω² — a few millimetres — so no weight feed-forward needed.
    const mass = grabbedBody.mass();
    const stiffness = mass * DRAG_FREQUENCY ** 2;
    const damping = 2 * DRAG_DAMPING_RATIO * mass * DRAG_FREQUENCY;

    anchorBody = physics.world.createRigidBody(
      RigidBodyDesc.kinematicPositionBased().setTranslation(hitPoint.x, hitPoint.y, hitPoint.z)
    );
    physics.world.createImpulseJoint(
      JointData.spring(0, stiffness, damping, { x: 0, y: 0, z: 0 }, localGrab),
      anchorBody,
      grabbedBody,
      true
    );
  }

  /**
   * Sets the drag target, effectively dragging an entity toward it.
   */
  function move(targetPoint: { x: number, y: number, z: number }) {
    // A cursor dragged off-screen can project to a degenerate/non-finite
    // point; ignore it so it can never poison the anchor.
    if (!isFiniteVec(targetPoint)) return;
    dragTarget.set(targetPoint.x, targetPoint.y, targetPoint.z);
  }

  /**
   * Rotates the dragged assembly around the world Y-axis through the grab point.
   */
  function rotate(deltaAngle: number) {
    if (!grabbedBody || !alive(grabbedBody)) return;

    const deltaRot = new Quaternion().setFromAxisAngle(UP, deltaAngle);
    const bodyRot = new Quaternion();
    const offset = new Vector3();
    const pos = grabbedBody.translation();

    grabWorldPoint.set(pos.x - grabOffset.x, pos.y - grabOffset.y, pos.z - grabOffset.z);
    draggedBodies.forEach((b) => {
      const t = b.translation();
      const r = b.rotation();
      offset.set(t.x - grabWorldPoint.x, t.y - grabWorldPoint.y, t.z - grabWorldPoint.z).applyQuaternion(deltaRot);
      b.setTranslation({ x: grabWorldPoint.x + offset.x, y: grabWorldPoint.y + offset.y, z: grabWorldPoint.z + offset.z }, true);
      b.setRotation(bodyRot.set(r.x, r.y, r.z, r.w).premultiply(deltaRot), true);
    });
    grabOffset.applyQuaternion(deltaRot);
  }

  /**
   * Stops dragging. The grabbed body freezes exactly where it was
   * released; the limbs keep swinging until `step` settles them.
   */
  function stop() {
    if (!grabbedBody) return;

    if (anchorBody) physics.world.removeRigidBody(anchorBody); // also removes the spring
    anchorBody = null;

    if (alive(grabbedBody)) {
      grabbedBody.setBodyType(RigidBodyType.KinematicPositionBased, true);
      grabbedBody.lockRotations(false, true);
      grabbedBody.setLinearDamping(0);
    }

    settlingBodies.push(...draggedBodies.filter((b) => b.handle !== grabbedBody!.handle && alive(b)));
    grabbedBody = null;
    draggedBodies = [];
  }

  /**
   * Called once per physics step: advances the drag anchor, and freezes
   * released bodies back to kinematic once they fall asleep.
   */
  function step(_delta: number) {
    if (grabbedBody && !alive(grabbedBody)) stop();

    if (grabbedBody && anchorBody) {
      const pos = grabbedBody.translation();

      // The anchor goes to the cursor, but never leads the grab point by
      // more than MAX_STRETCH — that cap is the spring's max force.
      grabWorldPoint.set(pos.x - grabOffset.x, pos.y - grabOffset.y, pos.z - grabOffset.z);
      anchorNext.copy(dragTarget).sub(grabWorldPoint);
      if (anchorNext.length() > MAX_STRETCH) anchorNext.setLength(MAX_STRETCH);
      anchorNext.add(grabWorldPoint);

      if (isFiniteVec(anchorNext)) anchorBody.setNextKinematicTranslation(anchorNext);
    }

    if (settlingBodies.length === 0) return;

    if (game.mode !== 'edit') {
      settlingBodies = [];
      return;
    }

    settlingBodies = settlingBodies.filter((b) => {
      if (!alive(b)) return false;

      // A limb at the apex of its swing has zero velocity but is not at
      // rest, so a velocity threshold would freeze it mid-air in a
      // gravity-defying pose. Rapier only sleeps a body after its velocity
      // stays low for a sustained window, so a swinging limb keeps going
      // until it truly hangs in equilibrium — then we freeze it there.
      if (!b.isSleeping()) return true;

      b.setBodyType(RigidBodyType.KinematicPositionBased, true);
      b.setLinearDamping(0);
      b.setAngularDamping(0);
      return false;
    });
  }

  /**
   * Cleans up all dragger state
   */
  function cleanup() {
    stop();
    settlingBodies = [];
  }

  /**
   * Checks if there is an entity currently being dragged.
   */
  function isDragging() {
    return grabbedBody !== null;
  }


  return {
    start,
    move,
    rotate,
    stop,
    step,
    cleanup,
    isDragging
  };
}
