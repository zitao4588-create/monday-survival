import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/visual-tokens.css";
import "./styles/paper-texture.css";
import "./styles.css";
import { MondaySurvivalGame } from "./MondaySurvivalGame";

function StandaloneApp() {
  return <MondaySurvivalGame />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StandaloneApp />
  </StrictMode>
);
