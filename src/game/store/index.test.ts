import { describe, it, expect, vi } from 'vitest';
import { Vector3, Quaternion } from 'rapier';
import { useGameState, saveEntityToStore, updateEntityFromStore, generateEntityId } from './index';

// Mock the Solid.js store
vi.mock('solid-js/store', () => ({
  createStore: vi.fn(() => [
    {
      mode: 'edit',
      environment: {},
      entities: {},
      gravity: 0,
      level: 0
    },
    vi.fn()
  ])
}));

describe('Game State', () => {
  it('should provide access to game state and setter', () => {
    const [state, setState] = useGameState();

    expect(state).toBeDefined();
    expect(setState).toBeDefined();
    expect(state.mode).toBe('edit');
  });

  it('should generate entity IDs correctly', () => {
    const id = generateEntityId('cube', 1);
    expect(id).toBe('cube_1');

    const id2 = generateEntityId('sphere', 42);
    expect(id2).toBe('sphere_42');
  });

  it('should save entity to store', () => {
    const [_, setState] = useGameState();
    const position = new Vector3(1, 2, 3);
    const rotation = new Quaternion(0, 0, 0, 1);

    saveEntityToStore('cube_1', 'cube', position, rotation);

    expect(setState).toHaveBeenCalledWith('entities', 'cube_1', {
      id: 'cube_1',
      type: 'cube',
      position: [1, 2, 3],
      rotation: [0, 0, 0, 1]
    });
  });

  it('should update entity from store', () => {
    const [state, _] = useGameState();

    // Mock the state to include an entity
    Object.defineProperty(state, 'entities', {
      value: {
        'cube_1': {
          id: 'cube_1',
          type: 'cube',
          position: [1, 2, 3],
          rotation: [0, 0, 0, 1]
        }
      }
    });

    const mockBody = {
      setTranslation: vi.fn(),
      setRotation: vi.fn()
    };

    const mockMesh = {
      position: {
        set: vi.fn()
      },
      quaternion: {
        set: vi.fn()
      }
    };

    const result = updateEntityFromStore('cube_1', mockBody as any, mockMesh as any);

    expect(result).toBe(true);
    expect(mockBody.setTranslation).toHaveBeenCalled();
    expect(mockBody.setRotation).toHaveBeenCalled();
    expect(mockMesh.position.set).toHaveBeenCalledWith(1, 2, 3);
    expect(mockMesh.quaternion.set).toHaveBeenCalledWith(0, 0, 0, 1);
  });

  it('should return false when updating non-existent entity', () => {
    const [state, _] = useGameState();

    // Mock the state with empty entities
    Object.defineProperty(state, 'entities', { value: {} });

    const mockBody = {
      setTranslation: vi.fn(),
      setRotation: vi.fn()
    };

    const mockMesh = {
      position: {
        set: vi.fn()
      },
      quaternion: {
        set: vi.fn()
      }
    };

    const result = updateEntityFromStore('non-existent', mockBody as any, mockMesh as any);

    expect(result).toBe(false);
    expect(mockBody.setTranslation).not.toHaveBeenCalled();
    expect(mockBody.setRotation).not.toHaveBeenCalled();
  });
});