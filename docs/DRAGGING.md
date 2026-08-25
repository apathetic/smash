# Dragging a Ragdoll: What We Tried and What Stuck

Notes from a long exploration into dragging the ragdoll with the cursor in
edit mode. Six materially different control approaches were built and
rejected before the current one; two "safety" mitigations made things
catastrophically worse. This is the record of what failed, why, and which
parts of the problem turned out not to be the controller's fault at all.

The single hardest lesson: **most of the pain came from the ragdoll's mass
distribution, not from the drive.** Every controller was fighting a body
whose limbs outweighed its torso 5:1.

See [JOINTS.md](./JOINTS.md) for the ragdoll's joint design.

---

## The problem

Dragging a single rigid body is trivial. The ragdoll is 15 bodies wired
together with 14 impulse joints, and the requirements pull against each
other:

| Requirement | Pulls toward |
| --- | --- |
| Track the cursor exactly | Strong authority over the grabbed part |
| Limbs flail naturally | *No* authority over the limbs |
| Never explode | Bounded forces, finite masses, nothing fighting the solver |
| Never ghost through the ground | Contacts must be able to win |

Authority over the grabbed part and freedom for the limbs are transmitted
through the *same joints*. That tension is the whole story.

### Acceptance criteria

These questions drove every iteration. Approaches were judged against them,
not against how elegant the mechanism looked:

1. **Does it explode?** Do joints hold, or do parts fly apart? *(paramount — a failure here disqualifies everything else)*
2. **Does it rubber-band?** Does it follow the cursor, or snap and play catch-up?
3. **Does it ghost through obstacles?**
4. **Is orientation affected?** It should not reorient unless a modifier is held.
5. **Is it valid, idiomatic Rapier?**
6. **Are there hacks?**
7. **Does it retain momentum on release?**
8. **Is it still interactive in edit mode?**
9. **Do the limbs move naturally?**
10. **Is it slop?** Is every line necessary?

---

## Approaches

| # | Approach | Tracking | Flail | Explodes | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | Kinematic + character controller | Exact | None | **Yes** | Rejected |
| 2 | Spring joint + kinematic anchor | Laggy | Good | No | Rejected |
| 3 | PD force drive (clamped) | Sluggish | Good | No | Rejected |
| 4 | Uniform acceleration field | Good | **None** | No | Rejected |
| 5 | **Velocity drive + mass ratio** | **Exact** | **Good** | **No** | **Shipped** |
| 6 | Bulk transport + carry fraction | Good | Good | No | Runner-up |

### 1. Kinematic body + `KinematicCharacterController`

The grabbed body becomes `KinematicPositionBased` and is moved each step by
`computeColliderMovement`, which shape-casts the desired motion and clamps it
at the first hit.

**Pros.** Tracking is exact by definition — a kinematic body goes where you
put it. The swept cast means the grabbed collider *physically cannot* enter
geometry, and it slides along surfaces instead of stopping dead.
`setApplyImpulsesToDynamicBodies(false)` means the drag shoves nothing.

**Cons.** A kinematic body has **infinite mass**. When a limb embedded in
terrain, the contact solver tried to eject it while the hard joint tried to
hold it to an immovable anchor. With a finite iteration budget the solver
over-corrected and **the ragdoll detonated**. Only the grabbed collider is
swept, so limbs ghosted through the ground anyway. Settling also ran on a
`setInterval` outside the physics step.

**Where:** `feat/dragger`, `feat/ccd`, `claude/beautiful-almeida-d7b59f`.

### 2. Spring joint + kinematic anchor (the "mouse joint")

An invisible kinematic anchor follows the cursor; a `JointData.spring`
couples it to the grab point. Solved inside Rapier's constraint solver.

**Pros.** No mass fakery, nothing kinematic mid-drag, force bounded by
capping the anchor's lead distance. Stable, and it cannot explode.

**Cons — structural, not tuning.** A spring only produces force when it is
*stretched*, so **the lag is the mechanism, not a symptom**. Softening it to
stop the violence removes exactly the force that was pulling. Two concrete
walls:

- *Disproportionate force.* At ω = 30 rad/s, `k = M·ω² = 89,100 N/m`, so a
  **2 cm** cursor nudge put **5.2 g** into a 35 kg chest. Tiny drags produced
  violent spasms.
- *Damping is unresolvable.* The spring pulls a 35 kg body but hauls a 99 kg
  assembly. Sizing `c` to the assembly gives ζ = 2.02 on the grabbed body —
  overdamped, so it crawls then jerks to a halt. Sizing it to the grabbed
  body gives ζ = 0.68 on the assembly — underdamped, so the whole ragdoll
  rings and rubber-bands. `√(99/35) = 1.68`, so no single value critically
  damps both modes.

