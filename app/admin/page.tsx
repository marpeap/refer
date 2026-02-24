'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Referrer {
  id: string
  full_name: string
  email: string
  phone: string
  code: string
  status: 'pending' | 'active' | 'suspended'
  created_at: string
  sales_count: number
}

interface Sale {
  id: string
  client_name: string
  service: string
  amount: number
  admin_note: string | null
  created_at: string
  referrer_name: string
}

interface CommissionRate {
  pack_name: string
  commission_amount: number
}

interface Contract {
  id: string
  full_name: string
  email: string
  pdf_filename: string
  status: 'sent' | 'signed'
  created_at: string
  signed_at: string | null
  pdf_url: string
}

const services = [
  'M-ONE',
  'M-SHOP LITE',
  'M-LOCAL',
  'M-CALLING',
  'M-CAMPAIGN',
  'M-NEURAL',
  'M-CORP'
]

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'referrers' | 'sales' | 'contracts' | 'commissions'>('referrers')
  const [referrers, setReferrers] = useState<Referrer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(null)
  const [contractPdfFile, setContractPdfFile] = useState<File | null>(null)
  const [contractPdfText, setContractPdfText] = useState('')
  const [sendContractLoading, setSendContractLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([])
  const [commissionSaving, setCommissionSaving] = useState(false)
  
  // Sale form state
  const [saleForm, setSaleForm] = useState({
    referrer_code: '',
    client_name: '',
    service: services[0],
    amount: '',
    admin_note: ''
  })

  const router = useRouter()

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    const storedPassword = sessionStorage.getItem('admin_password')
    if (auth === 'true' && storedPassword) {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated, activeTab])

  const fetchData = async () => {
    setDataLoading(true)
    try {
      if (activeTab === 'referrers') {
        const res = await fetch('/api/admin/referrers', {
          headers: { 'x-admin-password': sessionStorage.getItem('admin_password') || '' }
        })
        if (res.ok) {
          const data = await res.json()
          setReferrers(data)
        }
      } else if (activeTab === 'contracts') {
        const [referrersRes, contractsRes] = await Promise.all([
          fetch('/api/admin/referrers', {
            headers: { 'x-admin-password': sessionStorage.getItem('admin_password') || '' }
          }),
          fetch('/api/admin/contracts', {
            headers: { 'x-admin-password': sessionStorage.getItem('admin_password') || '' }
          })
        ])
        if (referrersRes.ok) {
          const data = await referrersRes.json()
          setReferrers(data)
        }
        if (contractsRes.ok) {
          const data = await contractsRes.json()
          setContracts(data)
        }
      } else if (activeTab === 'commissions') {
        const res = await fetch('/api/admin/commission-rates', {
          headers: { 'x-admin-password': sessionStorage.getItem('admin_password') || '' }
        })
        if (res.ok) {
          const data = await res.json()
          // Ensure all services are present
          const existing: Record<string, number> = {}
          data.forEach((r: CommissionRate) => { existing[r.pack_name] = r.commission_amount })
          setCommissionRates(services.map(s => ({ pack_name: s, commission_amount: existing[s] ?? 0 })))
        }
      } else {
        const res = await fetch('/api/admin/sales', {
          headers: { 'x-admin-password': sessionStorage.getItem('admin_password') || '' }
        })
        if (res.ok) {
          const data = await res.json()
          setSales(data)
        }
      }
    } catch {
      // Error silently
    } finally {
      setDataLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (res.ok) {
        sessionStorage.setItem('admin_auth', 'true')
        sessionStorage.setItem('admin_password', password)
        setIsAuthenticated(true)
      } else {
        setError('Mot de passe incorrect')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const updateReferrerStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/referrers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': sessionStorage.getItem('admin_password') || ''
        },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        fetchData()
      }
    } catch {
      // Error silently
    }
  }

  const createSale = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': sessionStorage.getItem('admin_password') || ''
        },
        body: JSON.stringify({
          referrer_code: saleForm.referrer_code,
          client_name: saleForm.client_name,
          service: saleForm.service,
          amount: parseInt(saleForm.amount),
          admin_note: saleForm.admin_note
        })
      })

      if (res.ok) {
        setSaleForm({
          referrer_code: '',
          client_name: '',
          service: services[0],
          amount: '',
          admin_note: ''
        })
        fetchData()
      }
    } catch {
      // Error silently
    }
  }

  const deleteSale = async (id: string) => {
    if (!confirm('Supprimer cette vente ?')) return
    
    try {
      const res = await fetch(`/api/admin/sales/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': sessionStorage.getItem('admin_password') || '' }
      })

      if (res.ok) {
        fetchData()
      }
    } catch {
      // Error silently
    }
  }

  const sendContract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReferrer) return

    setSendContractLoading(true)
    try {
      const formData = new FormData()
      formData.append('referrer_id', selectedReferrer.id)
      
      if (contractPdfFile) {
        formData.append('pdf', contractPdfFile)
      } else if (contractPdfText) {
        formData.append('pdf_text', contractPdfText)
      } else {
        alert('Veuillez sélectionner un fichier PDF ou saisir le texte du contrat')
        setSendContractLoading(false)
        return
      }

      const res = await fetch('/api/admin/contracts/send', {
        method: 'POST',
        headers: { 'x-admin-password': sessionStorage.getItem('admin_password') || '' },
        body: formData
      })

      if (res.ok) {
        setContractModalOpen(false)
        setSelectedReferrer(null)
        setContractPdfFile(null)
        setContractPdfText('')
        fetchData()
        alert('Contrat envoyé avec succès')
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de l\'envoi du contrat')
      }
    } catch {
      alert('Erreur lors de l\'envoi du contrat')
    } finally {
      setSendContractLoading(false)
    }
  }

  const saveCommissions = async () => {
    setCommissionSaving(true)
    try {
      const res = await fetch('/api/admin/commission-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': sessionStorage.getItem('admin_password') || ''
        },
        body: JSON.stringify(commissionRates)
      })
      if (!res.ok) alert('Erreur lors de la sauvegarde')
    } catch {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setCommissionSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      active: '#10b981',
      suspended: '#ef4444'
    }
    const labels: Record<string, string> = {
      pending: 'En attente',
      active: 'Actif',
      suspended: 'Suspendu'
    }
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: colors[status] + '20',
        color: colors[status]
      }}>
        {labels[status]}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (!isAuthenticated) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '32px',
            fontWeight: 800,
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Administration
          </h1>
          <p style={{
            textAlign: 'center',
            color: '#a0a0a0',
            marginBottom: '32px'
          }}>
            Accès réservé
          </p>

          {error && (
            <div style={{
              padding: '16px',
              backgroundColor: '#3a1a1a',
              border: '1px solid #5a2a2a',
              borderRadius: '8px',
              marginBottom: '24px',
              textAlign: 'center',
              color: '#ff6b6b'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#a0a0a0'
              }}>Mot de passe admin</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: '#111118',
                  border: '1px solid #2a2a35',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="Mot de passe"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '16px',
                backgroundColor: '#5B6EF5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Vérification...' : 'Accéder'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '24px'
          }}>
            <Link href="/" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '14px' }}>
              Retour à l&apos;accueil
            </Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '24px',
        borderBottom: '1px solid #2a2a35',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '24px',
              fontWeight: 800,
              color: '#ffffff'
            }}>
              mar<span style={{ color: '#5B6EF5' }}>peap</span>
            </span>
          </Link>
          <span style={{ color: '#5B6EF5', fontWeight: 500 }}>Admin</span>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('admin_auth')
            sessionStorage.removeItem('admin_password')
            setIsAuthenticated(false)
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #5B6EF5',
            borderRadius: '6px',
            color: '#5B6EF5',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Déconnexion
        </button>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        <button
          onClick={() => setActiveTab('referrers')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'referrers' ? '#5B6EF5' : '#111118',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Apporteurs
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'sales' ? '#5B6EF5' : '#111118',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Ventes
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'contracts' ? '#5B6EF5' : '#111118',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Contrats
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'commissions' ? '#5B6EF5' : '#111118',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Commissions
        </button>
      </div>

      {/* Referrers Tab */}
      {activeTab === 'referrers' && (
        <section>
          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#111118',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a25' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Nom</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Email</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Téléphone</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Code</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Statut</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Date</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: 500, color: '#a0a0a0' }}>Ventes</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {referrers.map((referrer) => (
                    <tr key={referrer.id} style={{ borderTop: '1px solid #2a2a35' }}>
                      <td style={{ padding: '16px' }}>{referrer.full_name}</td>
                      <td style={{ padding: '16px', color: '#a0a0a0' }}>{referrer.email}</td>
                      <td style={{ padding: '16px', color: '#a0a0a0' }}>{referrer.phone}</td>
                      <td style={{ padding: '16px', fontFamily: "'Syne', monospace", fontWeight: 700 }}>{referrer.code}</td>
                      <td style={{ padding: '16px' }}>{getStatusBadge(referrer.status)}</td>
                      <td style={{ padding: '16px', color: '#a0a0a0' }}>{formatDate(referrer.created_at)}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>{referrer.sales_count}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {referrer.status !== 'active' && (
                            <button
                              onClick={() => updateReferrerStatus(referrer.id, 'active')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#10b981',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Activer
                            </button>
                          )}
                          {referrer.status === 'active' && (
                            <button
                              onClick={() => updateReferrerStatus(referrer.id, 'suspended')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#ef4444',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Suspendre
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <section>
          {/* Sale Form */}
          <div style={{
            backgroundColor: '#111118',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '20px'
            }}>
              Enregistrer une vente
            </h3>
            <form onSubmit={createSale} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a0a0a0' }}>Code apporteur</label>
                <input
                  type="text"
                  value={saleForm.referrer_code}
                  onChange={(e) => setSaleForm({ ...saleForm, referrer_code: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#080810',
                    border: '1px solid #2a2a35',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="DUPONT-7K3M"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a0a0a0' }}>Nom client</label>
                <input
                  type="text"
                  value={saleForm.client_name}
                  onChange={(e) => setSaleForm({ ...saleForm, client_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#080810',
                    border: '1px solid #2a2a35',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Nom du client"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a0a0a0' }}>Service</label>
                <select
                  value={saleForm.service}
                  onChange={(e) => setSaleForm({ ...saleForm, service: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#080810',
                    border: '1px solid #2a2a35',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                  required
                >
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a0a0a0' }}>Montant (€)</label>
                <input
                  type="number"
                  value={saleForm.amount}
                  onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#080810',
                    border: '1px solid #2a2a35',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="15000"
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a0a0a0' }}>Note (optionnel)</label>
                <input
                  type="text"
                  value={saleForm.admin_note}
                  onChange={(e) => setSaleForm({ ...saleForm, admin_note: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#080810',
                    border: '1px solid #2a2a35',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Note interne"
                />
              </div>
              <div>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#5B6EF5',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>

          {/* Sales Table */}
          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#111118',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a25' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Apporteur</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Client</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Service</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: 500, color: '#a0a0a0' }}>Montant</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Date</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Note</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} style={{ borderTop: '1px solid #2a2a35' }}>
                      <td style={{ padding: '16px' }}>{sale.referrer_name}</td>
                      <td style={{ padding: '16px' }}>{sale.client_name}</td>
                      <td style={{ padding: '16px' }}>{sale.service}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500 }}>
                        {sale.amount.toLocaleString('fr-FR')} €
                      </td>
                      <td style={{ padding: '16px', color: '#a0a0a0' }}>{formatDate(sale.created_at)}</td>
                      <td style={{ padding: '16px', color: '#a0a0a0' }}>{sale.admin_note || '-'}</td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => deleteSale(sale.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ef4444',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <section>
          {/* Active Referrers with Contract Status */}
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '20px'
          }}>
            Apporteurs actifs
          </h3>
          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto', marginBottom: '48px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#111118',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a25' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Nom</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Email</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Code</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Statut contrat</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {referrers.filter(r => r.status === 'active').map((referrer) => {
                    const referrerContracts = contracts.filter(c => c.email === referrer.email)
                    const hasSignedContract = referrerContracts.some(c => c.status === 'signed')
                    const hasSentContract = referrerContracts.some(c => c.status === 'sent')
                    let contractStatus = 'Aucun'
                    if (hasSignedContract) contractStatus = 'Signé'
                    else if (hasSentContract) contractStatus = 'Envoyé'
                    
                    return (
                      <tr key={referrer.id} style={{ borderTop: '1px solid #2a2a35' }}>
                        <td style={{ padding: '16px' }}>{referrer.full_name}</td>
                        <td style={{ padding: '16px', color: '#a0a0a0' }}>{referrer.email}</td>
                        <td style={{ padding: '16px', fontFamily: "'Syne', monospace", fontWeight: 700 }}>{referrer.code}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: hasSignedContract ? '#10b98120' : hasSentContract ? '#f59e0b20' : '#6b728020',
                            color: hasSignedContract ? '#10b981' : hasSentContract ? '#f59e0b' : '#6b7280'
                          }}>
                            {contractStatus}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {!hasSignedContract && (
                            <button
                              onClick={() => {
                                setSelectedReferrer(referrer)
                                setContractModalOpen(true)
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#5B6EF5',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Envoyer un contrat
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* All Contracts */}
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '20px'
          }}>
            Tous les contrats
          </h3>
          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#111118',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a25' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Apporteur</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Date envoi</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Statut</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Date signature</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} style={{ borderTop: '1px solid #2a2a35' }}>
                      <td style={{ padding: '16px' }}>{contract.full_name}</td>
                      <td style={{ padding: '16px', color: '#a0a0a0' }}>{formatDate(contract.created_at)}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: contract.status === 'signed' ? '#10b98120' : '#f59e0b20',
                          color: contract.status === 'signed' ? '#10b981' : '#f59e0b'
                        }}>
                          {contract.status === 'signed' ? 'Signé' : 'Envoyé'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#a0a0a0' }}>
                        {contract.signed_at ? formatDate(contract.signed_at) : '-'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <a
                          href={`https://storage.marpeap.digital/contracts/${contract.pdf_filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#5B6EF5',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#ffffff',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'inline-block'
                          }}
                        >
                          Voir PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Contract Modal */}
          {contractModalOpen && selectedReferrer && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: '#111118',
                borderRadius: '12px',
                padding: '32px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto'
              }}>
                <h3 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '20px'
                }}>
                  Envoyer un contrat à {selectedReferrer.full_name}
                </h3>

                <form onSubmit={sendContract} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#a0a0a0'
                    }}>Option 1 : Uploader un PDF</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setContractPdfFile(e.target.files?.[0] || null)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#080810',
                        border: '1px solid #2a2a35',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#a0a0a0'
                    }}>Option 2 : Saisir le texte du contrat</label>
                    <textarea
                      value={contractPdfText}
                      onChange={(e) => setContractPdfText(e.target.value)}
                      placeholder="Texte du contrat..."
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#080810',
                        border: '1px solid #2a2a35',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setContractModalOpen(false)
                        setSelectedReferrer(null)
                        setContractPdfFile(null)
                        setContractPdfText('')
                      }}
                      style={{
                        flex: 1,
                        padding: '14px',
                        backgroundColor: 'transparent',
                        border: '1px solid #a0a0a0',
                        borderRadius: '8px',
                        color: '#a0a0a0',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 500
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={sendContractLoading}
                      style={{
                        flex: 1,
                        padding: '14px',
                        backgroundColor: '#5B6EF5',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        cursor: sendContractLoading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 700,
                        opacity: sendContractLoading ? 0.7 : 1
                      }}
                    >
                      {sendContractLoading ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}
      {/* Commissions Tab */}
      {activeTab === 'commissions' && (
        <section>
          <div style={{
            backgroundColor: '#111118',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px'
          }}>
            <h3 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '8px'
            }}>
              Taux de commission par service
            </h3>
            <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '24px' }}>
              Montant versé à l&apos;apporteur (en €) pour chaque vente conclue.
            </p>

            {dataLoading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {commissionRates.map((rate, idx) => (
                    <div key={rate.pack_name} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px 16px',
                      backgroundColor: '#080810',
                      borderRadius: '8px',
                      border: '1px solid #2a2a35'
                    }}>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: '14px' }}>{rate.pack_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min="0"
                          value={rate.commission_amount}
                          onChange={(e) => {
                            const updated = [...commissionRates]
                            updated[idx] = { ...rate, commission_amount: parseFloat(e.target.value) || 0 }
                            setCommissionRates(updated)
                          }}
                          style={{
                            width: '100px',
                            padding: '8px 12px',
                            backgroundColor: '#111118',
                            border: '1px solid #3a3a45',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '14px',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ color: '#a0a0a0', fontSize: '14px' }}>€</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={saveCommissions}
                  disabled={commissionSaving}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: commissionSaving ? '#333' : '#5B6EF5',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: commissionSaving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    opacity: commissionSaving ? 0.7 : 1
                  }}
                >
                  {commissionSaving ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
