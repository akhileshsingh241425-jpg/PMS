import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Building2, Briefcase, DollarSign, FileText, User, Phone, Mail, Globe, MapPin, Hash, Tag, Calendar, ArrowUpRight, Plus } from 'lucide-react'
import api from '../services/api'

const formatDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatCurrency = (v) => {
  if (v == null || v === 0) return '—'
  return '₹' + Number(v).toLocaleString('en-IN')
}

const PO_STATUS_COLORS = {
  'DRAFT': { bg: '#F3F4F6', text: '#6B7280' },
  'PO ISSUED': { bg: '#DBEAFE', text: '#1E40AF' },
  'WORK IN PROGRESS': { bg: '#EDE9FE', text: '#5B21B6' },
  'WORK COMPLETED': { bg: '#D1FAE5', text: '#065F46' },
  'PARTIALLY PAID': { bg: '#FEF3C7', text: '#92400E' },
  'PAID & CLOSED': { bg: '#059669', text: '#fff' },
  'CANCELLED': { bg: '#FEE2E2', text: '#991B1B' },
}

export default function VendorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [projects, setProjects] = useState([])
  const [paymentSummary, setPaymentSummary] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/vendors/${id}`)
        setVendor(res.data.vendor)
        setProjects(res.data.vendor.projects || [])
        setPaymentSummary(res.data.payment_summary || {})
      } catch (e) {
        if (e.response?.status === 404) setVendor({ notFound: true })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6B7280', fontSize: '14px' }}>Loading vendor details...</div>
    </div>
  )

  if (!vendor) return null
  if (vendor.notFound) {
    return (
      <div style={{ background: '#F6F8FC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 700, color: '#D1D5DB', marginBottom: '8px' }}>404</div>
          <p style={{ fontSize: '16px', color: '#6B7280', margin: '0 0 4px' }}>Vendor not found</p>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 20px' }}>The vendor you are looking for does not exist.</p>
          <button onClick={() => navigate('/clients')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#5B3DF5', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Back to Clients</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh', padding: '0 24px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <button onClick={() => navigate('/clients')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0', border: 'none', background: 'none', color: '#6B7280', fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginBottom: '12px' }}>
          <ChevronLeft className="w-4 h-4" /> Back to Clients
        </button>

        <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.05)', border: '1px solid #ECECEC', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'linear-gradient(135deg, #F59E0B, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(245,158,11,.2)' }}>
                <span style={{ color: '#fff', fontSize: '24px', fontWeight: 700 }}>{(vendor.name || '?')[0]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{vendor.name}</h1>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#FEF3C7', color: '#92400E' }}>VENDOR</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: vendor.status === 'Active' ? '#D1FAE5' : '#FEE2E2', color: vendor.status === 'Active' ? '#065F46' : '#991B1B' }}>{vendor.status}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#6B7280', fontSize: '13px' }}>
                  <span style={{ fontWeight: 500 }}>{vendor.client_code}</span>
                  <span>|</span>
                  <span>{vendor.industry || '—'}</span>
                  {vendor.location && <><span>|</span><span>{vendor.location}</span></>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#6B7280' }}>
                  {vendor.contact_name && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />{vendor.contact_name}</span>}
                  {vendor.contact_phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />{vendor.contact_phone}</span>}
                  {vendor.contact_email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />{vendor.contact_email}</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F3F4F6', fontSize: '12px', color: '#6B7280' }}>
                  {vendor.gst_number && <span><strong>GST:</strong> {vendor.gst_number}</span>}
                  {vendor.pan_no && <span><strong>PAN:</strong> {vendor.pan_no}</span>}
                  {vendor.msme_status && <span><strong>MSME:</strong> {vendor.msme_status}</span>}
                  {vendor.bank_account_no && <span><strong>A/c:</strong> {vendor.bank_account_no}</span>}
                  {vendor.bank_ifsc && <span><strong>IFSC:</strong> {vendor.bank_ifsc}</span>}
                  {vendor.default_tds_section && <span><strong>TDS:</strong> {vendor.default_tds_section}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ECECEC', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px' }}>Projects</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937' }}>{projects.length}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ECECEC', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px' }}>Total PO Amount</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>{formatCurrency(paymentSummary.total_po_amount)}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ECECEC', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px' }}>Advance Paid</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563EB' }}>{formatCurrency(paymentSummary.total_advance_paid)}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ECECEC', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px' }}>Balance Outstanding</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: paymentSummary.total_balance_outstanding > 0 ? '#DC2626' : '#059669' }}>{formatCurrency(paymentSummary.total_balance_outstanding)}</div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.05)', border: '1px solid #ECECEC' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #ECECEC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase className="w-4 h-4" style={{ color: '#F59E0B' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: 0 }}>Purchase Orders</h3>
            </div>
            <Link to={`/po-out?vendor=${vendor.name}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: '#0052CC', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
              <Plus className="w-3.5 h-3.5" /> Issue Vendor PO
            </Link>
          </div>
          {projects.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF' }}>
              <FileText className="w-10 h-10 mx-auto mb-2" style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px', color: '#6B7280' }}>No projects yet</p>
              <p style={{ fontSize: '12px', margin: 0 }}>Projects assigned to this vendor will appear here</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>PO #</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>Project</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>PO Amount</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>Net Amount</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>Advance</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>Balance</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>TDS</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>GST</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>Terms</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>Date</th>
                    <th style={{ padding: '8px 12px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => {
                    const st = PO_STATUS_COLORS[p.po_out_status] || { bg: '#F3F4F6', text: '#6B7280' }
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#5B21B6' }}>{p.po_number || '—'}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.title || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{formatCurrency(p.po_amount)}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{formatCurrency(p.net_amount)}</td>
                        <td style={{ padding: '8px 12px', color: '#2563EB' }}>{formatCurrency(p.advance_paid)}</td>
                        <td style={{ padding: '8px 12px', color: p.balance_outstanding > 0 ? '#DC2626' : '#059669', fontWeight: 600 }}>{formatCurrency(p.balance_outstanding)}</td>
                        <td style={{ padding: '8px 12px', color: '#6B7280' }}>{formatCurrency(p.tds)}</td>
                        <td style={{ padding: '8px 12px', color: '#6B7280' }}>{formatCurrency(p.gst)}</td>
                        <td style={{ padding: '8px 12px', color: '#6B7280', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.po_terms || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, background: st.bg, color: st.text }}>{p.po_out_status}</span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#6B7280' }}>{formatDate(p.created_at)}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <Link to={p.direction === 'OUT' ? `/po-out/${p.id}` : `/projects/${p.id}`} style={{ color: '#5B3DF5', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                            View <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
