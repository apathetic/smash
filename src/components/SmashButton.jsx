import { createSignal, createEffect, onCleanup, untrack, createMemo } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { saveLevel } from "~/game/hooks/saveLevel";
import { useGameState } from "~/game/store";
import { animate, spring, createTimeline } from "animejs";


/**
 *
 */
function SmashButton() {
  const [gameState, setGameState] = useGameState();
  const navigate = useNavigate();
  let textRef;
  let activeAnims = [];

  createEffect(() => {
    const mode = gameState.mode;

    // Stop and clear any previous active animations to prevent overlap
    activeAnims.forEach(anim => {
      try { anim.cancel(); } catch {}
    });
    activeAnims = [];

    // Reset elements to base styles
    if (textRef) {
      textRef.style.transform = 'scale(1)';
      textRef.style.opacity = '1';
      const ring = textRef.querySelector('.pulse-ring');
      if (ring) {
        ring.style.strokeWidth = '0px';
        ring.style.opacity = '0';
      }
    }

    if (mode === 'smashing') {
      const tl = createTimeline();
      tl.add(textRef, {
        opacity: 0,
        scale: 0.7,
        duration: 150,
        ease: 'outQuad'
      })
      .add(textRef, {
        opacity: [0, 1],
        scale: [0.7, 1],
        ease: spring({ bounce: 0.5 }),
        duration: 500
      });
      activeAnims.push(tl);
    } else if (mode === 'smashed') {
      // Loop pulse scale animation
      const pulse = animate(textRef, {
        scale: [
          { to: 1.25, ease: 'inOut(3)', duration: 200 },
          { to: 1, ease: spring({ bounce: .7 }) }
        ],
        loop: true,
        loopDelay: 250,
      });
      activeAnims.push(pulse);

      const ring = textRef.querySelector('.pulse-ring');
      if (ring) {
        const ringPulse = animate(ring, {
          strokeWidth: ['0px', '10px'],
          opacity: [0.65, 0],
          duration: 1500,
          loop: true,
          ease: 'outQuad'
        });
        activeAnims.push(ringPulse);
      }
    }
  });

  onCleanup(() => {
    activeAnims.forEach(anim => {
      try { anim.cancel(); } catch {}
    });
  });

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
    <div class="fixed bottom-3 right-5 z-100 flex items-center gap-3">
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
              }
              .pulse-ring {
                stroke-linejoin: round;
                fill: none;
                stroke-width: 0;
              }
            `}
            </style>

            <svg
              ref={textRef}
              viewBox="0 0 60 25"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '120px', 'transform-origin': 'center' }}
              class="text-container"
            >
              {/* Expanding Pulse Ring */}
              <text
                x="30"
                y="20"
                font-family="'Lilita One', sans-serif"
                font-weight="900"
                font-size="20"
                letter-spacing="-1px"
                text-anchor="middle"
                class="pulse-ring"
                stroke="white"
              >
                {displayText()}
              </text>

              {/* Main Text */}
              <text
                x="30"
                y="20"
                font-family="'Lilita One', sans-serif"
                font-weight="900"
                font-size="20"
                letter-spacing="-1px"
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
