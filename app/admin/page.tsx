'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface Referrer {
  id: string
  full_name: string
  email: string
  phone: string
  code: string
  status: 'pending' | 'active' | 'suspended'
  tier: 'bronze' | 'silver' | 'gold'
  created_at: string
  sales_count: number
}

interface Sale {
  id: string
  client_name: string
  service: string
  amount: number
  commission_amount: number
  commission_paid: boolean
  paid_at: string | null
  admin_note: string | null
  created_at: string
  referrer_name: string
  referrer_code: string
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

interface AdminStats {
  referrers: { total: number; active: number; pending: number; suspended: number }
  sales: { this_month: number; all_time: number }
  commissions: { this_month: number; all_time: number; pending: number }
  top_referrer: { name: string; sales: number; commission: number } | null
  series_monthly: { month: string; sales: number; commission: number }[]
  by_service: { service: string; count: number; commission: number }[]
}

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  active: boolean
  created_at: string
  expires_at: string | null
}

interface ChallengeCompletion {
  referrer_id: string
  referrer_name: string
  referrer_code: string
  completed_at: string
  bonus_paid: boolean
}

interface Challenge {
  id: string
  title: string
  description: string | null
  month: string
  condition_type: string
  condition_value: Record<string, unknown>
  bonus_amount: number
  active: boolean
  completions: ChallengeCompletion[]
}

interface CascadeCommission {
  id: string
  sale_id: string
  parrain_name: string
  parrain_code: string
  filleul_name: string
  filleul_code: string
  amount: number
  paid: boolean
  paid_at: string | null
  created_at: string
}

const services = ['M-ONE', 'M-SHOP LITE', 'M-LOCAL', 'M-CALLING', 'M-CAMPAIGN', 'M-NEURAL', 'M-CORP']

const SERVICE_COLORS = ['#5B6EF5', '#9B5BF5', '#2ED573', '#F59E0B', '#EF4444', '#06B6D4', '#F97316']

