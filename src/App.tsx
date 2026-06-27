import { useEffect, useMemo, useState } from "react";
import CalorieRing from "./components/CalorieRing";
import AddMealSheet from "./components/AddMealSheet";
import GoalSheet from "./components/GoalSheet";
import type { LoggedMeal } from "./types";
import {
  loadGoal,
  loadMeals,
  localDay,
  saveGoal,
  saveMeals,
} from "./storage";

export default function App() {
  const [meals, setMeals] = useState<LoggedMeal[]>(() => loadMeals());
  const [goal, setGoal] = useState<number>(() => loadGoal());
  const [showAdd, setShowAdd] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  const today = localDay();

  // Persist on change.
  useEffect(() => saveMeals(meals), [meals]);
  useEffect(() => saveGoal(goal), [goal]);

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
      <header className="app-header">
        <h1>
          <span className="logo">🥗</span> SnapCal
        </h1>
        <button
          className="icon-btn"
          aria-label="Set daily goal"
          onClick={() => setShowGoal(true)}
        >
          🎯
        </button>
      </header>

      <section className="summary">
        <CalorieRing consumed={totals.calories} goal={goal} />
        <div className="macros">
          <div className="macro">
            <div className="v">{totals.protein} g</div>
            <div className="k">Protein</div>
          </div>
          <div className="macro">
            <div className="v">{totals.carbs} g</div>
            <div className="k">Carbs</div>
          </div>
          <div className="macro">
            <div className="v">{totals.fat} g</div>
            <div className="k">Fat</div>
          </div>
        </div>
      </section>

      <h2 className="section-title">Today</h2>

      {todaysMeals.length === 0 ? (
        <div className="empty">
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
              <div className="meal-cal">{m.calories}</div>
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
        <span className="plus">＋</span> Snap a meal
      </button>

      {showAdd && (
        <AddMealSheet onClose={() => setShowAdd(false)} onAdd={addMeal} />
      )}
      {showGoal && (
        <GoalSheet
          goal={goal}
          onClose={() => setShowGoal(false)}
          onSave={(g) => {
            setGoal(g);
            setShowGoal(false);
          }}
        />
      )}
    </>
  );
}
