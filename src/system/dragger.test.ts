import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RigidBodyType } from 'rapier';
import { createDragger } from './dragger';

type MockBody = ReturnType<typeof createMockBody>;

const createMockBody = (handle: number, mass: number) => ({
  handle,
  mass: vi.fn().mockReturnValue(mass),
  translation: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
  rotation: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0, w: 1 }),
  linvel: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
  angvel: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
  isSleeping: vi.fn().mockReturnValue(false),
  setBodyType: vi.fn(),
  setTranslation: vi.fn(),
  setRotation: vi.fn(),
  setLinvel: vi.fn(),
  setLinearDamping: vi.fn(),
  setAngularDamping: vi.fn(),
  setNextKinematicTranslation: vi.fn(),
  lockRotations: vi.fn(),
  enableCcd: vi.fn()
});


describe('Dragger', () => {
  let dragger: ReturnType<typeof createDragger>;
  let head: MockBody;
  let chest: MockBody;
  let hand: MockBody;
  let controller: {
    setApplyImpulsesToDynamicBodies: ReturnType<typeof vi.fn>;
    computeColliderMovement: ReturnType<typeof vi.fn>;
    computedMovement: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // A miniature ragdoll: chest is the heaviest part (the torso)
    head  = createMockBody(1, 200);
    chest = createMockBody(2, 300);
    hand  = createMockBody(3, 100);

    controller = {
      setApplyImpulsesToDynamicBodies: vi.fn(),
      computeColliderMovement: vi.fn(),
      computedMovement: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 })
    };

    const bodies = [head, chest, hand];
    const joints = [
      { body1: () => head,  body2: () => chest },
      { body1: () => chest, body2: () => hand }
    ];

    const mockPhysics = {
      world: {
        createCharacterController: vi.fn().mockReturnValue(controller),
        removeCharacterController: vi.fn(),
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

  const grab = (body: MockBody) => {
    dragger.start({ parent: () => body } as any, { x: 0, y: 2, z: 0 });
  };

  it('should lock the orientation of the heaviest body (the torso) when a drag starts', () => {
    grab(head); // grab the head; the chest should still be the anchor of orientation

    expect(chest.lockRotations).toHaveBeenCalledWith(true, true);
    expect(head.lockRotations).not.toHaveBeenCalled();
    expect(hand.lockRotations).not.toHaveBeenCalled();
  });

  it('should drive the grabbed body kinematically, without touching any rotation', () => {
    grab(head);

    expect(head.setBodyType).toHaveBeenLastCalledWith(RigidBodyType.KinematicPositionBased, true);

    dragger.move({ x: 5, y: 3, z: 1 });
    dragger.step(1 / 60);
    dragger.step(1 / 60);

    expect(controller.computeColliderMovement).toHaveBeenCalledTimes(2);
    expect(head.setNextKinematicTranslation).toHaveBeenCalledTimes(2);
    [head, chest, hand].forEach((b) => {
      expect(b.setRotation).not.toHaveBeenCalled();
    });
  });

  it('should carry the connected bodies with the drag velocity, not through the joints', () => {
    grab(head);

    dragger.move({ x: 5, y: 3, z: 1 });
    dragger.step(1 / 60);

    // The kinematic grabbed body must not yank the limbs via infinite-mass
    // joints: each connected body is given the bulk drag velocity instead
    expect(chest.setLinvel).toHaveBeenCalled();
    expect(hand.setLinvel).toHaveBeenCalled();
  });

  it('should rotate the assembly only via the explicit rotate modifier', () => {
    grab(head);

    dragger.rotate(Math.PI / 4);

    [head, chest, hand].forEach((b) => {
      expect(b.setRotation).toHaveBeenCalledTimes(1);
    });
  });

  it('should release the grabbed body as dynamic, carrying the drag velocity', () => {
    grab(head);
    dragger.stop();

    expect(head.setBodyType).toHaveBeenLastCalledWith(RigidBodyType.Dynamic, true);
    expect(head.setLinvel).toHaveBeenCalled();
  });

  it('should keep the torso lock until the released bodies come to rest', () => {
    grab(head);
    dragger.stop();

    // Still locked right after release, so the entity cannot reorient while coasting
    expect(chest.lockRotations).not.toHaveBeenCalledWith(false, true);

    // Bodies report zero velocity, so the next step freezes and unlocks them
    dragger.step(1 / 60);

    [head, chest, hand].forEach((b) => {
      expect(b.setBodyType).toHaveBeenLastCalledWith(RigidBodyType.KinematicPositionBased, true);
      expect(b.lockRotations).toHaveBeenLastCalledWith(false, true);
    });
  });
});
