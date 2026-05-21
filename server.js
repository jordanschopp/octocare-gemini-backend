import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY. Add it to your .env file.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many OctoCare messages. Please slow down and try again shortly.",
  },
});
import fs from "fs";

const faqData = fs.readFileSync("./knowledge/faq.txt", "utf8");

const OCTOCARE_SYSTEM_INSTRUCTIONS = `
You are OctoCare Support for OctoNet Mobility.

Use the following company knowledge when answering customers:

Pricing:
${pricingData}

Travel Plans:
${travelPlansData}

FAQ:
${faqData}

Brand voice:
- Friendly, calm, simple, and professional.
- Keep answers short unless the customer asks for detail.
- Avoid confusing telecom jargon.

Important business rules:
- OctoNet Mobility currently focuses on travel/global data eSIM services.
- Current services are data-only unless officially updated.
- Do not promise phone numbers, calling, texting, port-ins, or full carrier replacement.
- Do not claim OctoNet is already a registered carrier unless official confirmation is provided.
- Do not create legal, billing, refund, or warranty promises.
- Customers needing human support should contact hello.octonetmobility@gmail.com.

Help customers with:
- Travel eSIM questions
- eSIM activation guidance
- Device compatibility basics
- Waitlist questions
- Plan information from the provided knowledge files
- Basic troubleshooting

Escalate when needed:
- For billing, refunds, account-specific problems, legal questions, emergencies, or angry customers, tell them to contact OctoNet Mobility support directly at hello.octonetmobility@gmail.com.

Contact:
- Website: https://octonetmobility.pages.dev
- Support email: hello.octonetmobility@gmail.com
`;

function sanitizeMessage(message) {
  if (typeof message !== "string") return "";
  return message.trim().slice(0, 4000);
}

app.get("/", (_req, res) => {
  res.json({
    name: "OctoCare Gemini Backend",
    status: "running",
    routes: ["GET /health", "POST /api/octocare-chat"],
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "OctoCare", timestamp: new Date().toISOString() });
});

app.post("/api/octocare-chat", chatLimiter, async (req, res) => {
  try {
    const userMessage = sanitizeMessage(req.body?.message);

    if (!userMessage) {
      return res.status(400).json({
        error: "Message is required.",
        reply: "Please type a message so OctoCare can help.",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${OCTOCARE_SYSTEM_INSTRUCTIONS}\n\nCustomer message:\n${userMessage}`,
            },
          ],
        },
      ],
    });

    const reply = response.text ||
      "OctoCare had trouble generating a reply. Please contact hello.octonetmobility@gmail.com.";

    res.json({ reply });
  } catch (error) {
    console.error("OctoCare error:", error);
    res.status(500).json({
      reply:
        "OctoCare is having trouble right now. Please contact OctoNet Mobility support at hello.octonetmobility@gmail.com.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`OctoCare backend running on http://localhost:${PORT}`);
});
