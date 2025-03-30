import { loadLevel } from "~/game/hooks/loadLevel";
import { Page } from "~/components/Page";
import { Nav } from "~/components/Nav";

export default function Overview() {
  return (
    <>
      <Nav />
      behind text neato

      <Page>
        how to play.<br />
        stats. <br />
        choose a level or something.<br />
        high score, replays

        <ul>
          <li><button onclick={() => loadLevel('1-discovery')}>level 1</button></li>
          <li><button onclick={() => loadLevel('2-blocks')}>level 2</button></li>
          <li><button onclick={() => loadLevel(3)}>level 3</button></li>
        </ul>

      </Page>
    </>
  );
}
