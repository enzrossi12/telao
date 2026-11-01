import { ReactNode } from 'react'

interface IconButtonProps {
  label: string
  icon: ReactNode
  className?: string
  isPressed?: boolean
  disabled?: boolean
  onClick: () => void
}

function IconButton({
  label,
  icon,
  className = '',
  isPressed,
  disabled,
  onClick
}: IconButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      aria-pressed={isPressed}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span className="icon-button-tooltip" aria-hidden="true">
        {label}
      </span>
    </button>
  )
}

export default IconButton
