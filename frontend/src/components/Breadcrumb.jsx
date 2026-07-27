import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { C } from './styleConstants'

export default function Breadcrumb({ items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted, marginBottom: 10, flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <ChevronRight className="w-3 h-3" style={{ color: '#CBD5E1' }} />}
          {item.to ? (
            <Link to={item.to} style={{ color: C.blue, textDecoration: 'none' }}>{item.label}</Link>
          ) : (
            <span style={{ color: C.text, fontWeight: 600 }}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}