import { useState } from "react";

interface Props {
  goal: number;
  onClose: () => void;
  onSave: (goal: number) => void;
}

/** Tiny sheet for adjusting the daily calorie goal. */
export default function GoalSheet({ goal, onClose, onSave }: Props) {
  const [value, setValue] = useState(String(goal));

  function save() {
    const n = parseInt(value, 10);
    onSave(Number.isFinite(n) && n > 0 ? n : goal);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>Daily goal</h2>
        <div className="goal-row">
          <label htmlFor="goal-input">Calories per day</label>
          <input
            id="goal-input"
            type="number"
            inputMode="numeric"
            min={500}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
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
