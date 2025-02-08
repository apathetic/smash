# SMASH





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

## Open Questions



1. when setting up entity in physicWorld, will it always be:
  const body = physics.createRigidBody(rigidBodyDesc);
  const collider = physics.createCollider(colliderDesc, body);
  ??
  Or will an entity have multiple meshes, rigid bodies, etc.
  OR or, to the point, can we represent a WorldEntity with a single mesh prop and (rigid) body prop?


2. when updating entity, will it always be:
  mesh.position.copy(body.translation());
  mesh.quaternion.copy(body.rotation());

...or, will there be other things? ie.
  pivot.rotation.y += 0.005;


3. why is the floor "off".  the falling cube comes to rest just above of it.
  setting the floor's mesh.position or rigidBody.translation doesnt seem to have an effect