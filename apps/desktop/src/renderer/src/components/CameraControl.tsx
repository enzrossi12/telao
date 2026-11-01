import { Video, VideoOff } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import IconButton from './IconButton'

interface CameraControlProps {
  camera: ReturnType<typeof useCamera>
  isCameraOn: boolean
}

function CameraControl({ camera, isCameraOn }: CameraControlProps): React.JSX.Element {
  const { devices, selectedDeviceId, isBusy, hasFailed, setCameraEnabled, selectDevice } = camera

  return (
    <div className="camera-control">
      {hasFailed && (
        <p className="camera-error" role="alert">
          Não foi possível usar a câmera.
        </p>
      )}
      <IconButton
        label={isCameraOn ? 'Desligar câmera' : 'Ligar câmera'}
        icon={isCameraOn ? <VideoOff size={20} /> : <Video size={20} />}
        className={isCameraOn ? 'icon-button-accent' : ''}
        isPressed={isCameraOn}
        disabled={isBusy}
        onClick={() => setCameraEnabled(!isCameraOn)}
      />
      {devices.length > 1 && (
        <select
          aria-label="Escolher câmera"
          value={selectedDeviceId ?? devices[0].deviceId}
          onChange={(event) => selectDevice(event.target.value)}
        >
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Câmera ${index + 1}`}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

export default CameraControl
