import { useEffect, useMemo, useState } from "react";
import CalorieRing from "./components/CalorieRing";
import AddMealSheet from "./components/AddMealSheet";
import SettingsSheet from "./components/SettingsSheet";
import Petals from "./components/Petals";
import type { LoggedMeal } from "./types";
import {
  loadApiKey,
  loadGoal,
  loadMeals,
  loadModel,
  localDay,
  saveApiKey,
  saveGoal,
  saveMeals,
  saveModel,
} from "./storage";

export default function App() {
  const [meals, setMeals] = useState<LoggedMeal[]>(() => loadMeals());
  const [goal, setGoal] = useState<number>(() => loadGoal());
  const [apiKey, setApiKey] = useState<string>(() => loadApiKey());
  const [model, setModel] = useState<string>(() => loadModel());
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const today = localDay();
  const prettyToday = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Persist on change.
  useEffect(() => saveMeals(meals), [meals]);
  useEffect(() => saveGoal(goal), [goal]);
  useEffect(() => saveApiKey(apiKey), [apiKey]);
  useEffect(() => saveModel(model), [model]);

  const todaysMeals = useMemo(
    () =>
      meals
        .filter((m) => m.day === today)
        .sort((a, b) => b.loggedAt - a.loggedAt),
    [meals, today],
  );

  const totals = useMemo(
    () =>
      todaysMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          protein: acc.protein + m.protein_g,
          carbs: acc.carbs + m.carbs_g,
          fat: acc.fat + m.fat_g,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [todaysMeals],
  );

  function addMeal(meal: LoggedMeal) {
    setMeals((prev) => [meal, ...prev]);
    setShowAdd(false);
  }

  function deleteMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <>
      <Petals />
      <div className="app-content">
      <header className="app-header">
        <div>
          <h1>
            <span className="logo">🥗</span> SnapCal
          </h1>
          <div className="subtitle">{prettyToday}</div>
        </div>
        <button
          className="icon-btn"
          aria-label="Settings"
          onClick={() => setShowSettings(true)}
        >
          🎯
        </button>
      </header>

      <section className="summary">
        <CalorieRing consumed={totals.calories} goal={goal} />
        <div className="macros">
          <div className="macro">
            <span className="macro-dot" style={{ background: "#34d399" }} />
            <div className="v">
              {totals.protein}
              <span className="g">g</span>
            </div>
            <div className="k">Protein</div>
          </div>
          <div className="macro">
            <span className="macro-dot" style={{ background: "#fbbf24" }} />
            <div className="v">
              {totals.carbs}
              <span className="g">g</span>
            </div>
            <div className="k">Carbs</div>
          </div>
          <div className="macro">
            <span className="macro-dot" style={{ background: "#f472b6" }} />
            <div className="v">
              {totals.fat}
              <span className="g">g</span>
            </div>
            <div className="k">Fat</div>
          </div>
        </div>
      </section>

      <h2 className="section-title">Today</h2>

      {todaysMeals.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji">📸</span>
          No meals logged yet.
          <br />
          Tap the button below to snap your first one.
        </div>
      ) : (
        todaysMeals.map((m) => (
          <div className="meal" key={m.id}>
            <div>
              <div className="meal-name">{m.name}</div>
              <div className="meal-sub">
                {m.protein_g}p · {m.carbs_g}c · {m.fat_g}f
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="meal-cal">
                {m.calories}
                <small>kcal</small>
              </div>
              <button
                className="meal-del"
                aria-label={`Delete ${m.name}`}
                onClick={() => deleteMeal(m.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={() => setShowAdd(true)}>
        <span className="plus">＋</span> Add a meal
      </button>
      </div>

      {showAdd && (
        <AddMealSheet
          apiKey={apiKey}
          model={model}
          onClose={() => setShowAdd(false)}
          onAdd={addMeal}
          onNeedKey={() => {
            setShowAdd(false);
            setShowSettings(true);
          }}
        />
      )}
      {showSettings && (
        <SettingsSheet
          goal={goal}
          apiKey={apiKey}
          model={model}
          onClose={() => setShowSettings(false)}
          onSave={(g, k, m) => {
            setGoal(g);
            setApiKey(k);
            setModel(m);
            setShowSettings(false);
          }}
        />
      )}
    </>
  );
}
