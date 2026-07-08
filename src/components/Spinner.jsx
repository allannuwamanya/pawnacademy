import './Spinner.css'

export default function Spinner({ size = 20, color = 'var(--accent-gold)' }) {
  return (
    <div 
      className="spinner" 
      style={{ 
        width: size, 
        height: size,
        borderColor: `${color}33`,
        borderTopColor: color
      }}
    />
  )
}