**Where:** `feat/dragger-spring-joint-anchor`.

### 3. PD force drive

`F = k·err − c·(v − v_target)`, critically damped, force-clamped.

**Cons.** Gains were sized to the grabbed body's mass while the force had to
haul the entire assembly through the joints — effective acceleration came out
around 7 m/s², and the clamp throttled catch-up to ~1.7 m/s. Unusably slow.
Raising the clamp reintroduced the violence.

### 4. Uniform acceleration field

Apply `F = m·a` to *every* body — the same acceleration, exactly like
gravity. Chosen because uniform acceleration provably cannot yank a joint.

**Cons.** That guarantee *is* the bug. By the equivalence principle, uniform
acceleration induces **zero relative motion**, which is mathematically
identical to gluing the limbs to the torso. Tracking was fine; the limbs went
completely rigid.

> This failure recurred later at the velocity level (adding the same velocity
> delta to every body). **Any** uniform bulk motion applied to all bodies
> eliminates the relative motion that *is* the flail.

### 5. Velocity drive + mass ratio — **shipped**

Each step the grabbed body is given exactly the velocity that lands the grab
point on the cursor. It stays **dynamic**, and is temporarily weighted
against the rest of its assembly so the joints cannot negotiate that command
away.

```
setLinvel((dragTarget + grabOffset − pos) / delta)   // capped at MAX_DRAG_SPEED
setAdditionalMass(restOfAssemblyMass × DRAG_MASS_RATIO)
```

**Pros.** Tracking is exact by construction — the command is derived from
position error, so when the cursor stops, the error is zero, the command is
zero, and it stops dead. No stored spring energy means nothing to rebound.
The limbs are **completely undriven**, so their own inertia produces the
flail. Mass stays finite, so joint and contact corrections remain shared and
bounded.

**Cons.** It toggles mass, which is a smell. And the boost *worsens ground
penetration*, because contacts must arrest proportionally more momentum —
which is what forced the mass-distribution fix below.

### 6. Bulk transport + carry fraction + feed-forward

The runner-up. Carry every body by most of the **cursor's own acceleration**,
withholding a fraction; the withheld part is the lag, and the lag is the
flail. The grabbed body then gets the cursor's velocity fed forward plus a
*gentle* correction.

Two sub-lessons worth keeping:

- Applying the carry to a **per-step correction term** fails: the joints slow
  the torso every step, so the correction never decays, and the limbs get
  topped back up to torso speed forever. The flail stops scaling with drag
  intensity and degenerates into a constant gentle sway. Carry must be
  measured from the *cursor's* acceleration.
- **Deadbeat correction amplifies disturbances.** Erasing the whole position
  error in one step (`v = error/delta`) answers every limb tug with a violent
  snap, which whips the limbs harder, which tug harder. Feeding the cursor
  velocity forward and dropping the correction gain to ~0.35 makes the loop
  passive.

**Where:** `feat/dragger-spring-joint-anchor` (kept for comparison; differs
from `main` in `dragger.ts` only).

---

## The fix that mattered more than any controller

The ragdoll gave **every** part a default mass of 100 kg — a hand weighed as
much as the hips, and the arms and legs together outweighed the torso ~5:1.
Total: ~1800 kg.

That single fact caused both headline symptoms. Tracking quality is
`M / (M + rest_of_assembly)`:

| Grabbed body mass | Tracking |
| --- | --- |
| 300 kg (old chest, no boost) | 17% |
| 35 kg (real chest, no boost) | 35% |
| ~1,320 kg (real chest + ×20 boost) | 95% |

And the same ratio explained the rubber-band: 1,500 kg of limb momentum
sloshing back into a 300 kg torso. A truck felt fine all along **because its
chassis dominates its wheels** — the ragdoll was simply inverted.

Replacing the flat 100 kg with a real anthropometric distribution (~99 kg
total) fixed it at the root and cut the boost needed for the same 95%
tracking from ~30,300 kg to ~1,320 kg — **23× less momentum for contacts to
arrest.**

```
head 8 · chest 35 · hips 14 · upperArm 3 · foreArm 1.5 · hand 0.6
       · upperLeg 10 · lowerLeg 4.5 · foot 1.5      (kg)
```

