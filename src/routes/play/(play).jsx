import { Page } from "~/components/Page";
import { ThreeStage } from "~/components/ThreeStage"; // Question: does Solid/Start have ability to use dir aliases?  i.e. import Tool from "@three/tools"

export default function Play() {
  return (
    <Page>
      <ThreeStage />

      <div className='ui' class='relative z-2'>
        some threejs thing
      </div>
    </Page>
  );
}
