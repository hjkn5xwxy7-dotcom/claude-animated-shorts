import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { Smoke } from "./videos/smoke/Smoke";
import { MondShort, calcMond, MondProps } from "./videos/mond/Mond";
import { MannShort, calcMann } from "./videos/mann/Mann";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Smoke" component={Smoke} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="MondShort" component={MondShort} defaultProps={{ timing: null } as MondProps} calculateMetadata={calcMond}
      durationInFrames={2400} fps={30} width={1080} height={1920} />
    <Composition id="MannShort" component={MannShort} defaultProps={{ timing: null } as MondProps} calculateMetadata={calcMann}
      durationInFrames={3600} fps={30} width={1080} height={1920} />
  </>
);
