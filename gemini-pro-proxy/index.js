// --- Dependências ---
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// Importa o SDK do Google
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuração Inicial ---
const app = express();
// O Render define a PORTA automaticamente através das variáveis de ambiente
const PORT = process.env.PORT || 3001; 

// --- Configuração de Segurança ---

// 1. Helmet: Adiciona cabeçalhos de segurança HTTP básicos
app.use(helmet());

// 2. Express JSON: Permite que o servidor entenda JSON enviado no corpo (body) das requisições
app.use(express.json());

// ===================================================================
// ATENÇÃO: SUA ÚNICA CAMADA DE SEGURANÇA ESTÁ AQUI
// ===================================================================
// Adicione as URLs EXATAS dos seus projetos.
// Se a requisição vier de um domínio que NÃO ESTÁ nesta lista,
// o backend irá REJEITÁ-LA.

const allowedOrigins = [
  // --- ADICIONE SEUS DOMÍNIOS PERSONALIZADOS AQUI ---
  // Exemplo 1 (com www):
  // 'https://www.meuprojeto1.com',
  
  // Exemplo 2 (sem www):
  // 'https://meuapp2.com',
  
  // --- DOMÍNIO DO GITHUB PAGES (se você ainda usar) ---
  'https://bhdspro.github.io', 
  
  // --- PARA TESTES NO SEU COMPUTADOR (OPCIONAL) ---
  'http://localhost:3000', // Para React/Vue/etc.
  'http://127.0.0.1:5500' // Para "Live Server" do VS Code
];

// 3. CORS (Cross-Origin Resource Sharing)
app.use(cors({
  /**
   * Esta função verifica a 'origem' (o domínio) de cada requisição
   * que chega ao seu backend.
   */
  origin: function (origin, callback) {
    // Verifica se a 'origem' da requisição está na sua lista 'allowedOrigins'
    // A verificação '!origin' permite requisições sem origem (ex: Postman ou apps mobile)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      // Se a origem estiver na lista, permite a requisição
      callback(null, true);
    } else {
      // Se a origem NÃO estiver na lista, bloqueia a requisição
      callback(new Error('Domínio não permitido pelo CORS'));
    }
  }
}));

// --- Configuração da API Gemini ---

// 1. Puxa a sua chave secreta da API Gemini das variáveis de ambiente do Render
// Esta chave NUNCA fica no código
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Define o modelo a ser usado (gemini-pro, como solicitado)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// --- Rotas da API do seu Backend ---

/**
 * Rota de "Saúde" (Health Check)
 * Apenas para verificar se o servidor está no ar.
 * Você pode acessar https://seu-proxy.onrender.com/ no navegador.
 */
app.get('/', (req, res) => {
  res.send('Servidor Proxy Gemini PRO está no ar e pronto!');
});

/**
 * Rota Principal do Proxy
 * Seus 5+ projetos farão a chamada 'POST' para esta rota.
 * Ela está protegida apenas pela lista 'allowedOrigins'.
 */
app.post('/api/generate', async (req, res) => {
  try {
    // Pega o 'prompt' e o 'history' do corpo da requisição
    const { prompt, history } = req.body;

    // Validação simples
    if (!prompt) {
      return res.status(400).json({ error: 'Nenhum prompt foi fornecido.' });
    }

    // Inicia o chat com o histórico (se houver)
    const chat = model.startChat({
      history: history || [], // Usa o histórico ou um array vazio
      generationConfig: {
        maxOutputTokens: 1000, // Define um limite de tokens
      },
    });

    // Envia o novo prompt para o Gemini
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Retorna a resposta do Gemini para o seu projeto cliente
    res.json({ text });

  } catch (error) {
    // Se algo der errado (ex: chave da API inválida, erro do Gemini)
    console.error('Erro ao chamar a API Gemini:', error.message);
    res.status(500).json({ error: 'Erro interno no servidor ao processar a requisição.' });
  }
});

// --- Iniciar o Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
  console.log('Permitindo requisições dos seguintes domínios:', allowedOrigins);
});
