import { useState } from 'react'
import { ScreenShare, ScreenShareOff } from 'lucide-react'
import { UseScreenShare } from '../hooks/useScreenShare'
import ScreenPicker from './ScreenPicker'

interface ScreenShareControlProps {
  screenShare: UseScreenShare
  isSharing: boolean
}

function ScreenShareControl({
  screenShare,
  isSharing
}: ScreenShareControlProps): React.JSX.Element {
  const { isBusy, hasFailed, startSharing, stopSharing } = screenShare
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const handlePick = (sourceId: string): void => {
    setIsPickerOpen(false)
    startSharing(sourceId)
  }

  return (
    <div className="camera-control">
      {hasFailed && (
        <p className="camera-error" role="alert">
          Não foi possível compartilhar a tela.
        </p>
      )}
      <button
        type="button"
        className={isSharing ? 'camera-button screen-button-on' : 'camera-button'}
        aria-pressed={isSharing}
        disabled={isBusy}
        onClick={() => (isSharing ? stopSharing() : setIsPickerOpen(true))}
      >
        {isSharing ? <ScreenShareOff size={18} /> : <ScreenShare size={18} />}
        {isSharing ? 'Parar de compartilhar' : 'Compartilhar tela'}
      </button>
      {isPickerOpen && <ScreenPicker onPick={handlePick} onCancel={() => setIsPickerOpen(false)} />}
    </div>
  )
}

export default ScreenShareControl
