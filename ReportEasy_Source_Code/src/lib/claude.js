const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-6';

export async function explainLabReport({ text, imageBase64, mimeType, language }) {
  const content = [];

  // If image provided, use vision
  if (imageBase64 && mimeType) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mimeType, data: imageBase64 },
    });
  }

  content.push({
    type: 'text',
    text: `You are a compassionate medical translator helping everyday people understand their lab reports. 

${text ? `Lab report text:\n${text}\n\n` : ''}

Please analyze this lab report and respond ONLY in ${language}. Structure your response in this exact JSON format:

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

Use simple everyday language. Avoid medical jargon. Be reassuring but honest. Never diagnose — only explain what the values mean. Always recommend consulting a doctor.`,
  });

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  const rawText = data.content[0].text;

  // Strip JSON fences if present
  const clean = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
