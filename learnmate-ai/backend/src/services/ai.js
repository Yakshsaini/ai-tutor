
// Wait helper
const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Identify Gemini HTTP errors
function getGeminiStatus(error) {
  const status =
    Number(error?.status || error?.statusCode || error?.response?.status);

  if (status) return status;

  const match = String(error?.message || '').match(/\b(408|429|500|502|503|504)\b/);
  return match ? Number(match[1]) : 0;
}

// Retry only temporary errors
function isTemporaryError(status) {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

// Generate content with retry and model fallback
async function generate(prompt, { system, json = false } = {}) {
  const primaryModel = modelName();

  // Configure fallback models in .env if needed
  const fallbackModels = (
    process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.5-flash-lite'
  )
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m && m !== primaryModel);

  const models = [primaryModel, ...fallbackModels];
  let lastError;

  for (const currentModel of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const model = new GoogleGenerativeAI(apiKey())
          .getGenerativeModel({
            model: currentModel,
            systemInstruction: system,
            generationConfig: {
              temperature: json ? 0.5 : 0.3,
              ...(json
                ? { responseMimeType: 'application/json' }
                : {}),
            },
          });

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        console.log(`Gemini success: ${currentModel}`);
        return response;

      } catch (error) {
        lastError = error;

        const status = getGeminiStatus(error);

        console.error(
          `Gemini error: model=${currentModel}, attempt=${attempt}, status=${status}`
        );

        if (!isTemporaryError(status)) {
          throw new AIError(
            `Gemini request failed: ${error.message || 'unknown error'}`,
            502,
            'GEMINI_FAILED'
          );
        }

        if (attempt < 3) {
          // Exponential backoff with small random jitter
          const delay =
            1000 * Math.pow(2, attempt - 1) +
            Math.floor(Math.random() * 500);

          await sleep(delay);
        }
      }
    }

    console.warn(`Switching from ${currentModel} to next Gemini model...`);
  }

  const status = getGeminiStatus(lastError);

  throw new AIError(
    `Gemini is temporarily unavailable. Please try again later. Last error: ${lastError?.message || 'unknown error'}`,
    status === 429 ? 429 : status === 503 ? 503 : 502,
    status === 503 ? 'GEMINI_UNAVAILABLE' : 'GEMINI_FAILED'
  );
}
