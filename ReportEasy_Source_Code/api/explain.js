export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, imageBase64, mimeType, language } = req.body;
  const apiKey = process.env.GITHUB_TOKEN;

  const contentParts = [];
  if (imageBase64 && mimeType) {
    contentParts.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } });
  }
  contentParts.push({ type: "text", text: `You are a compassionate medical translator. Analyze this lab report and respond ONLY in ${language} in this exact JSON format:
{
  "summary": "2-3 sentence plain language overview",
  "parameters": [{"name":"...","value":"...","normalRange":"...","status":"normal|low|high|critical","explanation":"..."}],
  "doctorQuestions": ["Q1","Q2","Q3"],
  "urgency": "routine|soon|urgent",
  "urgencyNote": "..."
}
${text ? `Lab report text:\n${text}` : ''}
Never diagnose. Always recommend consulting a doctor.` });

  const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
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

  const data = await response.json();
  if (!response.ok) return res.status(500).json({ error: data });

  const raw = data.choices[0].message.content;
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    res.status(200).json(JSON.parse(clean));
  } catch {
    res.status(500).json({ error: "Failed to parse AI response" });
  }
}
