import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "fs";
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

const pricingData = fs.readFileSync("./knowledge/pricing.txt", "utf8");
const travelPlansData = fs.readFileSync("./knowledge/travel-plans.txt", "utf8");
const faqData = fs.readFileSync("./knowledge/faq.txt", "utf8");

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

const projectArc = {
  codename: "PROJECT ARC",
  title: "The evolution of OctoNet Mobility",
  phase: "Version 1 Beta Build",
  status: "In Development",
  mission:
    "Building a customer-first telecom experience with travel eSIM, OctoCare, NETPAY Preview, smart support tools, and a modern app + web ecosystem.",
  currentFocus: [
    "Travel eSIM plan previews",
    "OctoCare AI support",
    "Device compatibility tools",
    "Roaming savings calculator",
    "Plan recommendation engine",
    "NETPAY Preview",
    "Account dashboard",
    "Website and app feature sync"
  ],
  nextMilestones: [
    "Beta stability testing",
    "Website feature polish",
    "App Store readiness review",
    "Partner readiness",
    "Customer waitlist growth",
    "Version 1 launch preparation"
  ],
  disclaimer:
    "PROJECT ARC is an internal roadmap codename. Features, pricing, coverage, availability, NETPAY, and OctoNet services may change before public launch."
};

const OCTOCARE_SYSTEM_INSTRUCTIONS = `
You are OctoCare Support for OctoNet Mobility.

Use the following official OctoNet company knowledge when answering customers.

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
- NETPAY is a future preview concept only. Do not describe it as a bank, wallet, credit card, loan, money-transfer service, or active payment service.
- PROJECT ARC is an internal roadmap codename. Do not present it as a public paid product.
- Customers needing human support should contact hello.octonetmobility@gmail.com.

Help customers with:
- Travel eSIM questions
- eSIM activation guidance
- Device compatibility basics
- Waitlist questions
- Plan information from the provided knowledge files
- Basic troubleshooting
- OctoNet app and website feature guidance

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
    routes: [
      "GET /health",
      "POST /api/octocare-chat",
      "GET /api/project-arc/status",
      "GET /api/project-arc/roadmap"
    ],
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "OctoCare",
    project: "PROJECT ARC",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/project-arc/status", (_req, res) => {
  res.json({
    success: true,
    project: projectArc.codename,
    title: projectArc.title,
    phase: projectArc.phase,
    status: projectArc.status,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/project-arc/roadmap", (_req, res) => {
  res.json({
    success: true,
    data: projectArc,
    timestamp: new Date().toISOString()
  });
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

    const reply =
      response.text ||
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
  console.log(`PROJECT ARC routes active on /api/project-arc/status and /api/project-arc/roadmap`);
});
