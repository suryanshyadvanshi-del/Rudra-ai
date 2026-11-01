# RUDRA AI — Netlify starter

A mobile-first all-in-one AI web app with:
- Text chat and coding assistance
- Text provider fallback: Groq, then Gemini
- Image generation through Hugging Face Inference (model availability/quotas vary)
- Server-side API keys using Netlify Functions

## 1) Create provider keys

Create accounts and keys:
- Groq: https://console.groq.com/
- Google AI Studio: https://aistudio.google.com/
- Hugging Face: https://huggingface.co/settings/tokens

For Hugging Face, create a token that is allowed to use Inference Providers. Check that the selected image model is available to your account/region. The free allowance and model access can change.

## 2) Deploy from Android

1. Extract this ZIP using your file manager.
2. Open https://app.netlify.com/ in Chrome and sign in.
3. In Netlify, choose **Add new site → Import an existing project**.
4. Put this project in a GitHub repository. You can create the repository from GitHub's mobile website and upload the extracted files.
5. Import that repository into Netlify. Build command: `npm run build`; publish directory: `public`.
6. In Netlify: **Site configuration → Environment variables**, add:
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
   - `HF_TOKEN`
   - optionally `GROQ_MODEL`, `GEMINI_MODEL`, `HF_IMAGE_MODEL`
7. Trigger a new deploy after setting variables.

Netlify Functions are deployed from `netlify/functions` automatically.

## 3) Local testing on Android (optional)

If you have a terminal environment that supports Node.js:
```bash
npm install
npm run dev
```
Open the local Netlify URL shown by the command.

## 4) Security and limits

- Never add API keys to `public/app.js`, HTML, or any client-side file.
- Do not commit real keys to GitHub. If a key is accidentally exposed, revoke it and create a new one.
- Set `ALLOWED_ORIGIN` to your exact deployed site URL if you want a basic origin check.
- The included origin check is not authentication and does not prevent all abuse. A public app can be called by anyone who can reach its function URL.
- Add proper authentication, durable per-user rate limiting (e.g. an external database/edge rate-limit service), CAPTCHA/abuse protection, and usage monitoring before sharing widely.
- Free tiers have quotas, rate limits, model queues, and may change. No hosted provider can be promised as unlimited/free.
- Text fallback tries Gemini if Groq fails. Image generation currently uses Hugging Face only; it does not silently switch to a different image provider.

## 5) Troubleshooting

- `Groq HTTP 401`: check/recreate `GROQ_API_KEY`.
- `Gemini HTTP 400/403`: verify key, model availability and API access in AI Studio.
- `HF HTTP 401/403`: verify token permissions and model access.
- `HF HTTP 503`: model may be loading or unavailable; retry later or choose another supported model.
- `All configured text providers failed`: check both provider keys and Netlify function logs.

This is a working starter, not a guarantee of unlimited service. Provider model names, endpoints, pricing and free quotas can change; verify them in each provider console before production use.
