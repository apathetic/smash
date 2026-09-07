import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Raycaster, Vector3 } from 'three';
import { createControls } from './controls';
import { registry } from '~/game/store/registry';

type mockFn = ReturnType<typeof vi.fn>;


describe('Controls', () => {
  let mockGraphics: IGraphics;
  let mockPhysics: IPhysics;
  let controls: ReturnType<typeof createControls>;
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

  /** The raycaster the controls built for themselves in `beforeEach`. */
  const ray = () => vi.mocked(Raycaster).mock.results[0].value.ray;

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

  describe('pickUp', () => {
    // An entity pulled from the inventory tray was never under the pointer,
    // so there is nothing to cast at. It is set down under the pointer and
    // then held exactly as a grabbed entity would be.
    let entity: WorldEntity;
    let body: { setTranslation: mockFn; collider: mockFn };

    const pointerMove = () => new PointerEvent('pointermove', { pointerId: 7, clientX: 500, clientY: 300 });

    beforeEach(() => {
      body = { setTranslation: vi.fn(), collider: vi.fn().mockReturnValue(mockCollider) };
      entity = { dynamicBodies: [{ body, mesh: { position: { copy: vi.fn() } } }] } as any;
    });

    it('sets the entity down along the pointer ray without casting for it', () => {
      controls.pickUp(entity, pointerMove());

      expect(ray().at).toHaveBeenCalled();
      expect(ray().intersectPlane).not.toHaveBeenCalled();
      expect(body.setTranslation).toHaveBeenCalled();
      expect(mockPhysics.world.castShape).not.toHaveBeenCalled();
    });

    it('holds it exactly as a grabbed entity', () => {
      controls.pickUp(entity, pointerMove());

      expect(mockPhysics.dragger.start).toHaveBeenCalledWith(mockCollider, expect.anything());
      expect(mockPhysics.markEdited).toHaveBeenCalled();
      expect(controls.enabled).toBe(false);
      expect(mockGraphics.renderer.domElement.setPointerCapture).toHaveBeenCalledWith(7);
    });

    it('appears at the orbit focus when that is near enough to look tile-sized', () => {
      cameraDistance = 1;
      controls.pickUp(entity, pointerMove());

      expect(ray().at).toHaveBeenCalledWith(1, expect.anything());
    });

    it('comes nearer than the focus rather than appear smaller than its tile', () => {
      // A unit cube 1000 units out would be a speck. It is pulled in to
      // wherever it looks SPAWN_SIZE_PX across instead.
      cameraDistance = 1000;
      controls.pickUp(entity, pointerMove());

      const depth = ray().at.mock.calls[0][0];
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThan(cameraDistance);
    });

    it('drags on the camera-facing plane, like any grabbed entity', () => {
      // A ground plane is ill-conditioned from the tray: a pointer nudged
      // toward the horizon maps to a point at infinity and the entity
      // shoots away from the camera.
      controls.pickUp(entity, pointerMove());

      expect(mockGraphics.camera.getWorldDirection).toHaveBeenCalled();
    });

    it('ignores an entity with no body to hold', () => {
      controls.pickUp({ dynamicBodies: [] } as any, pointerMove());

      expect(body.setTranslation).not.toHaveBeenCalled();
      expect(mockPhysics.dragger.start).not.toHaveBeenCalled();
    });
  });

  describe('depth drag (alt)', () => {
    // Alt changes one thing: how far away the entity is. It slides along
    // the line from the camera out through it, so it holds its point on
    // screen and only grows or shrinks. Steering by the pointer's live ray
    // instead made it track the pointer's new screen position too, so it
    // climbed or sank on the way in and a drag back landed it elsewhere.
    //
    // The three mock makes vector maths inert, so the distance the
    // arithmetic starts from is the mocked Vector3.length (10 units). What
    // is asserted is the factor the drag position is scaled by.
    const DISTANCE = 10;

    const grabThenAltMove = (clientY: number) => {
      const down = new PointerEvent('pointerdown', { pointerId: 1, clientX: 500, clientY: 300 });
      Object.defineProperty(down, 'target', { value: mockGraphics.renderer.domElement, writable: false });
      mockGraphics.renderer.domElement.dispatchEvent(down);
      (mockPhysics.dragger.isDragging as any).mockReturnValue(true);
      altMove(clientY);
    };
    const altMove = (clientY: number) => {
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 500, clientY, altKey: true }));
    };
    // Only the drag position is scaled along the camera-to-entity offset
    const scales = () => vi.mocked(Vector3).mock.results
      .map((r) => r.value)
      .find((v) => v.addScaledVector.mock.calls.length)
      .addScaledVector.mock.calls.map(([, factor]: [unknown, number]) => factor);

    it('pushes the entity further away when the pointer moves up', () => {
      grabThenAltMove(200); // 100px up from the grab
      expect(scales()[0]).toBeGreaterThan(1);
    });

    it('brings it closer when the pointer moves down', () => {
      grabThenAltMove(400); // 100px down from the grab
      expect(scales()[0]).toBeLessThan(1);
    });

    it('returns it exactly where it started when dragged back the same distance', () => {
      // The whole point of scaling by a fraction of the current distance:
      // the two factors are reciprocals, so they cancel to 1 rather than
      // leaving the entity somewhere new.
      grabThenAltMove(200);
      altMove(300); // back to where the drag began

      const [out, back] = scales();
      expect(out * back).toBeCloseTo(1, 6);
    });

    it('leaves the entity on its line, rather than following the pointer', () => {
      // Following the live ray is what made it wander off in other axes.
      grabThenAltMove(200);

      expect(ray().at).not.toHaveBeenCalled();
      expect(mockPhysics.dragger.move).toHaveBeenCalled();
    });

    it('never pushes it past the far limit, however hard it is dragged', () => {
      grabThenAltMove(-100000);
      expect(scales()[0]).toBeCloseTo(90 / DISTANCE, 6);
    });

    it('never pulls it behind the camera, however hard it is dragged', () => {
      grabThenAltMove(100000);
      expect(scales()[0]).toBeCloseTo(2 / DISTANCE, 6);
    });
  });

  describe('canSpawn', () => {
    // The tray reads this to hide itself when the camera is too close in.
    const orbitChanged = () => {
      const [, listener] = (controls as any).addEventListener.mock.calls.find(([type]: [string]) => type === 'change');
      listener();
    };

    it('allows spawning at a comfortable orbit distance', () => {
      cameraDistance = 12;
      orbitChanged();
      expect(controls.canSpawn()).toBe(true);
    });

    it('refuses while the camera sits close in, so no item is spent', () => {
      expect(controls.canSpawn()).toBe(false); // the suite grabs at 5
    });

    it('tracks the orbit as the camera zooms in and back out', () => {
      cameraDistance = 2;
      orbitChanged();
      expect(controls.canSpawn()).toBe(false);

      cameraDistance = 20;
      orbitChanged();
      expect(controls.canSpawn()).toBe(true);
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