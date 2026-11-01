
export default async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  const send = (statusCode, data) => ({
    statusCode,
    headers,
    body: JSON.stringify(data)
  });

  if (event.httpMethod !== "POST") {
    return send(405, { error: "POST only" });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return send(400, { error: "Invalid request" });
  }

  const prompt = typeof body.prompt === "string"
    ? body.prompt.trim().slice(0, 1000)
    : "";

  if (!prompt) {
    return send(400, { error: "Enter an image prompt." });
  }

  const token = process.env.HF_TOKEN;
  const model = process.env.HF_IMAGE_MODEL ||
    "black-forest-labs/FLUX.1-schnell";

  if (!token) {
    return send(503, { error: "Image API key not configured." });
  }

  try {
    const result = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt }),
        signal: AbortSignal.timeout(55000)
      }
    );

    if (!result.ok) {
      return send(502, {
        error: "Image provider unavailable. Check model access or quota."
      });
    }

    const type = result.headers.get("content-type") || "";

    if (!type.startsWith("image/")) {
      return send(502, { error: "Provider did not return an image." });
    }

    const buffer = Buffer.from(await result.arrayBuffer());

    if (buffer.length > 8 * 1024 * 1024) {
      return send(502, { error: "Image is too large." });
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "no-store"
      },
      isBase64Encoded: true,
      body: buffer.toString("base64")
    };

  } catch (error) {
    console.error("Image generation error:", error.message);
    return send(500, { error: "Image generation failed." });
  }
};
