# Telão — app de compartilhamento de tela e câmera para um grupo de amigos

## O que é
App desktop **somente para Windows** (modelo do Discord: Electron + React) para um grupo
fechado de ~10 amigos. Serve **apenas** para:
- compartilhar a tela (ou uma janela) em **720p a 30 fps**;
- ligar a câmera.

**Não tem** chamada de voz, microfone, chat de texto, contas de usuário, nem versão
mobile/macOS/Linux. Não adicione nada disso sem o usuário pedir.

O plano completo, dividido em fases com critérios de aceite, está em `docs/PLANO.md`.
**Sempre leia o plano antes de começar uma tarefa e trabalhe uma fase por vez.**

## Arquitetura
```
apps/desktop  → Electron + React + TypeScript (electron-vite). O app que os amigos instalam.
apps/token    → Função serverless (Vercel) que valida a senha do grupo e emite o token do LiveKit.
LiveKit Cloud → Servidor de mídia (SFU). Cada pessoa envia o stream uma vez; o SFU distribui.
```
Fluxo: app valida a senha do grupo em `apps/token` → a pessoa cria ou escolhe uma sala (guardada
no Upstash Redis, com senha em hash) → app pede o token dessa sala → conecta no LiveKit → publica
câmera/tela e assina os streams dos outros.

## Stack
- Monorepo com **npm workspaces** (não usar pnpm/yarn).
- Desktop: Electron (última estável), electron-vite, React, TypeScript `strict`.
- Mídia: `livekit-client` no renderer.
- Som da tela: `loopback-capture` no main (módulo nativo aprovado pelo usuário, versão fixa).
- Ícones: `lucide-react`.
- Token: `livekit-server-sdk` numa função da Vercel (`apps/token/api/token.ts`).
- Empacotamento: `electron-builder` (instalador NSIS) + `electron-updater` (GitHub Releases).
- Estilo: CSS Modules ou CSS simples. Sem framework de UI pesado.

## Regras invioláveis
1. **`LIVEKIT_API_SECRET` nunca entra no app desktop.** Só existe nas variáveis de ambiente
   de `apps/token`. O desktop só conhece `LIVEKIT_URL` e `TOKEN_URL`.
2. Segurança do Electron: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
   Renderer só fala com o main via `contextBridge` no preload. Ver skill `electron-seguro`.
3. Microfone **nunca** é publicado. O token só permite as fontes CAMERA, SCREEN_SHARE e
   SCREEN_SHARE_AUDIO.
4. Compartilhamento de tela: preset 720p30, codec H.264 (usa o encoder de hardware da GPU).
   Ver skill `livekit-padroes`.
5. Visual **inspirado** no Discord (tema escuro, layout parecido), mas **sem** usar logo,
   nome, ícones ou assets do Discord.
6. Não adicionar dependências fora da stack acima sem perguntar.

## Convenções
- Código, nomes de variáveis, commits: inglês. Textos da interface: **português (pt-BR)**.
- Componentes React em `apps/desktop/src/renderer/src/components/`, um por arquivo.
- Lógica do LiveKit isolada em hooks (`useRoom`, `useScreenShare`, `useCamera`…), não
  espalhada nos componentes.
- Commits pequenos, um por item do plano (Conventional Commits: `feat:`, `fix:`, `chore:`).
- Ao concluir um item do plano, marque o checkbox em `docs/PLANO.md`.

## Comandos (após a Fase 0)
```
npm install                     # na raiz
npm run dev -w apps/desktop     # roda o app em modo dev
npm run typecheck               # checagem de tipos em todos os workspaces
npm run lint
npm run build:win -w apps/desktop   # gera o instalador .exe em apps/desktop/dist
npx vercel dev --cwd apps/token     # roda a função de token localmente
```

## Skills do projeto (`.claude/skills/`)
- `livekit-padroes` — como usar o LiveKit neste projeto (presets, assinatura sob demanda, eventos).
- `electron-seguro` — regras de segurança e como criar um canal IPC novo.
- `testar-sala` — como simular vários amigos na sala para testar.
- `fechar-fase` — checklist para concluir uma fase do plano (`/fechar-fase N`).
- `release-windows` — gerar e publicar uma versão nova (`/release-windows`).
