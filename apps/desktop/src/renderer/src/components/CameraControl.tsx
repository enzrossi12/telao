import { Video, VideoOff } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'

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
      <button
        type="button"
        className={isCameraOn ? 'camera-button camera-button-on' : 'camera-button'}
        aria-pressed={isCameraOn}
        disabled={isBusy}
        onClick={() => setCameraEnabled(!isCameraOn)}
      >
        {isCameraOn ? <VideoOff size={18} /> : <Video size={18} />}
        {isCameraOn ? 'Desligar câmera' : 'Câmera'}
      </button>
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
