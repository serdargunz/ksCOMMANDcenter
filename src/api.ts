import type { AnalysisResult } from "./types";

// Free-tier, vision-capable Gemini model. Called directly from the browser
// with the user's own key (stored locally) — no backend involved.
const GEMINI_MODEL = "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are a nutrition estimation assistant for a calorie-tracking app.
You receive a single photo of a meal and estimate its nutrition.

Guidelines:
- Identify every distinct food and drink item you can see.
- Estimate realistic portion sizes from visual cues (plate size, utensils, packaging).
- Give your best single numeric estimate for calories and macros — never a range.
- Be practical: typical real-world servings, not lab-perfect precision.
- Set confidence to "low" when the photo is blurry, dark, or portions are hard to judge.
- If the image is NOT food or drink, set is_food to false, return an empty items
  array, total_calories 0, and explain kindly in the note.`;

// Gemini's response schema (OpenAPI subset — types are UPPERCASE). Combined with
// responseMimeType "application/json" this forces strict JSON output.
const NUTRITION_SCHEMA = {
  type: "OBJECT",
  properties: {
    is_food: { type: "BOOLEAN" },
    meal_name: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          portion: { type: "STRING" },
          calories: { type: "INTEGER" },
          protein_g: { type: "INTEGER" },
          carbs_g: { type: "INTEGER" },
          fat_g: { type: "INTEGER" },
        },
        required: ["name", "portion", "calories", "protein_g", "carbs_g", "fat_g"],
      },
    },
    total_calories: { type: "INTEGER" },
    confidence: { type: "STRING", enum: ["low", "medium", "high"] },
    note: { type: "STRING" },
  },
  required: [
    "is_food",
    "meal_name",
    "items",
    "total_calories",
    "confidence",
    "note",
  ],
};

/**
 * Reads an image File and returns its raw base64 (no data: prefix) plus media type.
 */
export function fileToBase64(
  file: File,
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read that image."));
        return;
      }
      const comma = result.indexOf(",");
      const base64 = comma >= 0 ? result.slice(comma + 1) : result;
      resolve({ base64, mediaType: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

/** Calls Gemini directly and returns the parsed nutrition analysis. */
export async function analyzePhoto(
  base64: string,
  mediaType: string,
  apiKey: string,
): Promise<AnalysisResult> {
  if (!apiKey) {
    throw new Error("No Gemini API key set. Add it in Settings (🎯) first.");
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          { inline_data: { mime_type: mediaType, data: base64 } },
          { text: "Analyze this meal photo and estimate its nutrition." },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: NUTRITION_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  };

  // The free tier occasionally returns 429 on a per-minute basis. Retry a few
  // times with backoff so transient limits don't surface as an error.
  const MAX_ATTEMPTS = 3;
  let res: Response;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error("Couldn't reach Gemini. Check your internet connection.");
    }
    if (res.status !== 429 || attempt >= MAX_ATTEMPTS) break;
    // Wait 4s, then 8s, before retrying.
    await new Promise((r) => setTimeout(r, attempt * 4000));
  }

  if (!res.ok) {
    let detail = "";
    try {
      const e = (await res.json()) as { error?: { message?: string } };
      detail = e.error?.message ?? "";
    } catch {
      /* ignore */
    }
    if (res.status === 400 && /api key|api_key/i.test(detail)) {
      throw new Error("That Gemini API key looks invalid. Re-check it in Settings.");
    }
    if (res.status === 429) {
      throw new Error(
        "Gemini's free tier is busy right now. Wait a minute and try again. " +
          "(If it keeps happening, your key's daily free quota may be used up — it resets each day.)",
      );
    }
    if (res.status === 403) {
      throw new Error("Gemini rejected the key (403). Make sure it's enabled in AI Studio.");
    }
    throw new Error("Gemini couldn't analyze that photo. Please try again.");
  }

  let data: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    promptFeedback?: { blockReason?: string };
  };
  try {
    data = await res.json();
  } catch {
    throw new Error("Gemini returned an unexpected response.");
  }

  if (data.promptFeedback?.blockReason) {
    throw new Error("Couldn't analyze that image. Try a clear photo of a meal.");
  }

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) {
    throw new Error("No analysis came back. Please try again.");
  }

  try {
    return JSON.parse(text) as AnalysisResult;
  } catch {
    throw new Error("Couldn't read the analysis. Please try another photo.");
  }
}
