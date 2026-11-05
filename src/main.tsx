import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { gameStore } from "./core/store";
import "./styles/app.css";

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