type TabType = 'dashboard' | 'referrers' | 'sales' | 'commissions' | 'contracts' | 'annonces' | 'challenges' | 'cascade'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [dataLoading, setDataLoading] = useState(false)

  // Existing state
  const [referrers, setReferrers] = useState<Referrer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([])
  const [commissionSaving, setCommissionSaving] = useState(false)
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(null)
  const [contractPdfFile, setContractPdfFile] = useState<File | null>(null)
  const [contractPdfText, setContractPdfText] = useState('')
  const [sendContractLoading, setSendContractLoading] = useState(false)
  const [referrerCommissionModal, setReferrerCommissionModal] = useState<Referrer | null>(null)
  const [referrerRates, setReferrerRates] = useState<(CommissionRate & { is_custom: boolean })[]>([])
  const [referrerRatesSaving, setReferrerRatesSaving] = useState(false)
  const [saleForm, setSaleForm] = useState({ referrer_code: '', client_name: '', service: services[0], amount: '', admin_note: '' })

  // New state — Dashboard
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)

  // New state — Annonces
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', type: 'info', expires_at: '' })
  const [announcementCreating, setAnnouncementCreating] = useState(false)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)

  // New state — Challenges
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null)
  const [challengeCreating, setChallengeCreating] = useState(false)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [challengeForm, setChallengeForm] = useState({
    title: '', description: '',
    month: new Date().toISOString().slice(0, 7),
    condition_type: 'sales_count' as 'sales_count' | 'service_sold' | 'amount_total',
    condition_count: '3',
    condition_service: services[0],
    condition_service_count: '1',
    condition_amount: '500',
    bonus_amount: '50'
  })

  // New state — Cascade
  const [cascadeRate, setCascadeRate] = useState(5)
  const [cascadeRateEdit, setCascadeRateEdit] = useState('5')
  const [cascadeRateSaving, setCascadeRateSaving] = useState(false)
  const [cascadeCommissions, setCascadeCommissions] = useState<CascadeCommission[]>([])

  const adminHeaders = () => ({
    'x-admin-password': sessionStorage.getItem('admin_password') || ''
  })

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    const storedPassword = sessionStorage.getItem('admin_password')
    if (auth === 'true' && storedPassword) {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) fetchData()
  }, [isAuthenticated, activeTab])

  const fetchData = async () => {
    setDataLoading(true)
    try {
      if (activeTab === 'dashboard') {
        const res = await fetch('/api/admin/stats', { headers: adminHeaders() })
        if (res.ok) setAdminStats(await res.json())
      } else if (activeTab === 'referrers') {
        const res = await fetch('/api/admin/referrers', { headers: adminHeaders() })
        if (res.ok) setReferrers(await res.json())
      } else if (activeTab === 'sales') {
        const res = await fetch('/api/admin/sales', { headers: adminHeaders() })
        if (res.ok) setSales(await res.json())
      } else if (activeTab === 'commissions') {
        const res = await fetch('/api/admin/commission-rates', { headers: adminHeaders() })
        if (res.ok) {
          const data = await res.json()
          const existing: Record<string, number> = {}
          data.forEach((r: CommissionRate) => { existing[r.pack_name] = r.commission_amount })
          setCommissionRates(services.map(s => ({ pack_name: s, commission_amount: existing[s] ?? 0 })))
        }
      } else if (activeTab === 'contracts') {
        const [referrersRes, contractsRes] = await Promise.all([
          fetch('/api/admin/referrers', { headers: adminHeaders() }),
          fetch('/api/admin/contracts', { headers: adminHeaders() })
        ])
        if (referrersRes.ok) setReferrers(await referrersRes.json())
        if (contractsRes.ok) setContracts(await contractsRes.json())
      } else if (activeTab === 'annonces') {
        const res = await fetch('/api/admin/announcements', { headers: adminHeaders() })
        if (res.ok) setAnnouncements(await res.json())
      } else if (activeTab === 'challenges') {
        const res = await fetch('/api/admin/challenges', { headers: adminHeaders() })
        if (res.ok) setChallenges(await res.json())
      } else if (activeTab === 'cascade') {
        const res = await fetch('/api/admin/cascade', { headers: adminHeaders() })
        if (res.ok) {
          const data = await res.json()
          setCascadeRate(Number(data.rate))
          setCascadeRateEdit(String(data.rate))
          setCascadeCommissions(data.commissions || [])
        }
      }
    } catch { /* silent */ }
    finally { setDataLoading(false) }
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
    } catch { setError('Une erreur est survenue') }
    finally { setLoading(false) }
  }

  // ── Referrers ──────────────────────────────────────────────────────────────
  const updateReferrerStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/referrers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ status })
      })
      if (res.ok) fetchData()
    } catch { /* silent */ }
  }

  const openReferrerCommissionModal = async (referrer: Referrer) => {
    setReferrerCommissionModal(referrer)
    const res = await fetch(`/api/admin/referrers/${referrer.id}/commission-rates`, { headers: adminHeaders() })
    if (res.ok) setReferrerRates(await res.json())
  }

  const saveReferrerCommissions = async () => {
    if (!referrerCommissionModal) return
    setReferrerRatesSaving(true)
    try {
      await fetch(`/api/admin/referrers/${referrerCommissionModal.id}/commission-rates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify(referrerRates.map(r => ({ pack_name: r.pack_name, commission_amount: r.commission_amount })))
      })
      setReferrerCommissionModal(null)
    } catch { /* silent */ }
    finally { setReferrerRatesSaving(false) }
  }

  const resetReferrerCommissions = async () => {
    if (!referrerCommissionModal) return
    if (!confirm('Remettre les taux globaux pour cet apporteur ?')) return
    await fetch(`/api/admin/referrers/${referrerCommissionModal.id}/commission-rates`, {
      method: 'DELETE', headers: adminHeaders()
    })
    setReferrerCommissionModal(null)
  }

  // ── Sales ──────────────────────────────────────────────────────────────────
  const createSale = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({
          referrer_code: saleForm.referrer_code, client_name: saleForm.client_name,
          service: saleForm.service, amount: parseInt(saleForm.amount), admin_note: saleForm.admin_note
        })
      })
      if (res.ok) {
        setSaleForm({ referrer_code: '', client_name: '', service: services[0], amount: '', admin_note: '' })
        fetchData()
      }
    } catch { /* silent */ }
  }

  const exportCSV = () => {
    const headers = ['Apporteur', 'Code', 'Client', 'Service', 'Montant (€)', 'Commission (€)', 'Versée', 'Date versement', 'Date vente']
    const rows = sales.map(s => [
      s.referrer_name, s.referrer_code, s.client_name, s.service,
      Number(s.amount).toFixed(2), Number(s.commission_amount).toFixed(2),
      s.commission_paid ? 'Oui' : 'Non', s.paid_at ? formatDate(s.paid_at) : '', formatDate(s.created_at),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `ventes-commissions-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const deleteSale = async (id: string) => {
    if (!confirm('Supprimer cette vente ?')) return
    try {
      const res = await fetch(`/api/admin/sales/${id}`, { method: 'DELETE', headers: adminHeaders() })
      if (res.ok) fetchData()
    } catch { /* silent */ }
  }

  const markCommissionPaid = async (id: string, paid: boolean) => {
    try {
      const res = await fetch(`/api/admin/sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ commission_paid: paid })
      })
      if (res.ok) fetchData()
    } catch { /* silent */ }
  }

  // ── Commissions ────────────────────────────────────────────────────────────
  const saveCommissions = async () => {
    setCommissionSaving(true)
    try {
      const res = await fetch('/api/admin/commission-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify(commissionRates)
      })
      if (!res.ok) alert('Erreur lors de la sauvegarde')
    } catch { alert('Erreur lors de la sauvegarde') }
    finally { setCommissionSaving(false) }
  }

  // ── Contracts ──────────────────────────────────────────────────────────────
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
        method: 'POST', headers: adminHeaders(), body: formData
      })
      if (res.ok) {
        setContractModalOpen(false); setSelectedReferrer(null); setContractPdfFile(null); setContractPdfText('')
        fetchData(); alert('Contrat envoyé avec succès')
      } else {
        const data = await res.json()
        alert(data.error || "Erreur lors de l'envoi du contrat")
      }
    } catch { alert("Erreur lors de l'envoi du contrat") }
    finally { setSendContractLoading(false) }
  }

  // ── Annonces ───────────────────────────────────────────────────────────────
  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    setAnnouncementCreating(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({
          title: announcementForm.title, content: announcementForm.content,
          type: announcementForm.type,
          expires_at: announcementForm.expires_at || null
        })
      })
      if (res.ok) {
        setAnnouncementForm({ title: '', content: '', type: 'info', expires_at: '' })
        setShowAnnouncementForm(false)
        fetchData()
      }
    } catch { /* silent */ }
    finally { setAnnouncementCreating(false) }
  }

  const toggleAnnouncement = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ active: !active })
      })
      if (res.ok) fetchData()
    } catch { /* silent */ }
  }

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', headers: adminHeaders() })
      if (res.ok) fetchData()
    } catch { /* silent */ }
  }

  const pushAnnouncementAll = async (id: string, title: string, content: string) => {
    try {
      await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ _action: 'push_all', announcement_id: id, title, body: content })
      })
      alert('Notifications envoyées !')
    } catch { /* silent */ }
  }

  // ── Challenges ─────────────────────────────────────────────────────────────
  const createChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    setChallengeCreating(true)
    let condition_value: Record<string, unknown> = {}
    if (challengeForm.condition_type === 'sales_count') {
      condition_value = { count: parseInt(challengeForm.condition_count) }
    } else if (challengeForm.condition_type === 'service_sold') {
      condition_value = { service: challengeForm.condition_service, count: parseInt(challengeForm.condition_service_count) }
    } else if (challengeForm.condition_type === 'amount_total') {
      condition_value = { amount: parseFloat(challengeForm.condition_amount) }
    }
    try {
      const res = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({
          title: challengeForm.title, description: challengeForm.description || null,
          month: challengeForm.month, condition_type: challengeForm.condition_type,
          condition_value, bonus_amount: parseFloat(challengeForm.bonus_amount)
        })
      })
      if (res.ok) {
        setChallengeForm({ title: '', description: '', month: new Date().toISOString().slice(0, 7), condition_type: 'sales_count', condition_count: '3', condition_service: services[0], condition_service_count: '1', condition_amount: '500', bonus_amount: '50' })
        setShowChallengeForm(false)
        fetchData()
      }
    } catch { /* silent */ }
    finally { setChallengeCreating(false) }
  }

  const toggleChallenge = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ action: 'toggle' })
      })
      if (res.ok) fetchData()
    } catch { /* silent */ }
  }

  const deleteChallenge = async (id: string) => {
    if (!confirm('Supprimer ce challenge ?')) return
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE', headers: adminHeaders() })
      if (res.ok) fetchData()
    } catch { /* silent */ }
  }

  const markChallengeBonusPaid = async (challengeId: string, referrerId: string) => {
    try {
      const res = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ action: 'mark-paid', referrer_id: referrerId })
      })
      if (res.ok) fetchData()
    } catch { /* silent */ }
  }

  // ── Cascade ────────────────────────────────────────────────────────────────
  const updateCascadeRate = async () => {
    setCascadeRateSaving(true)
    try {
      const res = await fetch('/api/admin/cascade', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ rate: parseFloat(cascadeRateEdit) })
      })
      if (res.ok) { setCascadeRate(parseFloat(cascadeRateEdit)); alert('Taux mis à jour') }
    } catch { /* silent */ }
    finally { setCascadeRateSaving(false) }
  }

  const markCascadePaid = async (commissionId: string) => {
    try {
      const res = await fetch('/api/admin/cascade', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ commission_id: commissionId })
      })
      if (res.ok) fetchData()
    } catch { /* silent */ }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = { pending: '#f59e0b', active: '#10b981', suspended: '#ef4444' }
    const labels: Record<string, string> = { pending: 'En attente', active: 'Actif', suspended: 'Suspendu' }
    return (
      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, backgroundColor: colors[status] + '20', color: colors[status] }}>
        {labels[status]}
      </span>
    )
  }

  const getTierBadge = (_tier: string, salesCount: number) => {
    const t = salesCount >= 10 ? 'gold' : salesCount >= 3 ? 'silver' : 'bronze'
    const cfg = { bronze: { label: 'Bronze', color: '#cd7f32' }, silver: { label: 'Silver', color: '#a8a9ad' }, gold: { label: 'Gold', color: '#f1c40f' } }[t] || { label: 'Bronze', color: '#cd7f32' }
    return (
      <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, backgroundColor: cfg.color + '22', color: cfg.color, border: `1px solid ${cfg.color}44` }}>
        {cfg.label}
      </span>
    )
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const formatCondition = (challenge: Challenge) => {
    const v = challenge.condition_value
    if (challenge.condition_type === 'sales_count') return `${v.count ?? v} vente(s) ce mois`
    if (challenge.condition_type === 'service_sold') return `${v.count ?? 1}x ${v.service} ce mois`
    if (challenge.condition_type === 'amount_total') return `${v.amount ?? v}€ de commissions ce mois`
    return ''
  }

  const announcementTypeColor: Record<string, string> = {
    info: '#5B6EF5', success: '#10b981', warning: '#f59e0b', promo: '#9B5BF5'
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', backgroundColor: '#080810',
    border: '1px solid #2a2a35', borderRadius: '6px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box'
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: '📊 Tableau de bord' },
    { id: 'referrers', label: '👥 Apporteurs' },
    { id: 'sales', label: '💰 Ventes' },
    { id: 'commissions', label: '🏆 Commissions' },
    { id: 'contracts', label: '📄 Contrats' },
    { id: 'annonces', label: '📢 Annonces' },
    { id: 'challenges', label: '🎯 Challenges' },
    { id: 'cascade', label: '🔗 Cascade' },
  ]

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>Administration</h1>
          <p style={{ textAlign: 'center', color: '#a0a0a0', marginBottom: '32px' }}>Accès réservé</p>
          {error && (
            <div style={{ padding: '16px', backgroundColor: '#3a1a1a', border: '1px solid #5a2a2a', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', color: '#ff6b6b' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#a0a0a0' }}>Mot de passe admin</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', backgroundColor: '#111118', border: '1px solid #2a2a35', borderRadius: '8px', color: '#ffffff', fontSize: '16px', boxSizing: 'border-box' }}
                placeholder="Mot de passe" required />
            </div>
            <button type="submit" disabled={loading} style={{ padding: '16px', backgroundColor: '#5B6EF5', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Vérification...' : 'Accéder'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link href="/" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '14px' }}>Retour à l&apos;accueil</Link>
          </p>
        </div>
      </main>
    )
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid #2a2a35', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
              mar<span style={{ color: '#5B6EF5' }}>peap</span>
            </span>
          </Link>
          <span style={{ color: '#5B6EF5', fontWeight: 500 }}>Admin</span>
        </div>
        <button onClick={() => { sessionStorage.removeItem('admin_auth'); sessionStorage.removeItem('admin_password'); setIsAuthenticated(false) }}
          style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #5B6EF5', borderRadius: '6px', color: '#5B6EF5', cursor: 'pointer', fontSize: '14px' }}>
          Déconnexion
        </button>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '10px 18px', backgroundColor: activeTab === tab.id ? '#5B6EF5' : '#111118', border: 'none', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.id ? 700 : 500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <section>
          {dataLoading || !adminStats ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                  { label: 'Apporteurs actifs', value: adminStats.referrers.active, sub: `${adminStats.referrers.pending} en attente`, color: '#5B6EF5' },
                  { label: 'Ventes ce mois', value: adminStats.sales.this_month, sub: `${adminStats.sales.all_time} au total`, color: '#9B5BF5' },
                  { label: 'Commissions à verser', value: `${adminStats.commissions.pending.toLocaleString('fr-FR')} €`, sub: `${adminStats.commissions.this_month.toLocaleString('fr-FR')} € ce mois`, color: '#f59e0b' },
                  { label: 'Top apporteur', value: adminStats.top_referrer?.name ?? '-', sub: adminStats.top_referrer ? `${adminStats.top_referrer.sales} ventes — ${adminStats.top_referrer.commission} €` : '', color: '#2ED573' },
                ].map((card, i) => (
                  <div key={i} style={{ background: '#111118', border: '1px solid #2a2a35', borderRadius: 12, padding: '18px 20px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{card.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: card.color, marginBottom: 4 }}>{card.value}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Area chart — commissions par mois */}
              {adminStats.series_monthly.length > 0 && (
                <div style={{ background: '#111118', border: '1px solid #2a2a35', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.8)' }}>Évolution mensuelle</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={adminStats.series_monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="adminCommGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5B6EF5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#5B6EF5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid #2a2a35', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                      <Area type="monotone" dataKey="commission" name="Commissions (€)" stroke="#5B6EF5" fill="url(#adminCommGrad)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="sales" name="Ventes" stroke="#9B5BF5" fill="none" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bar chart — par service */}
              {adminStats.by_service.length > 0 && (
                <div style={{ background: '#111118', border: '1px solid #2a2a35', borderRadius: 12, padding: '20px 24px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.8)' }}>Répartition par service</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={adminStats.by_service} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="service" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid #2a2a35', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                      <Bar dataKey="count" name="Ventes" radius={[4, 4, 0, 0]}>
                        {adminStats.by_service.map((_, i) => (
                          <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── REFERRERS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'referrers' && (
        <section>
          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#111118', borderRadius: '12px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a25' }}>
                    {['Nom', 'Email', 'Code', 'Statut', 'Niveau', 'Ventes', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrers.map((referrer) => (
                    <tr key={referrer.id} style={{ borderTop: '1px solid #2a2a35' }}>
                      <td style={{ padding: '16px' }}>
                        <div>{referrer.full_name}</div>
                        <div style={{ fontSize: 12, color: '#a0a0a0' }}>{referrer.phone}</div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{formatDate(referrer.created_at)}</div>
                      </td>
                      <td style={{ padding: '16px', color: '#a0a0a0', fontSize: 13 }}>{referrer.email}</td>
                      <td style={{ padding: '16px', fontFamily: "'Syne', monospace", fontWeight: 700 }}>{referrer.code}</td>
                      <td style={{ padding: '16px' }}>{getStatusBadge(referrer.status)}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>{getTierBadge(referrer.tier, referrer.sales_count)}</td>
                      <td style={{ padding: '16px', textAlign: 'center', fontWeight: 700 }}>{referrer.sales_count}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {referrer.status !== 'active' && (
                            <button onClick={() => updateReferrerStatus(referrer.id, 'active')} style={{ padding: '6px 12px', backgroundColor: '#10b981', border: 'none', borderRadius: '4px', color: '#ffffff', cursor: 'pointer', fontSize: '12px' }}>Activer</button>
                          )}
                          {referrer.status === 'active' && (
                            <button onClick={() => updateReferrerStatus(referrer.id, 'suspended')} style={{ padding: '6px 12px', backgroundColor: '#ef4444', border: 'none', borderRadius: '4px', color: '#ffffff', cursor: 'pointer', fontSize: '12px' }}>Suspendre</button>
                          )}
                          <button onClick={() => openReferrerCommissionModal(referrer)} style={{ padding: '6px 12px', backgroundColor: 'rgba(91,110,245,0.15)', border: '1px solid rgba(91,110,245,0.3)', borderRadius: '4px', color: '#5B6EF5', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Commissions</button>
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

      {/* ── SALES TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'sales' && (
        <section>
          {/* Sale Form */}
          <div style={{ backgroundColor: '#111118', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Enregistrer une vente</h3>
            <form onSubmit={createSale} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Code apporteur', key: 'referrer_code', type: 'text', placeholder: 'DUPONT-7K3M' },
                { label: 'Nom client', key: 'client_name', type: 'text', placeholder: 'Nom du client' },
                { label: 'Montant (€)', key: 'amount', type: 'number', placeholder: '15000' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a0a0a0' }}>{field.label}</label>
                  <input type={field.type} value={saleForm[field.key as keyof typeof saleForm]} onChange={(e) => setSaleForm({ ...saleForm, [field.key]: e.target.value })}
                    style={inputStyle} placeholder={field.placeholder} required />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a0a0a0' }}>Service</label>
                <select value={saleForm.service} onChange={(e) => setSaleForm({ ...saleForm, service: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }} required>
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a0a0a0' }}>Note (optionnel)</label>
                <input type="text" value={saleForm.admin_note} onChange={(e) => setSaleForm({ ...saleForm, admin_note: e.target.value })}
                  style={inputStyle} placeholder="Note interne" />
              </div>
              <div>
                <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#5B6EF5', border: 'none', borderRadius: '6px', color: '#ffffff', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Enregistrer</button>
              </div>
            </form>
          </div>

          {!dataLoading && sales.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button onClick={exportCSV} style={{ padding: '8px 18px', background: 'rgba(91,110,245,0.12)', border: '1px solid rgba(91,110,245,0.3)', borderRadius: 8, color: '#5B6EF5', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>↓ Exporter CSV</button>
              </div>
              {(() => {
                const unpaid = sales.filter(s => !s.commission_paid).reduce((a, s) => a + Number(s.commission_amount), 0)
                const paid = sales.filter(s => s.commission_paid).reduce((a, s) => a + Number(s.commission_amount), 0)
                return (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 20px', flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase' }}>Commissions à verser</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{unpaid.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '14px 20px', flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase' }}>Commissions versées</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{paid.toLocaleString('fr-FR')} €</div>
                    </div>
                  </div>
                )
              })()}
            </>
          )}

          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#111118', borderRadius: '12px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a25' }}>
                    {['Apporteur', 'Client', 'Service', 'Montant', 'Commission', 'Paiement', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '16px', textAlign: h === 'Montant' || h === 'Commission' ? 'right' : h === 'Paiement' ? 'center' : 'left', fontWeight: 500, color: '#a0a0a0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} style={{ borderTop: '1px solid #2a2a35' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600 }}>{sale.referrer_name}</div>
                        <div style={{ fontSize: 11, color: '#5B6EF5', fontFamily: 'monospace' }}>{sale.referrer_code}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: 14 }}>{sale.client_name}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: 'rgba(91,110,245,0.15)', color: '#5B6EF5' }}>{sale.service}</span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>{Number(sale.amount).toLocaleString('fr-FR')} €</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 800, color: '#2ED573', fontSize: 15 }}>+{Number(sale.commission_amount).toLocaleString('fr-FR')} €</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {sale.commission_paid ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Versé ✓</span>
                            {sale.paid_at && <span style={{ fontSize: 10, color: '#555' }}>{formatDate(sale.paid_at)}</span>}
                            <button onClick={() => markCommissionPaid(sale.id, false)} style={{ fontSize: 10, color: '#a0a0a0', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Annuler</button>
                          </div>
                        ) : (
                          <button onClick={() => markCommissionPaid(sale.id, true)} style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: '#10b981', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Marquer versé</button>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: '#a0a0a0', fontSize: 13 }}>{formatDate(sale.created_at)}</td>
                      <td style={{ padding: '16px' }}>
                        <button onClick={() => deleteSale(sale.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', border: 'none', borderRadius: '4px', color: '#ffffff', cursor: 'pointer', fontSize: '12px' }}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── COMMISSIONS TAB ───────────────────────────────────────────────── */}
      {activeTab === 'commissions' && (
        <section>
          <div style={{ backgroundColor: '#111118', borderRadius: '12px', padding: '24px', maxWidth: '600px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Taux de commission par service</h3>
            <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '24px' }}>Taux globaux par défaut — appliqués à tous les apporteurs sauf override individuel.</p>
            {dataLoading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {commissionRates.map((rate, idx) => (
                    <div key={rate.pack_name} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', backgroundColor: '#080810', borderRadius: '8px', border: '1px solid #2a2a35' }}>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: '14px' }}>{rate.pack_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" value={rate.commission_amount}
                          onChange={(e) => { const updated = [...commissionRates]; updated[idx] = { ...rate, commission_amount: parseFloat(e.target.value) || 0 }; setCommissionRates(updated) }}
                          style={{ width: '100px', padding: '8px 12px', backgroundColor: '#111118', border: '1px solid #3a3a45', borderRadius: '6px', color: '#ffffff', fontSize: '14px', textAlign: 'right' }} />
                        <span style={{ color: '#a0a0a0', fontSize: '14px' }}>€</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={saveCommissions} disabled={commissionSaving} style={{ padding: '12px 32px', backgroundColor: commissionSaving ? '#333' : '#5B6EF5', border: 'none', borderRadius: '8px', color: '#ffffff', cursor: commissionSaving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, opacity: commissionSaving ? 0.7 : 1 }}>
                  {commissionSaving ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── CONTRACTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'contracts' && (
        <section>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Apporteurs actifs</h3>
          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto', marginBottom: '48px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#111118', borderRadius: '12px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a25' }}>
                    {['Nom', 'Email', 'Code', 'Statut contrat', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrers.filter(r => r.status === 'active').map((referrer) => {
                    const rc = contracts.filter(c => c.email === referrer.email)
                    const hasSigned = rc.some(c => c.status === 'signed')
                    const hasSent = rc.some(c => c.status === 'sent')
                    const contractStatus = hasSigned ? 'Signé' : hasSent ? 'Envoyé' : 'Aucun'
                    return (
                      <tr key={referrer.id} style={{ borderTop: '1px solid #2a2a35' }}>
                        <td style={{ padding: '16px' }}>{referrer.full_name}</td>
                        <td style={{ padding: '16px', color: '#a0a0a0' }}>{referrer.email}</td>
                        <td style={{ padding: '16px', fontFamily: "'Syne', monospace", fontWeight: 700 }}>{referrer.code}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, backgroundColor: hasSigned ? '#10b98120' : hasSent ? '#f59e0b20' : '#6b728020', color: hasSigned ? '#10b981' : hasSent ? '#f59e0b' : '#6b7280' }}>
                            {contractStatus}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {!hasSigned && (
                            <button onClick={() => { setSelectedReferrer(referrer); setContractModalOpen(true) }}
                              style={{ padding: '6px 12px', backgroundColor: '#5B6EF5', border: 'none', borderRadius: '4px', color: '#ffffff', cursor: 'pointer', fontSize: '12px' }}>
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

          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Tous les contrats</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#111118', borderRadius: '12px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a1a25' }}>
                  {['Apporteur', 'Date envoi', 'Statut', 'Date signature', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} style={{ borderTop: '1px solid #2a2a35' }}>
                    <td style={{ padding: '16px' }}>{contract.full_name}</td>
                    <td style={{ padding: '16px', color: '#a0a0a0' }}>{formatDate(contract.created_at)}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, backgroundColor: contract.status === 'signed' ? '#10b98120' : '#f59e0b20', color: contract.status === 'signed' ? '#10b981' : '#f59e0b' }}>
                        {contract.status === 'signed' ? 'Signé' : 'Envoyé'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#a0a0a0' }}>{contract.signed_at ? formatDate(contract.signed_at) : '-'}</td>
                    <td style={{ padding: '16px' }}>
                      <a href={`https://storage.marpeap.digital/contracts/${contract.pdf_filename}`} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '6px 12px', backgroundColor: '#5B6EF5', border: 'none', borderRadius: '4px', color: '#ffffff', textDecoration: 'none', cursor: 'pointer', fontSize: '12px', display: 'inline-block' }}>
                        Voir PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Contract Modal */}
          {contractModalOpen && selectedReferrer && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 1000 }}>
              <div style={{ backgroundColor: '#111118', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Envoyer un contrat à {selectedReferrer.full_name}</h3>
                <form onSubmit={sendContract} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#a0a0a0' }}>Option 1 : Uploader un PDF</label>
                    <input type="file" accept=".pdf" onChange={(e) => setContractPdfFile(e.target.files?.[0] || null)}
                      style={{ width: '100%', padding: '12px', backgroundColor: '#080810', border: '1px solid #2a2a35', borderRadius: '8px', color: '#ffffff', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#a0a0a0' }}>Option 2 : Saisir le texte du contrat</label>
                    <textarea value={contractPdfText} onChange={(e) => setContractPdfText(e.target.value)} placeholder="Texte du contrat..." rows={6}
                      style={{ width: '100%', padding: '12px', backgroundColor: '#080810', border: '1px solid #2a2a35', borderRadius: '8px', color: '#ffffff', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button type="button" onClick={() => { setContractModalOpen(false); setSelectedReferrer(null); setContractPdfFile(null); setContractPdfText('') }}
                      style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', border: '1px solid #a0a0a0', borderRadius: '8px', color: '#a0a0a0', cursor: 'pointer', fontSize: '16px', fontWeight: 500 }}>
                      Annuler
                    </button>
                    <button type="submit" disabled={sendContractLoading}
                      style={{ flex: 1, padding: '14px', backgroundColor: '#5B6EF5', border: 'none', borderRadius: '8px', color: '#ffffff', cursor: sendContractLoading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 700, opacity: sendContractLoading ? 0.7 : 1 }}>
                      {sendContractLoading ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── ANNONCES TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'annonces' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700 }}>Annonces</h3>
            <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              style={{ padding: '10px 20px', background: '#5B6EF5', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              {showAnnouncementForm ? '✕ Annuler' : '+ Nouvelle annonce'}
            </button>
          </div>

          {showAnnouncementForm && (
            <div style={{ background: '#111118', border: '1px solid #2a2a35', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <form onSubmit={createAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Titre</label>
                    <input type="text" value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      style={inputStyle} placeholder="Titre de l'annonce" required />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Contenu</label>
                    <textarea value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      style={{ ...inputStyle, resize: 'vertical' }} rows={3} placeholder="Contenu de l'annonce" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Type</label>
                    <select value={announcementForm.type} onChange={e => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      {[['info', 'Info'], ['success', 'Succès'], ['warning', 'Alerte'], ['promo', 'Promo']].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Expiration (optionnel)</label>
                    <input type="datetime-local" value={announcementForm.expires_at} onChange={e => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })}
                      style={inputStyle} />
                  </div>
                </div>
                <div>
                  <button type="submit" disabled={announcementCreating} style={{ padding: '12px 28px', background: announcementCreating ? '#333' : '#5B6EF5', border: 'none', borderRadius: 8, color: '#fff', cursor: announcementCreating ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
                    {announcementCreating ? 'Création...' : 'Publier l\'annonce'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0', background: '#111118', borderRadius: 12 }}>Aucune annonce</div>
              ) : announcements.map(ann => (
                <div key={ann.id} style={{ background: '#111118', border: `1px solid ${ann.active ? announcementTypeColor[ann.type] + '33' : '#2a2a35'}`, borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: announcementTypeColor[ann.type] + '22', color: announcementTypeColor[ann.type], flexShrink: 0 }}>
                      {ann.type}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, opacity: ann.active ? 1 : 0.5 }}>{ann.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{ann.content}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                        {formatDate(ann.created_at)}{ann.expires_at ? ` · Expire le ${formatDate(ann.expires_at)}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => pushAnnouncementAll(ann.id, ann.title, ann.content)}
                        style={{ padding: '6px 12px', background: 'rgba(155,91,245,0.15)', border: '1px solid rgba(155,91,245,0.3)', borderRadius: 6, color: '#9B5BF5', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        🔔 Push
                      </button>
                      <button onClick={() => toggleAnnouncement(ann.id, ann.active)}
                        style={{ padding: '6px 12px', background: ann.active ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${ann.active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 6, color: ann.active ? '#ef4444' : '#10b981', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {ann.active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => deleteAnnouncement(ann.id)}
                        style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── CHALLENGES TAB ────────────────────────────────────────────────── */}
      {activeTab === 'challenges' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700 }}>Challenges mensuels</h3>
            <button onClick={() => setShowChallengeForm(!showChallengeForm)}
              style={{ padding: '10px 20px', background: '#5B6EF5', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              {showChallengeForm ? '✕ Annuler' : '+ Nouveau challenge'}
            </button>
          </div>

          {showChallengeForm && (
            <div style={{ background: '#111118', border: '1px solid #2a2a35', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <form onSubmit={createChallenge} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Titre</label>
                    <input type="text" value={challengeForm.title} onChange={e => setChallengeForm({ ...challengeForm, title: e.target.value })}
                      style={inputStyle} placeholder="Ex: 3 ventes ce mois" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Mois</label>
                    <input type="month" value={challengeForm.month} onChange={e => setChallengeForm({ ...challengeForm, month: e.target.value })}
                      style={inputStyle} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Type de condition</label>
                    <select value={challengeForm.condition_type} onChange={e => setChallengeForm({ ...challengeForm, condition_type: e.target.value as typeof challengeForm.condition_type })}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="sales_count">Nb ventes ce mois</option>
                      <option value="service_sold">Service spécifique</option>
                      <option value="amount_total">Montant total commissions</option>
                    </select>
                  </div>

                  {challengeForm.condition_type === 'sales_count' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Nombre de ventes requis</label>
                      <input type="number" min="1" value={challengeForm.condition_count} onChange={e => setChallengeForm({ ...challengeForm, condition_count: e.target.value })}
                        style={inputStyle} required />
                    </div>
                  )}

                  {challengeForm.condition_type === 'service_sold' && (
                    <>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Service</label>
                        <select value={challengeForm.condition_service} onChange={e => setChallengeForm({ ...challengeForm, condition_service: e.target.value })}
                          style={{ ...inputStyle, cursor: 'pointer' }}>
                          {services.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Nb ventes de ce service</label>
                        <input type="number" min="1" value={challengeForm.condition_service_count} onChange={e => setChallengeForm({ ...challengeForm, condition_service_count: e.target.value })}
                          style={inputStyle} required />
                      </div>
                    </>
                  )}

                  {challengeForm.condition_type === 'amount_total' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Montant commissions (€)</label>
                      <input type="number" min="1" value={challengeForm.condition_amount} onChange={e => setChallengeForm({ ...challengeForm, condition_amount: e.target.value })}
                        style={inputStyle} required />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>Bonus (€)</label>
                    <input type="number" min="1" value={challengeForm.bonus_amount} onChange={e => setChallengeForm({ ...challengeForm, bonus_amount: e.target.value })}
                      style={inputStyle} required />
                  </div>
                </div>
                <div>
                  <button type="submit" disabled={challengeCreating} style={{ padding: '12px 28px', background: challengeCreating ? '#333' : '#5B6EF5', border: 'none', borderRadius: 8, color: '#fff', cursor: challengeCreating ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
                    {challengeCreating ? 'Création...' : 'Créer le challenge'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {challenges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0', background: '#111118', borderRadius: 12 }}>Aucun challenge</div>
              ) : challenges.map(ch => (
                <div key={ch.id} style={{ background: '#111118', border: `1px solid ${ch.active ? 'rgba(46,213,115,0.2)' : '#2a2a35'}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{ch.title}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: ch.active ? 'rgba(46,213,115,0.15)' : 'rgba(255,255,255,0.07)', color: ch.active ? '#2ED573' : '#a0a0a0' }}>
                          {ch.active ? 'Actif' : 'Inactif'}
                        </span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{ch.month}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{formatCondition(ch)}</div>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: 12 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#2ED573' }}>+{Number(ch.bonus_amount).toLocaleString('fr-FR')} €</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{ch.completions.length} completion(s)</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {ch.completions.length > 0 && (
                        <button onClick={() => setExpandedChallenge(expandedChallenge === ch.id ? null : ch.id)}
                          style={{ padding: '6px 12px', background: 'rgba(91,110,245,0.15)', border: '1px solid rgba(91,110,245,0.3)', borderRadius: 6, color: '#5B6EF5', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          {expandedChallenge === ch.id ? '▲' : '▼'} Completions
                        </button>
                      )}
                      <button onClick={() => toggleChallenge(ch.id, ch.active)}
                        style={{ padding: '6px 12px', background: ch.active ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${ch.active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 6, color: ch.active ? '#ef4444' : '#10b981', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {ch.active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => deleteChallenge(ch.id)}
                        style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                        ✕
                      </button>
                    </div>
                  </div>

                  {expandedChallenge === ch.id && (ch.completions?.length ?? 0) > 0 && (
                    <div style={{ borderTop: '1px solid #2a2a35', padding: '12px 20px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ch.completions.map(comp => (
                          <div key={comp.referrer_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{comp.referrer_name}</span>
                              <span style={{ fontSize: 12, color: '#5B6EF5', fontFamily: 'monospace', marginLeft: 8 }}>{comp.referrer_code}</span>
                            </div>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{formatDate(comp.completed_at)}</span>
                            {comp.bonus_paid ? (
                              <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Bonus versé ✓</span>
                            ) : (
                              <button onClick={() => markChallengeBonusPaid(ch.id, comp.referrer_id)}
                                style={{ padding: '5px 12px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: '#10b981', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                Marquer bonus versé
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── CASCADE TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'cascade' && (
        <section>
          {/* Rate card */}
          <div style={{ background: '#111118', border: '1px solid #2a2a35', borderRadius: 12, padding: '20px 24px', marginBottom: 24, maxWidth: 400 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, marginBottom: 6 }}>Taux de commission cascade</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Pourcentage de la commission du filleul reversé au parrain.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" min="0" max="100" step="0.5" value={cascadeRateEdit} onChange={e => setCascadeRateEdit(e.target.value)}
                  style={{ width: 80, padding: '10px 12px', backgroundColor: '#080810', border: '1px solid #2a2a35', borderRadius: 8, color: '#ffffff', fontSize: 18, fontWeight: 700, textAlign: 'center' }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>%</span>
              </div>
              <button onClick={updateCascadeRate} disabled={cascadeRateSaving}
                style={{ padding: '10px 20px', background: cascadeRateSaving ? '#333' : '#5B6EF5', border: 'none', borderRadius: 8, color: '#fff', cursor: cascadeRateSaving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
                {cascadeRateSaving ? '...' : 'Enregistrer'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>Taux actuel en base : {cascadeRate}%</p>
          </div>

          {/* Cascade commissions table */}
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, marginBottom: 16 }}>Commissions cascade</h3>
          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>Chargement...</div>
          ) : (
            <>
              {/* Summary */}
              {cascadeCommissions.length > 0 && (() => {
                const unpaid = cascadeCommissions.filter(c => !c.paid).reduce((a, c) => a + Number(c.amount), 0)
                return (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 20px', flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase' }}>Cascade à verser</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{unpaid.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div style={{ background: 'rgba(46,213,115,0.08)', border: '1px solid rgba(46,213,115,0.2)', borderRadius: 10, padding: '14px 20px', flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase' }}>Total cascade</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#2ED573' }}>{cascadeCommissions.reduce((a, c) => a + Number(c.amount), 0).toLocaleString('fr-FR')} €</div>
                    </div>
                  </div>
                )
              })()}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#111118', borderRadius: '12px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1a1a25' }}>
                      {['Parrain', 'Filleul', 'Cascade', 'Statut', 'Date', 'Action'].map(h => (
                        <th key={h} style={{ padding: '16px', textAlign: 'left', fontWeight: 500, color: '#a0a0a0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cascadeCommissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#a0a0a0' }}>Aucune commission cascade</td>
                      </tr>
                    ) : cascadeCommissions.map(cc => (
                      <tr key={cc.id} style={{ borderTop: '1px solid #2a2a35' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 600 }}>{cc.parrain_name}</div>
                          <div style={{ fontSize: 11, color: '#5B6EF5', fontFamily: 'monospace' }}>{cc.parrain_code}</div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 500 }}>{cc.filleul_name}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{cc.filleul_code}</div>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 800, color: '#2ED573', fontSize: 15 }}>+{Number(cc.amount).toLocaleString('fr-FR')} €</td>
                        <td style={{ padding: '16px' }}>
                          {cc.paid ? (
                            <div>
                              <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Versé ✓</span>
                              {cc.paid_at && <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>{formatDate(cc.paid_at)}</div>}
                            </div>
                          ) : (
                            <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>En attente</span>
                          )}
                        </td>
                        <td style={{ padding: '16px', color: '#a0a0a0', fontSize: 13 }}>{formatDate(cc.created_at)}</td>
                        <td style={{ padding: '16px' }}>
                          {!cc.paid && (
                            <button onClick={() => markCascadePaid(cc.id)}
                              style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: '#10b981', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              Marquer versé
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {/* ── MODAL: Per-referrer commission rates ─────────────────────────── */}
      {referrerCommissionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#111118', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700 }}>Commissions — {referrerCommissionModal.full_name}</h3>
              <button onClick={() => setReferrerCommissionModal(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', width: 30, height: 30, borderRadius: 6, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <p style={{ color: '#a0a0a0', fontSize: '12px', marginBottom: '20px' }}>
              Taux personnalisés pour cet apporteur. Les cases marquées <span style={{ color: '#5B6EF5' }}>globale</span> utilisent le taux par défaut.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {referrerRates.map((rate, idx) => (
                <div key={rate.pack_name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#080810', borderRadius: '8px', border: `1px solid ${rate.is_custom ? 'rgba(91,110,245,0.3)' : '#2a2a35'}` }}>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '13px' }}>{rate.pack_name}</span>
                  {!rate.is_custom && <span style={{ fontSize: '10px', color: '#5B6EF5', background: 'rgba(91,110,245,0.1)', padding: '2px 6px', borderRadius: 100 }}>globale</span>}
                  <input type="number" min="0" value={rate.commission_amount}
                    onChange={(e) => { const updated = [...referrerRates]; updated[idx] = { ...rate, commission_amount: parseFloat(e.target.value) || 0, is_custom: true }; setReferrerRates(updated) }}
                    style={{ width: '90px', padding: '6px 10px', backgroundColor: '#111118', border: '1px solid #3a3a45', borderRadius: '6px', color: '#ffffff', fontSize: '13px', textAlign: 'right' }} />
                  <span style={{ color: '#a0a0a0', fontSize: '13px' }}>€</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={resetReferrerCommissions} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #3a3a45', borderRadius: '8px', color: '#a0a0a0', cursor: 'pointer', fontSize: '13px' }}>
                Remettre les taux globaux
              </button>
              <button onClick={saveReferrerCommissions} disabled={referrerRatesSaving} style={{ flex: 1, padding: '10px 24px', backgroundColor: referrerRatesSaving ? '#333' : '#5B6EF5', border: 'none', borderRadius: '8px', color: '#ffffff', cursor: referrerRatesSaving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, opacity: referrerRatesSaving ? 0.7 : 1 }}>
                {referrerRatesSaving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
