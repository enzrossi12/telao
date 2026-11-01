import { useEffect, useState } from 'react'

function UpdateBanner(): React.JSX.Element | null {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    window.telao.getDownloadedUpdate().then((downloaded) => {
      if (downloaded) setVersion(downloaded)
    })
    return window.telao.onUpdateDownloaded(setVersion)
  }, [])

  if (!version) return null

  return (
    <aside className="update-banner" role="status">
      <span>Nova versão disponível</span>
      <button type="button" onClick={() => window.telao.restartToUpdate()}>
        Reiniciar
      </button>
    </aside>
  )
}

export default UpdateBanner
