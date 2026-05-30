import { createMemo, Show } from 'solid-js';
import { useGameState } from '~/game/store';

/**
 * Returns a damage percentage based on accumulated damage vs target
 */
function calculateDamagePercentage(totalDamage, targetDamage) {
  if (!targetDamage || targetDamage <= 0) return 0;
  return Math.min(100, (totalDamage / targetDamage) * 100);
}



/**
 * Divides raw physics impact energy (which can reach hundreds of thousands) 
 * down to human-readable "arcade points" (10s and 100s) for UI display 
 * and progress calculations against the level's targetDamage.
 */
const DISPLAY_SCALAR = 1000;

/**
 * The Damage display.
 * @returns {JSX.Element}
 */
const Damage = () => {
  const [gameState] = useGameState();
  const displayDamage = createMemo(() => gameState.totalDamage / DISPLAY_SCALAR);
  const damagePercent = createMemo(() => calculateDamagePercentage(displayDamage(), gameState.targetDamage));

  return (
    <Show when={gameState.mode === 'smashing' || gameState.mode === 'smashed'}>
      <aside class="fixed bottom-24 right-5 z-10 pointer-events-none flex flex-col items-end text-white drop-shadow-md uppercase">
        <div class="text-sm font-bold tracking-wider">
          damage
        </div>
        <div class="text-xs font-mono mt-1">
          {Math.round(displayDamage())} / {gameState.targetDamage}
        </div>
        <div class="text-4xl font-black mt-1">
          {Math.round(damagePercent())}%
        </div>
      </aside>
    </Show>
  );
};

export { Damage };
