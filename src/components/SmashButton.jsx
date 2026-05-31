import { createSignal, createEffect, onCleanup, untrack, createMemo } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { saveLevel } from "~/game/hooks/saveLevel";
import { useGameState } from "~/game/store";


/**
 *
 */
function SmashButton() {
  const [gameState, setGameState] = useGameState();
  const navigate = useNavigate();

  const isSmashMode = () => gameState.mode === 'smashing' || gameState.mode === 'smashed';
  const isResetMode = () => gameState.mode === 'reset';
  const isEditMode = () => gameState.mode === 'edit';
  const isLevelComplete = () => gameState.totalDamage >= gameState.targetDamage;

  function goStore(e) {
    e.stopPropagation();
    const excess = Math.max(0, gameState.totalDamage - gameState.targetDamage);
    if (excess > 0) {
      setGameState('currency', c => c + excess);
    }
    navigate('/store');
  }

  function goReplay(e) {
    e.stopPropagation();
    // doesn't do anything right now
  }

  const ledColor = () => {
    if (isEditMode()) return '#4488ff'; // blue
    if (isSmashMode()) return '#ff3333'; // red
    if (isResetMode()) return '#ffaa00'; // orange
    return '#4488ff';
  };


  function goSmash(e) {
    e.stopPropagation();

    if (isResetMode()) return;

    if (isSmashMode()) {
      navigate('/set');
      return;
    }

    saveLevel();
    navigate('/smash');
  }

  const targetText = createMemo(() => isEditMode() ? "SMASH" : "RESET");
  const [displayText, setDisplayText] = createSignal(untrack(targetText));
  let scrambleInterval;
  let isInitial = true;

  createEffect(() => {
    const target = targetText();
    if (isInitial) {
       isInitial = false;
       setDisplayText(target);
       return;
    }

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
    let iterations = 0;
    clearInterval(scrambleInterval);

    const startText = untrack(displayText);
    const maxLength = Math.max(startText.length, target.length);

    scrambleInterval = setInterval(() => {
      setDisplayText(() => {
        let currentString = "";
        for (let i = 0; i < maxLength; i++) {
          const startChar = startText[i] || "";
          const targetChar = target[i] || "";

          if (iterations < i * 2) {
             currentString += startChar;
          } else if (iterations < i * 2 + 6) {
             currentString += chars[Math.floor(Math.random() * chars.length)];
          } else {
             currentString += targetChar;
          }
        }
        return currentString;
      });

      iterations++;
      if (iterations >= maxLength * 2 + 6) {
        clearInterval(scrambleInterval);
        setDisplayText(target);
      }
    }, 40);
  });

  onCleanup(() => clearInterval(scrambleInterval));



  return (
    <div class="fixed bottom-5 right-5 z-100 flex items-center gap-3">
        {isLevelComplete() ? (
          <>
            <button
              class="px-4 py-2 bg-zinc-800 text-white font-mono font-bold uppercase tracking-widest rounded hover:text-fuchsia-400 transition-colors border-none cursor-pointer"
              onClick={goReplay}
            >
              Replay
            </button>
            <button
              class="px-6 py-2 bg-fuchsia-600 text-white font-mono font-bold uppercase tracking-widest rounded hover:bg-fuchsia-500 transition-colors border-none cursor-pointer shadow-[0_0_15px_rgba(192,38,211,0.5)]"
              onClick={goStore}
            >
              Next Scenario
            </button>
          </>
        ) : (
          <div class="relative group flex items-center gap-3" onClick={goSmash}>
            <style>
            {`
              .text-container {
                cursor: pointer;
                transform-origin: center;
                user-select: none;
 /*               filter: drop-shadow(1px 1px 1px black); */
              }

              @keyframes pulse-scale {
                0% { transform: scale(1); }
                70% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
              @keyframes pulse-stroke {
                0% { stroke-width: 0; stroke-opacity: 0.65; }
                70% { stroke-width: 10px; stroke-opacity: 0; }
                100% { stroke-width: 0; stroke-opacity: 0; }
              }
              .pulse-anim {
                animation: pulse-scale 1.5s infinite;
                transform-origin: center;
              }
              .pulse-ring {
                stroke-linejoin: round;
                fill: none;
                stroke-width: 0;
              }
              .pulse-ring.active {
                animation: pulse-stroke 1.5s infinite;
              }
            `}
            </style>

            <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" style={{ width: '120px' }} class={`text-container ${gameState.mode === 'smashed' ? 'pulse-anim' : ''}`}>
              {/* Expanding Pulse Ring */}
              <text
                x="30"
                y="17.5"
                font-family="monospace"
                font-weight="900"
                font-size="17.5"
                letter-spacing="-1.25px"
                text-anchor="middle"
                class={`pulse-ring ${gameState.mode === 'smashed' ? 'active' : ''}`}
                stroke="white"
              >
                {displayText()}
              </text>

              {/* Main Text */}
              <text
                x="30"
                y="17.5"
                font-family="monospace"
                font-weight="900"
                font-size="17.5"
                letter-spacing="-1.25px"
                text-anchor="middle"
                fill="white"
              >
                {displayText()}
              </text>
            </svg>

            {/* LED Indicator */}
            <div
              style={{
                width: '18px',
                height: '18px',
                'border-radius': '50%',
                'background-color': ledColor(),
                'box-shadow': isSmashMode() ? `0 0 1px ${ledColor()}, 0 0 12px ${ledColor()}` : 'none',
                transition: 'background-color 0.2s, box-shadow 0.2s'
              }}
            />
          </div>
      )}
    </div>
  );
}


export { SmashButton };
