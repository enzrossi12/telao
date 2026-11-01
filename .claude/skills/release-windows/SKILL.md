---
name: release-windows
description: Gera e publica uma nova versão do instalador Windows no GitHub Releases para a atualização automática. Use apenas quando o usuário pedir explicitamente com /release-windows.
disable-model-invocation: true
---

# Publicar nova versão ($ARGUMENTS = patch | minor | major, padrão patch)

Pré-requisitos (confirmar antes de começar):
- Working tree limpa (`git status`) e na branch `main`.
- `apps/desktop/.env` preenchido: as URLs entram no instalador durante o build.
- `apps/desktop/electron-builder.yml` com `publish` apontando para `enzrossi12/telao`.

Passos:
1. `npm run typecheck` e `npm run lint` precisam passar.
2. Subir a versão: `npm version <tipo> -w apps/desktop --no-git-tag-version`.
3. Escrever as novidades em `apps/desktop/CHANGELOG.md` (em português, linguagem simples —
   é o que os amigos vão ler).
4. Commit `chore(release): vX.Y.Z`, tag anotada com `git tag -a vX.Y.Z -m vX.Y.Z` (o
   `--follow-tags` ignora tags simples) e `git push --follow-tags`.
5. Gerar os arquivos: `npm run build:win -w apps/desktop`.
6. Publicar em Releases, de um destes jeitos (feito pelo usuário, que é quem tem acesso à conta):
   - **Pelo site:** em github.com/enzrossi12/telao/releases/new, escolher a tag `vX.Y.Z` e anexar
     de `apps/desktop/dist` os três arquivos `telao-X.Y.Z-setup.exe`,
     `telao-X.Y.Z-setup.exe.blockmap` e `latest.yml`.
   - **Pelo terminal:** com `GH_TOKEN` definido no terminal do usuário (token com permissão de
     releases no repositório), `npm run build:win -w apps/desktop -- --publish always`.
7. Conferir no GitHub Releases que os três arquivos estão lá e que o release **não** é rascunho
   nem pré-lançamento (sem o `latest.yml` a atualização automática não funciona).
8. Avisar o usuário: versão publicada, link do release e que os apps instalados baixam a versão
   sozinhos, mostrando "Nova versão disponível" para reiniciar.

Nunca publicar se algum passo falhar; pare e explique o erro.

O instalador não é assinado, então o SmartScreen mostra um aviso na primeira instalação: em "Mais
informações" e "Executar assim mesmo" a instalação segue. Ele traz as URLs do LiveKit e do token,
mas nenhum segredo: `LIVEKIT_API_SECRET` e a senha do grupo nunca entram no app.
