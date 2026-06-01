import { animate, spring } from 'animejs';
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
    <Show when={gameState.mode === 'smashing' || gameState.mode === 'smashed'}>
      <aside
        ref={(el) => {
          animate(el, {
            opacity: [0, 1],
            scale: [0.9, 1],
            translateX: [30, 0],
            delay: 150,
            duration: 400,
            ease: spring({ bounce: 0.4 })
          });
        }}
        style="opacity: 0;"
        class="fixed bottom-24 right-5 z-10 pointer-events-none flex flex-col items-end text-white drop-shadow-md uppercase"
      >
        <div class="text-sm font-bold tracking-wider">
          damage
        </div>
        <div class="text-xs font-mono mt-1">
          {Math.round(gameState.totalDamage)} / {gameState.targetDamage}
        </div>
        <div class="text-4xl font-black mt-1">
          {Math.round(damagePercent())}%
        </div>
      </aside>
    </Show>
  );
};

export { Damage };
