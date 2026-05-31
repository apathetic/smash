import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { saveLevel } from "~/game/hooks/saveLevel";
import { useGameState } from "~/game/store";
/**
 * Placeholder to showcase an idea.
 * TODO: refine, iterate, update.
 */
function SmashButton() {
  const [isConfirming, setConfirming] = createSignal(false);
  const [isSmashing, setSmashing] = createSignal(false);
  const [gameState, setGameState] = useGameState();
  const navigate = useNavigate();
  let timer;

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


  function reset() {
    clearTimeout(timer);
    setConfirming(false);
  }

  function goSmash(e) {
    // e.preventDefault();
    e.stopPropagation();

    if (isResetMode()) return;

    if (isSmashMode()) {
      navigate('/set');
      return;
    }

    reset();

    setConfirming(true);

    // cool animation while holding button....
    // then...
    timer = setTimeout(() => {
      setSmashing(true);
      saveLevel();
      setTimeout(() => {
        setSmashing(false);
        setConfirming(false);
        navigate('/smash');
      }, 400); // animation-exit
    }, 1000 );
  }



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
        <button
          class={`block flex items-center gap-3 ${isConfirming() && isEditMode() ? 'confirming': ''} ${isSmashing() ? 'smash': ''}`}
          style={{ "background-color": "transparent" }}
          onMouseDown={goSmash}
          onMouseUp={reset}
          onMouseOut={reset}
        >

        {/* LED Indicator */}
        <div
          style={{
            width: '12px',
            height: '12px',
            "border-radius": '50%',
            "background-color": ledColor(),
            "box-shadow": `0 0 8px ${ledColor()}`,
            transition: "background-color 0.3s, box-shadow 0.3s"
          }}
        />

  {/* This is hack:  */}
  <style>
  {`
    button { opacity: 1; transition: opacity 0.4s; cursor: pointer; border: none; }
    g { transition: transform 0.4s; }
    svg { height: 2em; }
    path {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      stroke: black;
      fill: white;
    }
    text {
      stroke-dasharray: 200;
      stroke-dashoffset: 200;
      stroke: black;
      stroke-width: 0.5px;
      fill: white;
      animation: draw 0.8s ease-out forwards;
    }
    .confirming path {
      animation: draw 1.0s linear forwards;
    }

    .smash { opacity: 0; pointer-events: none; }
    .smash g:nth-child(1) { transform: scale(2); }
    .smash g:nth-child(2) { transform: scale(1.2); }
    .smash g:nth-child(3) { transform: scale(0.3); }
    .smash g:nth-child(5) { transform: scale(4); }

    @keyframes draw {
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }
    .pulse-anim {
      animation: pulse 1s infinite;
      transform-origin: center;
    }
  `}
  </style>

        {isEditMode() || isConfirming() ? (
          <svg viewBox="0 0 64 20" xmlns="http://www.w3.org/2000/svg">

          {/* S */}
          <g transform="translate(0,1)">
            <path d="M5.69626 3.66792C5.16258 4.05336 5 4.45531 5 4.75C5 5.0594 5.09807 5.29967 5.64962 5.61437C6.2898 5.97964 7.20473 6.23479 8.38731 6.55087C8.42051 6.55974 8.45397 6.56867 8.48767 6.57767C9.5375 6.85794 10.8224 7.20095 11.8371 7.77994C12.9731 8.42808 14 9.51213 14 11.25C14 12.7502 13.1552 13.9733 12.0602 14.7641C10.9632 15.5564 9.5229 16 8 16C6.4771 16 5.03677 15.5564 3.93978 14.7641C2.84478 13.9733 2 12.7502 2 11.25H5C5 11.5447 5.16258 11.9466 5.69626 12.3321C6.22795 12.7161 7.03762 13 8 13C8.96238 13 9.77205 12.7161 10.3037 12.3321C10.8374 11.9466 11 11.5447 11 11.25C11 10.9406 10.9019 10.7003 10.3504 10.3856C9.7102 10.0204 8.79527 9.76521 7.61269 9.44913C7.57949 9.44026 7.54603 9.43133 7.51233 9.42233C6.4625 9.14206 5.17763 8.79905 4.16288 8.22006C3.02693 7.57192 2 6.48787 2 4.75C2 3.24977 2.84478 2.02672 3.93978 1.23588C5.03677 0.443615 6.4771 0 8 0C9.5229 0 10.9632 0.443615 12.0602 1.23588C13.1552 2.02672 14 3.24977 14 4.75H11C11 4.45531 10.8374 4.05336 10.3037 3.66792C9.77205 3.28392 8.96238 3 8 3C7.03762 3 6.22795 3.28392 5.69626 3.66792Z" fill="#000000"/>
          </g>

          {/* M */}
          <g transform="translate(13,2)">
            <path d="M1 0H4.52852L8 8.98501L11.4715 0H15V16H12V6.95617L9.27852 14H6.72148L4 6.95617V16H1V0Z" fill="#000000"/>
          </g>

          {/* A */}
          <g transform="translate(26,1)">
            <path d="M6.42436 0H9.57565L14.995 16H11.8276L10.8115 13H5.18855L4.17242 16H1.005L6.42436 0ZM6.20468 10H9.79533L8 4.69952L6.20468 10Z" fill="#000000" fill-rule="evenodd" clip-rule="evenodd" />
          </g>

          {/* S */}
          <g transform="translate(36,2)">
            <path d="M5.69626 3.66792C5.16258 4.05336 5 4.45531 5 4.75C5 5.0594 5.09807 5.29967 5.64962 5.61437C6.2898 5.97964 7.20473 6.23479 8.38731 6.55087C8.42051 6.55974 8.45397 6.56867 8.48767 6.57767C9.5375 6.85794 10.8224 7.20095 11.8371 7.77994C12.9731 8.42808 14 9.51213 14 11.25C14 12.7502 13.1552 13.9733 12.0602 14.7641C10.9632 15.5564 9.5229 16 8 16C6.4771 16 5.03677 15.5564 3.93978 14.7641C2.84478 13.9733 2 12.7502 2 11.25H5C5 11.5447 5.16258 11.9466 5.69626 12.3321C6.22795 12.7161 7.03762 13 8 13C8.96238 13 9.77205 12.7161 10.3037 12.3321C10.8374 11.9466 11 11.5447 11 11.25C11 10.9406 10.9019 10.7003 10.3504 10.3856C9.7102 10.0204 8.79527 9.76521 7.61269 9.44913C7.57949 9.44026 7.54603 9.43133 7.51233 9.42233C6.4625 9.14206 5.17763 8.79905 4.16288 8.22006C3.02693 7.57192 2 6.48787 2 4.75C2 3.24977 2.84478 2.02672 3.93978 1.23588C5.03677 0.443615 6.4771 0 8 0C9.5229 0 10.9632 0.443615 12.0602 1.23588C13.1552 2.02672 14 3.24977 14 4.75H11C11 4.45531 10.8374 4.05336 10.3037 3.66792C9.77205 3.28392 8.96238 3 8 3C7.03762 3 6.22795 3.28392 5.69626 3.66792Z" fill="#000000"/>
          </g>

          {/* H */}
          <g transform="translate(48,1)">
            <path d="M2 0V16H5V9.5H11V16H14V0H11V6.5H5V0H2Z" fill="#000000"/>
          </g>

          </svg>
        ) : (
          <svg viewBox="0 0 64 20" xmlns="http://www.w3.org/2000/svg" style={{ width: '64px' }} class={gameState.mode === 'smashed' ? 'pulse-anim' : ''}>
            <text
              x="32"
              y="14"
              text-anchor="middle"
              font-family="monospace"
              font-weight="bold"
              font-size="14"
            >
              RESET
            </text>
          </svg>
        )}

        </button>
      )}
    </div>
  );
}


export { SmashButton };
