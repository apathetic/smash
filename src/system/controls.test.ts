import { describe, it, expect, vi, beforeEach } from 'vitest';
// import { Vector3 } from 'three';
import { createControls } from './controls';
import { registry } from '~/game/store/registry';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type mockFn = ReturnType<typeof vi.fn>;


describe('Controls', () => {
  let mockGraphics: IGraphics;
  let mockPhysics: IPhysics;
  let controls: OrbitControls;
  let cameraDistance: number;
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

    // grabRadius() converts a screen-space tolerance through the camera,
    // so fov and the orbit distance have to be real numbers.
    cameraDistance = 5;

    mockGraphics = {
      camera: {
        fov: 75,
        position: { distanceTo: () => cameraDistance },
        getWorldDirection: vi.fn().mockImplementation((v) => {
          v.set(0, 0, -1);
          return v;
        })
      } as any,
      renderer: {
        domElement: (() => {
          const canvas = document.createElement('canvas') as any;
          canvas.setPointerCapture = vi.fn();
          canvas.releasePointerCapture = vi.fn();
          canvas.hasPointerCapture = vi.fn().mockReturnValue(true);
          return canvas;
        })()
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
      cleanup: vi.fn(),
      stop: vi.fn(),
      rotate: vi.fn()
    };

    mockPhysics = {
      world: {
        castShape: vi.fn().mockReturnValue({
          collider: mockCollider,
          time_of_impact: 1.0,
          // the contact point on the collider, in world space
          witness1: { x: 1, y: 2, z: 3 }
        }),
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

  it('should handle pointer down event in edit mode', () => {
    const event = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 500,
      clientY: 300
    });

    Object.defineProperty(event, 'target', { value: mockGraphics.renderer.domElement, writable: false });
    mockGraphics.renderer.domElement.dispatchEvent(event);

    expect(mockPhysics.world.castShape).toHaveBeenCalled();
    expect(mockPhysics.dragger.start).toHaveBeenCalled();
    expect(mockGraphics.renderer.domElement.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('should handle pointer move event when an object is selected', () => {
    // First select an object
    const downEvent = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 500,
      clientY: 300
    });

    Object.defineProperty(downEvent, 'target', { value: mockGraphics.renderer.domElement, writable: false });
    mockGraphics.renderer.domElement.dispatchEvent(downEvent);

    // Mock that we are dragging
    (mockPhysics.dragger.isDragging as any).mockReturnValue(true);

    // Then move the mouse/pointer
    const moveEvent = new PointerEvent('pointermove', {
      pointerId: 1,
      clientX: 600,
      clientY: 400
    });

    window.dispatchEvent(moveEvent);
    expect(mockPhysics.dragger.move).toHaveBeenCalled();
  });

  it('should handle pointer up event and reset the selected body', () => {
    // First select an object
    const downEvent = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 500,
      clientY: 300
    });

    Object.defineProperty(downEvent, 'target', { value: mockGraphics.renderer.domElement, writable: false });
    mockGraphics.renderer.domElement.dispatchEvent(downEvent);

    // Then release the mouse/pointer
    const upEvent = new PointerEvent('pointerup', { pointerId: 1 });
    window.dispatchEvent(upEvent);

    // The dragger should be stopped
    expect(mockPhysics.dragger.stop).toHaveBeenCalled();
    expect(mockGraphics.renderer.domElement.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  describe('grab tolerance', () => {
    // A fingertip is ~40px across and a ragdoll's grab handles are a
    // ~36px strip on a phone, so the pick is swept as a small ball. What
    // gets grabbed is unchanged -- only the precision required.
    const castArgs = () => (mockPhysics.world.castShape as any).mock.calls[0];

    const pointerDown = () => {
      const event = new PointerEvent('pointerdown', { pointerId: 1, clientX: 500, clientY: 300 });
      Object.defineProperty(event, 'target', { value: mockGraphics.renderer.domElement, writable: false });
      mockGraphics.renderer.domElement.dispatchEvent(event);
    };

    it('sweeps a ball rather than casting a bare ray', () => {
      pointerDown();
      expect(mockPhysics.world.castRay).toBeUndefined();
      expect(mockPhysics.world.castShape).toHaveBeenCalled();
      expect(castArgs()[3].radius).toBeGreaterThan(0);
    });

    it('grabs exactly what the cast reports, with no substitution', () => {
      pointerDown();
      expect(mockPhysics.dragger.start).toHaveBeenCalledWith(mockCollider, expect.anything());
    });

    it('scales the radius with camera distance so the tolerance stays screen-space', () => {
      pointerDown();
      const near = castArgs()[3].radius;

      (mockPhysics.world.castShape as any).mockClear();
      cameraDistance = 20; // 4x further out
      pointerDown();
      const far = (mockPhysics.world.castShape as any).mock.calls[0][3].radius;

      expect(far).toBeGreaterThan(near);
      expect(far / near).toBeCloseTo(4, 1);
    });

    it('filters the cast to grabbable colliders', () => {
      pointerDown();
      const predicate = castArgs()[11];

      const draggablePart = { parent: () => ({ handle: 1 }) };
      const limb = { parent: () => ({ handle: 2 }) };
      vi.spyOn(registry, 'findPart').mockImplementation((handle: number) =>
        handle === 2 ? ({ draggable: false } as any) : ({ draggable: true } as any)
      );

      expect(predicate(draggablePart)).toBe(true);
      expect(predicate(limb)).toBe(false);
    });

    it('treats a body in no entity as grabbable (a plain cube)', () => {
      pointerDown();
      const predicate = castArgs()[11];
      vi.spyOn(registry, 'findPart').mockReturnValue(undefined);

      expect(predicate({ parent: () => ({ handle: 9 }) })).toBe(true);
    });

    it('rejects a collider with no rigid body', () => {
      pointerDown();
      const predicate = castArgs()[11];
      expect(predicate({ parent: () => null })).toBe(false);
    });

    it('grabs at the contact point, not the centre of the swept ball', () => {
      // The ball's centre stops a radius clear of the surface -- and a
      // radius to the *side* of it for an off-centre grab. That point is
      // what dragger.rotate() pivots around, so using it swings the
      // entity around a column floating beside it.
      pointerDown();

      const point = (mockPhysics.dragger.start as any).mock.calls[0][1];
      expect(point).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('leaves orbit controls enabled when the cast finds nothing', () => {
      (mockPhysics.world.castShape as any).mockReturnValue(null);
      pointerDown();

      expect(mockPhysics.dragger.start).not.toHaveBeenCalled();
      expect(controls.enabled).toBe(true);
    });
  });

  it.skip('should not interact with objects when not in edit mode', () => {
    // Mock game state to be in 'smash' mode
    vi.mocked(require('~/game/store').useGameState).mockReturnValue([{ mode: 'smash' }]);

    // Recreate controls with new game state
    controls = createControls({ graphics: mockGraphics, physics: mockPhysics });

    const event = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 500,
      clientY: 300
    });

    window.dispatchEvent(event);

    // No ray casting should happen in smash mode
    expect(mockPhysics.world.castRay).not.toHaveBeenCalled();
  });
});