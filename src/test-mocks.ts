import { vi } from 'vitest';

vi.mock('rapier', () => ({
  World: vi.fn().mockImplementation(() => ({
    gravity: { x: 0, y: 0, z: 0 },
    integrationParameters: { numSolverIterations: 4 },
    step: vi.fn(),
    forEachRigidBody: vi.fn(),
    castRay: vi.fn().mockReturnValue({
      collider: {
        parent: vi.fn().mockReturnValue({
          setBodyType: vi.fn(),
          setTranslation: vi.fn(),
          setRotation: vi.fn()
        }),
        setActiveCollisionTypes: vi.fn()
      },
      toi: 1.0
    })
  })),
  EventQueue: vi.fn().mockImplementation(() => ({
    drainContactForceEvents: vi.fn()
  })),
  RigidBodyType: { KinematicPositionBased: 1, Dynamic: 2 },
  Ray: vi.fn(),
  QueryFilterFlags: { ONLY_DYNAMIC: 1 },
  ActiveCollisionTypes: { DEFAULT: 1, KINEMATIC_FIXED: 2 },
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
  Quaternion: vi.fn().mockImplementation((x = 0, y = 0, z = 0, w = 1) => ({ x, y, z, w })),
  RigidBodyDesc: vi.fn().mockImplementation(() => ({
    setTranslation: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
    setAdditionalMass: vi.fn().mockReturnThis(),
    setLinearDamping: vi.fn().mockReturnThis(),
    setAngularDamping: vi.fn().mockReturnThis()
  })),
  ColliderDesc: vi.fn().mockImplementation(() => ({
    setTranslation: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
    setSensor: vi.fn().mockReturnThis(),
    setActiveCollisionTypes: vi.fn().mockReturnThis()
  }))
}));

vi.mock('three', () => ({
  Vector2: vi.fn().mockImplementation((x, y) => ({ x, y })),
  Vector3: vi.fn().mockImplementation((x, y, z) => ({ x, y, z })),
  Plane: vi.fn().mockImplementation(() => ({
    constant: 0,
    normal: { x: 0, y: 0, z: 1 }
  })),
  Raycaster: vi.fn().mockImplementation(() => ({
    setFromCamera: vi.fn(),
    ray: {
      origin: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: -1 },
      intersectPlane: vi.fn().mockReturnValue({ x: 1, y: 2, z: 0 })
    }
  }))
}));

vi.mock('controls', () => ({
  OrbitControls: vi.fn().mockImplementation(() => ({
    minDistance: 0,
    maxDistance: 0,
    maxPolarAngle: 0,
    enabled: true
  }))
}));



/* * /

// vi.mock('solid-js', () => ({
//   createEffect: vi.fn((callback) => callback()),
//   onCleanup: vi.fn()
// }));



vi.mock('~/game/store', () => ({
  useGameState: vi.fn(() => [{ mode: 'edit' }])
}));

vi.mock('~/game/store/registry', () => ({
  registry: {
    add: vi.fn(),
    remove: vi.fn(),
    each: vi.fn(),
    clear: vi.fn()
  }
}));

vi.mock('~/system/scene', () => ({
  createScene: vi.fn(() => ({
    scene: {
      add: vi.fn()
    }
  })),
  createLights: vi.fn(() => [])
}));



vi.mock('~/system/resizer', () => ({
  createResizer: vi.fn()
}));

vi.mock('~/system/timeline', () => ({
  createTimeline: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn()
  }))
}));

vi.mock('~/system/controls', () => ({
  createControls: vi.fn(() => ({}))
}));

vi.mock('~/system/gui', () => ({
  createGUI: vi.fn(() => ({}))
}));



// // Mock the entity classes
// vi.mock('~/game/entities/Cube', () => ({
//   Cube: class {
//     constructor(data) {
//       this.data = data;
//     }
//   }
// }));

// vi.mock('~/game/entities/Ragdoll', () => ({
//   RagDoll: class {
//     constructor(data) {
//       this.data = data;
//     }
//   }
// }));

// vi.mock('~/game/environment/Floor', () => ({
//   Floor: class {
//     constructor() {}
//   }
// }));

// vi.mock('~/game/environment/Terrain', () => ({
//   Terrain: class {
//     constructor(data) {
//       this.data = data;
//     }
//   }
// }));

/* */
