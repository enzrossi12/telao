# Serviço de token

Função da Vercel que valida a senha do grupo e emite o token do LiveKit.

`POST /api/token` com `{ "name": "Fulano", "password": "senha-do-grupo" }` responde `{ "token": "..." }`.

| Status | Corpo                               | Motivo                                                |
| ------ | ----------------------------------- | ----------------------------------------------------- |
| 200    | `{ token }`                         | Tudo certo                                            |
| 400    | `{ error: "invalid_body" }`         | JSON inválido                                         |
| 400    | `{ error: "invalid_name" }`         | Nome fora de 2–24 caracteres ou com espaço nas pontas |
| 401    | `{ error: "invalid_password" }`     | Senha errada                                          |
| 500    | `{ error: "server_misconfigured" }` | Falta variável de ambiente                            |

## Variáveis de ambiente

`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `GROUP_PASSWORD` e `ROOM_NAME` (padrão: `telao`).

**`LIVEKIT_API_SECRET` só existe aqui, nunca no app desktop.**

## Deploy

Rode os comandos dentro de `apps/token`. O primeiro cria o projeto na Vercel:

```bash
npx vercel
```

Cadastre cada variável, repetindo para as quatro:

```bash
npx vercel env add LIVEKIT_API_KEY production
```

Publique em produção:

```bash
npx vercel --prod
```

## Testar

```bash
curl -X POST https://<seu-app>.vercel.app/api/token -H "Content-Type: application/json" -d "{\"name\":\"Teste\",\"password\":\"senha-do-grupo\"}"
```

Para rodar localmente, copie `.env.example` para `.env` e use `npx vercel dev`, que pede login na
Vercel.
