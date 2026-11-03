import { EyeOff } from 'lucide-react'

interface StopWatchingButtonProps {
  onClick: () => void
}

// Centered at the bottom of the video; small tiles show only the icon.
function StopWatchingButton({ onClick }: StopWatchingButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className="stream-control stream-stop"
      aria-label="Parar de assistir"
      onClick={onClick}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <EyeOff size={16} aria-hidden="true" />
      <span className="stream-stop-label" aria-hidden="true">
        Parar de assistir
      </span>
    </button>
  )
}

export default StopWatchingButton
