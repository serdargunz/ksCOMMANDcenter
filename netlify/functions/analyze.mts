import type { Context } from "@netlify/functions";

// Gemini's response schema (OpenAPI subset — types are UPPERCASE). Setting this
// as responseSchema with responseMimeType "application/json" makes the model
// return strictly this shape, so parsing is reliable.
const NUTRITION_SCHEMA = {
  type: "OBJECT",
  properties: {
    is_food: {
      type: "BOOLEAN",
      description: "True only if the image actually contains food or drink.",
    },
    meal_name: {
      type: "STRING",
      description: "Short friendly name for the whole meal.",
    },
    items: {
      type: "ARRAY",
      description: "Each distinct food or drink item visible in the photo.",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Name of this single item." },
          portion: {
            type: "STRING",
            description: "Estimated portion, e.g. '1 cup', '150 g', '1 medium'.",
          },
          calories: { type: "INTEGER", description: "Estimated kcal." },
          protein_g: { type: "INTEGER", description: "Protein in grams." },
          carbs_g: { type: "INTEGER", description: "Carbohydrates in grams." },
          fat_g: { type: "INTEGER", description: "Fat in grams." },
        },
        required: ["name", "portion", "calories", "protein_g", "carbs_g", "fat_g"],
      },
    },
    total_calories: {
      type: "INTEGER",
      description: "Sum of calories across all items.",
    },
    confidence: {
      type: "STRING",
      enum: ["low", "medium", "high"],
      description: "How confident the estimate is, given photo clarity.",
    },
    note: {
      type: "STRING",
      description: "One short, friendly sentence. If not food, gently say so here.",
    },
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

// Free-tier, vision-capable Gemini model.
const MODEL = "gemini-2.0-flash";

// Gemini also accepts HEIC/HEIF, which iPhones produce by default.
const ALLOWED_MEDIA = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
];

// ~7 MB of base64 ≈ ~5 MB image.
const MAX_BASE64_LENGTH = 7_000_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }

  // Accept either GEMINI_API_KEY or GOOGLE_API_KEY.
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          "The server is missing its GEMINI_API_KEY. Add it in your Netlify site settings (Environment variables) and redeploy. Get a free key at https://aistudio.google.com/app/apikey",
      },
      500,
    );
  }

  let payload: { image?: unknown; mediaType?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const { image, mediaType } = payload;

  if (typeof image !== "string" || image.length === 0) {
    return json({ error: "Missing 'image' (base64 data)." }, 400);
  }
  if (image.length > MAX_BASE64_LENGTH) {
    return json(
      { error: "That image is too large. Please use a photo under ~5 MB." },
      413,
    );
  }
  if (typeof mediaType !== "string" || !ALLOWED_MEDIA.includes(mediaType)) {
    return json(
      { error: "Unsupported image type. Use JPEG, PNG, WebP, GIF, or HEIC." },
      400,
    );
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          { inline_data: { mime_type: mediaType, data: image } },
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

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("gemini fetch error:", err);
    return json(
      { error: "Couldn't reach the analysis service. Please try again." },
      502,
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const e = (await res.json()) as { error?: { message?: string } };
      detail = e.error?.message ?? "";
    } catch {
      /* ignore */
    }
    console.error("gemini error:", res.status, detail);
    if (res.status === 400 && /api key/i.test(detail)) {
      return json(
        {
          error:
            "The GEMINI_API_KEY looks invalid. Check it in your Netlify environment variables.",
        },
        401,
      );
    }
    if (res.status === 429) {
      return json(
        {
          error:
            "Free-tier rate limit hit. Wait a moment and try again.",
        },
        429,
      );
    }
    return json(
      { error: "Something went wrong analyzing the photo. Please try again." },
      502,
    );
  }

  let data: {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };
  try {
    data = await res.json();
  } catch {
    return json({ error: "The analysis service returned an unexpected response." }, 502);
  }

  if (data.promptFeedback?.blockReason) {
    return json(
      { error: "Couldn't analyze that image. Please try a clear photo of a meal." },
      422,
    );
  }

  const candidate = data.candidates?.[0];
  const text =
    candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  if (!text) {
    return json({ error: "No analysis was returned. Please try again." }, 502);
  }

  try {
    const result = JSON.parse(text);
    return json(result, 200);
  } catch {
    return json(
      { error: "Couldn't read the analysis. Please try another photo." },
      502,
    );
  }
};
