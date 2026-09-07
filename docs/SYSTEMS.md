# Systems, Hooks and Components

How the pieces of the app are allowed to know about each other.

The world is built from a handful of long-lived singletons — graphics,
physics, controls, timeline. Left unchecked, everything reaches for
everything: a button ends up holding the camera, and a physics module ends
up encoding a game rule. This is the arrangement that keeps that from
happening, and the reasoning behind it.

---

## The three layers

| Layer | Lives in | Owns | Knows about |
| --- | --- | --- | --- |
| **Systems** | `src/system/` | Raw capability: rendering, simulation, input | Each other, by explicit construction. *Never* the game |
| **Hooks** | `src/game/hooks/` | Game rules, and the sequencing of systems | Systems, the store, entities |
| **Components** | `src/components/`, `src/routes/` | Markup, animation, and reading input | Hooks and the store. *Nothing* below |

Dependencies point in one direction only: components depend on hooks,
hooks depend on systems, systems depend on nothing above them. A system
importing a hook is always a mistake.

### Systems know nothing about the game

A system answers *how*, never *whether*. The controls know how to raycast,
how to drag a body, and how far the camera is orbiting. Whether the player
may spawn an item at that distance is a rule about the game, so it lives in
a hook. This is the distinction that is easiest to lose and most expensive
to get back.

The test: if a rule would change when the game's design changes, it does
not belong in `src/system/`.

### Facts go down; decisions stay up

When a system holds a fact the game needs, it **publishes** the fact rather
than answering the question.

```ts
// controls.ts -- a fact about the camera
const [orbitDistance, setOrbitDistance] = createSignal(0);

// hooks/spawnEntity.ts -- a rule about the game
const SPAWN_MIN_DISTANCE = 12;
const canSpawn = () => gameState.mode === 'edit' && orbitDistance() >= SPAWN_MIN_DISTANCE;
```

The signal is reactive, so anything may read it without holding a reference
to the controls, and the controls never learn that an inventory tray
exists. The threshold sits beside the code it governs.

### Hooks are the seam

Hooks are where systems get coordinated and where game rules are applied:
`loadLevel`, `resetLevel`, `replayLevel`, `saveLevel`, `spawnEntity`. A
component that needs several systems to move together is a component that
is missing a hook.

Worked example — pulling an item from the inventory tray:

| Step | Where | Why there |
| --- | --- | --- |
| Detect the pointer leaving the tile | `Inventory.jsx` | A gesture is presentation |
| Refuse if zoomed in, or not editing | `spawnEntity.ts` | A game rule |
| Spend the item from the inventory | `spawnEntity.ts` | A game rule |
| Instantiate and insert the entity | `spawnEntity.ts` → `world.add` | Sequencing systems |
| Place it under the pointer and drag it | `controls.pickUp` | Projection maths: pure capability |

`Inventory.jsx` imports one hook and the store. It cannot name a system,
so it cannot grow a dependency on one by accident.

---

## The singletons

Each system is created once and reached through a `use` hook of the same
shape: `useGraphics`, `usePhysics`, `useControls`, `useTimeline`,
`useWorld`. Passing props constructs it; calling bare returns the existing
instance. Most throw if there isn't one yet; `usePhysics` is the exception
and builds itself on demand, since it needs nothing from the DOM.

```ts
const controls = useControls({ graphics, physics }); // construct
const controls = useControls();                      // retrieve
```

Two rules keep this from decaying:

**A system is reached through its own hook, never through another.** The
world builds the controls, exactly as it builds the physics, but it does
not re-export them. Anything that wants the controls calls `useControls()`.
Re-exporting turns one dependency into two: callers end up bound to the
world *and* to whatever it happens to expose.

**Construction happens at the composition root.** `Stage.jsx` owns the
`<canvas>`, so it calls `useWorld(canvas)` and the whole graph is built
underneath. Everything else is retrieval.

---

## Where the code deviates today

Two places predate the three layers and still reach past the hooks:

- **`routes/index.jsx`** builds the title screen's demo scene by hand,
  driving `useWorld`, `useTimeline`, `useGraphics` and `usePhysics`
  directly. It is a level loader that never became a hook.
- **`routes/smash.jsx`** polls `physics.isSettled()` on a timer to decide
  when a smash has finished. That is a game rule reading a system directly.

Both would become hooks alongside `loadLevel` and `replayLevel`. Neither is
load-bearing for anything else, so the fix is confined to those files.

---

## Known limitation: the systems are global state

Each system keeps its one instance in a module-scoped variable —
`graphicsHandle`, `physicsHandle`, `controlsHandle`, `timelineHandle`,
`worldHandle` — and every call to `useGraphics()`, `usePhysics()` and the
rest hands back that same object. Nothing is passed in. The instance is
simply *there*, reachable by anything that imports the module.

That has three costs, all of them real in this codebase today.

**Nothing enforces the dependency direction.** 
Components depend on hooks, and hooks depend on systems, because that is the convention. 

**Tests replace modules rather than being handed objects.** Since a system
cannot be passed to the code under test, a test has to intercept the import
instead: `vi.mock('~/system/world', ...)`. The instance also outlives each
test in a file, so state gets reset between cases rather than built fresh.

**There can only ever be one of each.** `EntityIcon.jsx` sets up a real
entity in a throwaway scene to draw a tray tile, and the entity's `setup`
insists on somewhere to put its rigid bodies. A second physics world is not
available, so the component hands over a hand-written stub:

```js
const fakePhysics = {
  createRigidBody: () => ({}),
  createCollider: () => ({})
};

entity.setup(scene, fakePhysics);
```

The remedy is dependency injection: build the systems once at the root and
pass them down through a Solid context, so a component is *given* what it
needs instead of importing it. The dependency direction then follows from
what each caller was handed, tests supply fakes directly, and a second
world costs nothing.

It would touch every system, every hook and every test, which is why it has
not been done. Worth revisiting when a second world is genuinely needed, or
when the stub above starts having to grow.

---

## Related documents

- [OVERVIEW.md](./OVERVIEW.md) — the three layers of the world, and world entities
- [STATE.md](./STATE.md) — the three tiers of application state
- [DRAGGING.md](./DRAGGING.md) — dragging entities with the cursor
