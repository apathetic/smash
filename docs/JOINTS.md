# Ragdoll Joints

Why every joint in the ragdoll is a **revolute hinge**, what the alternatives
cost, and the one idea worth revisiting.

Companion to [DRAGGING.md](./DRAGGING.md).

---

## The constraint that decides everything

In Rapier's JS bindings, **limits and motors live on `UnitImpulseJoint`**,
and only revolute and prismatic joints extend it. Everything else extends
`ImpulseJoint` directly and has neither.

| `JointData` | DOF | Limits | Motor | Class |
| --- | --- | --- | --- | --- |
| `fixed` | 0 | — | — | `FixedImpulseJoint` |
| `revolute` | 1 (rotate) | **Yes** | **Yes** | `RevoluteImpulseJoint` → `UnitImpulseJoint` |
| `prismatic` | 1 (slide) | **Yes** | **Yes** | `PrismaticImpulseJoint` → `UnitImpulseJoint` |
| `spherical` | 3 | No | No | `SphericalImpulseJoint` |
| `generic` | 1–6, chosen via `JointAxesMask` | No | No | `GenericImpulseJoint` |
| `spring` | soft distance | n/a | n/a | `SpringImpulseJoint` |
| `rope` | max distance | n/a | n/a | `RopeImpulseJoint` |

`generic` looks like the obvious answer for a 2-DOF shoulder — you pass a
mask of locked axes — but it is still an `ImpulseJoint`, so you get the
degrees of freedom **without** the ability to limit or motor them.

### Why limits and motors are non-negotiable

Both absences were observed directly, and both look broken:

- **No limits** → joints bend to anatomically impossible angles. The legs
  folded 180° backwards up the ragdoll's spine.
- **No motors** → no muscle tone. Limbs become dead weight: they hang and
  swing but never resist, which reads as a corpse rather than a body.

The ragdoll originally used `spherical` for shoulders, elbows, wrists, hips
and ankles. Both symptoms above were the result. Converting them to
`revolute` traded a degree of freedom for limits and tone — and that trade is
the entire reason the joints look the way they do.

---

## What the ragdoll uses now

Every joint is `JointData.revolute` with limits and a position motor, created
through one helper that also disables contacts between the pair:

```ts
const createJoint = (data, b1, b2, limits?) => {
  const joint = physics.createImpulseJoint(data, b1, b2, true);
  joint.setContactsEnabled(false);
  if (limits) {
    const held = Math.min(b1.mass(), b2.mass());
    joint.setLimits(...limits);
    joint.configureMotorPosition(0, JOINT_STIFFNESS * held, JOINT_DAMPING * held);
  }
  return joint;
};
```

| Joint | Axis | Limits (rad) | Motion |
| --- | --- | --- | --- |
| Neck | `(√½, √½, 0)` | ±0.6 | Nod / tilt |
| Waist | X | ±π/6 | Bend |
| Shoulder L / R | Z | −1.6…0.3 / −0.3…1.6 | Arm raise to the side |
| Elbow L / R | Y | −2.4…0 / 0…2.4 | Bends one way only |
| Wrist L / R | Y | ±0.5 | Small deflection |
| Hip L / R | X | −1.6…0.5 | Kick forward, limited back |
| Knee L / R | X | 0…2.4 | Bends one way only |
| Ankle L / R | X | ±0.5 | Small deflection |

**Contacts are disabled between jointed neighbours.** Adjacent parts overlap
at their shared anchor, so leaving contacts on makes them fight the joint
forever. Non-adjacent parts still collide normally, so the ragdoll cannot
pass through itself.

### Motor gains scale per kg

`JOINT_STIFFNESS = 0.3` and `JOINT_DAMPING = 0.05` are expressed **per
kilogram** of the lighter of the two bodies — the segment the joint actually
holds up.

