# Plano de implantação — Telão

App desktop para Windows, no modelo do Discord (Electron + React), para ~10 amigos
compartilharem a tela (720p/30fps) ou ligarem a câmera. Sem voz.

> Para o Claude Code: execute **uma fase por vez**, na ordem. Ao fim de cada fase, rode a
> skill `fechar-fase` e só avance quando todos os critérios de aceite estiverem cumpridos.
> Se algo do plano se mostrar inviável, pare e explique antes de mudar de abordagem.

---

## Decisões já tomadas

| Tema | Decisão |
|---|---|
| Plataforma | Somente Windows 10/11 x64 |
| App | Electron + React + TypeScript (electron-vite) |
| Mídia | LiveKit Cloud (SFU). Self-host fica para o futuro, se necessário |
| Token | Função serverless na Vercel, senha única do grupo |
| Sala | Uma sala fixa (`telao`), configurável por variável de ambiente |
| Tela | 720p, 30 fps, H.264, simulcast ligado |
| Câmera | 720p, 30 fps, simulcast ligado |
| Áudio | Sem microfone. Áudio da tela opcional (Fase 6) |
| Assistir tela | **Sob demanda, igual ao Discord**: a pessoa clica em "Assistir" para receber o stream. Câmeras são recebidas automaticamente |
| Distribuição | Instalador NSIS + atualização automática via GitHub Releases |
| Assinatura de código | Não (o SmartScreen mostrará aviso; aceitável para amigos) |

### Estimativa de banda (por pessoa)
- Enviando a tela a 720p30: ~1,5–2,5 Mbps de upload.
- Câmera 720p: ~1–1,7 Mbps de upload.
- Assistindo 1 tela em destaque + algumas câmeras em miniatura: ~3–5 Mbps de download
  (miniaturas recebem a camada baixa do simulcast).

### Variáveis de ambiente
```
# apps/token (configurar na Vercel; NUNCA no desktop)
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
GROUP_PASSWORD=
ROOM_NAME=telao

# apps/desktop (.env, prefixo exigido pelo electron-vite para o renderer)
VITE_LIVEKIT_URL=wss://<seu-projeto>.livekit.cloud
VITE_TOKEN_URL=https://<seu-app>.vercel.app/api/token
```

---

## Fase 0 — Estrutura do projeto
- [x] Inicializar git e `.gitignore` (node_modules, dist, out, .env, .vercel).
- [x] Criar monorepo com npm workspaces: `apps/desktop` e `apps/token`.
- [x] Gerar `apps/desktop` com o template electron-vite **react-ts**.
- [x] TypeScript `strict` em todos os workspaces; ESLint + Prettier na raiz.
- [x] Scripts na raiz: `typecheck`, `lint`, `format`.
- [x] Criar `.env.example` nos dois apps com as variáveis acima.
- [x] Configurar janela principal com `contextIsolation: true`, `sandbox: true`,
      `nodeIntegration: false` e preload com `contextBridge` (ver skill `electron-seguro`).

**Aceite:** `npm run dev -w apps/desktop` abre uma janela; `npm run typecheck` e
`npm run lint` passam sem erros.

---

## Fase 1 — Serviço de token
- [x] `apps/token/api/token.ts`: aceita `POST { name, password }`.
- [x] Rejeitar com 401 se `password !== GROUP_PASSWORD` (comparação em tempo constante).
- [x] Validar `name`: 2–24 caracteres, sem espaços nas pontas.
- [x] `identity` = nome + sufixo aleatório curto (evita conflito de nomes iguais);
      `name` = nome exibido.
- [x] Permissões do token: `roomJoin`, `room: ROOM_NAME`, `canSubscribe: true`,
      `canPublish: true`, `canPublishSources: [CAMERA, SCREEN_SHARE, SCREEN_SHARE_AUDIO]`,
      `canPublishData: false`. Validade de 6 horas.
- [x] Responder `{ token }`; CORS liberado (o app Electron chama de `file://`/localhost).
- [x] README curto em `apps/token` explicando o deploy (`npx vercel`, variáveis de ambiente).

