// server.js
import express from "express";
import axios from "axios";

const app = express();
app.use(express.json({ limit: "1mb" }));

/**
 * CONFIGURAÇÃO:
 * - As chaves e URLs ficam configuradas como variáveis de ambiente no Render.
 *
 * Variáveis esperadas (defina no painel do Render):
 *  - GEMINI_API_KEY            -> chave do Gemini PRO (Bearer)
 *  - GEMINI_API_URL            -> URL completa para chamar o Gemini (ex: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateText)
 *  - CHATGPT_API_KEY           -> chave da OpenAI (Bearer)
 *  - CHATGPT_API_URL           -> URL completa para Chat completions (ex: https://api.openai.com/v1/chat/completions)
 *
 * Observação: as URLs acima podem ser ajustadas conforme API (coloque o endpoint/model correto no Render).
 */

// Domínios permitidos (origins) — sem paths. Mantive conforme solicitado.
const ALLOWED_ORIGINS = new Set([
  "https://apps.grupobhds.com",
  "https://grupobhds.com"
]);

// Helper: valida Origin (exatamente)
function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

// Middleware CORS simples e verificação de origem
app.use((req, res, next) => {
  const origin = req.get("origin");

  // Para requests sem Origin (p.ex. curl, server-side), você pode optar por negar ou permitir.
  // Aqui vamos negar para manter segurança (apenas browsers dos domínios autorizados).
  if (!isOriginAllowed(origin)) {
    // Se for pré-flight (OPTIONS), respondemos 403 imediatamente
    if (req.method === "OPTIONS") {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    // Para requisições normais, retornamos 403
    return res.status(403).json({ error: "Origin not allowed" });
  }

  // Cabeçalhos CORS para origem aprovada
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Ajuste max-age se desejar
  res.setHeader("Access-Control-Max-Age", "600");

  // Se for preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Utilitário para repassar requisição ao provider
async function forwardRequest({ url, apiKey, originalReq, extraHeaders = {} }) {
  // Repassamos o body como JSON. Mantemos o corpo tal qual foi recebido.
  const payload = originalReq.body ?? {};

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    ...extraHeaders
  };

  // Seja explícito: não repassamos o Authorization do cliente
  try {
    const resp = await axios.post(url, payload, {
      headers,
      timeout: 25000, // 25s timeout — ajuste conforme necessidade
      validateStatus: () => true // devolvemos resposta mesmo que status !== 2xx
    });

    // Retornar status e dados do provider ao cliente
    return {
      status: resp.status,
      headers: resp.headers,
      data: resp.data
    };
  } catch (err) {
    // Erro de rede/timeout
    if (err.code === "ECONNABORTED") {
      return { error: "timeout", message: "Request to provider timed out" };
    }
    return { error: "network_error", message: err.message || String(err) };
  }
}

/**
 * Endpoint: /gemini
 * Faz POST para a URL GEMINI_API_URL usando GEMINI_API_KEY.
 * O conteúdo do body é repassado tal qual. A resposta do provider é retornada íntegra.
 */
app.post("/gemini", async (req, res) => {
  const geminiUrl = process.env.GEMINI_API_URL;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiUrl || !geminiKey) {
    return res.status(500).json({ error: "server_misconfigured", message: "GEMINI_API_URL or GEMINI_API_KEY not set on server" });
  }

  const result = await forwardRequest({
    url: geminiUrl,
    apiKey: geminiKey,
    originalReq: req
  });

  if (result.error) {
    return res.status(502).json(result);
  }

  // Repasse dos headers básicos que costumam interessar ao cliente: content-type
  if (result.headers && result.headers["content-type"]) {
    res.setHeader("Content-Type", result.headers["content-type"]);
  }

  return res.status(result.status).send(result.data);
});

/**
 * Endpoint: /chatgpt
 * Faz POST para CHATGPT_API_URL usando CHATGPT_API_KEY.
 * Suporta dois formatos de entrada do cliente:
 *  - Formato OpenAI: { model, messages, ... } -> passado direto
 *  - Formato simples: { prompt: "texto" } -> aqui transformamos para messages com role:user
 *
 * Observação: for transparency, nós repassamos o corpo transformado (se necessário) e retornamos a resposta do OpenAI.
 */
app.post("/chatgpt", async (req, res) => {
  const chatUrl = process.env.CHATGPT_API_URL;
  const chatKey = process.env.CHATGPT_API_KEY;

  if (!chatUrl || !chatKey) {
    return res.status(500).json({ error: "server_misconfigured", message: "CHATGPT_API_URL or CHATGPT_API_KEY not set on server" });
  }

  // Prepara payload: se cliente já enviou "messages", passa direto; se enviou "prompt", converte.
  let payload = req.body ?? {};

  if (!payload.messages && payload.prompt) {
    payload = {
      model: payload.model || "gpt-3.5-turbo",
      messages: [
        { role: "user", content: String(payload.prompt) }
      ],
      // copia outras propriedades se houver
      ...payload.extra ?? {}
    };
  }

  const result = await forwardRequest({
    url: chatUrl,
    apiKey: chatKey,
    originalReq: { body: payload }
  });

  if (result.error) {
    return res.status(502).json(result);
  }

  if (result.headers && result.headers["content-type"]) {
    res.setHeader("Content-Type", result.headers["content-type"]);
  }

  return res.status(result.status).send(result.data);
});

// Healthcheck
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

// Start
const port = process.env.PORT || 3000;
app.listen(port, () => {
  // Log mínimo
  console.log(`IA proxy listening on port ${port}`);
});
