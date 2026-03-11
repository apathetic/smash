import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { loadLevel } from "~/game/hooks/loadLevel";

export const Menu = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen());
  const closeMenu = () => setIsOpen(false);

  const handleHelp = () => {
    closeMenu();
    navigate('/overview');
  };

  const handleLevel = (level) => {
    closeMenu();
    loadLevel(level);
  };

  return (
    <>
      <button
        class="z-50 relative p-2 text-white bg-transparent border-none cursor-pointer outline-none hover:text-fuchsia-400 transition-colors"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line
            x1="4" x2="20" y1="6" y2="6"
            class="transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: isOpen() ? "translate(0px, 6px) rotate(45deg)" : "translate(0px, 0px) rotate(0deg)",
              "transform-origin": "12px 12px"
            }}
          />
          <line
            x1="4" x2="20" y1="12" y2="12"
            class="transition-opacity duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ opacity: isOpen() ? 0 : 1 }}
          />
          <line
            x1="4" x2="20" y1="18" y2="18"
            class="transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: isOpen() ? "translate(0px, -6px) rotate(-45deg)" : "translate(0px, 0px) rotate(0deg)",
              "transform-origin": "12px 12px"
            }}
          />
        </svg>
      </button>

      {/* SCRIM */}
      <div
        class="fixed inset-0 z-30 overflow-hidden"
        style={{ "pointer-events": isOpen() ? "auto" : "none" }}
        onClick={closeMenu}
      >
        <div
          class="absolute top-0 left-[-20vw] w-[140vw] h-[120vh] flex translate-y-[-10vh] transition-opacity duration-[400ms]"
          style={{
             "opacity": isOpen() ? 0.7 : 0
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => {
            const inDelay = i * 20;
            const outDelay = (29 - i) * 15;
            return (
              <div
                key={`scrim-tile-${i}`}
                class="h-full w-[5vw] bg-black transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform: isOpen() ? `skewX(-15deg) scaleX(1.05)` : `skewX(-15deg) scaleX(0)`,
                  "transform-origin": "left",
                  "transition-delay": isOpen() ? `${inDelay}ms` : `${outDelay}ms`,
                  "margin-left": i === 0 ? "0" : "-1px"
                }}
              ></div>
            );
          })}
        </div>
      </div>

      {/* SIDEBAR */}
      <div class="fixed inset-0 z-40 pointer-events-none overflow-hidden">

        {/* Tiled Background */}
        <div class="absolute top-0 left-[-10vw] w-[60vw] h-[120vh] flex translate-y-[-10vh]">
          {[0, 1, 2, 3, 4].map((i) => {
            // Left to right entrance, right to left exit
            const inDelay = 50 + i * 40;
            const outDelay = (4 - i) * 40;
            return (
              <div
                key={i}
                class="h-full w-[12vw] bg-zinc-900/70 backdrop-blur-md border-r border-white/5 transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
                style={{
                  transform: isOpen() ? `skewX(-15deg) translateY(0)` : `skewX(-15deg) translateY(-120%)`,
                  "transition-delay": isOpen() ? `${inDelay}ms` : `${outDelay}ms`
                }}
              ></div>
            );
          })}
        </div>

        {/* Navigation */}
        <nav
          class="absolute top-0 left-0 h-full w-[40%] flex flex-col pt-24 px-12 transition-all duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
             transform: isOpen() ? "translateX(0)" : "translateX(-15%)",
             opacity: isOpen() ? 1 : 0,
             "transition-delay": "0ms",
             "pointer-events": isOpen() ? "auto" : "none"
          }}
        >
          <h2 class="text-5xl font-black italic tracking-tighter text-white mb-12 drop-shadow-lg">
            LEVELS
          </h2>

          <ul class="flex flex-col gap-8 font-mono text-2xl text-white list-none m-0 p-0">
            <li>
              <button class="text-left text-white bg-transparent border-none uppercase tracking-widest font-bold cursor-pointer drop-shadow-md pb-2 border-b-2 border-transparent transition-colors hover:text-fuchsia-400" onClick={() => handleLevel('1-discovery')}>
                1. Discovery
              </button>
            </li>
            <li>
              <button class="text-left text-white bg-transparent border-none uppercase tracking-widest font-bold cursor-pointer drop-shadow-md pb-2 border-b-2 border-transparent transition-colors hover:text-fuchsia-400" onClick={() => handleLevel('2-blocks')}>
                2. Blocks
              </button>
            </li>
            <li>
              <button class="text-left text-white bg-transparent border-none uppercase tracking-widest font-bold cursor-pointer drop-shadow-md pb-2 border-b-2 border-transparent transition-colors hover:text-fuchsia-400" onClick={() => handleLevel(3)}>
                3. Alpha
              </button>
            </li>
          </ul>

          <footer class="mt-auto mb-12 flex items-center justify-between border-t border-white/20 pt-8">
            <button class="flex items-center gap-4 text-white bg-transparent border-none cursor-pointer drop-shadow-md transition-colors hover:text-fuchsia-400" onClick={handleHelp}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" x2="12.01" y1="17" y2="17"></line>
              </svg>
              <span class="font-bold tracking-widest uppercase text-lg">HOW TO PLAY</span>
            </button>
          </footer>

        </nav>

      </div>
    </>
  );
};
