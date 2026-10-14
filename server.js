
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

// Servir os arquivos do Magnux
app.use(express.static(__dirname));

// Endpoint da inteligência artificial
app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const message = req.body?.message;

    if (!apiKey) {
      return res.status(500).json({
        error: "A chave da IA não foi configurada no servidor."
      });
    }

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Envie uma mensagem válida."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "Você é a inteligência artificial do Magnux. Responda em português do Brasil de forma clara, útil e objetiva."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: message.trim() }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Gemini:", data);
      return res.status(502).json({
        error: "A IA não conseguiu responder. Verifique a configuração e os limites da API."
      });
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return res.status(502).json({
        error: "A IA retornou uma resposta vazia."
      });
    }

    res.json({ answer });
  } catch (error) {
    console.error("Erro no servidor:", error);
    res.status(500).json({
      error: "Erro interno ao conversar com a IA."
    });
  }
});

// Página inicial do Magnux
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Magnux online na porta ${PORT}`);
});