Joint motor gains had to follow — see [JOINTS.md](./JOINTS.md#motor-gains-scale-per-kg).

---

## Hard rules

Things that cost real time to learn. Violate these and the ragdoll explodes.

**Never enable CCD on jointed bodies.** CCD's time-of-impact repositioning
moves a body to a contact position that violates its joint; the stiff joint
then injects an enormous corrective velocity and the ragdoll detonates. This
was introduced *as an anti-penetration fix* and made things dramatically
worse. (CCD on a lone unjointed body, like a cube, is fine.)

**Never overwrite velocity mid-solve as a "governor."** Clamping runaway
velocities sounds like a safety net. It destroys the solver's accumulated
joint impulses (warm-start state), so the next step re-solves from a broken
configuration and injects energy. It converted rare explosions into
guaranteed ones.

**Anything that fights the solver makes stability worse, not better.** Both
rules above are the same rule.

**Uniform motion applied to every body kills the flail.** See #4.

**Deadbeat correction amplifies whatever hangs off the controlled body.** See #6.

**Settle on `isSleeping()`, never a velocity threshold.** A limb at the apex
of its swing has *zero* velocity but is not at rest — a threshold froze limbs
mid-air in gravity-defying poses. Rapier only sleeps a body after velocity
stays low for a sustained window, which a swing apex never satisfies.

**Edit mode leaves gravity on.** Kinematic bodies ignore it, so the frozen
layout holds, while the dragger's dynamic limbs hang naturally. The earlier
zero-g edit mode forced the dragger to fake per-limb gravity — physics logic
leaking into interaction code.

---

## What `main` does today

- **Grab** — the whole assembly goes `Dynamic`; the grabbed body is weighted
  by `restMass × DRAG_MASS_RATIO` and has its own damping zeroed.
- **Orientation** — the *heaviest* body in the assembly (a ragdoll's torso, a
  truck's chassis, a lone cube itself) gets `lockRotations(true, true)` for
  the whole drag. This keeps the entity upright whichever part is grabbed.
- **Drive** — only the grabbed body is driven, by commanded velocity, capped
  at `MAX_DRAG_SPEED`. Limbs are untouched: gravity and inertia animate them.
- **Release** — the grabbed body restores its real mass and freezes
  `KinematicPositionBased` exactly where dropped; limbs get settle damping and
  keep swinging.
- **Settle** — each released body freezes back to kinematic once it falls
  asleep, and only then is the orientation lock released.
- **Grab handles** — only `head`, `chest`, `hips` are draggable. Dragging by a
  limb hangs the body off one joint chain in poses that are hard to undo.

| Constant | Value | Governs |
| --- | --- | --- |
| `DRAG_MASS_RATIO` | 20 | Tracking authority vs. ground penetration |
| `MAX_DRAG_SPEED` | 40 m/s | Per-step joint violation bound |
| `DRAG_LINEAR/ANGULAR_DAMPING` | 0.4 / 1.0 | Flail liveliness while held |
| `SETTLE_LINEAR/ANGULAR_DAMPING` | 3.0 / 5.0 | How fast it comes to rest |
| `NUM_SOLVER_ITERATIONS` | 20 | Constraint convergence |

---

## Known limitations

- **Limbs can still be pushed into terrain.** Only contacts protect them, and
  CCD is permanently off the table. Reduced, not eliminated, by the mass fix.
  The remaining levers are lowering `DRAG_MASS_RATIO`, raising solver
  iterations, or shape-casting the grabbed collider.
- **Terrain is a `trimesh` — it has no interior.** Thickness is not a property
  it has, so once a body is past the surface nothing pushes it back. Making it
  a solid volume would help.
- **No momentum on release.** The grabbed body freezes where dropped, which
  is what "stays put" requires. Throw-on-release conflicts with it directly
  and would need a modifier or a velocity threshold.
- **Damage constants were never retuned** after the ~18× mass reduction, so
  smash scoring reads far lower than the `targetDamage` of 1000 expects.
- **Tests assert lifecycle, not numbers.** `test-mocks.ts` mocks `three`
  globally, so `Vector3` math is inert under test — assertions cover body
  types, locks, damping and which bodies get driven, verified by mutation
  testing rather than by numeric checks.

---

## Branch map

Nothing is preserved in tags: every idea worth keeping from the branches
below is reproduced in full in these documents, so they can be deleted
outright.

| Branch | Contains | Keep? |
| --- | --- | --- |
| `main` | Velocity drive + mass ratio (#5) | Yes |
| `feat/dragger-spring-joint-anchor` | Bulk transport (#6); differs from `main` in `dragger.ts` only | Useful for A/B |
| `feat/ccd` | Character controller (#1) + the universal-joint experiment — captured in [JOINTS.md](./JOINTS.md#the-road-not-taken-universal-joints) | Deletable |
| `feat/joints` | Earlier joint conversion, plus rotated rest-pose limbs — captured in [JOINTS.md](./JOINTS.md#rotated-body-parts) | Deletable |
| `feat/dragger` | Character controller (#1), `setInterval` settling | Deletable |
| `claude/beautiful-almeida-d7b59f` | Character controller (#1) | Deletable |
