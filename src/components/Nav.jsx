import { useNavigate } from "@solidjs/router";
import { Menu } from "./Menu";

export const Nav = ({ back }) => {
  const setOrBack = back ? 'back' : 'set it';
  const navigate = useNavigate();
  const nav = (route) => () => navigate(route);

  return (
    <>
      <Menu />
      <button class="nav-button" onClick={nav('/set')}>{setOrBack}</button>
    </>
  );
};
