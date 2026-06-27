import type { AnalysisResult } from "./types";

/**
 * Reads an image File and returns its raw base64 (no data: prefix) plus media type.
 * Throws if the file isn't a supported image.
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
      // result is "data:image/jpeg;base64,XXXX" — split off the prefix.
      const comma = result.indexOf(",");
      const base64 = comma >= 0 ? result.slice(comma + 1) : result;
      resolve({ base64, mediaType: file.type });
    };
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

/** Sends the photo to the serverless function and returns the parsed analysis. */
export async function analyzePhoto(
  base64: string,
  mediaType: string,
): Promise<AnalysisResult> {
  const res = await fetch("/.netlify/functions/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image: base64, mediaType }),
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("The server returned an unexpected response.");
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : "Analysis failed. Please try again.";
    throw new Error(message);
  }

  return data as AnalysisResult;
}
