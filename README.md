# OctoCare Gemini Backend

This is a simple backend for OctoNet Mobility's OctoCare Support chatbot using the Gemini API.

## What it does

- Keeps your Gemini API key hidden on the backend
- Provides a support chat endpoint for your app/website
- Adds OctoCare brand rules
- Adds rate limiting to reduce spam
- Adds a health check route

## Setup

### 1. Install Node.js
Use Node.js 20 or newer.

### 2. Install dependencies

```bash
npm install
```

### 3. Create your `.env` file

Copy `.env.example` and rename it to `.env`.

```bash
cp .env.example .env
```

Paste your Gemini API key inside `.env`:

```bash
GEMINI_API_KEY=your_real_key_here
PORT=3000
```

You can create/manage Gemini API keys in Google AI Studio.

### 4. Start the backend

```bash
npm run dev
```

Or:

```bash
npm start
```

### 5. Test it

Open this in your browser:

```txt
http://localhost:3000/health
```

You should see:

```json
{ "ok": true, "service": "OctoCare" }
```

### 6. Test the chat endpoint

```bash
curl -X POST http://localhost:3000/api/octocare-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Does OctoNet include calling and texting?"}'
```

## App connection

Your iOS, Android, or website frontend should send POST requests to:

```txt
/api/octocare-chat
```

With this JSON body:

```json
{
  "message": "Customer question here"
}
```

The backend returns:

```json
{
  "reply": "OctoCare answer here"
}
```

## Important security notes

Do not put your Gemini API key inside SwiftUI, Android Studio, or public website code.

Keep the key only in this backend's `.env` file or in your deployment provider's environment variables.

For production, update `ALLOWED_ORIGINS` in `.env` to your real website/app domains.

## Suggested deployment options

Beginner-friendly:

- Render
- Railway
- Fly.io
- Google Cloud Run

For OctoNet's current stage, Render or Railway is probably easiest.
