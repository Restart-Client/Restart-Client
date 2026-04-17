import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HudApp } from "./hud/HudApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HudApp />
  </StrictMode>,
);
