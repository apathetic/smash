import { RigidBody, RigidBodyType } from 'rapier';
import { Vector3, Quaternion } from 'three';
import { useGameState } from "~/game/store";
import { registry } from "~/game/store/registry";

/**
 * Resets entities to their saved positions from the game state.
 * This restores the level to the state it was in when saveLevel was called.
 */
async function resetLevel() {
  const [gameState, setGameState] = useGameState();

  console.log('Resetting level to saved state');

  const targets = new Map<RigidBody, { targetPos: {x:number, y:number, z:number}, targetRot: {x:number, y:number, z:number, w:number} }>();
  const syncMeshes = new Map<RigidBody, any>();

  // Iterate through all entities in the world
  registry.each((entity) => {
    const entityData = gameState.entities[entity.id];

    entity.dynamicBodies?.forEach((dBody, index) => {
      const bodyState = entityData?.bodies?.[index];
      if (bodyState) {
        targets.set(dBody.body, {
          targetPos: { x: bodyState.position[0], y: bodyState.position[1], z: bodyState.position[2] },
          targetRot: { x: bodyState.rotation[0], y: bodyState.rotation[1], z: bodyState.rotation[2], w: bodyState.rotation[3] }
        });
        syncMeshes.set(dBody.body, dBody);
      }
    });
  });

  if (targets.size > 0) {
    await new Promise<void>((resolve) => {
      const vels = new Map<RigidBody, { v: Vector3, omega: Vector3 }>();

      targets.forEach((target, body) => {
         // Ensure they are kinematic so they don't fight us or explode
         body.setBodyType(RigidBodyType.KinematicPositionBased, true);
         vels.set(body, { v: new Vector3(), omega: new Vector3() });
      });

      const stiffness = 0.1;
      const damping = 0.75;

      function animate() {
        let allSettled = true;

        targets.forEach((target, body) => {
          const dBody = syncMeshes.get(body);
          if (!dBody) return;

          const currentPos = body.translation();
          const currentRot = body.rotation();

          const vData = vels.get(body)!;

          // Position spring
          vData.v.x += (target.targetPos.x - currentPos.x) * stiffness;
          vData.v.y += (target.targetPos.y - currentPos.y) * stiffness;
          vData.v.z += (target.targetPos.z - currentPos.z) * stiffness;

          vData.v.x *= damping;
          vData.v.y *= damping;
          vData.v.z *= damping;

          const nextPos = {
            x: currentPos.x + vData.v.x,
            y: currentPos.y + vData.v.y,
            z: currentPos.z + vData.v.z,
          };

          body.setNextKinematicTranslation(nextPos);
          dBody.mesh.position.set(nextPos.x, nextPos.y, nextPos.z);

          // Rotation spring
          const qCur = new Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
          const qTar = new Quaternion(target.targetRot.x, target.targetRot.y, target.targetRot.z, target.targetRot.w);

          if (qCur.dot(qTar) < 0) {
            qTar.set(-qTar.x, -qTar.y, -qTar.z, -qTar.w);
          }

          const qError = qTar.clone().multiply(qCur.clone().invert());
          const angle = 2 * Math.acos(Math.max(-1, Math.min(1, qError.w)));
          const s = Math.sqrt(1 - qError.w * qError.w);
          const axis = new Vector3(qError.x, qError.y, qError.z);
          if (s > 0.001) {
            axis.divideScalar(s);
          } else {
            axis.set(1, 0, 0);
          }

          vData.omega.x += axis.x * angle * stiffness;
          vData.omega.y += axis.y * angle * stiffness;
          vData.omega.z += axis.z * angle * stiffness;
          vData.omega.multiplyScalar(damping);

          const omegaLen = vData.omega.length();
          const nextRot = qCur.clone();
          if (omegaLen > 0.0001) {
            const spinQ = new Quaternion().setFromAxisAngle(vData.omega.clone().divideScalar(omegaLen), omegaLen);
            nextRot.premultiply(spinQ);
            nextRot.normalize();
          }

          body.setNextKinematicRotation(nextRot);
          dBody.mesh.quaternion.copy(nextRot);

          // check settling
          const speedSq = vData.v.lengthSq();
          const spinSq = vData.omega.lengthSq();
          const distSq = (target.targetPos.x - currentPos.x)**2 + (target.targetPos.y - currentPos.y)**2 + (target.targetPos.z - currentPos.z)**2;

          if (distSq > 0.001 || speedSq > 0.001 || spinSq > 0.001) {
            allSettled = false;
          }
        });

        if (allSettled) {
          resolve();
        } else {
          requestAnimationFrame(animate);
        }
      }

      animate();
    });

    // Now perform the final exact snap to ensure absolutely zero jitter and precise initial state
    targets.forEach((target, body) => {
      const pos = new Vector3(target.targetPos.x, target.targetPos.y, target.targetPos.z);
      const rot = new Quaternion(target.targetRot.x, target.targetRot.y, target.targetRot.z, target.targetRot.w);

      body.setBodyType(RigidBodyType.KinematicPositionBased, true);
      body.setTranslation(pos, true);
      body.setRotation(rot, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.resetForces(true);
      body.resetTorques(true);

      const dBody = syncMeshes.get(body);
      if (dBody && dBody.mesh) {
        dBody.mesh.position.copy(pos);
        dBody.mesh.quaternion.copy(rot);
      }
    });
  }

  // Reset impacts and total damage
  setGameState('impacts', []);
  setGameState('totalDamage', 0);

  console.log('Level reset complete');
}

export { resetLevel };


/**
  RESET: pulls  data from GAMESTATE (o


*/