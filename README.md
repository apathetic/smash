# SMASH

READY SET SMASH



## Quick Start

```bash
$ pnpm install
```
Setup the project, install dependencies:

<br />

```bash
$ pnpm dev
```
Runs the app in the development mode.<br>
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

<br />

```
$ pnpm build
```
Builds the app for production to the `dist` folder.<br>

<br />

```pnpm start```

```pnpm check```

Checks typescript correctness

```pnpm lint```
Runs linting against the code.


## Overview

There are three "things" that comprise the world

- visual: the 3D graphics that we actually see
  - these things are managed by ThreeJS
  - ...
- physical: objects and how they behave in gravity.
  - also called "rigid bodies"
  - motion, joints, etc.
  - does NOT detail how objects interact w/ other objects
- colliders: how objects interact w/ other objects
  - managed by Rapier
  - how things move/behave when the interact (crash) into one another
  - hitting a wall, the floor, etc.


## World Entities

"Entities" in the world, as defined above, will need considerations for each of: visual, physical, and collision

Because some entities are complex, comprised of multiple meshes, rigid bodies, colliders, etc, they cannot be represented in a single `mesh` or `body`.
The `ragdoll`, for example.

To set up an `Entity's` visual, physical and collision bits, we call its `setup` method.
This ensures that these bits are all instantiated together.
Note: previously, when we created a new (world) entity (e.g. new Cube()), it set up its own physics, adding itself into the (physics) world; however, it didn't do the same for the (three/visual) world.
This was a little problematic.
So, we can solve that using a `setup` fn where everything is managed together, consistently

```setup```: Instantiate the WorldEntity, getting its visual (ThreeJS) bits aadded, its rigidBody(s) setup, and any colliders setup.

```update```

```remove```






## State


There are three tiers of state within the application

First, data that represents each level is serialized in a number of JSON files.

When those files are loaded, a series of worldEntity objects are instantiated. These each contain a ThreeJS mesh and a Rapier Collider, and their own internal state. Any instantiated worldEntities are stored in a solid registry to make them available throughout the app.

Lastly, we have the game state, which is the position, rotation, etc., of all worldEntities within the Scene. This is separate from the data that each entity object contains. It is used to reset the level or save the level state to local storage, etc.





## Collision Groups

All entities within the Scene have attached Rapier collliders. By default, they will all interact with one another. However, we can create specific groups of worldEntities. This is useful for clicking  (only select partincular things) and raytracing, but also can be efficient when rapier calculates things.

- ALL "static" elements (walls, floor, etc) are GROUP 1 (in binary)
- ALL "interactable" entities (ragdoll, cube, etc) are GROUP 2 (in binary)
- ALL GROUPS interact with one another. HOWEVER, we have these GROUPS so as to FILTER raycasts / clicks / interactions / etc. appropriately
// https://rapier.rs/docs/user_guides/javascript/colliders/#collision-groups-and-solver-groups

```
0b0000_0000_0000_0001 = 0x0001 ==> is a member of GROUP 1.
0b0000_0000_0000_0011 = 0x0003 ==> may interact with GROUPS 1 and 2

0x0001 (member of #1) + 0x0003 (interactable with 1, 2) = 0x00010003

0x0002 (member of #2) + 0x0003 (interactable with 1, 2) = 0x00020003;



## Code references

- https://github.com/pmndrs/drei/blob/master/src/core/Environment.tsx
- https://drei.docs.pmnd.rs/getting-started/introduction
- https://javascriptgametutorials.com/tutorials/react-three-fiber/crossy-road/restricting-player-movement *****


