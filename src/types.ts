export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/** Raw shape returned by the /analyze serverless function. */
export interface AnalysisResult {
  is_food: boolean;
  meal_name: string;
  items: FoodItem[];
  total_calories: number;
  confidence: "low" | "medium" | "high";
  note: string;
}

/** A meal saved to the daily log. */
export interface LoggedMeal {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  /** ISO date string, e.g. "2026-06-27" — the local day this meal belongs to. */
  day: string;
  /** Epoch ms when it was logged, for ordering. */
  loggedAt: number;
}
