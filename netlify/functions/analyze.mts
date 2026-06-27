import Anthropic from "@anthropic-ai/sdk";
import type { Context } from "@netlify/functions";

// JSON schema the model is forced to fill in. Structured outputs guarantee the
// first text block is valid JSON matching this shape — no fragile parsing.
const NUTRITION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    is_food: {
      type: "boolean",
      description: "True only if the image actually contains food or drink.",
    },
    meal_name: {
      type: "string",
      description:
        "A short, friendly name for the whole meal, e.g. 'Grilled chicken salad'.",
    },
    items: {
      type: "array",
      description: "Each distinct food or drink item visible in the photo.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "Name of this single item." },
          portion: {
            type: "string",
            description:
              "Estimated portion, e.g. '1 cup', '150 g', '1 medium'.",
          },
          calories: { type: "integer", description: "Estimated kcal." },
          protein_g: { type: "integer", description: "Protein in grams." },
          carbs_g: { type: "integer", description: "Carbohydrates in grams." },
          fat_g: { type: "integer", description: "Fat in grams." },
        },
        required: ["name", "portion", "calories", "protein_g", "carbs_g", "fat_g"],
      },
    },
    total_calories: {
      type: "integer",
      description: "Sum of calories across all items.",
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
      description: "How confident the estimate is, given photo clarity.",
    },
    note: {
      type: "string",
      description:
        "One short, friendly sentence. If not food, gently say so here.",
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
} as const;

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

type AllowedMedia =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

const ALLOWED_MEDIA: AllowedMedia[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// ~7 MB of base64 ≈ ~5 MB image. Keeps us well under request limits.
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          "The server is missing its ANTHROPIC_API_KEY. Add it in your Netlify site settings (Environment variables) and redeploy.",
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
  if (
    typeof mediaType !== "string" ||
    !ALLOWED_MEDIA.includes(mediaType as AllowedMedia)
  ) {
    return json(
      { error: "Unsupported image type. Use JPEG, PNG, GIF, or WebP." },
      400,
    );
  }

  const client = new Anthropic({ apiKey });

  // Built as a variable (not an inline literal) so structured-output fields like
  // `output_config` pass through cleanly across SDK type versions; the SDK sends
  // the whole body to the API regardless.
  const body = {
    model: "claude-opus-4-8",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    output_config: {
      format: { type: "json_schema", schema: NUTRITION_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as AllowedMedia,
              data: image,
            },
          },
          {
            type: "text",
            text: "Analyze this meal photo and estimate its nutrition.",
          },
        ],
      },
    ],
  };

  try {
    const response = await client.messages.create(
      body as Anthropic.MessageCreateParamsNonStreaming,
    );

    if (response.stop_reason === "refusal") {
      return json(
        {
          error:
            "Couldn't analyze that image. Please try a clear photo of a meal.",
        },
        422,
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return json({ error: "No analysis was returned. Please try again." }, 502);
    }

    const result = JSON.parse(textBlock.text);
    return json(result, 200);
  } catch (err) {
    const status =
      err instanceof Anthropic.APIError && typeof err.status === "number"
        ? err.status
        : 502;
    const message =
      err instanceof Anthropic.AuthenticationError
        ? "The ANTHROPIC_API_KEY is invalid. Check it in your Netlify environment variables."
        : "Something went wrong analyzing the photo. Please try again.";
    console.error("analyze error:", err);
    return json({ error: message }, status >= 400 && status < 600 ? status : 502);
  }
};
