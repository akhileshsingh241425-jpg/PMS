import { useSearchParams, useNavigate } from 'react-router-dom'
import MeetingDetailView from '../components/MeetingDetailView'

export default function MeetingDetailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const meetingId = searchParams.get('id')
  const meetingType = searchParams.get('type') || 'meeting'

  if (!meetingId) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
        <p style={{ fontSize: 16 }}>No meeting specified</p>
        <button onClick={() => navigate(-1)}
          style={{ marginTop: 12, padding: '10px 24px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: '1100px', margin: '0 auto' }}>
      <MeetingDetailView
        meetingId={meetingId}
        meetingType={meetingType}
        onBack={() => navigate(-1)}
        onRefresh={() => window.location.reload()}
      />
    </div>
  )
}
