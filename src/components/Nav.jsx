import { useLocation, useNavigate, A } from "@solidjs/router";
import logo from "~/assets/images/solid.svg?raw";


export const Nav = ({ back }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const nav = (route) => () => navigate(route);

  const active = (path) => ''
    // path == location.pathname
    //   ? "border-sky-600"
    //   : "border-transparent hover:border-sky-600";

    const setOrBack = back ? 'back' : 'set it';


      // <nav> ?
      // <A class="no-underline inline-block [&>svg]:w-8 [&>svg]:h-8" href="/overview" innerHTML={logo} />
  return (
    <>
      <button class=" nav-button" onClick={nav('/overview')}>overview</button>
      <button class={`nav-button  ${active("/set")}`} onClick={nav('/set')}>{setOrBack}</button>
    </>
  );
};
