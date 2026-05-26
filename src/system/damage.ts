import { World } from "rapier";
import { useGameState } from "~/game/store";
import { registry } from "~/game/store/registry";


/**
 * Minimum raw force required to register an impact. Discards microscopic physics twitches.
 */
const FORCE_THRESHOLD = 50;



const [game, setGameState] = useGameState();

export const createDamageHandler = (world: World) => {
  return function handleCollisions(event: any) {
    const ragdoll = registry.get('ragdoll');
    if (!ragdoll) return;
    if (game.mode !== 'smash') return;

    // RigidBody attached to the first collider
    const handle1 = event.collider1();
    const collider1 = world.getCollider(handle1);
    const body1 = collider1 ? collider1.parent() : undefined;

    // RigidBody of the second collider involved in the event.
    const handle2 = event.collider2();
    const collider2 = world.getCollider(handle2);
    const body2 = collider2 ? collider2.parent() : undefined;

    // Ignore self-collisions!
    const part1 = ragdoll.dynamicBodies.find(({ body }: any) => body === body1);
    const part2 = ragdoll.dynamicBodies.find(({ body }: any) => body === body2);
    if (part1 && part2) return;

    const ragdollPart = part1 || part2;
    if (!ragdollPart) return;

    const ragdollBody = ragdollPart.body;
    const bodyPartName = ragdollPart.name || 'ragdoll';
    const rawForce = event.totalForceMagnitude();

    // 1. First, discard microscopic forces
    if (rawForce < FORCE_THRESHOLD) return;

    // 2. Next, demand at least ONE object have meaningful velocity
    // (velSq < 0.5 means both objects are essentially at rest)
    let maxVelSq = 0;
    if (body1) {
      const v1 = body1.linvel();
      const v1Sq = v1.x * v1.x + v1.y * v1.y + v1.z * v1.z;
      if (v1Sq > maxVelSq) maxVelSq = v1Sq;
    }

    if (body2) {
      const v2 = body2.linvel();
      const v2Sq = v2.x * v2.x + v2.y * v2.y + v2.z * v2.z;
      if (v2Sq > maxVelSq) maxVelSq = v2Sq;
    }

    if (maxVelSq < 0.5) return;

    // DEBUG: Let's see what a real hit looks like!
    console.log(`[Physics] Impact on ${bodyPartName}: rawForce = ${rawForce.toFixed(2)} | maxVelSq = ${maxVelSq.toFixed(2)}`);

    let multiplier = 1.0;
    switch (bodyPartName) {
      case 'head':
        multiplier = 3.0; // counts for the most
        break;
      case 'chest':
      case 'hips':
        multiplier = 1.5;
        break;
      case 'upperArmL':
      case 'upperArmR':
      case 'upperLegL':
      case 'upperLegR':
        multiplier = 1.0;
        break;
      case 'foreArmL':
      case 'foreArmR':
      case 'lowerLegL':
      case 'lowerLegR':
        multiplier = 0.5;
        break;
      case 'handL':
      case 'handR':
      case 'footL':
      case 'footR':
        multiplier = 0.2; // lowest for extremities
        break;
    }

    // Combine raw force with velocity to create "Impact Energy".
    const impactEnergy = rawForce * Math.sqrt(maxVelSq);

    const force = impactEnergy * multiplier;

    // Update the game state with impact data
    setGameState('impacts', (impacts: any) => [
      ...impacts,
      {
        id: Date.now() + Math.random(),
        bodyPart: bodyPartName,
        force: force,
        position: [ragdollBody.translation().x, ragdollBody.translation().y, ragdollBody.translation().z],
        rigidBody: ragdollBody,
        timestamp: Date.now()
      }
    ]);

    // Update total damage
    setGameState('totalDamage', (current: number) => current + force);
  };
};