**Aceite:** com `vercel dev`, um `curl` com senha certa devolve um token; com senha errada
devolve 401. Decodificar o JWT mostra as fontes permitidas corretas e nenhuma permissão de
microfone.

> Pausa para o usuário: criar conta no LiveKit Cloud e na Vercel, fazer o deploy e
> preencher as variáveis. O Claude Code deve listar os passos e esperar.

---

## Fase 2 — Entrar na sala e presença
- [x] Tela de entrada: campo nome, campo senha do grupo, botão "Entrar". Mensagens de erro
      em português (senha errada, sem internet, servidor fora).
- [x] Hook `useRoom`: busca token, cria `Room` com `adaptiveStream: true`, `dynacast: true`,
      `autoSubscribe: false` (assinatura é controlada pelo app — ver Fase 4) e conecta.
- [x] Lista de participantes na barra lateral (estilo Discord): nome, ícone de câmera ligada,
      selo "AO VIVO" quando compartilha tela.
- [x] Tratar `Reconnecting`/`Reconnected`/`Disconnected` com aviso na interface.
- [x] Botão "Sair" que desconecta e volta à tela de entrada.
- [x] Lembrar nome e senha (senha cifrada com `safeStorage` do Electron, via IPC).

**Aceite:** duas instâncias do app (ver skill `testar-sala`) entram na sala e cada uma vê a
outra na lista; derrubar a rede mostra "Reconectando…" e volta sozinho.

---

## Fase 3 — Câmera
- [x] Botão "Câmera" na barra inferior liga/desliga a câmera.
- [x] Publicar em 720p30 com simulcast (`VideoPresets.h720`).
- [x] Seleção de dispositivo de câmera (menu ao lado do botão), lembrando a escolha.
- [x] Assinar automaticamente as câmeras dos outros (`TrackPublished` com fonte CAMERA).
- [x] Grade de blocos (tiles) responsiva: câmera ligada mostra o vídeo; desligada mostra
      avatar com a inicial do nome.
- [x] Pré-visualização da própria câmera espelhada.
- [x] Limpar elementos `<video>` ao desassinar (`track.detach()`), sem vazamento de memória.

**Aceite:** com 3 instâncias, todas veem as câmeras umas das outras; ligar/desligar reflete em
menos de 1 s; o uso de memória não cresce ao ligar/desligar a câmera 20 vezes.

---

## Fase 4 — Compartilhamento de tela (núcleo do app)
- [x] **Seletor próprio** estilo Discord: modal com abas "Aplicativos" e "Telas", miniaturas e
      ícones vindos de `desktopCapturer.getSources` (no main, via IPC).
- [x] Fluxo: usuário escolhe a fonte → renderer envia o `id` ao main → main guarda a escolha
      → renderer chama `setScreenShareEnabled(true, …)` → o `setDisplayMediaRequestHandler`
      do main entrega a fonte escolhida. Cancelar no modal não deve iniciar nada.
- [x] Publicar com `ScreenSharePresets.h720fps30`, `videoCodec: 'h264'`, simulcast ligado,
      `contentHint: 'motion'`.
- [x] Tile de tela com selo "AO VIVO" e botão **"Assistir"**. Só assina o track ao clicar
      (economiza banda, igual ao Discord). Botão "Parar de assistir" desassina.
- [x] **Modo foco:** clicar num stream assistido o coloca em destaque; demais tiles viram uma
      faixa embaixo. Duplo clique deixa a janela em tela cheia; `Esc` sai.
- [x] Ao parar de compartilhar (botão ou janela capturada fechada), remover o tile para todos.
- [x] Notificação do Windows: "Fulano está ao vivo" (só se a janela não estiver em foco).
- [x] Overlay de diagnóstico (atalho `Ctrl+Shift+D`): resolução, fps, bitrate e codec recebidos,
      via `getStats`/`track.getReceiverStats()`.

**Aceite:** compartilhando uma janela de jogo ou vídeo, quem assiste vê 1280×720 a ~30 fps com
codec H.264 no overlay; quem não clicou em "Assistir" não recebe bytes desse track; uso de CPU
de quem compartilha fica razoável (encoder de hardware ativo — verificar no overlay ou no
Gerenciador de Tarefas, aba GPU, "Video Encode").

