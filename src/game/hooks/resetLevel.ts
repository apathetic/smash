import { Vector3, Quaternion } from "three";
import { useGameState } from "~/game/store";
import { registry } from "~/game/store/registry";
import { useWorld } from "~/system/world";

/**
 * Resets entities to their saved positions from the game state.
 * This restores the level to the state it was in when saveLevel was called.
 */
async function resetLevel() {
  const [_, setGameState] = useGameState();
  const { restore } = useWorld();

  console.log('Resetting level');

  // 1. Destroy and restore the Rapier world
  restore();

  // 2. Animate the Three.js meshes to gently catch up to the restored bodies
  await new Promise<void>((resolve) => {
    const vels = new Map<any, { v: Vector3, omega: Vector3 }>();

    registry.each((entity) => {
      entity.dynamicBodies?.forEach(({ mesh, body }) => {
        if (mesh && body) {
           vels.set(mesh, { v: new Vector3(), omega: new Vector3() });
        }
      });
    });

    const stiffness = 0.1;
    const damping = 0.75;

    function animate() {
      let allSettled = true;

      registry.each((entity) => {
        entity.dynamicBodies?.forEach(({ mesh, body }) => {
          if (!mesh || !body) return;

          const currentPos = mesh.position;
          const currentRot = mesh.quaternion;

          const targetPos = body.translation();
          const targetRot = body.rotation();

          const vData = vels.get(mesh);
          if (!vData) return;

          // Position spring
          vData.v.x += (targetPos.x - currentPos.x) * stiffness;
          vData.v.y += (targetPos.y - currentPos.y) * stiffness;
          vData.v.z += (targetPos.z - currentPos.z) * stiffness;
          vData.v.multiplyScalar(damping);

          mesh.position.set(
            currentPos.x + vData.v.x,
            currentPos.y + vData.v.y,
            currentPos.z + vData.v.z
          );

          // Rotation spring
          const qCur = new Quaternion().copy(currentRot);
          const qTar = new Quaternion(targetRot.x, targetRot.y, targetRot.z, targetRot.w);

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

          mesh.quaternion.copy(nextRot);

          // Check settling
          const speedSq = vData.v.lengthSq();
          const spinSq = vData.omega.lengthSq();
          const distSq = (targetPos.x - currentPos.x)**2 + (targetPos.y - currentPos.y)**2 + (targetPos.z - currentPos.z)**2;

          if (distSq > 0.001 || speedSq > 0.001 || spinSq > 0.001) {
            allSettled = false;
          }
        });
      });

      if (allSettled) {
        resolve();
      } else {
        requestAnimationFrame(animate);
      }
    }

    animate();
  });

  // 3. Final visual snap
  registry.each((entity) => {
    entity.dynamicBodies?.forEach(({ mesh, body }) => {
      if (mesh && body) {
        mesh.position.copy(body.translation());
        mesh.quaternion.copy(body.rotation());
      }
    });
  });

  // Reset impacts and total damage only if we're still in reset mode
  // This prevents overwriting the mode if the user already clicked "Smash"
  const [gameState] = useGameState();
  if (gameState.mode === 'reset') {
    setGameState('impacts', []);
    setGameState('totalDamage', 0);
    setGameState('mode', 'edit');
  }

  console.log('Level reset complete');
}

export { resetLevel };