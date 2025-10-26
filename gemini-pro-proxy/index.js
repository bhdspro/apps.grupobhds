// index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuração ---
const app = express();
const PORT = process.env.PORT || 3001; // Render define a porta automaticamente

// --- Middlewares de Segurança ---
app.use(helmet());
app.use(express.json());

// ATENÇÃO: Configure seus domínios aqui
// Adicione as URLs dos seus 5+ projetos que podem usar este backend
const allowedOrigins = [
  'https://meu-projeto-1.onrender.com',
  'https://meu-app-2.com',
  'http://localhost:3000' // Para seus testes locais
  // Adicione todos os seus domínios aqui
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Domínio não permitido pelo CORS'));
    }
  }
}));

// --- Middleware de Autenticação Interna ---
// Esta é a "senha" que seus 5 projetos usarão para falar com este backend.
// Nós vamos definir o valor real no painel do Render.
const internalApiKey = process.env.INTERNAL_API_KEY;

const authenticateKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key']; // Esperamos a senha no header 'x-api-key'

  if (!providedKey || providedKey !== internalApiKey) {
    return res.status(401).json({ error: 'Acesso não autorizado.' });
  }
  next(); // Senha correta, pode prosseguir
};

// --- Configuração do Gemini ---
// A chave real do Gemini SÓ existe aqui, segura no backend
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// IMPORTANTE: Aqui definimos o modelo GEMINI PRO que você solicitou
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });


// --- Rotas da API ---

// Rota de "saúde" para verificar se o servidor está no ar
app.get('/', (req, res) => {
  res.send('Servidor Proxy Gemini PRO está no ar!');
});

/**
 * Rota principal do proxy
 * Ela recebe o prompt, chama o Gemini PRO e retorna a resposta.
 */
app.post('/api/generate', authenticateKey, async (req, res) => {
  try {
    // Você pode receber o 'prompt' ou um histórico de 'history'
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Nenhum prompt fornecido.' });
    }

    const chat = model.startChat({
      history: history || [], // Usa o histórico se ele for enviado
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });

  } catch (error) {
    console.error('Erro ao chamar a API Gemini:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
});