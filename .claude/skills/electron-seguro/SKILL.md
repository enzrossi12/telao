---
name: electron-seguro
description: Regras de segurança do Electron e passo a passo para criar um canal IPC novo (preload + contextBridge + handler no main), incluindo o fluxo do seletor de tela com desktopCapturer. Use ao mexer em main, preload, IPC, janelas ou captura de tela.
---

# Electron seguro no Telão

## Configuração obrigatória de toda BrowserWindow
```ts
webPreferences: {
  preload: join(__dirname, '../preload/index.js'),
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
  webSecurity: true,
}
```
- Bloquear navegação para fora do app (`will-navigate` → `preventDefault`).
- `setWindowOpenHandler` → `{ action: 'deny' }`; links externos só via `shell.openExternal`
  e apenas para URLs `https:` conhecidas.
- CSP no `index.html` permitindo apenas: o próprio app, `wss://*.livekit.cloud`,
  `https://*.livekit.cloud` e o `VITE_TOKEN_URL`.

## Criar um canal IPC novo (sempre nesta ordem)
1. **Tipos** em `src/shared/ipc.ts`: nome do canal como constante + tipos de entrada/saída.
2. **Main** (`src/main/ipc/<area>.ts`): `ipcMain.handle(CANAL, handler)`.
   - Validar `event.senderFrame.url` (deve ser o app).
   - Validar os argumentos (tipo, tamanho). Nunca confiar no renderer.
3. **Preload** (`src/preload/index.ts`): expor uma função específica, nunca `ipcRenderer` cru.
   ```ts
   contextBridge.exposeInMainWorld('telao', {
     listScreenSources: () => ipcRenderer.invoke(IPC.LIST_SOURCES),
   });
   ```
4. **Tipagem global** em `src/preload/index.d.ts` (`window.telao`).
5. **Renderer** usa `window.telao.<função>()`.

Proibido: expor `ipcRenderer`, `require`, `fs`, `shell` ou qualquer API genérica ao renderer.

## Fluxo do seletor de tela (Fase 4)
```
renderer ── telao.listScreenSources() ──▶ main: desktopCapturer.getSources({
                                            types: ['window','screen'],
                                            thumbnailSize: {width: 320, height: 180},
                                            fetchWindowIcons: true })
         ◀── [{id, name, thumbnailDataUrl, iconDataUrl, kind}] ──

renderer (usuário escolhe) ── telao.selectScreenSource(id) ──▶ main guarda em memória

renderer ── room.localParticipant.setScreenShareEnabled(true, …)
         → Chromium chama getDisplayMedia
         → main: session.defaultSession.setDisplayMediaRequestHandler((req, callback) => {
              pega a fonte guardada; se não houver, nega;
              callback({ video: source });
              limpa a escolha guardada })
```
- O som da tela **não** passa por esse handler: o loopback do Electron levaria o Discord junto.
  Ele é capturado no main com `loopback-capture` (`src/main/ipc/screenAudio.ts`), excluindo o
  processo do Discord, e chega ao renderer como PCM pelo canal `SCREEN_AUDIO_CHUNK`.
- Converter miniaturas com `thumbnail.toDataURL()` no main antes de enviar.
- Se a fonte escolhida não existir mais (janela fechada), negar e avisar o usuário.

## Armazenar a senha do grupo
Usar `safeStorage.encryptString` / `decryptString` no main, gravando o resultado em arquivo
dentro de `app.getPath('userData')`. Nunca em `localStorage` em texto puro.
