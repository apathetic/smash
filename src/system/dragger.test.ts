import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RigidBodyType } from 'rapier';
import { createDragger } from './dragger';

type MockBody = ReturnType<typeof createMockBody>;

const createMockBody = (handle: number, mass: number) => ({
  handle,
  mass: vi.fn().mockReturnValue(mass),
  translation: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
  rotation: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0, w: 1 }),
  isSleeping: vi.fn().mockReturnValue(false),
  setBodyType: vi.fn(),
  setTranslation: vi.fn(),
  setRotation: vi.fn(),
  setLinvel: vi.fn(),
  setLinearDamping: vi.fn(),
  setAngularDamping: vi.fn(),
  setAdditionalMass: vi.fn(),
  lockRotations: vi.fn()
});


describe('Dragger', () => {
  let dragger: ReturnType<typeof createDragger>;
  let head: MockBody;
  let chest: MockBody;
  let hand: MockBody;

  beforeEach(() => {
    vi.clearAllMocks();

    // A miniature ragdoll: head — chest — hand, with the chest heaviest,
    // so the chest is the torso the dragger should orient the body by.
    head  = createMockBody(1, 200);
    chest = createMockBody(2, 300);
    hand  = createMockBody(3, 100);

    const bodies = [head, chest, hand];
    const joints = [
      { body1: () => head,  body2: () => chest },
      { body1: () => chest, body2: () => hand }
    ];

    const mockPhysics = {
      world: {
        getRigidBody: vi.fn().mockImplementation(
          (handle: number) => bodies.find((b) => b.handle === handle)
        ),
        impulseJoints: {
          forEachJointHandleAttachedToRigidBody: vi.fn().mockImplementation(
            (handle: number, cb: (jointHandle: number) => void) => {
              joints.forEach((j, i) => {
                if (j.body1().handle === handle || j.body2().handle === handle) cb(i);
              });
            }
          ),
          get: vi.fn().mockImplementation((i: number) => joints[i])
        }
      }
    } as unknown as IPhysics;

    dragger = createDragger(mockPhysics);
  });

  /** Grab a part, as `controls` does after a raycast hit */
  const grab = (body: MockBody) => {
    dragger.start({ parent: () => body } as any, { x: 0, y: 2, z: 0 });
  };

  it('should orient the entity by its heaviest body, whichever part is grabbed', () => {
    grab(head); // the head is held, but the chest is what keeps the body upright

    expect(chest.lockRotations).toHaveBeenCalledWith(true, true);
    expect(head.lockRotations).not.toHaveBeenCalled();
    expect(hand.lockRotations).not.toHaveBeenCalled();
  });

  it('should make the whole assembly dynamic, so gravity and the joints animate the limbs', () => {
    grab(head);

    [head, chest, hand].forEach((b) => {
      expect(b.setBodyType).toHaveBeenCalledWith(RigidBodyType.Dynamic, true);
    });
  });

  it('should weight the grabbed body against the rest of the assembly', () => {
    grab(head);

    // Without this the limbs (400kg here) negotiate the drag command away
    // through the joints and the held part tracks at a fraction of cursor
    // speed. It has to outweigh what it is hauling.
    const [added, wake] = head.setAdditionalMass.mock.calls[0];
    expect(added).toBeGreaterThan(400);
    expect(wake).toBe(true);
  });

  it('should drive the grabbed body by commanding its velocity, touching no rotation', () => {
    grab(head);

    dragger.move({ x: 5, y: 3, z: 1 });
    dragger.step(1 / 60);
    dragger.step(1 / 60);

    expect(head.setLinvel).toHaveBeenCalledTimes(2);
    [head, chest, hand].forEach((b) => {
      expect(b.setRotation).not.toHaveBeenCalled();
    });
  });

  it('should leave the connected limbs undriven, so their own inertia makes them trail', () => {
    grab(head);

    dragger.move({ x: 5, y: 3, z: 1 });
    dragger.step(1 / 60);

    // Driving them too would carry them in lockstep with the grabbed part —
    // no limb could fall behind, and the flail would disappear
    expect(chest.setLinvel).not.toHaveBeenCalled();
    expect(hand.setLinvel).not.toHaveBeenCalled();
  });

  it('should rotate the assembly only via the explicit rotate modifier', () => {
    grab(head);

    dragger.rotate(Math.PI / 4);

    [head, chest, hand].forEach((b) => {
      expect(b.setRotation).toHaveBeenCalledTimes(1);
      expect(b.setTranslation).toHaveBeenCalledTimes(1);
    });
  });

  it('should freeze the grabbed body where it was dropped, at its own mass', () => {
    grab(head);
    dragger.stop();

    expect(head.setBodyType).toHaveBeenLastCalledWith(RigidBodyType.KinematicPositionBased, true);
    expect(head.setAdditionalMass).toHaveBeenLastCalledWith(0, true); // ...for the smash
  });

  it('should damp the released limbs so they settle instead of swaying on', () => {
    grab(head);
    dragger.stop();

    [chest, hand].forEach((b) => {
      expect(b.setLinearDamping).toHaveBeenLastCalledWith(3.0);
      expect(b.setAngularDamping).toHaveBeenLastCalledWith(5.0);
    });
  });

  it('should hold the released limbs until they fall asleep, then freeze and unlock them', () => {
    grab(head);
    dragger.stop();

    // Still swinging: nothing is frozen, and the torso stays locked so the
    // body cannot flop over on its way to rest
    dragger.step(1 / 60);
    expect(chest.setBodyType).toHaveBeenLastCalledWith(RigidBodyType.Dynamic, true);
    expect(chest.lockRotations).not.toHaveBeenCalledWith(false, true);

    // Asleep — hanging in equilibrium — so now they freeze back to kinematic
    [chest, hand].forEach((b) => b.isSleeping.mockReturnValue(true));
    dragger.step(1 / 60);

    [chest, hand].forEach((b) => {
      expect(b.setBodyType).toHaveBeenLastCalledWith(RigidBodyType.KinematicPositionBased, true);
      expect(b.lockRotations).toHaveBeenLastCalledWith(false, true);
    });
  });
});
