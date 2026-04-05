'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

/* ── Types ──────────────────────────────────────────────── */
interface Sale { id: string; client_name: string; service: string; amount: number; commission_amount: number; commission_paid: boolean; paid_at: string | null; admin_note: string | null; created_at: string }
interface Contract { id: string; pdf_filename: string; status: 'sent' | 'signed'; otp_sent_at: string; signed_at: string | null; pdf_url: string }
interface User { full_name: string; email: string; phone: string; code: string }
interface CommissionRate { pack_name: string; commission_amount: number }
interface Stats { series_weekly: {week:string;sales:number;commission:number}[]; by_service: {service:string;count:number;commission:number}[]; projection: {monthly_estimate:number;trend:string}; clicks: {total:number;this_month:number;conversion_rate:number}; cascade: {filleuls_count:number;total_cascade_earned:number;pending_cascade:number} }
interface Badge { id: string; name: string; icon: string; description: string; earned_at?: string; progress?: {current:number;target:number} }
interface Challenge { id: string; title: string; description: string; month: string; condition_type: string; condition_value: any; bonus_amount: number; completed: boolean; completion_date: string | null; bonus_paid: boolean }
interface Announcement { id: string; title: string; content: string; type: string; created_at: string }

/* ── Packs ──────────────────────────────────────────────── */
const PACKS = [
  { name: 'M-ONE', price: 290, color: '#4F8AFF', tagline: 'Site One-Page Ultra-Rapide', description: 'Un site professionnel, beau et optimisé, livré en 48h.', target: 'Artisans, commerçants, auto-entrepreneurs, professions libérales', features: ['Design sur mesure responsive', 'Optimisation SEO intégrée', 'Formulaire de contact & maps', 'Mise en ligne en 48h'], pitchArgs: ['Vos concurrents sont en ligne — et vous ?', 'Un site pro à partir de 290€', 'Livré en 48h, pas en 3 mois'] },
  { name: 'M-SHOP LITE', price: 490, color: '#F5A623', tagline: 'Boutique E-Commerce Pro', description: 'Une boutique en ligne complète avec gestion des paiements.', target: 'Créateurs, artisans, commerces physiques', features: ['Boutique avec panier & Stripe', 'Gestion produits, stocks, livraisons', 'Design adapté à votre marque', 'SEO optimisé'], pitchArgs: ['Vendez 24h/24 sans effort', 'Boutique pro en moins d\'une semaine', 'Concurrencez Amazon sur votre niche'] },
  { name: 'M-LOCAL', price: 190, color: '#10B981', tagline: 'Visibilité Google Maps', description: 'Optimisation complète de votre fiche Google Business.', target: 'Restaurants, coiffeurs, plombiers, médecins', features: ['Optimisation fiche Google Business', 'Photos & contenus SEO', 'Stratégie mots-clés locaux', 'Résultats en 30 jours'], pitchArgs: ['80% des recherches locales aboutissent à une visite', 'Le pack le moins cher, souvent le plus impactant', '"Trouvez un plombier près de moi" — soyez le 1er'] },
  { name: 'M-CALLING', price: 490, color: '#F54EA2', tagline: 'Standardiste IA 24h/24', description: 'Un agent vocal IA répond à tous les appels 24h/24, 7j/7.', target: 'Cabinets médicaux, restaurants, hôtels, agences', features: ['Réponse instantanée 24h/24', 'Prise de rendez-vous auto', 'Disponible en plusieurs langues', 'Zéro coût de recrutement'], pitchArgs: ['Plus jamais d\'appel manqué', 'Remplace un standardiste pour 30€/mois', 'Vos concurrents paient encore un humain'] },
  { name: 'M-CAMPAIGN', price: 519.99, color: '#2ED573', tagline: 'Gestionnaire Google Ads IA', description: 'Un agent IA gère vos campagnes Google Ads en continu.', target: 'E-commerce, agences, cliniques, formations', features: ['Création & optimisation campagnes', 'Suivi temps réel', 'Rapports mensuels clairs', 'Consultation de démarrage'], pitchArgs: ['Dépensez moins en pub, gagnez plus', 'Votre budget travaille 24h/24', 'Résultats mesurables dès le 1er mois'] },
  { name: 'M-NEURAL', price: 180, color: '#9B5BF5', tagline: 'ChatBot IA sur vos données', description: 'Un chatbot intelligent formé sur vos propres données.', target: 'E-commerce, SaaS, formateurs en ligne', features: ['IA formée sur votre contenu', 'Intégration site en 48h', 'Répond 24h/24', 'Réduit tickets support de 70%'], pitchArgs: ['Finies les réponses aux mêmes questions', 'Plus abordable qu\'un CDI support', 'Vos clients adorent les réponses en 3 secondes'] },
  { name: 'M-CORP', price: 820, color: '#F1C40F', tagline: 'Équipe de 5 Agents IA autonomes', description: '5 agents IA spécialisés automatisent vos processus métiers.', target: 'PME à partir de 5 employés, entreprises en croissance', features: ['5 agents IA personnalisés', 'Automatisation tâches répétitives', 'Intégrations CRM, Slack, Drive', 'Formation équipe + support'], pitchArgs: ['Votre propre équipe IA pour le prix d\'un freelance', 'ROI moyen : 40h économisées/mois', 'Le pack "transformer sa boîte"'] },
]

const PIE_COLORS = ['#36D8B0', '#F0B429', '#9B5BF5', '#F54EA2', '#4F8AFF', '#2ED573', '#F5A623']

/* ── QR Code SVG placeholder ───────────────────── */
function generateQRDataUrl(text: string): string {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#060E12"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#36D8B0" font-size="10" font-family="monospace">QR: ${text.slice(0, 12)}...</text></svg>`
  return `data:image/svg+xml;base64,${btoa(svgContent)}`
}

