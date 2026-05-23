import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadLevel } from './loadLevel';


const add = vi.fn();
const clear = vi.fn();
vi.mock('~/system/world', () => ({
  useWorld: () => ({ add, clear, save: vi.fn(), start: vi.fn(), stop: vi.fn() })
}));

const mockGameData = {
  entities: [{ type: 'Cube', position: [1, 2, 3], rotation: [0, 0, 0, 1] }],
  environment: [{ type: 'Terrain', position: [0, 0, 0] }]
};
vi.mock('~/game/levels/1-discovery.json', () => ({
  default: mockGameData
}));



describe('loadLevel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load a level and add entities to the world', async () => {

    await loadLevel('1-discovery');

    expect(clear).toHaveBeenCalled();
    expect(add).toHaveBeenCalledTimes(3); // Cube, Terrain, + RagDoll (always added)
  });

  it('should handle errors when loading a non-existent level', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Test with a level that doesn't exist
    await loadLevel('nonexistent');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});