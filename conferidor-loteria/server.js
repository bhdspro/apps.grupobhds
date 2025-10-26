/*
Este é o seu arquivo de backend.
Salve-o como 'server.js' ou 'index.js' na raiz do seu projeto.
*/

const express = require('express');
const cors = require('cors');
// Use 'node-fetch' para versões do Node < 18. Para Node 18+, o fetch é nativo.
const fetch = require('node-fetch'); 
require('dotenv').config(); // Para carregar a API Key do arquivo .env (localmente) ou das Environment Variables (Render)

const app = express();
app.use(express.json({ limit: '10mb' })); // Permite JSON e aumenta o limite para imagens
app.use(cors()); // Permite requisições de outros domínios
// ATUALIZADO: Serve arquivos estáticos (como index.html) da raiz do projeto
app.use(express.static(__dirname)); 

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Este é o endpoint que o HTML vai chamar
app.post('/api/generateContent', async (req, res) => {
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Chave da API (GEMINI_API_KEY) não configurada no servidor.' });
    }

    // O modelo é pego do payload, pois usamos o mesmo para imagem e texto
    const model = "gemini-2.5-flash-preview-09-2025";
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    try {
        console.log('Recebendo requisição para /api/generateContent...');
        
        const googleResponse = await fetch(googleApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body) // Repassa o payload do frontend
        });

        if (!googleResponse.ok) {
            const errorBody = await googleResponse.text();
            console.error('Erro da API do Google:', googleResponse.status, errorBody);
            throw new Error(`Erro da API do Google: ${googleResponse.statusText}`);
        }

        const data = await googleResponse.json();
        console.log('Resposta da API do Google enviada ao frontend.');
        res.json(data); // Envia a resposta do Google de volta para o frontend

    } catch (error) {
        console.error('Erro no proxy do servidor:', error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    if (!GEMINI_API_KEY) {
        console.warn('AVISO: A variável de ambiente GEMINI_API_KEY não está definida.');
    }
});


