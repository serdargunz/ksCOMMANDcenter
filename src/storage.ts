import type { LoggedMeal } from "./types";

const MEALS_KEY = "snapcal.meals.v1";
const GOAL_KEY = "snapcal.goal.v1";
const APIKEY_KEY = "snapcal.gemini_key.v1";
const MODEL_KEY = "snapcal.model.v1";

const DEFAULT_GOAL = 2000;

// A current Gemini model that has free-tier quota and supports vision.
// gemini-2.5-flash-lite has even higher free limits if you need them.
export const DEFAULT_MODEL = "gemini-2.5-flash";

/** Local YYYY-MM-DD for a given date (defaults to now). */
export function localDay(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loadMeals(): LoggedMeal[] {
  try {
    const raw = localStorage.getItem(MEALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LoggedMeal[]) : [];
  } catch {
    return [];
  }
}

export function saveMeals(meals: LoggedMeal[]): void {
  try {
    localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  } catch {
    // Storage full or unavailable — fail silently; the in-memory state still works.
  }
}

export function loadGoal(): number {
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_GOAL;
  } catch {
    return DEFAULT_GOAL;
  }
}

export function saveGoal(goal: number): void {
  try {
    localStorage.setItem(GOAL_KEY, String(goal));
  } catch {
    // ignore
  }
}

/** The user's Gemini API key, stored only in this browser. */
export function loadApiKey(): string {
  try {
    return localStorage.getItem(APIKEY_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem(APIKEY_KEY, key.trim());
  } catch {
    // ignore
  }
}

/** Which Gemini model to use (advanced; defaults to DEFAULT_MODEL). */
export function loadModel(): string {
  try {
    const v = localStorage.getItem(MODEL_KEY);
    return v && v.trim() ? v.trim() : DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function saveModel(model: string): void {
  try {
    localStorage.setItem(MODEL_KEY, (model.trim() || DEFAULT_MODEL));
  } catch {
    // ignore
  }
}
