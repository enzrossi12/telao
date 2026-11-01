import { useState } from 'react'
import { ScreenShare, ScreenShareOff } from 'lucide-react'
import { UseScreenShare } from '../hooks/useScreenShare'
import IconButton from './IconButton'
import ScreenPicker from './ScreenPicker'

interface ScreenShareControlProps {
  screenShare: UseScreenShare
  isSharing: boolean
}

function ScreenShareControl({
  screenShare,
  isSharing
}: ScreenShareControlProps): React.JSX.Element {
  const { isBusy, hasFailed, hasAudioFailed, startSharing, stopSharing } = screenShare
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const handlePick = (sourceId: string, withAudio: boolean): void => {
    setIsPickerOpen(false)
    startSharing(sourceId, withAudio)
  }

  return (
    <div className="camera-control">
      {hasFailed && (
        <p className="camera-error" role="alert">
          Não foi possível compartilhar a tela.
        </p>
      )}
      {hasAudioFailed && (
        <p className="camera-error" role="alert">
          A tela está sendo compartilhada, mas sem som.
        </p>
      )}
      <IconButton
        label={isSharing ? 'Parar de compartilhar' : 'Compartilhar tela'}
        icon={isSharing ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
        className={isSharing ? 'icon-button-danger' : ''}
        isPressed={isSharing}
        disabled={isBusy}
        onClick={() => (isSharing ? stopSharing() : setIsPickerOpen(true))}
      />
      {isPickerOpen && <ScreenPicker onPick={handlePick} onCancel={() => setIsPickerOpen(false)} />}
    </div>
  )
}

export default ScreenShareControl
