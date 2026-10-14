# Magnux AI — pacote para Render (gratuito dentro dos limites)

Este pacote preserva o HTML atual do Magnux e conecta o chat 🤖 ao endpoint `/api/chat`, executado por um servidor Node.js. A chave do Gemini fica apenas nas variáveis de ambiente do Render.

## Arquivos
- `index.html`: versão atual do Magnux com chamada de vídeo e janela de chat Magnux AI.
- `server.js`: backend Node.js que chama a Gemini API sem expor a chave no navegador.
- `package.json`: dependências e comando de inicialização.
- `.gitignore`: evita enviar dependências e arquivo `.env`.

## Enviar para o GitHub
1. Abra o repositório `jarvis-site`.
2. Envie/substitua `index.html`, `server.js`, `package.json` e `.gitignore`.
3. Não envie uma chave real de API nem crie um `.env` com a chave.
4. Faça `Commit changes`.

## Configurar no Render
- Runtime/Language: `Node` (não Docker)
- Branch: `main`
- Root Directory: vazio
- Build Command: `npm install`
- Start Command: `npm start`
- Instance: `Free`
- Environment Variables: `GEMINI_API_KEY` = sua chave do Google AI Studio; opcional `GEMINI_MODEL` = `gemini-2.5-flash`

Depois de salvar, faça o deploy. Teste `https://SEU-SERVICO.onrender.com/health`; deve retornar JSON com `ok: true`. A IA fica em `POST /api/chat` e é chamada automaticamente pelo botão 🤖 dentro do Magnux após entrar no perfil.

## Limites importantes
- O Render Free pode suspender o serviço após inatividade e o primeiro acesso pode demorar.
- A Gemini API tem cotas e disponibilidade sujeitas aos termos atuais do Google.
- O backend aplica um limite básico por IP, mas para um site público maior é recomendável adicionar autenticação real e controles de abuso.
- O HTML original usa um sistema de login legado no Firebase Realtime Database. Este pacote não altera esse login; ele apenas conecta a IA ao backend. Revise as regras do Firebase antes de usar dados reais, pois o login legado não equivale à autenticação segura do Firebase Auth.
