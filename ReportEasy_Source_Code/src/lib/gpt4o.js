const GPT4O_URL = "https://models.inference.ai.azure.com/chat/completions";

export async function explainLabReport({ text, imageBase64, mimeType, language }) {
  const apiKey = process.env.EXPO_PUBLIC_GITHUB_TOKEN;

  const contentParts = [];

  if (imageBase64 && mimeType) {
    contentParts.push({
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${imageBase64}`,
        detail: "high"
      }
    });
  }

  contentParts.push({
    type: "text",
    text: `You are a compassionate medical translator helping everyday people understand their lab reports.

${text ? `Lab report text:\n${text}\n\n` : ""}

Please analyze this lab report and respond ONLY in ${language}. Structure your response in this exact JSON format and nothing else:

{
  "summary": "2-3 sentence plain language overview of the overall health picture",
  "parameters": [
    {
      "name": "parameter name in ${language}",
      "value": "the measured value with unit",
      "normalRange": "normal range",
      "status": "normal | low | high | critical",
      "explanation": "1-2 sentence plain language explanation of what this means for the patient"
    }
  ],
  "doctorQuestions": [
    "Question 1 to ask the doctor",
    "Question 2 to ask the doctor",
    "Question 3 to ask the doctor"
  ],
  "urgency": "routine | soon | urgent",
  "urgencyNote": "brief note on whether they need to see a doctor soon"
}

Use simple everyday language. Never diagnose. Always recommend consulting a doctor.`
  });

  const response = await fetch(GPT4O_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: contentParts }],
      max_tokens: 2000,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GPT-4o API error: ${err}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content;
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse AI response. Please try again.");
  }
}
