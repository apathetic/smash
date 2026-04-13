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
 * The Damage display.
 * @returns {JSX.Element}
 */
const Damage = () => {
  const [gameState] = useGameState();
  const damagePercent = createMemo(() => calculateDamagePercentage(gameState.totalDamage, gameState.targetDamage));

  return (
    <Show when={gameState.mode === 'smash'}>
      <div class="fixed top-[20px] left-1/2 -translate-x-1/2 w-3/4 z-10 pointer-events-none flex flex-col items-center">
        <div class="w-full h-5 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600 mb-2">
          <div
            class="h-full transition-all duration-300 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
            style={{ width: `${damagePercent()}%` }}
          />
        </div>
        <div class="font-bold uppercase tracking-wider text-white drop-shadow-md">
          Damage: {Math.round(damagePercent())}%
        </div>
      </div>
    </Show>
  );
};

export { Damage };
