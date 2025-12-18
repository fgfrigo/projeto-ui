# Node.js UI + Backend For Frontend (BFF)

## Visão Geral

Este projeto implementa uma aplicação web completa utilizando Vue.js 3 no frontend e Node.js (Fastify) como Backend For Frontend (BFF).

O Node.js atua como uma camada intermediária entre a interface do usuário e o backend Python, sendo responsável por autenticação, gerenciamento de sessão, geração de JWT e encaminhamento seguro de requisições.

Arquitetura da solução:

UI (Vue.js)
→ Node.js (Fastify – BFF)
→ Python API (FastAPI)

## Responsabilidades do BFF

- Servir a interface web
- Gerenciar login e logout
- Manter sessão do usuário via cookies
- Gerar e assinar JWT
- Encaminhar requisições para o backend Python
- Proteger rotas de API

## Tecnologias Utilizadas

- Node.js
- Fastify
- Vue.js 3
- Vite
- JWT
- Axios
- dotenv

## Autenticação

- Usuário administrativo
- Senha definida via variável de ambiente
- JWT gerado no login e enviado como Bearer Token ao backend Python
- Rotas /api protegidas por sessão válida

## Integração com Backend Python

CRUD de itens:
- GET /api/items
- POST /api/items
- PUT /api/items/:id
- DELETE /api/items/:id

API externa pública:
- GET /api/cep/:cep (ViaCEP)

## Configuração de Ambiente

Recomenda-se criar o arquivo .env a partir do .env_sample.

Variáveis esperadas:
- HOST
- PORT
- ADMIN_PASSWORD
- JWT_SECRET
- EXTERNAL_API_BASE

JWT_SECRET deve ser o mesmo utilizado no backend Python.

## Docker

Build:
docker build -t node-ui-app .

Run:
docker run -p 3000:3000 --env-file .env node-ui-app

Acesso:
http://localhost:3000
