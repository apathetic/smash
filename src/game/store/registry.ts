import { createStore } from "solid-js/store";


type EntityRegistry = {
  entities: Record<string, WorldEntity>;
  // get: (id: string) => any;
  add: (entity: WorldEntity) => void;
  remove: (entity: WorldEntity) => void;
  clear: () => void;
  each: (fn: (entity: WorldEntity) => void) => void;
};

/**
 * Entity Registry
 * This holds a list of _instantiated_ entity objects.
 */
const [store, setStore] = createStore<{entities: Record<string, WorldEntity>}>({
  entities: {}
});

const registry: EntityRegistry = {
  get entities() { return store.entities; },

  // get(id: string) {
  //   return store.entities[id];
  // },

  add (entity) {
    setStore("entities", {...store.entities, [entity.id]: entity});
  },

  remove(entity) {
    const newEntities = {...store.entities};
    delete newEntities[entity.id];
    setStore("entities", newEntities);
  },

  clear() {
    setStore("entities", {});
  },

  each(fn) {
    Object.values(store.entities).forEach(fn);
  }
};

const useRegistry: any = () => [store, setStore];


export {
  registry,
  useRegistry,
};