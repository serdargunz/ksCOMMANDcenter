import { useRef, useState } from "react";
import { analyzePhoto, fileToBase64 } from "../api";
import type { AnalysisResult, LoggedMeal } from "../types";
import { localDay } from "../storage";

interface Props {
  apiKey: string;
  model: string;
  onClose: () => void;
  onAdd: (meal: LoggedMeal) => void;
  onNeedKey: () => void;
}

type Phase =
  | "choose"
  | "needkey"
  | "capturing"
  | "analyzing"
  | "review"
  | "manual"
  | "error";

/** Editable, numeric-only field used for calories and macros. */
function NumberField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="input-wrap">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Math.max(0, Math.round(+e.target.value || 0)))}
        />
        <span className="unit">{unit}</span>
      </div>
    </div>
  );
}

export default function AddMealSheet({
  apiKey,
  model,
  onClose,
  onAdd,
  onNeedKey,
}: Props) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Editable fields, shared by the photo-review and manual forms.
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);

  function startPhoto() {
    if (!apiKey) {
      setPhase("needkey");
      return;
    }
    setPhase("capturing");
    fileRef.current?.click();
  }

  function startManual() {
    setName("");
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
    setError("");
    setPhase("manual");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      if (phase === "capturing") setPhase("choose");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPhase("analyzing");
    setError("");

    try {
      const { base64, mediaType } = await fileToBase64(file);
      const res = await analyzePhoto(base64, mediaType, apiKey, model);

      if (!res.is_food) {
        setError(
          res.note || "That doesn't look like food. Try a photo of your meal.",
        );
        setPhase("error");
        return;
      }

      setResult(res);
      setName(res.meal_name || "Meal");
      setCalories(res.total_calories || 0);
      setProtein(sum(res, "protein_g"));
      setCarbs(sum(res, "carbs_g"));
      setFat(sum(res, "fat_g"));
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("error");
    }
  }

  function handleAdd() {
    const meal: LoggedMeal = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now() + Math.random()),
      name: name.trim() || "Meal",
      calories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      day: localDay(),
      loggedAt: Date.now(),
    };
    onAdd(meal);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFile}
        />

        {phase === "choose" && (
          <>
            <h2>Add a meal</h2>
            <button className="btn btn-primary" onClick={startPhoto}>
              📷 Take a photo
            </button>
            <button className="btn btn-soft" onClick={startManual}>
              ✏️ Enter manually
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </>
        )}

        {phase === "needkey" && (
          <>
            <h2>One-time setup</h2>
            <p className="note">
              To read calories from photos, the app needs a free Google Gemini
              key (stored only on this device). You can also enter meals
              manually without it.
            </p>
            <button className="btn btn-primary" onClick={onNeedKey}>
              Add my free key
            </button>
            <button className="btn btn-soft" onClick={startManual}>
              Enter manually instead
            </button>
            <button className="btn btn-ghost" onClick={() => setPhase("choose")}>
              Back
            </button>
          </>
        )}

        {previewUrl && (phase === "analyzing" || phase === "review") && (
          <img className="preview-img" src={previewUrl} alt="Your meal" />
        )}

        {phase === "capturing" && (
          <div className="analyzing">
            <p>Opening camera…</p>
          </div>
        )}

        {phase === "analyzing" && (
          <div className="analyzing">
            <div className="spinner" />
            <p>Analyzing your meal…</p>
          </div>
        )}

        {phase === "error" && (
          <>
            <div className="error-box">{error}</div>
            <button className="btn btn-primary" onClick={startPhoto}>
              Try another photo
            </button>
            <button className="btn btn-soft" onClick={startManual}>
              Enter manually
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </>
        )}

        {(phase === "review" || phase === "manual") && (
          <>
            <h2>{phase === "review" ? "Looks good?" : "Add manually"}</h2>
            {phase === "review" && result && (
              <>
                <span className={`confidence ${result.confidence}`}>
                  {result.confidence} confidence
                </span>
                {result.note && <p className="note">{result.note}</p>}
              </>
            )}

            <div className="result-card">
              <div className="result-name-row">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Meal name"
                  aria-label="Meal name"
                  autoFocus={phase === "manual"}
                />
              </div>

              <div className="field-grid">
                <NumberField label="Calories" value={calories} unit="kcal" onChange={setCalories} />
                <NumberField label="Protein" value={protein} unit="g" onChange={setProtein} />
                <NumberField label="Carbs" value={carbs} unit="g" onChange={setCarbs} />
                <NumberField label="Fat" value={fat} unit="g" onChange={setFat} />
              </div>
            </div>

            {phase === "review" && result && result.items.length > 0 && (
              <ul className="items-detail">
                {result.items.map((it, i) => (
                  <li key={i}>
                    {it.name} — {it.portion} · {it.calories} kcal
                  </li>
                ))}
              </ul>
            )}

            <button className="btn btn-primary" onClick={handleAdd}>
              Add to today
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setPhase(phase === "review" ? "choose" : "choose")}
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function sum(res: AnalysisResult, key: "protein_g" | "carbs_g" | "fat_g"): number {
  return res.items.reduce((acc, it) => acc + (Number(it[key]) || 0), 0);
}
