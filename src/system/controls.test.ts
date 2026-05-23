import { describe, it, expect, vi, beforeEach } from 'vitest';
// import { Vector3 } from 'three';
import { createControls } from './controls';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type mockFn = ReturnType<typeof vi.fn>;


describe('Controls', () => {
  let mockGraphics: IGraphics;
  let mockPhysics: IPhysics;
  let controls: OrbitControls;
  let mockCollider: {
    parent: () => {
      setBodyType: mockFn;
      setTranslation: mockFn;
      setNextKinematicTranslation: mockFn;
    };
    setActiveCollisionTypes: mockFn;
  };
  // let mockRigidBody: {
  //   setBodyType: mockFn;
  //   setTranslation: mockFn;
  // };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock objects
    mockCollider = {
      parent: vi.fn().mockReturnValue({
        setBodyType: vi.fn(),
        setTranslation: vi.fn(),
        translation: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
        handle: 123,
        setLinvel: vi.fn(),
        setAngvel: vi.fn(),
        wakeUp: vi.fn(),
        setLinearDamping: vi.fn(),
        setAngularDamping: vi.fn(),
        setNextKinematicTranslation: vi.fn()
      }),
      setActiveCollisionTypes: vi.fn()
    };

    // mockRigidBody = {
    //   setBodyType: vi.fn(),
    //   setTranslation: vi.fn()
    // };

    mockGraphics = {
      camera: {
        getWorldDirection: vi.fn().mockImplementation((v) => {
          v.set(0, 0, -1);
          return v;
        })
      } as any,
      renderer: {
        domElement: {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        } as any
      } as any,
      scene: {
        add: vi.fn()
      } as any,
      // update: vi.fn()
    };

    const mockDragger = {
      isDragging: vi.fn().mockReturnValue(false),
      start: vi.fn(),
      move: vi.fn(),
      cleanup: vi.fn()
    };

    mockPhysics = {
      world: {
        castRay: vi.fn().mockReturnValue({
          collider: mockCollider,
          toi: 1.0 // time of impact
        }),
        createCharacterController: vi.fn().mockImplementation(() => ({
          setApplyImpulsesToDynamicBodies: vi.fn().mockReturnThis(),
          enableAutostep: vi.fn().mockReturnThis(),
          enableSnapToGround: vi.fn().mockReturnThis(),
          computeColliderMovement: vi.fn(),
          computedMovement: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 })
        })),
        impulseJoints: {
          forEachJointHandleAttachedToRigidBody: vi.fn(),
          get: vi.fn()
        }
      } as any,
      dragger: mockDragger,
      markEdited: vi.fn(),
      collisions: vi.fn(),
      update: vi.fn()
    } as any;

    // Create controls
    controls = createControls({ graphics: mockGraphics, physics: mockPhysics });

  });

  it('should initialize controls with the correct settings', () => {
    expect(controls).toBeDefined();
  });

  it('should handle mouse down event in edit mode', () => {
    const event = new MouseEvent('mousedown', {
      clientX: 500,
      clientY: 300
    });

    window.dispatchEvent(event);

    expect(mockPhysics.world.castRay).toHaveBeenCalled();
    expect(mockCollider.parent().setBodyType).toHaveBeenCalled();
  });

  it('should handle mouse move event when an object is selected', () => {
    // First select an object
    const downEvent = new MouseEvent('mousedown', {
      clientX: 500,
      clientY: 300
    });

    window.dispatchEvent(downEvent);

    // Then move the mouse
    const moveEvent = new MouseEvent('mousemove', {
      clientX: 600,
      clientY: 400
    });

    window.dispatchEvent(moveEvent);

    // The selected body should have its position updated
    expect(mockCollider.parent().setNextKinematicTranslation).toHaveBeenCalled();
  });

  it('should handle mouse up event and reset the selected body', () => {
    // First select an object
    const downEvent = new MouseEvent('mousedown', {
      clientX: 500,
      clientY: 300
    });

    window.dispatchEvent(downEvent);

    // Then release the mouse
    const upEvent = new MouseEvent('mouseup');
    window.dispatchEvent(upEvent);

    // The body type should be reset to Dynamic
    expect(mockCollider.parent().setBodyType).toHaveBeenCalledTimes(2);
  });

  it.skip('should not interact with objects when not in edit mode', () => {
    // Mock game state to be in 'smash' mode
    vi.mocked(require('~/game/store').useGameState).mockReturnValue([{ mode: 'smash' }]);

    // Recreate controls with new game state
    controls = createControls({ graphics: mockGraphics, physics: mockPhysics });

    const event = new MouseEvent('mousedown', {
      clientX: 500,
      clientY: 300
    });

    window.dispatchEvent(event);

    // No ray casting should happen in smash mode
    expect(mockPhysics.world.castRay).not.toHaveBeenCalled();
  });
});