
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

const response = (statusCode, data) => ({
  statusCode,
  headers,
  body: JSON.stringify(data)
});

async function groq(prompt, mode) {
  if (!process.env.GROQ_API_KEY) throw new Error("Groq unavailable");

  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: mode === "code"
            ? "You are RUDRA AI, an expert coding assistant. Write clear, working and secure code."
            : "You are RUDRA AI, a helpful and accurate AI assistant."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }),
    signal: AbortSignal.timeout(25000)
  });

  if (!r.ok) throw new Error(`Groq error ${r.status}`);

  const data = await r.json();
  const answer = data.choices?.[0]?.message?.content;

  if (!answer) throw new Error("Empty Groq response");

  return { answer, provider: "Groq" };
}

async function gemini(prompt, mode) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini unavailable");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: mode === "code"
              ? "You are RUDRA AI, an expert coding assistant. Write secure, working code."
              : "You are RUDRA AI, a helpful AI assistant."
          }]
        },
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }]
      }),
      signal: AbortSignal.timeout(25000)
    }
  );

  if (!r.ok) throw new Error(`Gemini error ${r.status}`);

  const data = await r.json();
  const answer = data.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "").join("");

  if (!answer) throw new Error("Empty Gemini response");

  return { answer, provider: "Gemini" };
}

export default async (event) => {
  if (event.httpMethod !== "POST") {
    return response(405, { error: "POST only" });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request" });
  }

  const prompt = typeof body.prompt === "string"
    ? body.prompt.trim().slice(0, 8000)
    : "";

  const mode = body.mode === "code" ? "code" : "chat";

  if (!prompt) {
    return response(400, { error: "Enter a prompt first." });
  }

  try {
    return response(200, await groq(prompt, mode));
  } catch (groqError) {
    console.log("Groq fallback:", groqError.message);
  }

  try {
    return response(200, await gemini(prompt, mode));
  } catch (geminiError) {
    console.log("Gemini fallback:", geminiError.message);
  }

  return response(503, {
    error: "All AI providers unavailable. Check API keys and quotas."
  });
};
