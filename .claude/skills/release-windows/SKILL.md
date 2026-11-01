---
name: release-windows
description: Gera e publica uma nova versão do instalador Windows no GitHub Releases para a atualização automática. Use apenas quando o usuário pedir explicitamente com /release-windows.
disable-model-invocation: true
---

# Publicar nova versão ($ARGUMENTS = patch | minor | major, padrão patch)

Pré-requisitos (confirmar antes de começar):
- Working tree limpa (`git status`) e na branch `main`.
- Variável `GH_TOKEN` definida no terminal (token do GitHub com permissão de releases).
- `apps/desktop/electron-builder.yml` com `publish: github` apontando para o repositório.

Passos:
1. `npm run typecheck` e `npm run lint` precisam passar.
2. Subir a versão: `npm version <tipo> -w apps/desktop --no-git-tag-version`.
3. Escrever as novidades em `apps/desktop/CHANGELOG.md` (em português, linguagem simples —
   é o que os amigos vão ler).
4. Commit `chore(release): vX.Y.Z` e tag `vX.Y.Z`; `git push --follow-tags`.
5. Build e publicação: `npm run build:win -w apps/desktop -- --publish always`.
6. Conferir no GitHub Releases: o `.exe`, o `.blockmap` e o `latest.yml` precisam estar lá
   (sem o `latest.yml` a atualização automática não funciona).
7. Avisar o usuário: versão publicada, link do release e que os apps instalados vão
   atualizar na próxima abertura.

Nunca publicar se algum passo falhar; pare e explique o erro.
