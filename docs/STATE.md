# State

There are three tiers of state within the application.

---

## 1. Level data (JSON)

The data that represents each level is serialized in a number of JSON files
under [`src/game/levels/`](../src/game/levels/). This is the on-disk
definition of a level: which entities exist, and where they start.

## 2. Instantiated world entities

When those files are loaded, a series of `WorldEntity` objects are
instantiated. Each contains a ThreeJS mesh and a Rapier collider, along with
its own internal state.

Instantiated entities are stored in a registry
([`src/game/store/registry.ts`](../src/game/store/registry.ts)) so they are
available throughout the app.

## 3. Game state

Lastly there is the game state — the position, rotation, and so on of every
world entity within the scene, held in a Solid store
([`src/game/store/index.ts`](../src/game/store/index.ts)).

This is deliberately **separate** from the data each entity object contains.
Keeping it apart is what allows the level to be reset, or its state saved to
local storage, without reaching into live entity objects.

---

## Related documents

- [OVERVIEW.md](./OVERVIEW.md) — the three layers of the world, and world entities
