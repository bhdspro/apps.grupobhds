// --- Dependências ---
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuração Inicial ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- Segurança ---
app.use(helmet());
app.use(express.json());

const allowedOrigins = [
  'https://apps.grupobhds.com',
  'https://bhdspro.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Domínio não permitido pelo CORS'));
    }
  }
}));

// --- Configuração da API Gemini ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ⚠️ Modelo atualizado — compatível com o endpoint atual (v1)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// --- Rotas ---
app.get('/', (req, res) => {
  res.send('Servidor Proxy Gemini PRO está no ar e pronto!');
});

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Nenhum prompt foi fornecido.' });
    }

    const chat = model.startChat({
      history: history || [],
      generationConfig: { maxOutputTokens: 1000 },
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response.text();

    res.json({ text: response });

  } catch (error) {
    console.error('Erro ao chamar a API Gemini:', error.message);

    // Retorna o erro original para debug mais detalhado
    res.status(500).json({
      error: 'Erro interno no servidor ao processar a requisição.',
      details: error.message,
    });
  }
});

// --- Inicialização ---
app.listen(PORT, () => {
  console.log(`✅ Servidor proxy rodando na porta ${PORT}`);
  console.log('🌐 Permitindo requisições dos seguintes domínios:', allowedOrigins);
});
