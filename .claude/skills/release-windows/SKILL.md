---
name: release-windows
description: Gera o instalador Windows de uma versão nova para enviar aos amigos. Use apenas quando o usuário pedir explicitamente com /release-windows.
disable-model-invocation: true
---

# Gerar nova versão ($ARGUMENTS = patch | minor | major, padrão patch)

O Telão não tem atualização automática: cada versão é um instalador que o usuário envia aos
amigos, que instalam por cima da versão anterior. O login salvo é mantido.

Pré-requisitos (confirmar antes de começar):
- Working tree limpa (`git status`) e na branch `main`.
- `apps/desktop/.env` preenchido: as URLs entram no instalador durante o build.

Passos:
1. `npm run typecheck` e `npm run lint` precisam passar.
2. Subir a versão: `npm version <tipo> -w apps/desktop --no-git-tag-version`.
3. Escrever as novidades em `apps/desktop/CHANGELOG.md` (em português, linguagem simples —
   é o que os amigos vão ler).
4. Commit `chore(release): vX.Y.Z` e tag `vX.Y.Z`; `git push --follow-tags`.
5. Gerar o instalador: `npm run build:win -w apps/desktop`.
6. Conferir que `apps/desktop/dist/telao-X.Y.Z-setup.exe` existe e abre o app.
7. Avisar o usuário: versão gerada, caminho do `.exe` e o que mudou, pronto para mandar no grupo.

Nunca gerar a versão se algum passo falhar; pare e explique o erro.

O instalador não é assinado, então o SmartScreen mostra um aviso: em "Mais informações" e
"Executar assim mesmo" a instalação segue. Ele traz as URLs do LiveKit e do token, mas nenhum
segredo: `LIVEKIT_API_SECRET` e a senha do grupo nunca entram no app.
