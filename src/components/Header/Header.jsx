import { useLocation, A } from "@solidjs/router";
import logo from "~/assets/images/solid.svg?raw";


const Header = () => {
  const location = useLocation();
  const active = (path) =>
    path == location.pathname
      ? "border-sky-600"
      : "border-transparent hover:border-sky-600";

  return (
    <header class="sm:flex items-center text-center md:text-right w-full z-100">
      <A class="no-underline inline-block [&>svg]:w-8 [&>svg]:h-8" href="/home" innerHTML={logo} />

      <nav class="w-full text-sm lg:text-right font-extralight">
        <A class={`no-underline inline-block ${active("/")} pa-2`} href="/overview">Overview</A>&bull;
        <A class={`no-underline inline-block ${active("/play")} pa-2`} href="/play">Play</A>
        <A class={`no-underline inline-block ${active("/404")} pa-2`} href="/404">404</A>
      </nav>
    </header>
  );
};

export { Header };
