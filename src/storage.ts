import type { LoggedMeal } from "./types";

const MEALS_KEY = "snapcal.meals.v1";
const GOAL_KEY = "snapcal.goal.v1";
const APIKEY_KEY = "snapcal.gemini_key.v1";

const DEFAULT_GOAL = 2000;

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
