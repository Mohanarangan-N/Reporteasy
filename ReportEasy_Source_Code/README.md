# ReportEasy 🩺

> Understand your lab report. In your language. Instantly.

AI-powered lab report explainer — Web + Android app built with Expo, Supabase, and Claude API.

---

## Stack

| Layer | Tech |
|---|---|
| App + Web | Expo + React Native |
| Backend / DB | Supabase |
| AI | Claude API (claude-sonnet-4-6) |
| Web Deploy | Vercel |
| App Build | Expo EAS |
| Global Payments | Lemon Squeezy |
| India Payments | Razorpay |

---

## Project Structure

```
reporteasy/
├── App.js                      # Root navigator
├── app.json                    # Expo config
├── supabase_schema.sql         # DB schema — run in Supabase
├── .env.example                # Env vars template
└── src/
    ├── constants/
    │   └── index.js            # Colors, languages, pricing
    ├── lib/
    │   ├── supabase.js         # Supabase client
    │   └── claude.js           # Claude API integration
    ├── hooks/
    │   └── useAuth.js          # Auth context + hooks
    └── screens/
        ├── OnboardingScreen.js # Welcome + language picker
        ├── AuthScreen.js       # Email OTP login
        ├── HomeScreen.js       # Dashboard + report history
        ├── UploadScreen.js     # PDF / camera upload + AI processing
        ├── ResultScreen.js     # Explanation results
        ├── PaywallScreen.js    # Credits purchase
        └── AccountScreen.js   # Settings, language, signout
```

---

## Day 1 Setup

### 1. Clone and install
```bash
git clone https://github.com/Mohanarangan-N/reporteasy
cd reporteasy
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → paste contents of `supabase_schema.sql` → Run
3. Go to Storage → create a bucket named `reports` (private)
4. Copy your Project URL and anon key

### 3. Set up environment variables
```bash
cp .env.example .env
# Fill in your Supabase URL, anon key, and Anthropic API key
```

### 4. Run the app
```bash
# Web
npm run web

# Android (with device/emulator connected)
npm run android
```

---

## Day 5 — Deploy

### Web (Vercel)
```bash
npm install -g vercel
vercel --prod
# Add env vars in Vercel dashboard
```

### Android (EAS Build)
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

---

## Supabase Edge Function (PDF text extraction)

Create `supabase/functions/extract-pdf/index.ts`:
```typescript
import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

serve(async (req) => {
  const { filePath } = await req.json()
  // Download file from storage, extract text using pdf-parse
  // Return { text: "extracted text" }
})
```

Deploy with: `supabase functions deploy extract-pdf`

---

## Security Note

⚠️ For production: move the Claude API call into a Supabase Edge Function.
Never expose your Anthropic API key in the client bundle.

The edge function pattern:
1. Client uploads file to Supabase storage
2. Client calls edge function with `filePath`
3. Edge function fetches file, calls Claude API with server-side key
4. Edge function saves result to DB, returns `reportId`
5. Client navigates to ResultScreen

---

## Monetization

| Plan | Global | India |
|---|---|---|
| 1 free trial | On signup | On signup |
| Pay-per-use | $2.99/report | ₹49/report |
| Bundle | $6.99/5 reports | ₹149/5 reports |
| Monthly | $4.99/month | ₹99/month |
| Annual | $39.99/year | ₹799/year |

- **Global**: Lemon Squeezy (Merchant of Record — handles VAT/GST automatically)
- **India**: Razorpay (UPI + cards)

---

## Languages Supported

95+ languages via Claude API — zero extra cost per language.

Phase 1 (launch): English, Tamil, Hindi, Spanish, Arabic, French
Phase 2 (month 2): German, Portuguese, Japanese, Korean, Bahasa, Telugu, Kannada, Malayalam
Phase 3 (month 4+): Mandarin, Russian, Turkish, Italian, Filipino, Bengali, Urdu

---

Built by **Mohanarangan N** · [Mora Digital Automations](https://morafinds.site) · Puducherry, India
