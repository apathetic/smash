import { useGameState } from "~/game/store";
import { settleMeshes } from "~/game/hooks/settleMeshes";
import { usePhysics } from "~/system/physics";
import { REPLAY_PAUSE_MS } from "~/system/constants";

/**
 * Identifies the in-flight replay, so a newer one supersedes the
 * continuation of an older one.
 */
let generation = 0;
let resumeTimer: ReturnType<typeof setTimeout>;

/**
 * Replays the last smash from its saved physics snapshot.
 * Entities snap back to their starting pose -- the same settling
 * animation the reset uses -- hold there for a brief moment, then
 * resume smashing via the exact same sequence as the original run
 * (restore -> dynamic -> gravity), which Rapier replays
 * deterministically. Damage is only recorded in 'smashing' mode, so
 * the score and level result are untouched. The camera is never
 * modified, leaving the user free to reposition it.
 *
 * Safe to call repeatedly: each call supersedes the last.
 */
async function replayLevel() {
  const [gameState, setGameState] = useGameState();
  const physics = usePhysics();
  const token = ++generation;

  setGameState('mode', 'replay');

  // Freeze the world before restoring, so the resumed run starts from
  // the exact state the original smash started from -- and so the
  // timeline leaves the meshes alone while they settle
  clearTimeout(resumeTimer);
  physics.setPaused(true);
  physics.restore();

  await settleMeshes();

  // Superseded by a newer replay, which now owns the world
  if (token !== generation) return;

  resumeTimer = setTimeout(() => {
    if (token !== generation) return;

    // Bail if the user left the replay (e.g. navigated to the store),
    // but never leave the world stranded in a paused state
    if (gameState.mode === 'replay') {
      // note: order is important:
      physics.setBodiesKinematic(false);
      physics.setGravity(true);
    }

    physics.setPaused(false);
  }, REPLAY_PAUSE_MS);
}

export { replayLevel };
