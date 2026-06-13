import deskBg from "../../assets/skin-v2/desk-bg@2x.webp";
import clipAsset from "../../assets/props/clip.svg";
import binderClipAsset from "../../assets/props/binder-clip.svg";
import penAsset from "../../assets/props/pen.webp";
import coffeeStainAsset from "../../assets/textures/coffee-stain.svg";
import tapeAsset from "../../assets/textures/tape.svg";
import "../../styles/skin-v2.css";

export interface GameStageProps {
  children: React.ReactNode;
}

export function GameStage({ children }: GameStageProps) {
  return (
    <main className="ms-skin-page">
      <div className="ms-skin-stage">
        <img className="ms-skin-stage__desk" src={deskBg} alt="" aria-hidden="true" />
        <div className="ms-skin-stage__props" aria-hidden="true">
          <img className="ms-skin-stage-prop ms-skin-stage-prop--tape-top" src={tapeAsset} alt="" />
          <img className="ms-skin-stage-prop ms-skin-stage-prop--tape-left" src={tapeAsset} alt="" />
          <img className="ms-skin-stage-prop ms-skin-stage-prop--coffee-left" src={coffeeStainAsset} alt="" />
          <img className="ms-skin-stage-prop ms-skin-stage-prop--coffee-right" src={coffeeStainAsset} alt="" />
          <img className="ms-skin-stage-prop ms-skin-stage-prop--clip" src={clipAsset} alt="" />
          <img className="ms-skin-stage-prop ms-skin-stage-prop--binder" src={binderClipAsset} alt="" />
          <img className="ms-skin-stage-prop ms-skin-stage-prop--pen" src={penAsset} alt="" />
        </div>
        <div className="ms-skin-stage__content">{children}</div>
      </div>
    </main>
  );
}
