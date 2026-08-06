import { Vector3, Quaternion } from "three";
import { RigidBodyType } from "rapier";
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
 * Damping once released. Much higher than while held: a free-swinging
 * limb is a very lightly damped pendulum and would sway for tens of
 * seconds before Rapier's sleep detector ever saw it as at rest. This
 * brings the assembly to a hanging stop in a second or two, then it
 * freezes.
 */
const SETTLE_LINEAR_DAMPING = 3.0;
const SETTLE_ANGULAR_DAMPING = 5.0;

/**
 * How heavy the grabbed body is made relative to the rest of its
 * assembly, for the duration of the drag.
 *
 * A ragdoll's limbs outweigh any one part ~5:1, so a velocity commanded
 * on the grabbed part gets negotiated away by the joints against all that
 * stationary mass (the body then tracks at a fraction of cursor speed),
 * and when the cursor stops, the limbs' momentum keeps throwing the light
 * part around (rubber-banding). A truck feels right for the opposite
 * reason: its chassis dominates its wheels.
 *
 * Making the held part dominate its own assembly reproduces that. The
 * mass stays finite, so joint and contact corrections are still shared
 * and bounded — this is nothing like the infinite mass of a kinematic
 * body. The limbs are untouched, so they still swing and flail freely;
 * they simply stop dragging the held part off the cursor.
 */
const DRAG_MASS_RATIO = 20;

/**
 * Ceiling on the grabbed body's commanded speed (m/s). The drag is
 * velocity-driven — each step the grabbed body is given exactly the
 * velocity that lands its grab point on the cursor — so tracking is exact
 * and it stops dead the moment the cursor does. This cap bounds how far
 * the body may outrun a snagged limb in one step, keeping joint
 * corrections finite.
 */
const MAX_DRAG_SPEED = 40;

const UP = new Vector3(0, 1, 0);

const isFiniteVec = (v: { x: number, y: number, z: number }) =>
  Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);


/**
 * Creates a dragger for the physics world.
 *
 * The grabbed body is velocity-driven: each step it is given exactly the
 * velocity that puts its grab point on the cursor, so it tracks exactly
 * and stops dead when the cursor stops — no spring, no lag, no rebound.
 * It stays *dynamic*, so obstacles still stop it and its joints share
 * load with finite mass rather than acting as an immovable anchor.
 *
 * Only the grabbed body is driven — every connected limb is left
 * completely free, so their own inertia makes them trail and flail behind
 * the drag and hang under gravity.
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
  const dragVelocity = new Vector3();

  const [game] = useGameState();

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

    // The grabbed body's velocity is commanded every step, so its own
    // damping would do nothing but fight the command. Weighting it against
    // the rest of the assembly is what makes that command stick: the limbs
    // can no longer negotiate it away through the joints. (A lone body has
    // nothing to outweigh, so this is a no-op for e.g. a cube.)
    const restMass = draggedBodies.reduce((sum, b) => sum + b.mass(), 0) - grabbedBody.mass();
    grabbedBody.setAdditionalMass(restMass * DRAG_MASS_RATIO, true);
    grabbedBody.setLinearDamping(0);

    // The heaviest body — a ragdoll's torso, a truck's chassis, or a
    // single-body entity itself — has its rotation locked for the whole
    // drag. That keeps the entity upright whichever part you grab: pull it
    // by a hand and the body trails along instead of flipping over, and
    // every other part still swings freely from its joints. The lock is
    // body-level (no second body involved), so it cannot transmit an
    // infinite inertia through a joint.
    draggedBodies.reduce((a, b) => (b.mass() > a.mass() ? b : a)).lockRotations(true, true);

    const pos = grabbedBody.translation();
    grabOffset.set(pos.x - hitPoint.x, pos.y - hitPoint.y, pos.z - hitPoint.z);
    dragTarget.set(hitPoint.x, hitPoint.y, hitPoint.z);
  }

  /**
   * Sets the drag target, effectively dragging an entity toward it.
   */
  function move(targetPoint: { x: number, y: number, z: number }) {
    // A cursor dragged off-screen can project to a degenerate/non-finite
    // point; ignore it so it can never poison the drive.
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

    if (alive(grabbedBody)) {
      grabbedBody.setAdditionalMass(0, true); // back to its own mass for the smash
      grabbedBody.setBodyType(RigidBodyType.KinematicPositionBased, true);
      grabbedBody.lockRotations(false, true); // frozen in place: its orientation is already fixed
    }

    // The rest keep swinging, but damped hard so they hang still within a
    // second or two. The orientation lock stays on until each body freezes,
    // so the entity can't flop over while it settles.
    draggedBodies
      .filter((b) => b.handle !== grabbedBody!.handle && alive(b))
      .forEach((b) => {
        b.setLinearDamping(SETTLE_LINEAR_DAMPING);
        b.setAngularDamping(SETTLE_ANGULAR_DAMPING);
        settlingBodies.push(b);
      });

    grabbedBody = null;
    draggedBodies = [];
  }

  /**
   * Called once per physics step: drives the grabbed body, and freezes
   * released bodies back to kinematic once they fall asleep.
   */
  function step(delta: number) {
    if (grabbedBody && !alive(grabbedBody)) stop();

    if (grabbedBody) {
      const pos = grabbedBody.translation();

      // Exactly the velocity that lands the grab point on the cursor this
      // step. When the cursor stops the remaining distance is zero, so the
      // command is zero and the body stops dead — it never coasts past and
      // springs back.
      dragVelocity.set(
        (dragTarget.x + grabOffset.x - pos.x) / delta,
        (dragTarget.y + grabOffset.y - pos.y) / delta,
        (dragTarget.z + grabOffset.z - pos.z) / delta
      );
      if (dragVelocity.length() > MAX_DRAG_SPEED) dragVelocity.setLength(MAX_DRAG_SPEED);

      if (isFiniteVec(dragVelocity)) grabbedBody.setLinvel(dragVelocity, true);
    }

    if (settlingBodies.length === 0) return;

    if (game.mode !== 'edit') {
      settlingBodies.filter(alive).forEach((b) => b.lockRotations(false, true));
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
      b.lockRotations(false, true); // no-op unless this was the orientation body
      return false;
    });
  }

  /**
   * Cleans up all dragger state
   */
  function cleanup() {
    stop();
    settlingBodies.filter(alive).forEach((b) => b.lockRotations(false, true));
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
