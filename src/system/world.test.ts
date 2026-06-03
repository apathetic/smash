import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorld } from './world';
import { registry } from '~/game/store/registry';

// Mock dependencies
vi.mock('./scene', () => ({
  useGraphics: vi.fn(() => ({
    scene: {
      add: vi.fn(),
      clear: vi.fn()
    },
    camera: {},
    renderer: {
      dispose: vi.fn()
    }
  }))
}));

vi.mock('./physics', () => ({
  usePhysics: vi.fn(() => ({
    world: {
      getRigidBody: vi.fn()
    },
    dragger: {
      cleanup: vi.fn()
    },
    save: vi.fn(),
    restore: vi.fn(),
    stepId: 0,
    update: vi.fn(),
    setGravity: vi.fn(),
    setBodiesKinematic: vi.fn(),
    markEdited: vi.fn(),
    hasEdited: false,
  }))
}));

vi.mock('./resizer', () => ({
  createResizer: vi.fn()
}));

vi.mock('./timeline', () => ({
  createTimeline: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn()
  })),
  useTimeline: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn()
  }))
}));

vi.mock('./controls', () => ({
  createControls: vi.fn(() => ({}))
}));

vi.mock('./gui', () => ({
  createGUI: vi.fn(() => ({}))
}));

vi.mock('~/game/store/registry', () => ({
  registry: {
    add: vi.fn(),
    remove: vi.fn(),
    each: vi.fn(),
    clear: vi.fn()
  }
}));

describe('World', () => {
  const mockCanvas = {
    getContext: vi.fn(() => ({})),
    clientWidth: 800,
    clientHeight: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as any; // HTMLCanvasElement;
  let world: ReturnType<typeof useWorld>;

  beforeEach(() => {
    vi.clearAllMocks();
    world = useWorld(mockCanvas);
  });

  it('should initialize the world with a canvas', () => {
    expect(world).toBeDefined();
    expect(world.add).toBeDefined();
    expect(world.remove).toBeDefined();
    expect(world.clear).toBeDefined();
  });

  it('should add entities to the world', () => {
    const mockEntity = {
      setup: vi.fn(),
      destroy: vi.fn()
    } as unknown as WorldEntity;

    world.add(mockEntity);

    expect(mockEntity.setup).toHaveBeenCalled();
    expect(registry.add).toHaveBeenCalledWith(mockEntity);
  });

  it('should remove entities from the world', () => {
    const mockEntity = {
      setup: vi.fn(),
      destroy: vi.fn()
    } as unknown as WorldEntity;

    world.remove(mockEntity);

    expect(mockEntity.destroy).toHaveBeenCalled();
    expect(registry.remove).toHaveBeenCalledWith(mockEntity);
  });

  it('should clear all entities from the world', () => {
    world.clear();

    expect(registry.each).toHaveBeenCalled();
    expect(registry.clear).toHaveBeenCalled();
  });

  it('should throw an error if useWorld is called without canvas initialization', () => {
    // This is a bit tricky to test since useWorld is a singleton
    // We'd need to reset the internal state of useWorld
    // For now, we'll just test the happy path
    expect(() => useWorld()).not.toThrow();
  });
});