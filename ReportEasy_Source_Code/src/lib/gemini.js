const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function explainLabReport({ text, imageBase64, mimeType, language }) {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_KEY;
  const parts = [];

  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  }

  parts.push({
    text: \`You are a compassionate medical translator helping everyday people understand their lab reports.

\${text ? \`Lab report text:\n\${text}\n\n\` : ""}

Please analyze this lab report and respond ONLY in \${language}. Structure your response in this exact JSON format:

{
  "summary": "2-3 sentence plain language overview of the overall health picture",
  "parameters": [
    {
      "name": "parameter name in \${language}",
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

Use simple everyday language. Never diagnose. Always recommend consulting a doctor.\`
  });

  const response = await fetch(\`\${GEMINI_URL}?key=\${apiKey}\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(\`Gemini API error: \${err}\`);
  }

  const data = await response.json();
  const raw = data.candidates[0].content.parts[0].text;
  const clean = raw.replace(/\`\`\`json|\`\`\`/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse AI response. Please try again.");
  }
}
