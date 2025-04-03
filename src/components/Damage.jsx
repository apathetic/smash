import { createMemo } from 'solid-js';
import { useGameState } from '~/game/store';
import { analyzeDamage, calculateHealth } from '~/game/utils/damageAnalysis';


/**
 * The Damage display.
 * @returns {JSX.Element}
 */
const Damage = () => {
  const [gameState] = useGameState();
  const damageData = createMemo(() => analyzeDamage(gameState.impacts));
  const health = createMemo(() => calculateHealth(gameState.totalDamage));

  const getHealthColor = () => {
    if (health() > 70) return 'bg-green-500';
    if (health() > 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div class="fixed top-10 right-10 bg-black/70 text-white p-4 rounded w-60 z-10">
      <div class="w-full h-5 bg-gray-700 rounded-full mb-2 overflow-hidden">
        <div
          class={`h-full transition-all duration-300 ${getHealthColor()}`}
          style={{ width: `${health()}%` }}
        />
      </div>

      <div class="text-center font-bold mb-3">
        Health: {Math.round(health())}%
      </div>

      <div class="mb-4">
        <div>Total Damage: {gameState.totalDamage.toFixed(2)}</div>
        {damageData().worstHit && (
          <div class="mt-1">
            Worst Hit: {damageData().worstHit.force.toFixed(2)} on {damageData().worstHit.bodyPart}
          </div>
        )}
      </div>

      <div>
        <h4 class="font-bold mb-1">Damage by Body Part:</h4>
        <ul class="pl-5 list-disc">
          {Object.entries(damageData().bodyPartDamage).map(([part, damage]) => (
            <li key={part} class="my-1">
              {part}: {(damage).toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export { Damage };
