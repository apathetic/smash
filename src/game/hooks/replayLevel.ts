import { useGameState } from "~/game/store";
import { usePhysics } from "~/system/physics";
import { REPLAY_PAUSE_MS } from "~/system/constants";

let resumeTimer: ReturnType<typeof setTimeout>;

/**
 * Replays the last smash from its saved physics snapshot.
 * Entities snap back to their starting positions, hold there for a
 * brief moment, then resume smashing using the exact same sequence as
 * the original run (restore -> dynamic -> gravity), which Rapier
 * replays deterministically. Damage is only recorded in 'smashing'
 * mode, so the score and level result are untouched. The camera is
 * never modified, leaving the user free to reposition it.
 *
 * Safe to call repeatedly: each call snaps back to the start and
 * re-arms the pause.
 */
function replayLevel() {
  const [gameState, setGameState] = useGameState();
  const physics = usePhysics();

  setGameState('mode', 'replay');

  // Snap every body back to the snapshot (kinematic, zero-gravity) and
  // hold the world there, so the resumed run starts from the exact
  // state the original smash started from
  physics.setPaused(true);
  physics.restore();

  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => {
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
