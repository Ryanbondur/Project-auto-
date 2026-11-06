import { useGameState } from "./useGameState";

/** Minimal feedback chips — path mutate / boss / draft — not clutter. */
export function RunFeedbackToast() {
  const state = useGameState();
  const items = state.feedback ?? [];
  if (items.length === 0) return null;
  return (
    <div className="run-feedback" aria-live="polite">
      {items.map((f) => (
        <p key={f.id} className="run-feedback-item">
          {f.text}
        </p>
      ))}
    </div>
  );
}
