import { useNavigate } from "@solidjs/router";


export const Nav = ({ back }) => {
  const setOrBack = back ? 'back' : 'set it';
  const navigate = useNavigate();
  const nav = (route) => () => navigate(route);

  return (
    <>
      <button class="nav-button" onClick={nav('/overview')}>overview</button>
      <button class="nav-button" onClick={nav('/set')}>{setOrBack}</button>
    </>
  );
};
