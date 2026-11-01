---
name: livekit-padroes
description: Padrões de uso do LiveKit neste projeto (conexão, presets 720p30 H.264, assinatura sob demanda de telas, eventos e limpeza de tracks). Use sempre que escrever ou alterar código que usa livekit-client ou livekit-server-sdk.
---

# Padrões LiveKit do Telão

Antes de usar uma API do LiveKit que você não tem certeza, confira a documentação atual
(docs.livekit.io) ou os tipos em `node_modules/livekit-client` — a API muda entre versões.

## Conexão (hook `useRoom`)
```ts
const room = new Room({
  adaptiveStream: true,   // recebe resolução proporcional ao tamanho do tile
  dynacast: true,         // para de enviar camadas que ninguém está assistindo
  publishDefaults: {
    videoCodec: 'h264',   // encoder de hardware da GPU no Windows
    simulcast: true,
  },
});
await room.connect(import.meta.env.VITE_LIVEKIT_URL, token, { autoSubscribe: false });
```
- `autoSubscribe: false` é obrigatório: o app decide o que assinar.
- Crie um único `Room` por sessão; ao sair, `await room.disconnect()` e descarte a instância.

## O que assinar
- **Câmera (`Track.Source.Camera`)**: assinar automaticamente ao receber `TrackPublished`
  ou ao entrar (percorrer `room.remoteParticipants`).
- **Tela (`Track.Source.ScreenShare`)** e **áudio da tela (`ScreenShareAudio`)**: só assinar
  quando o usuário clicar em "Assistir" (`publication.setSubscribed(true)`); "Parar de
  assistir" chama `setSubscribed(false)`.
- **Microfone**: nunca publicar; o token nem permite.

## Publicar
```ts
// Câmera
await room.localParticipant.setCameraEnabled(true, {
  resolution: VideoPresets.h720.resolution,
  deviceId,
});

// Tela — a fonte já foi escolhida no seletor próprio (ver skill electron-seguro / Fase 4)
await room.localParticipant.setScreenShareEnabled(
  true,
  { audio: withAudio, resolution: ScreenSharePresets.h720fps30.resolution, contentHint: 'motion' },
  { screenShareEncoding: ScreenSharePresets.h720fps30.encoding, videoCodec: 'h264', simulcast: true },
);
```
- Não aumentar acima de 720p30 sem o usuário pedir.

## Eventos que a interface precisa tratar
`ParticipantConnected`, `ParticipantDisconnected`, `TrackPublished`, `TrackUnpublished`,
`TrackSubscribed`, `TrackUnsubscribed`, `LocalTrackPublished`, `LocalTrackUnpublished`,
`Reconnecting`, `Reconnected`, `Disconnected`, `MediaDevicesError`.

- Registre listeners em um único lugar (o hook) e remova-os no cleanup do `useEffect`.
- Estado da UI deve ser derivado do `Room` (re-render a partir dos eventos), não duplicado
  manualmente em vários componentes.

## Renderização e limpeza
- Use `track.attach(videoEl)` num `<video>` controlado por ref; no unmount ou
  `TrackUnsubscribed`, chame `track.detach(videoEl)`.
- Nunca crie `<video>` soltos com `track.attach()` sem guardar referência — vaza memória.
- A própria câmera: pré-visualização com `transform: scaleX(-1)` (apenas visual).

## Diagnóstico
Para o overlay (`Ctrl+Shift+D`), use as estatísticas do receiver/sender do track
(resolução, fps, bitrate, codec). Confirme que o codec recebido é H.264.

## Token (apps/token)
- `AccessToken(apiKey, apiSecret, { identity, name, ttl: '6h' })`.
- `addGrant({ roomJoin: true, room, canSubscribe: true, canPublish: true, canPublishData: false,
  canPublishSources: [TrackSource.CAMERA, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO] })`.
- `await at.toJwt()` (é assíncrono nas versões atuais).
