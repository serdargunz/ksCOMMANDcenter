import { useState } from "react";
import { DEFAULT_MODEL } from "../storage";

interface Props {
  goal: number;
  apiKey: string;
  model: string;
  onClose: () => void;
  onSave: (goal: number, apiKey: string, model: string) => void;
}

/** Settings sheet: daily calorie goal, Gemini API key, and model (all local). */
export default function SettingsSheet({
  goal,
  apiKey,
  model,
  onClose,
  onSave,
}: Props) {
  const [goalValue, setGoalValue] = useState(String(goal));
  const [keyValue, setKeyValue] = useState(apiKey);
  const [modelValue, setModelValue] = useState(model);

  function save() {
    const n = parseInt(goalValue, 10);
    onSave(
      Number.isFinite(n) && n > 0 ? n : goal,
      keyValue.trim(),
      modelValue.trim() || DEFAULT_MODEL,
    );
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>Settings</h2>

        <div className="goal-row">
          <label htmlFor="goal-input">Daily calorie goal</label>
          <input
            id="goal-input"
            type="number"
            inputMode="numeric"
            min={500}
            value={goalValue}
            onChange={(e) => setGoalValue(e.target.value)}
          />
        </div>

        <div className="result-card">
          <label
            htmlFor="key-input"
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 6,
            }}
          >
            Gemini API key
          </label>
          <input
            id="key-input"
            type="password"
            autoComplete="off"
            placeholder="Paste your free key (AIza…)"
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              borderBottom: "2px solid var(--line)",
              background: "transparent",
              fontSize: 16,
              padding: "10px 2px",
              color: "var(--ink)",
            }}
          />
          <p className="note" style={{ margin: "12px 0 0" }}>
            Free key from{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent-press)", fontWeight: 600 }}
            >
              Google AI Studio
            </a>
            . Stored only on this device.
          </p>

          <label
            htmlFor="model-input"
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "18px 0 6px",
            }}
          >
            Model (advanced)
          </label>
          <input
            id="model-input"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={DEFAULT_MODEL}
            value={modelValue}
            onChange={(e) => setModelValue(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              borderBottom: "2px solid var(--line)",
              background: "transparent",
              fontSize: 16,
              padding: "10px 2px",
              color: "var(--ink)",
            }}
          />
          <p className="note" style={{ margin: "10px 0 0" }}>
            Leave as <code>gemini-2.5-flash</code> unless you hit limits — then try{" "}
            <code>gemini-2.5-flash-lite</code> (highest free quota).
          </p>
        </div>

        <button className="btn btn-primary" onClick={save}>
          Save
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
