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

const SERVICE_COLORS = ['#36D8B0', '#9B5BF5', '#F0B429', '#4F8AFF', '#EF4444', '#06B6D4', '#F54EA2']

type TabType = 'dashboard' | 'referrers' | 'sales' | 'commissions' | 'contracts' | 'annonces' | 'challenges' | 'cascade'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [dataLoading, setDataLoading] = useState(false)

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

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', type: 'info', expires_at: '' })
  const [announcementCreating, setAnnouncementCreating] = useState(false)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)

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
        if (res.ok) { const d = await res.json(); setAnnouncements(d.announcements || []) }
      } else if (activeTab === 'challenges') {
        const res = await fetch('/api/admin/challenges', { headers: adminHeaders() })
        if (res.ok) { const d = await res.json(); setChallenges(d.challenges || []) }
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
  const statusConfig: Record<string, { label: string; cls: string }> = {
    pending: { label: 'En attente', cls: 'badge-gold' },
    active: { label: 'Actif', cls: 'badge-mint' },
    suspended: { label: 'Suspendu', cls: 'badge-red' },
  }

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status] || statusConfig.pending
    return <span className={cfg.cls}>{cfg.label}</span>
  }

  const getTierBadge = (_tier: string, salesCount: number) => {
    const t = salesCount >= 10 ? 'gold' : salesCount >= 3 ? 'silver' : 'bronze'
    const cfg: Record<string, { label: string; cls: string }> = {
      bronze: { label: 'Bronze', cls: 'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#CD7F32]/15 text-[#CD7F32] border border-[#CD7F32]/25' },
      silver: { label: 'Silver', cls: 'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-text-secondary border border-white/10' },
      gold: { label: 'Gold', cls: 'badge-gold' },
    }
    return <span className={cfg[t].cls}>{cfg[t].label}</span>
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
    info: '#36D8B0', success: '#36D8B0', warning: '#F0B429', promo: '#9B5BF5'
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'referrers', label: 'Apporteurs' },
    { id: 'sales', label: 'Ventes' },
    { id: 'commissions', label: 'Commissions' },
    { id: 'contracts', label: 'Contrats' },
    { id: 'annonces', label: 'Annonces' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'cascade', label: 'Cascade' },
  ]

  const chartTooltipStyle = { background: '#0B1A1F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#EDF0F3', fontSize: 12 }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-bg-base font-body flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">
          <h1 className="font-display text-[28px] font-semibold text-text-primary text-center mb-2" style={{ letterSpacing: '-0.02em' }}>
            Administration
          </h1>
          <p className="text-text-muted text-sm text-center mb-8">Accès réservé</p>

          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3 mb-6 text-sm text-accent-red text-center font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="flex flex-col gap-5">
            <div>
              <label className="label">Mot de passe admin</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input py-3.5 text-base" placeholder="Mot de passe" required />
            </div>
            <button type="submit" disabled={loading}
              className={`btn-primary py-3.5 justify-center text-base ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {loading ? 'Vérification...' : 'Accéder'}
            </button>
          </form>
          <p className="text-center mt-6">
            <Link href="/" className="text-text-muted hover:text-accent-mint text-sm transition-colors">
              Retour à l'accueil
            </Link>
          </p>
        </div>
      </main>
    )
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-bg-base font-body p-4 md:p-6">
      {/* Header */}
      <header className="flex justify-between items-center pb-5 border-b border-bg-border mb-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="font-display text-xl font-bold text-text-primary tracking-tight">
            marpeap
          </Link>
          <span className="text-accent-mint font-medium text-sm">Admin</span>
        </div>
        <button onClick={() => { sessionStorage.removeItem('admin_auth'); sessionStorage.removeItem('admin_password'); setIsAuthenticated(false) }}
          className="btn-ghost text-xs py-1.5 px-3">
          Déconnexion
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-7 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-accent-mint text-bg-base'
                : 'bg-bg-surface text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <section>
          {dataLoading || !adminStats ? (
            <div className="text-center py-16 text-text-muted">Chargement...</div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                {[
                  { label: 'Apporteurs actifs', value: adminStats.referrers.active, sub: `${adminStats.referrers.pending} en attente`, color: 'text-accent-mint' },
                  { label: 'Ventes ce mois', value: adminStats.sales.this_month, sub: `${adminStats.sales.all_time} au total`, color: 'text-[#9B5BF5]' },
                  { label: 'Commissions à verser', value: `${adminStats.commissions.pending.toLocaleString('fr-FR')} €`, sub: `${adminStats.commissions.this_month.toLocaleString('fr-FR')} € ce mois`, color: 'text-accent-gold' },
                  { label: 'Top apporteur', value: adminStats.top_referrer?.name ?? '-', sub: adminStats.top_referrer ? `${adminStats.top_referrer.sales} ventes — ${adminStats.top_referrer.commission} €` : '', color: 'text-accent-mint' },
                ].map((card, i) => (
                  <div key={i} className="card p-5">
                    <div className="stat-label mb-1.5">{card.label}</div>
                    <div className={`text-xl font-mono font-bold ${card.color} mb-1`}>{card.value}</div>
                    <div className="text-xs text-text-muted">{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Area chart */}
              {adminStats.series_monthly.length > 0 && (
                <div className="card p-5 mb-5">
                  <div className="text-sm font-display font-semibold text-text-primary mb-4">Évolution mensuelle</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={adminStats.series_monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="adminCommGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#36D8B0" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#36D8B0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(237,240,243,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(237,240,243,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Area type="monotone" dataKey="commission" name="Commissions (€)" stroke="#36D8B0" fill="url(#adminCommGrad)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="sales" name="Ventes" stroke="#9B5BF5" fill="none" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bar chart */}
              {adminStats.by_service.length > 0 && (
                <div className="card p-5">
                  <div className="text-sm font-display font-semibold text-text-primary mb-4">Répartition par service</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={adminStats.by_service} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="service" tick={{ fill: 'rgba(237,240,243,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(237,240,243,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
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
            <div className="text-center py-12 text-text-muted">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse card overflow-hidden">
                <thead>
                  <tr className="bg-bg-elevated">
                    {['Nom', 'Email', 'Code', 'Statut', 'Niveau', 'Ventes', 'Actions'].map(h => (
                      <th key={h} className="th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrers.map((referrer) => (
                    <tr key={referrer.id} className="border-t border-bg-border table-row-hover">
                      <td className="px-3 md:px-5 py-3">
                        <div className="font-medium text-sm text-text-primary">{referrer.full_name}</div>
                        <div className="text-xs text-text-muted">{referrer.phone}</div>
                        <div className="text-[11px] text-text-muted mt-0.5">{formatDate(referrer.created_at)}</div>
                      </td>
                      <td className="px-3 md:px-5 py-3 text-text-secondary text-[13px]">{referrer.email}</td>
                      <td className="px-3 md:px-5 py-3 font-mono font-bold text-sm text-accent-mint">{referrer.code}</td>
                      <td className="px-3 md:px-5 py-3">{getStatusBadge(referrer.status)}</td>
                      <td className="px-3 md:px-5 py-3 text-center">{getTierBadge(referrer.tier, referrer.sales_count)}</td>
                      <td className="px-3 md:px-5 py-3 text-center font-mono font-bold text-sm">{referrer.sales_count}</td>
                      <td className="px-3 md:px-5 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {referrer.status !== 'active' && (
                            <button onClick={() => updateReferrerStatus(referrer.id, 'active')}
                              className="px-3 py-1.5 bg-accent-mint/15 text-accent-mint border border-accent-mint/20 rounded text-xs font-semibold cursor-pointer hover:bg-accent-mint/25 transition-colors">
                              Activer
                            </button>
                          )}
                          {referrer.status === 'active' && (
                            <button onClick={() => updateReferrerStatus(referrer.id, 'suspended')}
                              className="px-3 py-1.5 bg-accent-red/15 text-accent-red border border-accent-red/20 rounded text-xs font-semibold cursor-pointer hover:bg-accent-red/25 transition-colors">
                              Suspendre
                            </button>
                          )}
                          <button onClick={() => openReferrerCommissionModal(referrer)}
                            className="px-3 py-1.5 bg-accent-mint/10 text-accent-mint border border-accent-mint/20 rounded text-xs font-semibold cursor-pointer hover:bg-accent-mint/20 transition-colors">
                            Commissions
                          </button>
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
          <div className="card p-6 mb-8">
            <h3 className="font-display text-lg font-semibold text-text-primary mb-5" style={{ letterSpacing: '-0.01em' }}>
              Enregistrer une vente
            </h3>
            <form onSubmit={createSale} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Code apporteur', key: 'referrer_code', type: 'text', placeholder: 'DUPONT-7K3M' },
                { label: 'Nom client', key: 'client_name', type: 'text', placeholder: 'Nom du client' },
                { label: 'Montant (€)', key: 'amount', type: 'number', placeholder: '15000' },
              ].map(field => (
                <div key={field.key}>
                  <label className="label">{field.label}</label>
                  <input type={field.type} value={saleForm[field.key as keyof typeof saleForm]} onChange={(e) => setSaleForm({ ...saleForm, [field.key]: e.target.value })}
                    className="input" placeholder={field.placeholder} required />
                </div>
              ))}
              <div>
                <label className="label">Service</label>
                <select value={saleForm.service} onChange={(e) => setSaleForm({ ...saleForm, service: e.target.value })}
                  className="input cursor-pointer" required>
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="label">Note (optionnel)</label>
                <input type="text" value={saleForm.admin_note} onChange={(e) => setSaleForm({ ...saleForm, admin_note: e.target.value })}
                  className="input" placeholder="Note interne" />
              </div>
              <div>
                <button type="submit" className="btn-primary py-2.5 text-sm">Enregistrer</button>
              </div>
            </form>
          </div>

          {!dataLoading && sales.length > 0 && (
            <>
              <div className="flex justify-end mb-3">
                <button onClick={exportCSV} className="btn-ghost text-xs py-1.5 px-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Exporter CSV
                </button>
              </div>
              {(() => {
                const unpaid = sales.filter(s => !s.commission_paid).reduce((a, s) => a + Number(s.commission_amount), 0)
                const paid = sales.filter(s => s.commission_paid).reduce((a, s) => a + Number(s.commission_amount), 0)
                return (
                  <div className="flex gap-4 mb-6 flex-wrap">
                    <div className="bg-accent-red/8 border border-accent-red/20 rounded-xl p-4 flex-1 min-w-[160px]">
                      <div className="stat-label mb-1">Commissions à verser</div>
                      <div className="text-xl font-mono font-bold text-accent-red">{unpaid.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div className="bg-accent-mint/8 border border-accent-mint/20 rounded-xl p-4 flex-1 min-w-[160px]">
                      <div className="stat-label mb-1">Commissions versées</div>
                      <div className="text-xl font-mono font-bold text-accent-mint">{paid.toLocaleString('fr-FR')} €</div>
                    </div>
                  </div>
                )
              })()}
            </>
          )}

          {dataLoading ? (
            <div className="text-center py-12 text-text-muted">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse card overflow-hidden">
                <thead>
                  <tr className="bg-bg-elevated">
                    {['Apporteur', 'Client', 'Service', 'Montant', 'Commission', 'Paiement', 'Date', 'Actions'].map(h => (
                      <th key={h} className={`th ${h === 'Montant' || h === 'Commission' ? 'text-right' : h === 'Paiement' ? 'text-center' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-t border-bg-border table-row-hover">
                      <td className="px-3 md:px-5 py-3">
                        <div className="font-semibold text-sm text-text-primary">{sale.referrer_name}</div>
                        <div className="text-[11px] font-mono text-accent-mint">{sale.referrer_code}</div>
                      </td>
                      <td className="px-3 md:px-5 py-3 text-sm text-text-primary">{sale.client_name}</td>
                      <td className="px-3 md:px-5 py-3">
                        <span className="badge-mint">{sale.service}</span>
                      </td>
                      <td className="px-3 md:px-5 py-3 text-right font-mono font-semibold text-sm">{Number(sale.amount).toLocaleString('fr-FR')} €</td>
                      <td className="px-3 md:px-5 py-3 text-right font-mono font-bold text-accent-mint text-[15px]">+{Number(sale.commission_amount).toLocaleString('fr-FR')} €</td>
                      <td className="px-3 md:px-5 py-3 text-center">
                        {sale.commission_paid ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="badge-mint">Versé</span>
                            {sale.paid_at && <span className="text-[10px] text-text-muted">{formatDate(sale.paid_at)}</span>}
                            <button onClick={() => markCommissionPaid(sale.id, false)} className="text-[10px] text-text-muted underline cursor-pointer hover:text-text-secondary bg-transparent border-none">Annuler</button>
                          </div>
                        ) : (
                          <button onClick={() => markCommissionPaid(sale.id, true)}
                            className="px-3 py-1.5 bg-accent-mint/10 border border-accent-mint/20 rounded-md text-accent-mint text-xs font-semibold cursor-pointer hover:bg-accent-mint/20 transition-colors whitespace-nowrap">
                            Marquer versé
                          </button>
                        )}
                      </td>
                      <td className="px-3 md:px-5 py-3 text-text-muted text-[13px]">{formatDate(sale.created_at)}</td>
                      <td className="px-3 md:px-5 py-3">
                        <button onClick={() => deleteSale(sale.id)} className="btn-danger text-xs py-1 px-2.5">Supprimer</button>
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
          <div className="card p-6 max-w-[600px]">
            <h3 className="font-display text-lg font-semibold text-text-primary mb-2" style={{ letterSpacing: '-0.01em' }}>
              Taux de commission par service
            </h3>
            <p className="text-text-muted text-[13px] mb-6">Taux globaux par défaut — appliqués à tous les apporteurs sauf override individuel.</p>
            {dataLoading ? (
              <div className="text-center py-12 text-text-muted">Chargement...</div>
            ) : (
              <>
                <div className="flex flex-col gap-3 mb-6">
                  {commissionRates.map((rate, idx) => (
                    <div key={rate.pack_name} className="flex items-center gap-4 p-3 bg-bg-elevated rounded-lg border border-bg-border">
                      <span className="flex-1 font-semibold text-sm text-text-primary">{rate.pack_name}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" value={rate.commission_amount}
                          onChange={(e) => { const updated = [...commissionRates]; updated[idx] = { ...rate, commission_amount: parseFloat(e.target.value) || 0 }; setCommissionRates(updated) }}
                          className="w-[100px] bg-bg-surface border border-bg-border rounded-md px-3 py-2 text-sm font-mono text-text-primary text-right focus:outline-none focus:border-accent-mint/50 transition-colors" />
                        <span className="text-text-muted text-sm">€</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={saveCommissions} disabled={commissionSaving}
                  className={`btn-primary py-2.5 px-8 text-sm ${commissionSaving ? 'opacity-60 cursor-not-allowed' : ''}`}>
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
          <h3 className="font-display text-lg font-semibold text-text-primary mb-5" style={{ letterSpacing: '-0.01em' }}>
            Apporteurs actifs
          </h3>
          {dataLoading ? (
            <div className="text-center py-12 text-text-muted">Chargement...</div>
          ) : (
            <div className="overflow-x-auto mb-12">
              <table className="w-full border-collapse card overflow-hidden">
                <thead>
                  <tr className="bg-bg-elevated">
                    {['Nom', 'Email', 'Code', 'Statut contrat', 'Actions'].map(h => (
                      <th key={h} className="th">{h}</th>
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
                      <tr key={referrer.id} className="border-t border-bg-border table-row-hover">
                        <td className="px-3 md:px-5 py-3 text-sm font-medium text-text-primary">{referrer.full_name}</td>
                        <td className="px-3 md:px-5 py-3 text-text-secondary text-[13px]">{referrer.email}</td>
                        <td className="px-3 md:px-5 py-3 font-mono font-bold text-sm text-accent-mint">{referrer.code}</td>
                        <td className="px-3 md:px-5 py-3">
                          <span className={hasSigned ? 'badge-mint' : hasSent ? 'badge-gold' : 'badge bg-white/5 text-text-muted border border-white/10'}>
                            {contractStatus}
                          </span>
                        </td>
                        <td className="px-3 md:px-5 py-3">
                          {!hasSigned && (
                            <button onClick={() => { setSelectedReferrer(referrer); setContractModalOpen(true) }}
                              className="btn-primary text-xs py-1.5 px-3">
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

          <h3 className="font-display text-lg font-semibold text-text-primary mb-5" style={{ letterSpacing: '-0.01em' }}>
            Tous les contrats
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse card overflow-hidden">
              <thead>
                <tr className="bg-bg-elevated">
                  {['Apporteur', 'Date envoi', 'Statut', 'Date signature', 'Actions'].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="border-t border-bg-border table-row-hover">
                    <td className="px-3 md:px-5 py-3 text-sm font-medium text-text-primary">{contract.full_name}</td>
                    <td className="px-3 md:px-5 py-3 text-text-muted text-[13px]">{formatDate(contract.created_at)}</td>
                    <td className="px-3 md:px-5 py-3">
                      <span className={contract.status === 'signed' ? 'badge-mint' : 'badge-gold'}>
                        {contract.status === 'signed' ? 'Signé' : 'Envoyé'}
                      </span>
                    </td>
                    <td className="px-3 md:px-5 py-3 text-text-muted text-[13px]">{contract.signed_at ? formatDate(contract.signed_at) : '-'}</td>
                    <td className="px-3 md:px-5 py-3">
                      <a href={`https://storage.marpeap.digital/contracts/${contract.pdf_filename}`} target="_blank" rel="noopener noreferrer"
                        className="btn-primary text-xs py-1.5 px-3 no-underline">
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
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[1000]">
              <div className="card p-8 w-full max-w-[600px] max-h-[90vh] overflow-auto">
                <h3 className="font-display text-lg font-semibold text-text-primary mb-5" style={{ letterSpacing: '-0.01em' }}>
                  Envoyer un contrat à {selectedReferrer.full_name}
                </h3>
                <form onSubmit={sendContract} className="flex flex-col gap-5">
                  <div>
                    <label className="label">Option 1 : Uploader un PDF</label>
                    <input type="file" accept=".pdf" onChange={(e) => setContractPdfFile(e.target.files?.[0] || null)}
                      className="input py-3" />
                  </div>
                  <div>
                    <label className="label">Option 2 : Saisir le texte du contrat</label>
                    <textarea value={contractPdfText} onChange={(e) => setContractPdfText(e.target.value)} placeholder="Texte du contrat..." rows={6}
                      className="input resize-y" />
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button type="button" onClick={() => { setContractModalOpen(false); setSelectedReferrer(null); setContractPdfFile(null); setContractPdfText('') }}
                      className="btn-ghost flex-1 py-3 justify-center">
                      Annuler
                    </button>
                    <button type="submit" disabled={sendContractLoading}
                      className={`btn-primary flex-1 py-3 justify-center ${sendContractLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
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
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-display text-lg font-semibold text-text-primary" style={{ letterSpacing: '-0.01em' }}>Annonces</h3>
            <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              className={showAnnouncementForm ? 'btn-ghost text-sm' : 'btn-primary text-sm'}>
              {showAnnouncementForm ? 'Annuler' : 'Nouvelle annonce'}
            </button>
          </div>

          {showAnnouncementForm && (
            <div className="card p-6 mb-6">
              <form onSubmit={createAnnouncement} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Titre</label>
                    <input type="text" value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      className="input" placeholder="Titre de l'annonce" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Contenu</label>
                    <textarea value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      className="input resize-y" rows={3} placeholder="Contenu de l'annonce" required />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select value={announcementForm.type} onChange={e => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                      className="input cursor-pointer">
                      {[['info', 'Info'], ['success', 'Succès'], ['warning', 'Alerte'], ['promo', 'Promo']].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Expiration (optionnel)</label>
                    <input type="datetime-local" value={announcementForm.expires_at} onChange={e => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })}
                      className="input" />
                  </div>
                </div>
                <div>
                  <button type="submit" disabled={announcementCreating}
                    className={`btn-primary py-2.5 px-7 text-sm ${announcementCreating ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {announcementCreating ? 'Création...' : "Publier l'annonce"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {dataLoading ? (
            <div className="text-center py-12 text-text-muted">Chargement...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-text-muted card">Aucune annonce</div>
              ) : announcements.map(ann => (
                <div key={ann.id} className="card p-4" style={{ borderColor: ann.active ? announcementTypeColor[ann.type] + '33' : undefined }}>
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0"
                      style={{ background: announcementTypeColor[ann.type] + '22', color: announcementTypeColor[ann.type] }}>
                      {ann.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-[15px] text-text-primary mb-1 ${!ann.active ? 'opacity-50' : ''}`}>{ann.title}</div>
                      <div className="text-[13px] text-text-secondary leading-relaxed">{ann.content}</div>
                      <div className="text-[11px] text-text-muted mt-2">
                        {formatDate(ann.created_at)}{ann.expires_at ? ` · Expire le ${formatDate(ann.expires_at)}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => pushAnnouncementAll(ann.id, ann.title, ann.content)}
                        className="px-3 py-1.5 bg-[#9B5BF5]/10 border border-[#9B5BF5]/20 rounded-md text-[#9B5BF5] text-xs font-semibold cursor-pointer hover:bg-[#9B5BF5]/20 transition-colors">
                        Push
                      </button>
                      <button onClick={() => toggleAnnouncement(ann.id, ann.active)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                          ann.active
                            ? 'bg-accent-red/10 border border-accent-red/20 text-accent-red hover:bg-accent-red/20'
                            : 'bg-accent-mint/10 border border-accent-mint/20 text-accent-mint hover:bg-accent-mint/20'
                        }`}>
                        {ann.active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => deleteAnnouncement(ann.id)}
                        className="px-2.5 py-1.5 bg-accent-red/10 border border-accent-red/20 rounded-md text-accent-red text-xs cursor-pointer hover:bg-accent-red/20 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
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
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-display text-lg font-semibold text-text-primary" style={{ letterSpacing: '-0.01em' }}>Challenges mensuels</h3>
            <button onClick={() => setShowChallengeForm(!showChallengeForm)}
              className={showChallengeForm ? 'btn-ghost text-sm' : 'btn-primary text-sm'}>
              {showChallengeForm ? 'Annuler' : 'Nouveau challenge'}
            </button>
          </div>

          {showChallengeForm && (
            <div className="card p-6 mb-6">
              <form onSubmit={createChallenge} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="label">Titre</label>
                    <input type="text" value={challengeForm.title} onChange={e => setChallengeForm({ ...challengeForm, title: e.target.value })}
                      className="input" placeholder="Ex: 3 ventes ce mois" required />
                  </div>
                  <div>
                    <label className="label">Mois</label>
                    <input type="month" value={challengeForm.month} onChange={e => setChallengeForm({ ...challengeForm, month: e.target.value })}
                      className="input" required />
                  </div>
                  <div>
                    <label className="label">Type de condition</label>
                    <select value={challengeForm.condition_type} onChange={e => setChallengeForm({ ...challengeForm, condition_type: e.target.value as typeof challengeForm.condition_type })}
                      className="input cursor-pointer">
                      <option value="sales_count">Nb ventes ce mois</option>
                      <option value="service_sold">Service spécifique</option>
                      <option value="amount_total">Montant total commissions</option>
                    </select>
                  </div>

                  {challengeForm.condition_type === 'sales_count' && (
                    <div>
                      <label className="label">Nombre de ventes requis</label>
                      <input type="number" min="1" value={challengeForm.condition_count} onChange={e => setChallengeForm({ ...challengeForm, condition_count: e.target.value })}
                        className="input" required />
                    </div>
                  )}

                  {challengeForm.condition_type === 'service_sold' && (
                    <>
                      <div>
                        <label className="label">Service</label>
                        <select value={challengeForm.condition_service} onChange={e => setChallengeForm({ ...challengeForm, condition_service: e.target.value })}
                          className="input cursor-pointer">
                          {services.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Nb ventes de ce service</label>
                        <input type="number" min="1" value={challengeForm.condition_service_count} onChange={e => setChallengeForm({ ...challengeForm, condition_service_count: e.target.value })}
                          className="input" required />
                      </div>
                    </>
                  )}

                  {challengeForm.condition_type === 'amount_total' && (
                    <div>
                      <label className="label">Montant commissions (€)</label>
                      <input type="number" min="1" value={challengeForm.condition_amount} onChange={e => setChallengeForm({ ...challengeForm, condition_amount: e.target.value })}
                        className="input" required />
                    </div>
                  )}

                  <div>
                    <label className="label">Bonus (€)</label>
                    <input type="number" min="1" value={challengeForm.bonus_amount} onChange={e => setChallengeForm({ ...challengeForm, bonus_amount: e.target.value })}
                      className="input" required />
                  </div>
                </div>
                <div>
                  <button type="submit" disabled={challengeCreating}
                    className={`btn-primary py-2.5 px-7 text-sm ${challengeCreating ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {challengeCreating ? 'Création...' : 'Créer le challenge'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {dataLoading ? (
            <div className="text-center py-12 text-text-muted">Chargement...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {challenges.length === 0 ? (
                <div className="text-center py-12 text-text-muted card">Aucun challenge</div>
              ) : challenges.map(ch => (
                <div key={ch.id} className="card overflow-hidden" style={{ borderColor: ch.active ? 'rgba(54,216,176,0.2)' : undefined }}>
                  <div className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="font-semibold text-[15px] text-text-primary">{ch.title}</span>
                        <span className={`badge ${ch.active ? 'badge-mint' : 'bg-white/5 text-text-muted border border-white/10'}`}>
                          {ch.active ? 'Actif' : 'Inactif'}
                        </span>
                        <span className="text-xs text-text-muted">{ch.month}</span>
                      </div>
                      <div className="text-[13px] text-text-secondary">{formatCondition(ch)}</div>
                    </div>
                    <div className="text-right mr-3">
                      <div className="text-xl font-mono font-bold text-accent-mint">+{Number(ch.bonus_amount).toLocaleString('fr-FR')} €</div>
                      <div className="text-[11px] text-text-muted">{ch.completions?.length ?? 0} completion(s)</div>
                    </div>
                    <div className="flex gap-2">
                      {(ch.completions?.length ?? 0) > 0 && (
                        <button onClick={() => setExpandedChallenge(expandedChallenge === ch.id ? null : ch.id)}
                          className="px-3 py-1.5 bg-accent-mint/10 border border-accent-mint/20 rounded-md text-accent-mint text-xs font-semibold cursor-pointer hover:bg-accent-mint/20 transition-colors">
                          Completions
                        </button>
                      )}
                      <button onClick={() => toggleChallenge(ch.id, ch.active)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                          ch.active
                            ? 'bg-accent-red/10 border border-accent-red/20 text-accent-red hover:bg-accent-red/20'
                            : 'bg-accent-mint/10 border border-accent-mint/20 text-accent-mint hover:bg-accent-mint/20'
                        }`}>
                        {ch.active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => deleteChallenge(ch.id)}
                        className="px-2.5 py-1.5 bg-accent-red/10 border border-accent-red/20 rounded-md text-accent-red text-xs cursor-pointer hover:bg-accent-red/20 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {expandedChallenge === ch.id && (ch.completions?.length ?? 0) > 0 && (
                    <div className="border-t border-bg-border p-4 bg-white/[0.02]">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2.5">Completions</div>
                      <div className="flex flex-col gap-2">
                        {ch.completions.map(comp => (
                          <div key={comp.referrer_id} className="flex items-center gap-3 p-2.5 bg-white/[0.03] rounded-lg">
                            <div className="flex-1">
                              <span className="font-semibold text-sm text-text-primary">{comp.referrer_name}</span>
                              <span className="text-xs font-mono text-accent-mint ml-2">{comp.referrer_code}</span>
                            </div>
                            <span className="text-xs text-text-muted">{formatDate(comp.completed_at)}</span>
                            {comp.bonus_paid ? (
                              <span className="badge-mint">Bonus versé</span>
                            ) : (
                              <button onClick={() => markChallengeBonusPaid(ch.id, comp.referrer_id)}
                                className="px-3 py-1 bg-accent-mint/10 border border-accent-mint/20 rounded-md text-accent-mint text-xs font-semibold cursor-pointer hover:bg-accent-mint/20 transition-colors">
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
          <div className="card p-5 mb-6 max-w-[400px]">
            <h3 className="font-display text-base font-semibold text-text-primary mb-1.5">Taux de commission cascade</h3>
            <p className="text-[13px] text-text-muted mb-4">Pourcentage de la commission du filleul reversé au parrain.</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                <input type="number" min="0" max="100" step="0.5" value={cascadeRateEdit} onChange={e => setCascadeRateEdit(e.target.value)}
                  className="w-20 bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-lg font-mono font-bold text-text-primary text-center focus:outline-none focus:border-accent-mint/50 transition-colors" />
                <span className="text-lg font-bold text-text-muted">%</span>
              </div>
              <button onClick={updateCascadeRate} disabled={cascadeRateSaving}
                className={`btn-primary py-2.5 text-sm ${cascadeRateSaving ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {cascadeRateSaving ? '...' : 'Enregistrer'}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2.5">Taux actuel en base : {cascadeRate}%</p>
          </div>

          {/* Cascade commissions table */}
          <h3 className="font-display text-base font-semibold text-text-primary mb-4">Commissions cascade</h3>
          {dataLoading ? (
            <div className="text-center py-12 text-text-muted">Chargement...</div>
          ) : (
            <>
              {cascadeCommissions.length > 0 && (() => {
                const unpaid = cascadeCommissions.filter(c => !c.paid).reduce((a, c) => a + Number(c.amount), 0)
                const total = cascadeCommissions.reduce((a, c) => a + Number(c.amount), 0)
                return (
                  <div className="flex gap-4 mb-5 flex-wrap">
                    <div className="bg-accent-red/8 border border-accent-red/20 rounded-xl p-4 flex-1 min-w-[160px]">
                      <div className="stat-label mb-1">Cascade à verser</div>
                      <div className="text-xl font-mono font-bold text-accent-red">{unpaid.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div className="bg-accent-mint/8 border border-accent-mint/20 rounded-xl p-4 flex-1 min-w-[160px]">
                      <div className="stat-label mb-1">Total cascade</div>
                      <div className="text-xl font-mono font-bold text-accent-mint">{total.toLocaleString('fr-FR')} €</div>
                    </div>
                  </div>
                )
              })()}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse card overflow-hidden">
                  <thead>
                    <tr className="bg-bg-elevated">
                      {['Parrain', 'Filleul', 'Cascade', 'Statut', 'Date', 'Action'].map(h => (
                        <th key={h} className="th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cascadeCommissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-text-muted">Aucune commission cascade</td>
                      </tr>
                    ) : cascadeCommissions.map(cc => (
                      <tr key={cc.id} className="border-t border-bg-border table-row-hover">
                        <td className="px-3 md:px-5 py-3">
                          <div className="font-semibold text-sm text-text-primary">{cc.parrain_name}</div>
                          <div className="text-[11px] font-mono text-accent-mint">{cc.parrain_code}</div>
                        </td>
                        <td className="px-3 md:px-5 py-3">
                          <div className="font-medium text-sm text-text-primary">{cc.filleul_name}</div>
                          <div className="text-[11px] font-mono text-text-muted">{cc.filleul_code}</div>
                        </td>
                        <td className="px-3 md:px-5 py-3 font-mono font-bold text-accent-mint text-[15px]">+{Number(cc.amount).toLocaleString('fr-FR')} €</td>
                        <td className="px-3 md:px-5 py-3">
                          {cc.paid ? (
                            <div>
                              <span className="badge-mint">Versé</span>
                              {cc.paid_at && <div className="text-[10px] text-text-muted mt-1">{formatDate(cc.paid_at)}</div>}
                            </div>
                          ) : (
                            <span className="badge-red">En attente</span>
                          )}
                        </td>
                        <td className="px-3 md:px-5 py-3 text-text-muted text-[13px]">{formatDate(cc.created_at)}</td>
                        <td className="px-3 md:px-5 py-3">
                          {!cc.paid && (
                            <button onClick={() => markCascadePaid(cc.id)}
                              className="px-3 py-1.5 bg-accent-mint/10 border border-accent-mint/20 rounded-md text-accent-mint text-xs font-semibold cursor-pointer hover:bg-accent-mint/20 transition-colors whitespace-nowrap">
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[1000]">
          <div className="card p-8 w-full max-w-[520px] max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start mb-1.5">
              <h3 className="font-display text-lg font-semibold text-text-primary" style={{ letterSpacing: '-0.01em' }}>
                Commissions — {referrerCommissionModal.full_name}
              </h3>
              <button onClick={() => setReferrerCommissionModal(null)}
                className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/10 cursor-pointer transition-colors border-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="text-text-muted text-xs mb-5">
              Taux personnalisés pour cet apporteur. Les cases marquées <span className="text-accent-mint">globale</span> utilisent le taux par défaut.
            </p>
            <div className="flex flex-col gap-2.5 mb-6">
              {referrerRates.map((rate, idx) => (
                <div key={rate.pack_name} className={`flex items-center gap-3 p-3 bg-bg-elevated rounded-lg border ${rate.is_custom ? 'border-accent-mint/20' : 'border-bg-border'}`}>
                  <span className="flex-1 font-semibold text-[13px] text-text-primary">{rate.pack_name}</span>
                  {!rate.is_custom && <span className="text-[10px] text-accent-mint bg-accent-mint/10 px-1.5 py-0.5 rounded-full">globale</span>}
                  <input type="number" min="0" value={rate.commission_amount}
                    onChange={(e) => { const updated = [...referrerRates]; updated[idx] = { ...rate, commission_amount: parseFloat(e.target.value) || 0, is_custom: true }; setReferrerRates(updated) }}
                    className="w-[90px] bg-bg-surface border border-bg-border rounded-md px-2.5 py-1.5 text-[13px] font-mono text-text-primary text-right focus:outline-none focus:border-accent-mint/50 transition-colors" />
                  <span className="text-text-muted text-[13px]">€</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2.5">
              <button onClick={resetReferrerCommissions} className="btn-ghost text-[13px] py-2.5 px-4">
                Remettre les taux globaux
              </button>
              <button onClick={saveReferrerCommissions} disabled={referrerRatesSaving}
                className={`btn-primary flex-1 py-2.5 justify-center text-sm ${referrerRatesSaving ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {referrerRatesSaving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
