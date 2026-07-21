import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, Mail, Phone, Briefcase } from 'lucide-react'
import { C } from '../components/styleConstants'
import { fetchClient } from '../api/clientsApi'

export default function ClientsDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClient(id).then(res => setClient(res.client)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: 40, fontFamily: C.font, color: C.secondary }}>Loading...</div>
  if (!client) return <div style={{ padding: 40, fontFamily: C.font, color: C.secondary }}>Client not found</div>

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, color: C.text, padding: 24 }}>
      <button onClick={() => navigate('/clients')} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', color: C.blue, fontSize: 13, fontWeight: 500, padding: 0, marginBottom: 16 }}>
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </button>
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: client.client_type === 'main' ? C.blueDark : C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: client.client_type === 'main' ? '#fff' : C.blue }}>
            {(client.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{client.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, background: C.blueLight, padding: '2px 8px', borderRadius: 999 }}>{client.client_code}</span>
              {client.status === 'Active' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green }} />}
              <span style={{ fontSize: 12, color: C.secondary }}>{client.status}</span>
              <span style={{ fontSize: 12, color: C.secondary }}>·</span>
              <span style={{ fontSize: 12, color: C.secondary, background: '#F1F5F9', padding: '2px 10px', borderRadius: 999 }}>{client.client_type}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
          {client.location && <InfoRow icon={<MapPin />} label="Location" value={client.location} />}
          {client.contact_name && <InfoRow icon={<Building2 />} label="Contact" value={client.contact_name} />}
          {client.contact_email && <InfoRow icon={<Mail />} label="Email" value={client.contact_email} />}
          {client.contact_phone && <InfoRow icon={<Phone />} label="Phone" value={client.contact_phone} />}
          {client.industry && <InfoRow icon={<Briefcase />} label="Industry" value={client.industry} />}
        </div>
      </div>
      {client.projects && client.projects.length > 0 && (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: 24, marginTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Projects ({client.projects.length})</h2>
          {client.projects.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</span>
              <span style={{ fontSize: 12, color: C.secondary, background: '#F1F5F9', padding: '2px 8px', borderRadius: 999 }}>{p.stage}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
      <div style={{ color: C.secondary }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.secondary, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 14, color: C.text }}>{value}</div>
      </div>
    </div>
  )
}
