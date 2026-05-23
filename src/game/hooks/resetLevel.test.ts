import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetLevel } from './resetLevel';
import { registry } from '~/game/store/registry';

// Mock dependencies
vi.mock('~/game/store', () => ({
  useGameState: vi.fn(() => [
    {
      entities: {
        'cube_1': {
          id: 'cube_1',
          type: 'cube',
          position: [1, 2, 3],
          rotation: [0, 0, 0, 1]
        }
      }
    },
    vi.fn()
  ])
}));

vi.mock('~/game/store/registry', () => ({
  registry: {
    each: vi.fn((callback) => {
      // Mock entities in registry
      const entities = [
        { id: 'cube_1', reset: vi.fn() },
        { id: 'cube_2', reset: vi.fn() }
      ];

      entities.forEach(entity => callback(entity));
    })
  }
}));

describe('resetLevel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reset all entities in the registry', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await resetLevel();

    expect(registry.each).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Resetting level');
    expect(consoleSpy).toHaveBeenCalledWith('Level reset complete');

    consoleSpy.mockRestore();
  });
});