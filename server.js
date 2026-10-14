const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

// Limite simples por IP para reduzir abuso no plano gratuito.
const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
app.use("/api/", (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    bucket = { startedAt: now, count: 0 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({ error: "Muitas mensagens em pouco tempo. Aguarde um minuto e tente novamente." });
  }
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "magnux-ai" }));

app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "A chave GEMINI_API_KEY ainda não foi configurada no Render." });
  }

  const rawMessages = req.body && Array.isArray(req.body.messages) ? req.body.messages : null;
  if (!rawMessages || rawMessages.length === 0) {
    return res.status(400).json({ error: "Envie uma lista de mensagens válida." });
  }

  const messages = rawMessages.slice(-12).map((item) => {
    const role = item && item.role === "assistant" ? "model" : "user";
    const content = item && typeof item.content === "string" ? item.content.trim().slice(0, 4000) : "";
    return { role, parts: [{ text: content }] };
  }).filter((item) => item.parts[0].text.length > 0);

  if (!messages.length || !messages.some((item) => item.role === "user")) {
    return res.status(400).json({ error: "A mensagem está vazia ou inválida." });
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "Você é o Magnux AI, assistente do projeto Magnux. Responda em português do Brasil, com clareza, precisão e objetividade. Ajude com programação, tecnologia, estudos e ideias. Nunca peça senhas, chaves de API ou dados secretos." }]
          },
          contents: messages,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
        }),
        signal: AbortSignal.timeout(45_000)
      }
    );

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const upstreamMessage = data && data.error && data.error.message;
      console.error("Gemini API status:", upstream.status, upstreamMessage || "sem detalhe");
      if (upstream.status === 429) return res.status(429).json({ error: "A cota gratuita da IA pode ter sido atingida. Tente novamente mais tarde." });
      return res.status(502).json({ error: "O serviço de IA recusou a solicitação. Confira a chave, o modelo e a cota gratuita no Google AI Studio." });
    }

    const reply = (data.candidates?.[0]?.content?.parts || [])
      .map((part) => typeof part.text === "string" ? part.text : "")
      .join("")
      .trim();

    if (!reply) return res.status(502).json({ error: "A IA retornou uma resposta vazia. Tente reformular a mensagem." });
    return res.json({ reply });
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error.message || error);
    return res.status(502).json({ error: "Não foi possível alcançar a IA. Tente novamente em instantes." });
  }
});

// O HTML principal deve estar na raiz do repositório com o nome index.html.
app.use(express.static(__dirname));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Magnux AI ativo na porta ${PORT}`);
});