This matters because gravity torque scales with mass but a fixed motor
stiffness does not. When the ragdoll's masses were corrected from a flat
100 kg per part to a real distribution (see
[DRAGGING.md](./DRAGGING.md#the-fix-that-mattered-more-than-any-controller)),
limbs became ~18× lighter — which would have made a fixed motor ~10×
*stronger* relative to gravity, and the limbs would have gone rigid. Scaling
the gains keeps the same tone-to-gravity balance for a 0.6 kg hand and a
10 kg thigh alike.

---

## The rest pose is the motor target

Every position motor targets angle **0** — `configureMotorPosition(0, …)` —
and a revolute joint's zero angle is whatever relative orientation its two
bodies had **at the moment the joint was created**. So the pose the ragdoll
is assembled in is not merely how it looks on the first frame: it is the pose
every joint is continuously pulled back toward for as long as it exists.

Ours is assembled axis-aligned, in a rigid T-pose — arms straight out,
`upperArm` at `y: 2.05` — so that is also the posture its muscle tone holds.

### Rotated body parts

An experiment on the now-deleted `feat/joints` branch added an optional
`rotation` to the body-part factory so parts could be assembled at an angle.
Reproduced here in full — it is about eight lines.

Add the parameter to `createBoxBody`'s destructured options, alongside
`size` / `position` / `mass` / `color`:

```ts
rotation = [0, 0, 0] as Tuple,
```

Then apply the Euler rotation to both the rigid body and its mesh, after the
descriptor is built and before the body is created:

```ts
if (rotation[0] !== 0 || rotation[1] !== 0 || rotation[2] !== 0) {
  const euler = new Euler(rotation[0], rotation[1], rotation[2], 'XYZ');
  const q = new Quaternion().setFromEuler(euler);
  rigidBodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
  mesh.setRotationFromEuler(euler);
}
```

`Quaternion` and `Euler` come from `three`. Call sites then read:

```ts
createMeshBody({
  size:     [0.4, 0.2, 0.2],
  position: [0.5, 1.85, 0.0],       // shoulders also drop from y: 2.05
  rotation: [0, 0, Math.PI / 4],    // 45°: arm angled down, not held out
  color: shirt
});
```

**Why it is not merely cosmetic.** Because the motors target the build pose,
assembling the arms at 45° makes the ragdoll *rest* with its arms down
instead of holding them out. It changes the idle posture, not just the
spawn frame.

**Caveat.** Joint anchors are expressed in each body's **local** frame, so
rotating a part rotates its anchor offsets along with it. Anchors on any
rotated part must be re-derived — otherwise the joint is created at a skewed
rest angle, and a joint whose limits no longer straddle its rest angle is
exactly the failure described in [Gotchas](#gotchas).


---

## Gotchas

**Limits must straddle the rest pose.** The waist was set to
`limits = [limitAngle, limitAngle]` — min *and* max at +30°, a range that
excludes the joint's own rest angle of 0. The solver then injected permanent
corrective torque trying to reach a pose it could never hold. It should be
`[-limitAngle, limitAngle]`. This bug was hit independently on two branches;
it is an easy typo with dramatic consequences.

**Revolute axes must be unit vectors.** The neck was
`{ x: π/8, y: π/8, z: 0 }` — a direction expressed as if it were an angle.
Now `{ x: √½, y: √½, z: 0 }`: same direction, correctly normalised.

**Hinge direction is a sign.** If a joint bends the wrong way, flip the sign
of its limits — e.g. an elbow is `[-2.4, 0]` on one arm and `[0, 2.4]` on the
other precisely because the hinges face opposite directions.

**Never enable CCD on any of these bodies.** See
[DRAGGING.md](./DRAGGING.md#hard-rules).

---

## The gap: hinges are 1-DOF

A real shoulder and hip are 2–3 DOF. Ours are hinges, so an arm swings in one
plane and a leg kicks forward and back but cannot spread sideways. It is a
deliberate trade — limits and tone were worth more than the extra axis — but
it is the ragdoll's most visible remaining simplification.

### The road not taken: universal joints

A `createUniversalJoint` helper gets **2 DOF while keeping limits and
motors**: chain two revolute joints through an intermediate dummy body, with
a per-axis limit on each. Pitch and roll are free; twist is prevented.

It originated on the now-deleted `feat/ccd` branch, so the implementation is
reproduced here in full rather than referenced:

```ts
function createUniversalJoint(
  physics: World,
  bodyA: RigidBody,
  bodyB: RigidBody,
  anchorA: { x: number, y: number, z: number },
  anchorB: { x: number, y: number, z: number },
  axis1: { x: number, y: number, z: number },
  axis2: { x: number, y: number, z: number },
  limits1?: [number, number],
  limits2?: [number, number],
  stiffness?: number,
  damping?: number
) {
  // Dummy body in the middle. It must have high mass, or the solver
  // destabilises — a light body wedged between two constraints is a
  // classic instability.
  const worldAnchorA = {
    x: bodyA.translation().x + anchorA.x,
    y: bodyA.translation().y + anchorA.y,
    z: bodyA.translation().z + anchorA.z
  };
  const dummyDesc = RigidBodyDesc.dynamic()
    .setTranslation(worldAnchorA.x, worldAnchorA.y, worldAnchorA.z);
  const dummyBody = physics.createRigidBody(dummyDesc);
  const dummyColDesc = ColliderDesc.ball(0.1).setMass(100).setSensor(true);
  physics.createCollider(dummyColDesc, dummyBody);

  // Joint 1: bodyA -> dummy, rotating about axis1
  const joint1Data = JointData.revolute(anchorA, { x: 0, y: 0, z: 0 }, axis1);
  if (limits1) {
    joint1Data.limitsEnabled = true;
    joint1Data.limits = limits1;
  }
  if (stiffness !== undefined) joint1Data.stiffness = stiffness;
  if (damping !== undefined) joint1Data.damping = damping;
  physics.createImpulseJoint(joint1Data, bodyA, dummyBody, true);

  // Joint 2: dummy -> bodyB, rotating about axis2
  const joint2Data = JointData.revolute({ x: 0, y: 0, z: 0 }, anchorB, axis2);
  if (limits2) {
    joint2Data.limitsEnabled = true;
    joint2Data.limits = limits2;
  }
  if (stiffness !== undefined) joint2Data.stiffness = stiffness;
  if (damping !== undefined) joint2Data.damping = damping;
  physics.createImpulseJoint(joint2Data, dummyBody, bodyB, true);

  return dummyBody;
}
```

Applied to a hip — kick forward/back on one axis, spread side to side on the
other:

```ts
const dummyHipL = createUniversalJoint(
  physics,
  hipsBody,
  upperLegLBody,
  { x: 0.2, y: -0.15, z: 0 },      // anchor on hips
  { x: 0, y: 0.2, z: 0 },          // anchor on upper leg
  { x: 1, y: 0, z: 0 },            // axis 1: kick forward/back
  { x: 0, y: 0, z: 1 },            // axis 2: spread side/side
  [-Math.PI / 2, Math.PI / 4],     // limits 1
  [-Math.PI / 4, Math.PI / 4],     // limits 2
  STIFFNESS,
  DAMPING
);
```

This is the missing middle of the table above: `spherical` gives 3 DOF with
no control, `revolute` gives control with 1 DOF, and a universal joint buys
the second axis by *composing* revolutes rather than by giving up their
features.

**Costs.** Two extra rigid bodies and a sensor collider per joint, plus the
solver time for a second constraint. The dummy body must be given a **high
mass** — a light body wedged between two constraints is a classic solver
instability, and the commit's own comments flag it.

**Status.** Never merged or evaluated against the acceptance criteria in
[DRAGGING.md](./DRAGGING.md#acceptance-criteria) — in particular it has not
been tested for the no-explode requirement, and adding bodies mid-chain is
exactly the kind of change that has caused explosions before.

### Other routes to more DOF

| Route | Gets you | Costs |
| --- | --- | --- |
| Universal joint (2 revolutes + dummy) | 2 DOF, limits, motors | 2 bodies/joint; dummy mass tuning |
| `JointData.generic` + `JointAxesMask` | Any DOF combination, natively | No limits, no motors in JS |
| `JointData.spherical` | 3 DOF | No limits, no motors — the original problem |
| Stay on hinges | Simple, stable, controllable | One axis per joint |
