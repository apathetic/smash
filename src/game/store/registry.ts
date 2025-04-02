/**
 * Entity Registry
 *
 * A central store for all active entities in the game world.
 * Provides methods to add, remove, and iterate over entities.
 */
class EntityRegistry {
  private entities: Map<string, WorldEntity> = new Map();

  /**
   * Get all entities as a record
   */
  // get entities(): Record<string, WorldEntity> {
  //   return Object.fromEntries(this.entities);
  // }

  /**
   * Get an entity by ID
   */
  get(id: string): WorldEntity | undefined {
    return this.entities.get(id);
  }

  /**
   * Add an entity to the registry
   */
  add(entity: WorldEntity): void {
    if (!entity.id) {
      console.warn('Entity added to registry without an ID');
      return;
    }
    this.entities.set(entity.id, entity);
  }

  /**
   * Remove an entity from the registry
   */
  remove(entity: WorldEntity): void {
    if (!entity.id) return;
    this.entities.delete(entity.id);
  }

  /**
   * Execute a callback for each entity in the registry
   */
  each(fn: (entity: WorldEntity) => void): void {
    this.entities.forEach(fn);
  }

  /**
   * Clear all entities from the registry
   */
  clear(): void {
    this.entities.clear();
  }

  /**
   * Get the number of entities in the registry
   */
  size(): number {
    return this.entities.size;
  }
}

// Export a singleton instance
export const registry = new EntityRegistry();