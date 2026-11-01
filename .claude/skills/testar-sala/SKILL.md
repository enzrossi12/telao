---
name: testar-sala
description: Como simular vários amigos na sala para testar o app — várias instâncias do Electron e bots do LiveKit CLI. Use ao testar presença, câmera, compartilhamento de tela ou carga.
---

# Testar com vários participantes

## 1. Várias instâncias do app na mesma máquina
O app usa `requestSingleInstanceLock`, então em dev é preciso liberar:
```powershell
# terminal 1
$env:TELAO_MULTI_INSTANCE="1"; npm run dev -w apps/desktop
# terminal 2, 3… (cada uma com pasta de dados separada para não dividir o login salvo)
$env:TELAO_MULTI_INSTANCE="1"; $env:TELAO_USER_DATA="$env:TEMP\telao-2"; npm run dev -w apps/desktop
```
O main deve ler `TELAO_USER_DATA` e chamar `app.setPath('userData', …)` antes do `ready`
(somente quando `!app.isPackaged`).

Use nomes diferentes em cada instância (ex.: "Teste1", "Teste2").

## 2. Bots com o LiveKit CLI (`lk`)
Instalar no Windows: `winget install LiveKit.LiveKitCLI` (ou baixar do GitHub do livekit/livekit-cli).
Configurar o projeto: `lk cloud auth` (ou passar `--url`, `--api-key`, `--api-secret`).

- Um bot entrando e publicando vídeo de demonstração (simula uma câmera/tela):
  `lk room join --identity bot1 --publish-demo telao`
- Teste de carga com vários publicadores e espectadores:
  `lk load-test --room telao --video-publishers 3 --subscribers 7 --duration 2m`

As flags mudam entre versões: confira com `lk room join --help` e `lk load-test --help`
antes de rodar.

Os comandos acima usam a sala fixa `telao`. Uma sala criada no app tem um ID interno `sala-…`:
com alguém dentro, descubra o ID com `lk room list` e use-o no lugar de `telao`.

## 3. O que verificar em cada teste
- Lista de participantes correta nas duas pontas.
- Overlay `Ctrl+Shift+D`: 1280×720, ~30 fps, codec H.264 na tela assistida.
- Quem **não** clicou em "Assistir" não recebe o track de tela (ver bitrate 0 / sem assinatura).
- Gerenciador de Tarefas: CPU do app e "Video Encode" da GPU de quem compartilha.
- Derrubar o Wi-Fi por 5 s: deve aparecer "Reconectando…" e voltar.

Registre números de testes de carga em `docs/RESULTADOS.md` (data, cenário, CPU, RAM, banda).
