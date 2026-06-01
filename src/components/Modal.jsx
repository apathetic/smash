import { onMount } from "solid-js";
import { animate, spring } from "animejs";

export const Modal = (props) => {
  let backdropRef;
  let contentRef;

  onMount(() => {
    // Fade in the backdrop overlay
    animate(backdropRef, {
      opacity: [0, 1],
      duration: 250,
      ease: 'outQuad'
    });

    // Spring pop-in the inner content wrapper
    animate(contentRef, {
      opacity: [0, 1],
      scale: [0.85, 1],
      translateY: [20, 0],
      ease: spring({ bounce: 0.5 }),
      duration: 300
    });
  });

  return (
    <div
      ref={backdropRef}
      style="opacity: 0;"
      class="
        fixed
        inset-0
        bg-black/60
        z-50
        p-4
        flex
        items-center
        justify-center
        pointer-events-auto
      "
    >
      <dialog
        ref={contentRef}
        open
        style="opacity: 0; transform-origin: center;"
        class="
          bg-zinc-900/90
          m-auto
          max-w-3xl
          p-0
          relative
          rounded-xl
          shadow-2xl
          w-full
        "
      >
        <div class="h-full flex flex-col relative p-4 text-white font-mono">
          {props.children}
        </div>
      </dialog>
    </div>
  );
};
