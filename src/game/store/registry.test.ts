import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registry } from './registry';

describe('Registry', () => {
  // Mock entity for testing
  const mockEntity = {
    id: 'test-entity-1',
    setup: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  } as unknown as WorldEntity;

  const mockEntity2 = {
    id: 'test-entity-2',
    setup: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  } as unknown as WorldEntity;

  beforeEach(() => {
    // Clear registry before each test
    registry.clear();
    vi.clearAllMocks();
  });

  it('should add entities to the registry', () => {
    registry.add(mockEntity);
    expect(registry.size()).toBe(1);
  });

  it('should remove entities from the registry', () => {
    registry.add(mockEntity);
    registry.remove(mockEntity);
    expect(registry.size()).toBe(0);
  });

  it('should clear all entities from the registry', () => {
    registry.add(mockEntity);
    registry.add(mockEntity2);
    expect(registry.size()).toBe(2);

    registry.clear();
    expect(registry.size()).toBe(0);
  });

  it('should iterate over all entities', () => {
    registry.add(mockEntity);
    registry.add(mockEntity2);

    const callback = vi.fn();
    registry.each(callback);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls[0][0]).toBe(mockEntity);
    expect(callback.mock.calls[1][0]).toBe(mockEntity2);
  });

  it('should get entity by id', () => {
    registry.add(mockEntity);
    registry.add(mockEntity2);

    const entity = registry.get('test-entity-1');
    expect(entity).toBe(mockEntity);

    const entity2 = registry.get('test-entity-2');
    expect(entity2).toBe(mockEntity2);
  });

  it('should return undefined for non-existent entity id', () => {
    const entity = registry.get('non-existent');
    expect(entity).toBeUndefined();
  });

  it('should implement get method to retrieve entities by id', () => {
    registry.add(mockEntity);
    registry.add(mockEntity2);

    const entity = registry.get('test-entity-1');
    expect(entity).toBe(mockEntity);

    const entity2 = registry.get('test-entity-2');
    expect(entity2).toBe(mockEntity2);

    const nonExistent = registry.get('non-existent');
    expect(nonExistent).toBeUndefined();
  });
});