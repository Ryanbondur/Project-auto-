import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { gameStore } from "./core/store";
import { registerServiceWorker } from "./pwa/registerSW";
import { applyStandaloneClass } from "./pwa/standalone";
import "./styles/app.css";

applyStandaloneClass();
registerServiceWorker();

const root = document.getElementById("root");
if (!root) throw new Error("#root missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Debug / automation hook — not part of gameplay logic.
declare global {
  interface Window {
    gameStore: typeof gameStore;
  }
}
window.gameStore = gameStore;
