import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnEntity, canSpawn } from './spawnEntity';
import { useGameState } from '~/game/store';

// `add` runs the entity's `setup` for real, which is what gives it a mesh
const add = vi.fn((entity) => entity.dynamicBodies.push({ mesh: {}, body: {} }));
const holdEntity = vi.fn();
let distance = 20;
let fitted = 50;

vi.mock('~/system/world', () => ({
  useWorld: () => ({ add })
}));

vi.mock('~/system/controls', () => ({
  useControls: () => ({ holdEntity }),
  orbitDistance: () => distance
}));

vi.mock('~/system/scene', () => ({
  useGraphics: () => ({ camera: { fov: 70 } })
}));

vi.mock('~/system/projection', () => ({
  distanceForSize: () => fitted
}));


describe('spawnEntity', () => {
  const [gameState, setGameState] = useGameState();
  const event = { pointerId: 1 } as PointerEvent;

  beforeEach(() => {
    vi.clearAllMocks();
    distance = 20;
    fitted = 50;
    setGameState('mode', 'edit');
    setGameState('inventory', ['Cube', 'Cube', 'Truck']);
  });

  it('spends one item and hands the new entity straight to the drag', () => {
    const entity = spawnEntity('Cube', event);

    expect(gameState.inventory).toEqual(['Cube', 'Truck']);
    expect(add).toHaveBeenCalledWith(entity);
    expect(holdEntity).toHaveBeenCalledWith(entity, event, expect.any(Number));
  });

  it('spends only the type asked for', () => {
    spawnEntity('Truck', event);
    expect(gameState.inventory).toEqual(['Cube', 'Cube']);
  });

  it('spends nothing when none of that type is held', () => {
    spawnEntity('Rocket', event);

    expect(gameState.inventory).toEqual(['Cube', 'Cube', 'Truck']);
    expect(add).not.toHaveBeenCalled();
  });

  it('spends nothing while the camera is zoomed in too close', () => {
    // The tray is hidden then, but a drag already under way must not
    // quietly eat an item either.
    distance = 3;
    spawnEntity('Cube', event);

    expect(gameState.inventory).toEqual(['Cube', 'Cube', 'Truck']);
    expect(add).not.toHaveBeenCalled();
  });

  it('spends nothing outside edit mode', () => {
    setGameState('mode', 'smashing');
    spawnEntity('Cube', event);

    expect(add).not.toHaveBeenCalled();
  });

  describe('where it lands', () => {
    const distanceUsed = () => holdEntity.mock.calls[0][2];

    it('sets it down at the orbit focus, where the camera is already looking', () => {
      fitted = 50; // it would still look big enough out at the focus
      spawnEntity('Cube', event);

      expect(distanceUsed()).toBe(20);
    });

    it('brings it nearer than the focus rather than let it arrive a speck', () => {
      fitted = 5; // out at the focus it would be too small to see
      spawnEntity('Cube', event);

      expect(distanceUsed()).toBe(5);
    });
  });

  describe('canSpawn', () => {
    it('is true when editing at a comfortable distance', () => {
      expect(canSpawn()).toBe(true);
    });

    it('is false zoomed in past the threshold', () => {
      distance = 11;
      expect(canSpawn()).toBe(false);
    });

    it('is false outside edit mode', () => {
      setGameState('mode', 'display');
      expect(canSpawn()).toBe(false);
    });
  });
});