/* ══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [contract, setContract] = useState<Contract | null>(null)
  const [commissions, setCommissions] = useState<Record<string, number>>({})
  const [stats, setStats] = useState<Stats | null>(null)
  const [badges, setBadges] = useState<{earned: Badge[]; available: Badge[]}>({earned:[], available:[]})
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'accueil'|'ventes'|'analytics'|'objectifs'|'catalogue'|'ressources'|'classement'|'vente'>('accueil')
  const [leaderboard, setLeaderboard] = useState<{rank:number;name:string;tier:string;sales_count:number;total_commission:number;is_me:boolean}[]>([])
  const [myRank, setMyRank] = useState<{rank:number;total_commission:number;sales_count:number}|null>(null)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])
  const [activeFiche, setActiveFiche] = useState('M-ONE')
  const [copied, setCopied] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [signatureImage, setSignatureImage] = useState('')
  const [signLoading, setSignLoading] = useState(false)
  const [signSuccess, setSignSuccess] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [nextPayment, setNextPayment] = useState<string|null>(null)
  const [venteForm, setVenteForm] = useState({ client_email: '', client_name: '', client_phone: '', company_name: '', service: '' })
  const [venteLoading, setVenteLoading] = useState(false)
  const [venteResult, setVenteResult] = useState<{ checkout_url: string; sale_id: string } | null>(null)
  const [venteError, setVenteError] = useState('')
  const venteEnabled = process.env.NEXT_PUBLIC_VENTE_ENABLED === 'true'
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('refer_token')
    if (!token) { router.push('/login'); return }
    const fetchAll = async () => {
      try {
        const [userRes, salesRes, contractRes, ratesRes, statsRes, badgesRes, challengesRes, annRes] = await Promise.all([
          fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/sales', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/contracts/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/commission-rates'),
          fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/badges', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/challenges', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/announcements', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!userRes.ok) { localStorage.removeItem('refer_token'); router.push('/login'); return }
        const [userData, salesData] = await Promise.all([userRes.json(), salesRes.json()])
        setUser(userData)
        setSales(Array.isArray(salesData) ? salesData : [])
        if (contractRes.ok) { const d = await contractRes.json(); setContract(d.contract) }
        if (ratesRes.ok) { const d: CommissionRate[] = await ratesRes.json(); const map: Record<string,number> = {}; d.forEach(r => { map[r.pack_name] = Number(r.commission_amount) }); setCommissions(map) }
        if (statsRes.ok) { setStats(await statsRes.json()) }
        if (badgesRes.ok) { setBadges(await badgesRes.json()) }
        if (challengesRes.ok) { const d = await challengesRes.json(); setChallenges(d.challenges || []) }
        if (annRes.ok) { const d = await annRes.json(); setAnnouncements(d.announcements || []) }
        const now = new Date()
        const nextM = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        setNextPayment(nextM.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }))
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          navigator.serviceWorker.register('/sw.js').catch(() => {})
          navigator.serviceWorker.ready.then(async (reg) => {
            const sub = await reg.pushManager.getSubscription()
            setPushEnabled(!!sub)
          }).catch(() => {})
        }
      } catch { localStorage.removeItem('refer_token'); router.push('/login') }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [router])

  const handleLogout = () => { localStorage.removeItem('refer_token'); router.push('/login') }
  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000) }) }
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const totalCommission = sales.reduce((a, s) => a + Number(s.commission_amount || 0), 0)
  const pendingCommission = sales.filter(s => !s.commission_paid).reduce((a, s) => a + Number(s.commission_amount || 0), 0)
  const thisMonthKey = new Date().toISOString().slice(0, 7)
  const salesThisMonth = sales.filter(s => s.created_at.startsWith(thisMonthKey))

  /* Canvas signature */
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return {x:0,y:0}
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); setIsDrawing(true); const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return; const {x,y} = getCoords(e); ctx.beginPath(); ctx.moveTo(x,y) }
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); if (!isDrawing) return; const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return; const {x,y} = getCoords(e); ctx.lineTo(x,y); ctx.stroke() }
  const stopDrawing = () => { setIsDrawing(false); if (canvasRef.current) setSignatureImage(canvasRef.current.toDataURL()) }
  const clearSignature = () => { const c = canvasRef.current; const ctx = c?.getContext('2d'); if (!c||!ctx) return; ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); setSignatureImage('') }

  const signContract = async () => {
    if (!otpCode || otpCode.length !== 6) { alert('Veuillez entrer le code OTP à 6 chiffres'); return }
    if (!signatureImage) { alert('Veuillez signer le contrat'); return }
    const token = localStorage.getItem('refer_token'); if (!token) return
    setSignLoading(true)
    try {
      const res = await fetch('/api/contracts/sign', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ otp_code: otpCode, signature_image: signatureImage }) })
      if (res.ok) { setSignSuccess(true); const cr = await fetch('/api/contracts/me', { headers: { Authorization: `Bearer ${token}` } }); if (cr.ok) { const d = await cr.json(); setContract(d.contract) } }
      else { const d = await res.json(); alert(d.error || 'Erreur') }
    } catch { alert('Erreur') } finally { setSignLoading(false) }
  }

  const enablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setPushLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setPushLoading(false); return }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY })
      const token = localStorage.getItem('refer_token')
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(sub.toJSON()) })
      setPushEnabled(true)
    } catch {} finally { setPushLoading(false) }
  }

  const disablePush = async () => {
    setPushLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) { const token = localStorage.getItem('refer_token'); await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe() }
      setPushEnabled(false)
    } catch {} finally { setPushLoading(false) }
  }

  const loadLeaderboard = async () => {
    if (leaderboard.length > 0) return
    setLeaderboardLoading(true)
    try {
      const token = localStorage.getItem('refer_token')
      const res = await fetch('/api/leaderboard', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setLeaderboard(d.board); setMyRank(d.my_rank) }
    } catch {} finally { setLeaderboardLoading(false) }
  }

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a.id))
  const annTypeColor: Record<string, string> = { info: '#36D8B0', success: '#36D8B0', warning: '#F0B429', promo: '#9B5BF5' }
  const TABS: [string, string][] = [['accueil', 'Accueil'], ...(venteEnabled ? [['vente', 'Créer une vente'] as [string, string]] : []), ['ventes', 'Ventes'], ['analytics', 'Analytics'], ['objectifs', 'Objectifs'], ['catalogue', 'Catalogue'], ['ressources', 'Ressources'], ['classement', 'Classement']]

  if (loading) return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center">
      <span className="text-text-muted text-sm font-body">Chargement...</span>
    </main>
  )
  if (!user) return null

  return (
    <main className="min-h-screen bg-bg-base text-text-primary font-body">
      <style>{`
        .recharts-tooltip-wrapper .recharts-default-tooltip { background: #0B1A1F !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; }
      `}</style>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-bg-border backdrop-blur-xl bg-bg-base/90 px-4 md:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight">marpeap</span>
          <span className="text-xs text-text-muted font-body">Apporteurs</span>
        </Link>
        <div className="flex items-center gap-3">
          {badges.earned.length > 0 && <span title={`${badges.earned.length} badge(s)`} className="text-base">{badges.earned[0].icon}</span>}
          <span className="text-text-muted text-sm hidden sm:inline">{user.full_name}</span>
          <button onClick={handleLogout} className="btn-ghost py-1.5 px-3 text-xs">Déconnexion</button>
        </div>
      </header>

      <div className="max-w-[1040px] mx-auto px-4 md:px-5 py-7">

        {/* ── Announcements ── */}
        {visibleAnnouncements.length > 0 && (
          <div className="mb-5 space-y-2">
            {visibleAnnouncements.map(ann => (
              <div key={ann.id} className="rounded-xl px-4 py-2.5 flex items-start justify-between gap-3" style={{ background: `${annTypeColor[ann.type] || '#36D8B0'}12`, border: `1px solid ${annTypeColor[ann.type] || '#36D8B0'}30` }}>
                <div>
                  <div className="font-display text-sm font-semibold mb-0.5">{ann.title}</div>
                  <div className="font-body text-text-secondary text-xs leading-relaxed">{ann.content}</div>
                </div>
                <button onClick={() => setDismissedAnnouncements(p => [...p, ann.id])} className="text-text-muted hover:text-text-primary text-lg leading-none flex-shrink-0 cursor-pointer bg-transparent border-none">×</button>
              </div>
            ))}
          </div>
        )}

        {/* ── Contract pending ── */}
        {contract?.status === 'sent' && !signSuccess && (
          <div className="bg-accent-gold/8 border border-accent-gold/25 rounded-xl px-5 py-3 mb-5 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-accent-gold font-medium font-body">Vous avez un contrat en attente de signature</span>
            <button onClick={() => setActiveTab('ventes')} className="px-4 py-1.5 bg-accent-gold text-bg-base rounded-lg text-xs font-bold cursor-pointer border-none font-body">Signer maintenant</button>
          </div>
        )}

        {/* ── Welcome card ── */}
        <div className="rounded-xl border border-accent-mint/20 p-5 md:p-6 mb-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-center" style={{ background: 'linear-gradient(135deg, rgba(54,216,176,0.08), rgba(240,180,41,0.04))' }}>
          <div>
            <h1 className="font-display text-lg md:text-xl font-semibold mb-1" style={{ letterSpacing: '-0.015em' }}>Bonjour, {user.full_name.split(' ')[0]}</h1>
            <p className="text-text-muted text-xs mb-4 font-body">Espace apporteur d'affaires Marpeap</p>
            <div className="flex gap-3 flex-wrap">
              <StatCard value={user.code} label="Mon code" color="rgb(54,216,176)" />
              <StatCard value={sales.length} label="Ventes totales" color="rgb(54,216,176)" />
              <StatCard value={`${totalCommission.toLocaleString('fr-FR')}€`} label="Commissions" color="rgb(240,180,41)" />
              {pendingCommission > 0 && <StatCard value={`${pendingCommission.toLocaleString('fr-FR')}€`} label="En attente" color="rgb(240,180,41)" />}
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[200px]">
            <span className="text-[11px] text-text-muted font-body">Mon lien de parrainage</span>
            <div className="bg-bg-base/50 border border-bg-border rounded-lg px-3 py-2 text-xs text-text-muted font-mono overflow-hidden text-ellipsis whitespace-nowrap">
              refer.marpeap.com/r/{user.code}
            </div>
            <div className="flex gap-2">
              <button onClick={() => copy(user.code, 'code')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer border font-body transition-colors ${copied === 'code' ? 'bg-accent-mint/15 border-accent-mint/30 text-accent-mint' : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-text-primary'}`}>
                {copied === 'code' ? 'Copié' : 'Copier code'}
              </button>
              <button onClick={() => copy(`https://refer.marpeap.com/r/${user.code}`, 'link')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none font-body transition-colors ${copied === 'link' ? 'bg-accent-mint/15 text-accent-mint' : 'bg-accent-mint text-bg-base'}`}>
                {copied === 'link' ? 'Copié' : 'Copier lien'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {TABS.map(([tab, label]) => (
            <button key={tab} onClick={() => { setActiveTab(tab as any); if (tab === 'classement') loadLeaderboard() }}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-all font-body border ${activeTab === tab ? 'bg-accent-mint text-bg-base border-accent-mint font-bold' : 'bg-bg-surface border-bg-border text-text-secondary hover:text-text-primary hover:border-accent-mint/30'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════ TAB: ACCUEIL ══════════════ */}
        {activeTab === 'accueil' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 md:col-span-2">
              <h3 className="font-display text-sm font-semibold mb-4">Ce mois-ci</h3>
              <div className="flex gap-3 flex-wrap">
                <StatCard value={salesThisMonth.length} label="Ventes ce mois" color="rgb(54,216,176)" />
                <StatCard value={`${salesThisMonth.reduce((a, s) => a + Number(s.commission_amount), 0).toFixed(0)}€`} label="Commissions mois" color="rgb(54,216,176)" />
                {stats && <StatCard value={stats.clicks.this_month} label="Visites lien" color="#9B5BF5" />}
                {stats && <StatCard value={`${(stats.clicks.conversion_rate * 100).toFixed(0)}%`} label="Taux conversion" color="rgb(240,180,41)" />}
              </div>
            </div>

            {nextPayment && (
              <div className="card p-5">
                <h3 className="font-display text-sm font-semibold mb-3">Prochain versement estimé</h3>
                <div className="font-mono text-xl font-bold text-accent-mint mb-1">{pendingCommission.toFixed(2)} €</div>
                <div className="text-text-muted text-xs font-body">Estimé le {nextPayment}</div>
              </div>
            )}

            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold mb-3">Mes badges</h3>
              {badges.earned.length === 0 ? (
                <p className="text-text-muted text-xs font-body">Pas encore de badge. Faites votre première vente !</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {badges.earned.slice(0, 4).map(b => (
                    <div key={b.id} title={b.description} className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-center">
                      <div className="text-xl">{b.icon}</div>
                      <div className="text-text-muted text-[11px] mt-1 font-body">{b.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold mb-3">Challenge du mois</h3>
              {challenges.length === 0 ? (
                <p className="text-text-muted text-xs font-body">Aucun challenge actif ce mois-ci.</p>
              ) : (
                challenges.slice(0, 2).map(c => (
                  <div key={c.id} className={`rounded-lg p-3 mb-2 border ${c.completed ? 'bg-accent-mint/5 border-accent-mint/20' : 'bg-bg-elevated border-bg-border'}`}>
                    <div className="font-display text-xs font-semibold">{c.title}</div>
                    <div className={`text-xs font-bold mt-1 font-body ${c.completed ? 'text-accent-mint' : 'text-accent-gold'}`}>
                      {c.completed ? 'Complété !' : `Bonus : +${c.bonus_amount}€`}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold mb-2">Notifications push</h3>
              <p className="text-text-muted text-xs mb-3 font-body">
                {pushEnabled ? 'Vous recevez les notifications pour vos badges et ventes.' : 'Activez les notifications pour ne rien manquer.'}
              </p>
              <button onClick={pushEnabled ? disablePush : enablePush} disabled={pushLoading}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer border-none font-body ${pushEnabled ? 'bg-bg-elevated text-text-secondary' : 'bg-accent-mint text-bg-base'}`}>
                {pushLoading ? '...' : pushEnabled ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: CREER UNE VENTE ══════════════ */}
        {activeTab === 'vente' && venteEnabled && (
          <div className="max-w-[560px]">
            <h2 className="font-display text-lg font-semibold mb-1" style={{ letterSpacing: '-0.01em' }}>Créer une vente</h2>
            <p className="text-text-muted text-xs mb-5 font-body">Générez un lien de paiement Stripe pour votre prospect.</p>

            {venteResult ? (
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-accent-mint/10 border border-accent-mint/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" className="text-accent-mint"><path d="M4 9l3.5 3.5L14 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 className="font-display text-sm font-semibold mb-1">Lien de paiement généré</h3>
                <p className="text-text-muted text-xs mb-4 font-body">Un email avec le lien a été envoyé au prospect.</p>
                <div className="bg-accent-mint/8 border border-accent-mint/20 rounded-lg p-3 mb-4 break-all text-xs text-accent-mint font-mono">{venteResult.checkout_url}</div>
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(venteResult.checkout_url); setCopied('vente-url'); setTimeout(() => setCopied(''), 2000) }}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold cursor-pointer border-none font-body ${copied === 'vente-url' ? 'bg-accent-mint/15 text-accent-mint' : 'bg-accent-mint text-bg-base'}`}>
                    {copied === 'vente-url' ? 'Copié' : 'Copier le lien'}
                  </button>
                  <button onClick={() => { setVenteResult(null); setVenteForm({ client_email: '', client_name: '', client_phone: '', company_name: '', service: '' }); setVenteError('') }}
                    className="btn-ghost py-2.5 px-4 text-xs">Nouvelle vente</button>
                </div>
              </div>
            ) : (
              <div className="card p-6">
                {venteError && <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-2.5 mb-4 text-xs text-accent-red font-body">{venteError}</div>}
                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="label">Pack *</label>
                    <select value={venteForm.service} onChange={e => setVenteForm(f => ({ ...f, service: e.target.value }))} className="input" style={{ background: 'var(--bg-elevated)' }}>
                      <option value="" style={{ background: '#0B1A1F' }}>Choisir un pack</option>
                      {PACKS.filter(p => !['M-LOCAL', 'M-SHOP LITE', 'M-CALLING'].includes(p.name)).map(p => (
                        <option key={p.name} value={p.name} style={{ background: '#0B1A1F' }}>{p.name} — {p.price}€ {commissions[p.name] ? `(+${commissions[p.name]}€ commission)` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div><label className="label">Email du prospect *</label><input type="email" value={venteForm.client_email} onChange={e => setVenteForm(f => ({ ...f, client_email: e.target.value }))} placeholder="prospect@email.com" className="input" /></div>
                  <div><label className="label">Nom du prospect *</label><input type="text" value={venteForm.client_name} onChange={e => setVenteForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Jean Dupont" className="input" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Téléphone</label><input type="tel" value={venteForm.client_phone} onChange={e => setVenteForm(f => ({ ...f, client_phone: e.target.value }))} placeholder="06 12 34 56 78" className="input" /></div>
                    <div><label className="label">Société</label><input type="text" value={venteForm.company_name} onChange={e => setVenteForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Ma Société" className="input" /></div>
                  </div>
                  <button disabled={venteLoading || !venteForm.service || !venteForm.client_email || !venteForm.client_name}
                    onClick={async () => {
                      setVenteLoading(true); setVenteError('')
                      try {
                        const token = localStorage.getItem('refer_token')
                        const res = await fetch('/api/sales/initiate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(venteForm) })
                        const data = await res.json()
                        if (res.ok) { setVenteResult(data) } else { setVenteError(data.error || 'Erreur') }
                      } catch { setVenteError('Erreur réseau') } finally { setVenteLoading(false) }
                    }}
                    className={`btn-primary py-2.5 justify-center text-sm mt-1 ${venteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {venteLoading ? 'Génération en cours...' : 'Générer le lien de paiement'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: VENTES ══════════════ */}
        {activeTab === 'ventes' && (
          <div className="flex flex-col gap-5">
            <div className="flex gap-3 flex-wrap">
              {stats && (
                <div className="bg-[#9B5BF5]/8 border border-[#9B5BF5]/20 rounded-xl px-5 py-3 flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[#9B5BF5]"><path d="M9 3a6 6 0 100 12 6 6 0 000-12z" stroke="currentColor" strokeWidth="1.5" /><circle cx="9" cy="9" r="2" fill="currentColor" /></svg>
                  <div><div className="font-mono text-base font-bold text-[#9B5BF5]">{stats.clicks.this_month}</div><div className="text-text-muted text-[11px] font-body">visites ce mois</div></div>
                </div>
              )}
              {salesThisMonth.length > 0 && (
                <a href={`/api/statement/${thisMonthKey}`} className="bg-accent-mint/8 border border-accent-mint/20 rounded-xl px-5 py-3 flex items-center gap-3 no-underline text-text-primary hover:border-accent-mint/40 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-mint"><rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 6h4M7 9h4M7 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  <div><div className="font-display text-sm font-semibold">Relevé PDF</div><div className="text-text-muted text-[11px] font-body">Télécharger ce mois</div></div>
                </a>
              )}
            </div>

            {/* Contract */}
            {contract && (
              <div className="card p-5 md:p-6">
                {contract.status === 'sent' && !signSuccess ? (
                  <>
                    <h3 className="font-display text-sm font-semibold mb-4">Contrat à signer</h3>
                    <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-primary py-2 px-4 text-xs mb-5 inline-flex">Voir le contrat PDF</a>
                    <div className="mb-4">
                      <span className="label">Signature manuscrite</span>
                      <canvas ref={canvasRef} width={400} height={140} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="bg-white rounded-lg cursor-crosshair block" />
                      <button onClick={clearSignature} className="btn-ghost py-1 px-3 text-xs mt-1.5">Effacer</button>
                    </div>
                    <div className="mb-4">
                      <span className="label">Code OTP (6 chiffres)</span>
                      <input type="number" value={otpCode} onChange={e => setOtpCode(e.target.value.slice(0, 6))} placeholder="123456" className="input w-[170px] text-center text-lg tracking-[6px] font-mono" />
                    </div>
                    <button onClick={signContract} disabled={signLoading} className={`btn-primary py-2.5 px-6 text-sm ${signLoading ? 'opacity-60' : ''}`}>
                      {signLoading ? 'Signature...' : 'Signer le contrat'}
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-mint/10 border border-accent-mint/20 rounded-full flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-mint"><path d="M4 9l3.5 3.5L14 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div><div className="font-display text-sm font-semibold text-accent-mint">Contrat signé</div><div className="text-text-muted text-xs font-body mt-0.5">Signé le {formatDate(contract.signed_at || new Date().toISOString())}</div></div>
                    <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-primary py-1.5 px-3 text-xs ml-auto">Télécharger</a>
                  </div>
                )}
              </div>
            )}

            {/* Sales table */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-bg-border">
                <h3 className="font-display text-sm font-semibold">Historique des ventes</h3>
              </div>
              {sales.length === 0 ? (
                <div className="py-16 text-center text-text-muted">
                  <div className="text-3xl mb-2">—</div>
                  <div className="text-sm font-body">Aucune vente enregistrée pour le moment.</div>
                  <div className="text-xs mt-1 font-body">Partagez votre lien pour commencer !</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead><tr className="bg-bg-elevated/50">{['Client', 'Service', 'Montant', 'Commission', 'Statut', 'Date'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                    <tbody>
                      {sales.map(sale => (
                        <tr key={sale.id} className="table-row-hover border-t border-bg-border/50">
                          <td className="px-3 md:px-5 py-3 text-sm font-body">{sale.client_name}</td>
                          <td className="px-3 md:px-5 py-3"><span className="badge-mint">{sale.service}</span></td>
                          <td className="px-3 md:px-5 py-3 text-sm font-mono font-medium">{Number(sale.amount).toLocaleString('fr-FR')} €</td>
                          <td className="px-3 md:px-5 py-3 text-sm font-mono font-bold text-accent-mint">{Number(sale.commission_amount) > 0 ? `+${sale.commission_amount}€` : '—'}</td>
                          <td className="px-3 md:px-5 py-3">{sale.commission_paid ? <span className="badge-mint">Versée</span> : <span className="badge-gold">En attente</span>}</td>
                          <td className="px-3 md:px-5 py-3 text-xs text-text-muted font-body">{formatDate(sale.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: ANALYTICS ══════════════ */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-5">
            {!stats ? (
              <div className="text-center py-16 text-text-muted text-sm font-body">Chargement des analytics...</div>
            ) : (
              <>
                <div className="flex gap-3 flex-wrap">
                  <StatCard value={`${stats.projection.monthly_estimate}€`} label="Projection mensuelle" color="rgb(54,216,176)" sub={stats.projection.trend === 'up' ? '↑ En hausse' : stats.projection.trend === 'down' ? '↓ En baisse' : '→ Stable'} />
                  <StatCard value={stats.clicks.total} label="Visites totales" color="#9B5BF5" />
                  <StatCard value={`${(stats.clicks.conversion_rate * 100).toFixed(1)}%`} label="Taux conversion" color="rgb(240,180,41)" />
                  <StatCard value={`${stats.cascade.total_cascade_earned.toFixed(0)}€`} label="Gains cascade" color="rgb(54,216,176)" />
                  <StatCard value={stats.cascade.filleuls_count} label="Filleuls actifs" color="#F54EA2" />
                </div>

                <div className="card p-5">
                  <h3 className="font-display text-sm font-semibold mb-5">Commissions par semaine</h3>
                  {stats.series_weekly.length === 0 ? (
                    <div className="text-center py-10 text-text-muted text-xs font-body">Pas encore de données</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={stats.series_weekly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs><linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#36D8B0" stopOpacity={0.3} /><stop offset="95%" stopColor="#36D8B0" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0B1A1F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#EDF0F3' }} />
                        <Area type="monotone" dataKey="commission" stroke="#36D8B0" strokeWidth={2} fill="url(#commGrad)" name="Commission €" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {stats.by_service.length > 0 && (
                  <div className="card p-5">
                    <h3 className="font-display text-sm font-semibold mb-5">Répartition par service</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.by_service} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="service" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0B1A1F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#EDF0F3' }} />
                        <Bar dataKey="commission" name="Commission €" radius={[4, 4, 0, 0]}>{stats.by_service.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {stats.cascade.filleuls_count > 0 && (
                  <div className="card p-5">
                    <h3 className="font-display text-sm font-semibold mb-4">Cascade (niveau 1)</h3>
                    <div className="flex gap-3 flex-wrap">
                      <StatCard value={stats.cascade.filleuls_count} label="Filleuls recrutés" color="rgb(54,216,176)" />
                      <StatCard value={`${stats.cascade.total_cascade_earned.toFixed(2)}€`} label="Cascade gagnée" color="rgb(240,180,41)" />
                      <StatCard value={`${stats.cascade.pending_cascade.toFixed(2)}€`} label="Cascade en attente" color="rgb(240,180,41)" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════ TAB: OBJECTIFS ══════════════ */}
        {activeTab === 'objectifs' && (
          <div className="flex flex-col gap-5">
            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold mb-4">Badges obtenus ({badges.earned.length})</h3>
              {badges.earned.length === 0 ? (
                <p className="text-text-muted text-xs font-body">Aucun badge encore. Faites votre première vente pour débloquer le premier !</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {badges.earned.map(b => (
                    <div key={b.id} className="bg-accent-mint/8 border border-accent-mint/20 rounded-xl px-4 py-3 text-center min-w-[90px]">
                      <div className="text-2xl mb-1">{b.icon}</div>
                      <div className="font-display text-xs font-semibold">{b.name}</div>
                      <div className="text-text-muted text-[10px] mt-0.5 font-body">{formatDate(b.earned_at!)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold mb-4">Badges à débloquer ({badges.available.length})</h3>
              <div className="flex flex-col gap-2.5">
                {badges.available.map(b => {
                  const pct = b.progress ? Math.round((b.progress.current / b.progress.target) * 100) : 0
                  return (
                    <div key={b.id} className="bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="text-2xl grayscale opacity-40">{b.icon}</div>
                      <div className="flex-1">
                        <div className="font-display text-xs font-semibold">{b.name}</div>
                        <div className="text-text-muted text-[11px] mb-2 font-body">{b.description}</div>
                        {b.progress && (
                          <>
                            <div className="h-1 bg-bg-base rounded-full overflow-hidden"><div className="h-full bg-accent-mint rounded-full transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                            <div className="text-text-muted text-[10px] mt-1 font-body">{b.progress.current} / {b.progress.target}</div>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-text-muted font-bold font-mono">{pct}%</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold mb-4">Challenges du mois</h3>
              {challenges.length === 0 ? (
                <p className="text-text-muted text-xs font-body">Aucun challenge actif ce mois-ci.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {challenges.map(c => (
                    <div key={c.id} className={`rounded-xl px-5 py-4 border ${c.completed ? 'bg-accent-mint/5 border-accent-mint/20' : 'bg-bg-elevated border-bg-border'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-display text-sm font-semibold mb-1">{c.title}</div>
                          {c.description && <div className="text-text-secondary text-xs mb-2 font-body">{c.description}</div>}
                          <div className="text-text-muted text-xs font-body">
                            Condition : {c.condition_type === 'sales_count' ? `${c.condition_value.count} ventes ce mois` : c.condition_type === 'service_sold' ? `Vendre ${c.condition_value.service}` : `${c.condition_value.amount}€ de commissions`}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-mono text-lg font-bold text-accent-gold">+{c.bonus_amount}€</div>
                          {c.completed ? (
                            <div className="text-[11px] text-accent-mint mt-1 font-body">Complété{c.bonus_paid ? ' · Payé' : ''}</div>
                          ) : (
                            <div className="text-[11px] text-text-muted mt-1 font-body">En cours...</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: CATALOGUE ══════════════ */}
        {activeTab === 'catalogue' && (
          <div>
            <h2 className="font-display text-lg font-semibold mb-1" style={{ letterSpacing: '-0.01em' }}>Catalogue des produits</h2>
            <p className="text-text-muted text-xs mb-5 font-body max-w-lg">7 solutions que vous pouvez proposer. Pour chaque vente, vous touchez une commission.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-7">
              {PACKS.map(pack => {
                const comm = commissions[pack.name] ?? 0
                return (
                  <div key={pack.name} className="card overflow-hidden hover:-translate-y-0.5 transition-transform">
                    <div className="h-[3px]" style={{ background: pack.color }} />
                    <div className="p-4 md:p-5">
                      <div className="flex justify-between items-start mb-2.5">
                        <div>
                          <div className="font-display text-sm font-bold" style={{ color: pack.color }}>{pack.name}</div>
                          <div className="text-text-muted text-[11px] mt-0.5 font-body">{pack.tagline}</div>
                        </div>
                        <div className="font-mono text-lg font-bold text-text-primary">{pack.price}€</div>
                      </div>
                      {comm > 0 && (
                        <div className="bg-accent-mint/10 border border-accent-mint/20 rounded-lg px-3 py-1.5 mb-3 flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-accent-mint">+{comm}€</span>
                          <span className="text-text-muted text-[11px] font-body">commission</span>
                        </div>
                      )}
                      <p className="text-text-secondary text-xs leading-relaxed mb-3 font-body">{pack.description}</p>
                      <div className="mb-3">
                        {pack.features.map(f => (
                          <div key={f} className="flex gap-1.5 mb-1">
                            <span style={{ color: pack.color }} className="flex-shrink-0 text-xs">—</span>
                            <span className="text-text-secondary text-[11px] font-body">{f}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mb-3">
                        <div className="text-text-muted text-[10px] font-display font-semibold mb-1.5">Arguments</div>
                        {pack.pitchArgs.map(a => (
                          <div key={a} className="rounded px-2 py-1 mb-1 text-[11px] text-text-secondary italic font-body" style={{ background: `${pack.color}10`, border: `1px solid ${pack.color}20` }}>{a}</div>
                        ))}
                      </div>
                      <button onClick={() => copy(`https://refer.marpeap.com/r/${user?.code}`, 'pack-' + pack.name)}
                        className="w-full py-2 rounded-lg text-xs font-bold cursor-pointer font-body transition-colors" style={{ background: `${pack.color}18`, border: `1px solid ${pack.color}35`, color: pack.color }}>
                        Partager mon lien
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Share kit */}
            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold mb-1">Kit de partage</h3>
              <p className="text-text-muted text-xs mb-5 font-body">Messages prêts à l'emploi avec votre lien intégré.</p>
              <div className="flex flex-col gap-3">
                {[
                  { channel: 'WhatsApp', text: `Salut ! Je travaille avec Marpeap, une agence IA top. Si tu veux un site, de la pub ou des agents IA pour ton business, c'est là : https://refer.marpeap.com/r/${user?.code} — code promo : ${user?.code}` },
                  { channel: 'LinkedIn', text: `Je collabore avec Marpeap, une agence digitale spécialisée en IA. Solutions : site web, SEO, agents IA, standardiste IA... Si vous cherchez à digitaliser votre activité, voici leur lien : https://refer.marpeap.com/r/${user?.code}` },
                  { channel: 'Email', text: `Bonjour,\n\nJe me permets de vous contacter car je travaille en partenariat avec Marpeap, une agence digitale innovante.\n\nIls proposent des solutions IA pour PME : sites web, agents IA, gestion de campagnes...\n\nDécouvrez leurs offres : https://refer.marpeap.com/r/${user?.code}\n\nCordialement` },
                ].map(({ channel, text }) => (
                  <div key={channel} className="bg-bg-elevated border border-bg-border rounded-xl px-4 py-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-display text-xs font-semibold">{channel}</span>
                      <button onClick={() => copy(text, 'msg-' + channel)}
                        className={`px-3 py-1 rounded-md text-[11px] font-medium cursor-pointer border font-body transition-colors ${copied === 'msg-' + channel ? 'bg-accent-mint/15 border-accent-mint/30 text-accent-mint' : 'bg-accent-mint/10 border-accent-mint/20 text-accent-mint'}`}>
                        {copied === 'msg-' + channel ? 'Copié' : 'Copier'}
                      </button>
                    </div>
                    <div className="text-[11px] text-text-muted leading-relaxed italic whitespace-pre-line font-body">{text.slice(0, 120)}...</div>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <span className="text-text-muted text-[11px] font-body block mb-1.5">Mon lien de parrainage</span>
                <div className="font-mono text-sm text-accent-mint bg-accent-mint/8 border border-accent-mint/20 rounded-lg px-3 py-2 inline-block">
                  https://refer.marpeap.com/r/{user?.code}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: RESSOURCES ══════════════ */}
        {activeTab === 'ressources' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-display text-lg font-semibold mb-1" style={{ letterSpacing: '-0.01em' }}>Ressources & présentations</h2>
              <p className="text-text-muted text-xs font-body">Fiches produits pour comprendre l'offre et convaincre vos prospects.</p>
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold mb-3">Fiches produits M-PACKS</h3>
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {([{ name: 'M-ONE', color: '#4F8AFF' }, { name: 'M-CAMPAIGN', color: '#2ED573' }, { name: 'M-NEURAL', color: '#9B5BF5' }, { name: 'M-CORP', color: '#F1C40F' }] as const).map(p => (
                  <button key={p.name} onClick={() => setActiveFiche(p.name)}
                    className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer font-body transition-all"
                    style={{
                      border: activeFiche === p.name ? `1.5px solid ${p.color}` : '1.5px solid var(--bg-border)',
                      background: activeFiche === p.name ? `${p.color}18` : 'var(--bg-surface)',
                      color: activeFiche === p.name ? p.color : 'var(--text-muted)',
                    }}>
                    {p.name}
                  </button>
                ))}
              </div>
              {[
                { id: 'M-ONE', color: '#4F8AFF', title: 'M-ONE — Site web one-page premium', sub: 'Design premium, optimisé SEO, livré en 72h — 290 €', file: '/presentations/M-ONE_72H_Digital_Excellence.pdf' },
                { id: 'M-CAMPAIGN', color: '#2ED573', title: 'M-CAMPAIGN — Agent Google Ads autonome', sub: 'Gestion IA de vos campagnes publicitaires 24/7 — sur abonnement', file: '/presentations/M-CAMPAIGN_Autonomous_Google_Ads.pdf' },
                { id: 'M-NEURAL', color: '#9B5BF5', title: 'M-NEURAL — Chatbot IA expert 24/7', sub: 'Instance IA entraînée sur vos données, intégrée à votre site — 180 €', file: '/presentations/M-NEURAL_24_7_AI_Expert.pdf' },
                { id: 'M-CORP', color: '#F1C40F', title: 'M-CORP — Équipe IA autonome (5 agents)', sub: 'Stratège, Prospecteur, Commercial, Créatif, Analyste — 820 €', file: '/presentations/M-CORP_Autonomous_Team.pdf' },
              ].filter(f => f.id === activeFiche).map(fiche => (
                <div key={fiche.id} className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-bg-border">
                    <div className="font-display text-sm font-semibold"><span style={{ color: fiche.color }}>{fiche.id}</span> — {fiche.title.split(' — ')[1]}</div>
                    <div className="text-text-muted text-xs mt-1 font-body">{fiche.sub}</div>
                  </div>
                  <div className="p-5">
                    <iframe src={fiche.file} title={`Fiche ${fiche.id}`} className="w-full h-[520px] border-none rounded-xl bg-bg-base" />
                    <a href={fiche.file} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 px-4 py-2 rounded-lg text-xs font-semibold no-underline transition-colors" style={{ background: `${fiche.color}12`, border: `1px solid ${fiche.color}25`, color: fiche.color }}>
                      Ouvrir PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: CLASSEMENT ══════════════ */}
        {activeTab === 'classement' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-display text-lg font-semibold mb-1" style={{ letterSpacing: '-0.01em' }}>Classement des apporteurs</h2>
              <p className="text-text-muted text-xs font-body">Top 10 par commissions générées.</p>
            </div>
            {leaderboardLoading ? (
              <div className="text-center py-12 text-text-muted text-sm font-body">Chargement...</div>
            ) : (
              <>
                <div className="card overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead><tr className="bg-bg-elevated/50">{['#', 'Apporteur', 'Niveau', 'Ventes', 'Commissions'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                    <tbody>
                      {leaderboard.map(entry => {
                        const tierColors: Record<string, string> = { bronze: '#cd7f32', silver: '#a8a9ad', gold: '#f1c40f' }
                        const medal = entry.rank === 1 ? '1' : entry.rank === 2 ? '2' : entry.rank === 3 ? '3' : `${entry.rank}`
                        const tierColor = tierColors[entry.tier] || '#cd7f32'
                        return (
                          <tr key={entry.rank} className={`table-row-hover border-t border-bg-border/50 ${entry.is_me ? 'bg-accent-mint/5' : ''}`}>
                            <td className="px-3 md:px-5 py-3 font-mono text-sm font-bold">{medal}</td>
                            <td className="px-3 md:px-5 py-3 text-sm font-body">
                              {entry.name}
                              {entry.is_me && <span className="ml-2 badge-mint text-[10px]">Vous</span>}
                            </td>
                            <td className="px-3 md:px-5 py-3">
                              <span className="badge text-[11px] font-bold" style={{ background: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}44` }}>
                                {entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 md:px-5 py-3 text-sm font-body">{entry.sales_count}</td>
                            <td className="px-3 md:px-5 py-3 text-sm font-mono font-bold text-accent-mint">{entry.total_commission.toLocaleString('fr-FR')} €</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {myRank && !leaderboard.some(e => e.is_me) && (
                  <div className="bg-accent-mint/5 border border-accent-mint/20 rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="font-body text-sm"><span className="text-text-muted mr-2">Votre position :</span><span className="font-mono font-bold text-accent-mint">#{myRank.rank}</span></div>
                    <div className="text-text-secondary text-xs font-body">{myRank.sales_count} vente{myRank.sales_count > 1 ? 's' : ''} · {myRank.total_commission.toLocaleString('fr-FR')} €</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function StatCard({ value, label, color, sub }: { value: string | number; label: string; color?: string; sub?: string }) {
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl px-4 py-3 min-w-[110px]">
      <div className="font-mono text-xl font-bold tracking-tight" style={{ color: color || '#EDF0F3' }}>{value}</div>
      <div className="text-text-muted text-[11px] mt-0.5 font-body">{label}</div>
      {sub && <div className="text-text-muted/60 text-[10px] mt-0.5 font-body">{sub}</div>}
    </div>
  )
}
