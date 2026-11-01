import { Volume2 } from 'lucide-react'

interface VolumeSliderProps {
  name: string
  volume: number
  onChange: (volume: number) => void
}

function VolumeSlider({ name, volume, onChange }: VolumeSliderProps): React.JSX.Element {
  return (
    <label className="volume-slider" onDoubleClick={(event) => event.stopPropagation()}>
      <Volume2 size={16} aria-hidden="true" />
      <input
        type="range"
        aria-label={`Volume da tela de ${name}`}
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

export default VolumeSlider
