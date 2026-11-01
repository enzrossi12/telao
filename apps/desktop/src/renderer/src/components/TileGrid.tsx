import { Children, CSSProperties, ReactNode } from 'react'

interface TileGridProps {
  children: ReactNode
}

function TileGrid({ children }: TileGridProps): React.JSX.Element {
  const count = Children.count(children)
  const columns = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / columns)
  const layout = { '--columns': columns, '--rows': rows } as CSSProperties

  return (
    <section className="tile-grid" style={layout}>
      {children}
    </section>
  )
}

export default TileGrid
