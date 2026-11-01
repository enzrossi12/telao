# Serviço de token

Funções da Vercel que validam a senha do grupo, guardam as salas e emitem o token do LiveKit.

| Endpoint          | Corpo                                        | Resposta              |
| ----------------- | -------------------------------------------- | --------------------- |
| `POST /api/login` | `{ password }`                               | `{ status: "ok" }`    |
| `POST /api/rooms` | `{ password, roomName, roomPassword }`       | `201 { roomName }`    |
| `POST /api/token` | `{ name, password, roomName, roomPassword }` | `{ token, roomName }` |

Sem `roomName`, `/api/token` entra na sala fixa de `ROOM_NAME`. Isso mantém as versões do app até a
0.1.5 funcionando.

| Status | `error`                 | Motivo                                                |
| ------ | ----------------------- | ----------------------------------------------------- |
| 400    | `invalid_body`          | JSON inválido                                         |
| 400    | `invalid_name`          | Nome fora de 2–24 caracteres ou com espaço nas pontas |
| 400    | `invalid_room`          | Sala fora de 2–32 caracteres ou senha fora de 4–64    |
| 401    | `invalid_password`      | Senha do grupo errada                                 |
| 403    | `invalid_room_password` | Senha da sala errada                                  |
| 404    | `room_not_found`        | Sala não existe ou expirou                            |
| 409    | `room_exists`           | Já existe uma sala com esse nome                      |
| 500    | `server_misconfigured`  | Falta variável de ambiente                            |
| 500    | `storage_unavailable`   | Redis fora do ar ou sem configurar                    |

Uma sala expira depois de 7 dias sem ninguém entrar (`ROOM_TTL_SECONDS` em `lib/rooms.ts`). A senha
fica guardada só como hash `scrypt`.

## Variáveis de ambiente

`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `GROUP_PASSWORD`, `ROOM_NAME` (padrão: `telao`) e as do
Redis, `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`. A integração da Upstash cadastra as do
Redis sozinha; os nomes `KV_REST_API_URL` e `KV_REST_API_TOKEN` também funcionam.

**`LIVEKIT_API_SECRET` só existe aqui, nunca no app desktop.**

## Deploy

Rode os comandos dentro de `apps/token`. O primeiro cria o projeto na Vercel:

```bash
npx vercel
```

Cadastre cada variável, repetindo para as quatro primeiras:

```bash
npx vercel env add LIVEKIT_API_KEY production
```

Para as salas, abra **Storage** no projeto da Vercel, crie um banco **Upstash Redis** e conecte ao
projeto.

Publique em produção:

```bash
npx vercel --prod
```

## Testar

```bash
curl -X POST https://<seu-app>.vercel.app/api/login -H "Content-Type: application/json" -d "{\"password\":\"senha-do-grupo\"}"
```

Para rodar localmente, copie `.env.example` para `.env` e use `npx vercel dev`, que pede login na
Vercel.