---

## Fase 5 — Acabamento de app desktop
- [x] Tema escuro inspirado no Discord, com cores e ícones próprios (ex.: Tabler/Lucide).
- [x] Ícone do app e nome "Telão" na barra de tarefas.
- [x] `requestSingleInstanceLock` (abrir de novo foca a janela existente). Em dev, permitir
      várias instâncias via variável `TELAO_MULTI_INSTANCE=1` e pasta de dados separada via
      `TELAO_USER_DATA` (só quando `!app.isPackaged`; ver skill `testar-sala`).
      *Pode ser antecipado para a Fase 2, onde já é preciso abrir duas instâncias.*
- [x] Bandeja do sistema: fechar a janela minimiza para a bandeja; menu com "Abrir" e "Sair".
- [x] Lembrar tamanho e posição da janela.
- [x] Opção "Iniciar com o Windows" (desligada por padrão). *Só funciona na versão instalada;
      conferir na Fase 7.*
- ~~Atalho global opcional para iniciar/parar o compartilhamento (`globalShortcut`).~~
  Removido a pedido do usuário: não funcionou no teste e não é necessário.

**Aceite:** o app se comporta como um programa normal do Windows: uma instância só, bandeja
funcionando, janela volta na mesma posição.

---

## Fase 6 — Áudio da tela (opcional, igual ao "compartilhar com som" do Discord)
- [ ] Checkbox "Compartilhar som" no seletor.
- [ ] No handler de display media, usar `audio: 'loopback'` (captura o som do sistema no Windows).
- [ ] Publicar como `SCREEN_SHARE_AUDIO`; quem assiste ouve e tem slider de volume por stream.
- [ ] **Risco a verificar:** o loopback captura *todo* o som do PC, inclusive o áudio de outros
      streams que a pessoa está assistindo no próprio app (eco/realimentação). Testar e, se
      ocorrer, aplicar mitigação: silenciar os áudios recebidos enquanto a pessoa compartilha
      som e mostrar um aviso. A solução definitiva (captura de áudio por processo, como o
      Discord faz com WASAPI process loopback) exige módulo nativo — **não fazer sem o
      usuário aprovar**.

**Aceite:** quem assiste ouve o som do vídeo compartilhado sem eco perceptível.

---

## Fase 7 — Instalador e atualização automática
- [ ] `electron-builder` com alvo NSIS x64: atalho na área de trabalho e no menu Iniciar,
      instalação por usuário (sem pedir administrador).
- [ ] `electron-updater` publicando no GitHub Releases do repositório; verificar atualização ao
      abrir e a cada 6 horas; aviso "Nova versão disponível — reiniciar".
- [ ] Versão exibida na tela de entrada.
- [ ] Documentar o processo na skill `release-windows`.

**Aceite:** instalar a v0.1.0 numa máquina, publicar a v0.1.1 e o app atualizar sozinho.

---

## Fase 8 — Teste com o grupo e ajuste fino
- [ ] Teste de carga: 10 participantes (instâncias reais + bots do LiveKit CLI), 3 telas
      compartilhando, todos com câmera. Ver skill `testar-sala`.
- [ ] Medir CPU, memória e banda de quem compartilha e de quem assiste; registrar em
      `docs/RESULTADOS.md`.
- [ ] Ajustar bitrate máximo da tela se alguém tiver upload fraco (ex.: limitar a 1,5 Mbps).
- [ ] Conferir consumo do plano gratuito no painel do LiveKit Cloud.
- [ ] Sessão real com os amigos; anotar problemas em `docs/FEEDBACK.md` e corrigir.

**Aceite:** sessão de 1 hora com o grupo sem quedas e sem travamentos perceptíveis.

---

## Fora do escopo (não fazer sem pedido explícito)
Voz/microfone, chat de texto, várias salas, contas e cadastro, mobile, macOS/Linux, gravação,
self-host do LiveKit, assinatura de código.
