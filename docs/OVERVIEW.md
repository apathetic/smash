# Overview

How the world is put together, and what a "world entity" is.

---

## The three layers of the world

There are three "things" that comprise the world:

- **visual** — the 3D graphics that we actually see
  - managed by ThreeJS
- **physical** — objects and how they behave under gravity
  - also called "rigid bodies"
  - motion, joints, etc.
  - does *not* describe how objects interact with other objects
- **colliders** — how objects interact with other objects
  - managed by Rapier
  - how things move/behave when they interact (crash) into one another
  - hitting a wall, the floor, etc.

Collision groups — which entities can interact with, or be raycast against,
which others — are defined and documented in
[`src/system/constants.ts`](../src/system/constants.ts).

---

## World entities

Entities in the world need considerations for each of the three layers
above: visual, physical, and collision.

Some entities are complex — comprised of multiple meshes, rigid bodies and
colliders — so they cannot be represented by a single `mesh` or `body`. The
`ragdoll` is the clearest example: 15 bodies joined by 14 joints (see
[JOINTS.md](./JOINTS.md)).

To set up an entity's visual, physical and collision parts, we call its
`setup` method. This ensures those parts are all instantiated together.

> Previously, creating a world entity (e.g. `new Cube()`) set up its own
> physics and added itself to the physics world — but it did not do the same
> for the ThreeJS/visual world. That split was a source of bugs. A single
> `setup` keeps everything managed together, consistently.

| Method | Responsibility |
| --- | --- |
| `setup` | Instantiate the entity: add its ThreeJS visuals, its rigid bodies, and any colliders |
| `update` | Advance the entity each frame — typically syncing meshes to their bodies |
| `destroy` | Remove the entity's meshes and bodies, and dispose of its resources |

Entities extend `Base` ([`src/game/entities/Base.ts`](../src/game/entities/Base.ts)),
which holds the list of `dynamicBodies` — the mesh/body pairs that make up
the entity — and provides the default `update` and `destroy`.

---

## Related documents

- [STATE.md](./STATE.md) — the three tiers of application state
- [DRAGGING.md](./DRAGGING.md) — dragging entities with the cursor
- [JOINTS.md](./JOINTS.md) — the ragdoll's joint design
