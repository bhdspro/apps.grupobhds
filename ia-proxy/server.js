import express from "express";

const app = express();

// ==========================
// CONFIGURAÇÃO CORS
// ==========================
const ALLOWED_ORIGINS = new Set([
  "https://apps.grupobhds.com",
  "https://grupobhds.com",
  "http://localhost:3000",
  "http://127.0.0.1:5500"
]);

function isOriginAllowed(origin) {
  return origin && ALLOWED_ORIGINS.has(origin);
}

app.use((req, res, next) => {
  const origin = req.get("origin");
  console.log(`[SERVER] Requisição recebida: ${req.method} ${req.url} | Origin: ${origin}`);

  if (!isOriginAllowed(origin)) {
    console.warn(`[SERVER] Origin não permitida: ${origin}`);
    if (req.method === "OPTIONS") return res.sendStatus(403);
    return res.status(403).json({ error: "Origin not allowed" });
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "600");

  if (req.method === "OPTIONS") return res.sendStatus(204);

  next();
});

// ==========================
// ENDPOINTS DE ENTREGA DA API
// ==========================
app.get("/gemini", (req, res) => {
  const geminiApiKey = process.env.GEMINI_API_KEY || "CHAVE_GEMINI_AQUI";
  console.log(`[SERVER] Entregando API Gemini para Origin: ${req.get("origin")}`);
  res.json({ api: geminiApiKey });
});

app.get("/chatgpt", (req, res) => {
  const chatApiKey = process.env.CHATGPT_API_KEY || "CHAVE_CHATGPT_AQUI";
  console.log(`[SERVER] Entregando API ChatGPT para Origin: ${req.get("origin")}`);
  res.json({ api: chatApiKey });
});

// Healthcheck
app.get("/healthz", (req, res) => {
  console.log("[SERVER] Healthcheck acessado");
  res.json({ status: "ok" });
});

// ==========================
// START SERVER
// ==========================
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[SERVER] IA proxy rodando na porta ${port}`);
});
