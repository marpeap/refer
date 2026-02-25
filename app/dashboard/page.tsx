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
  { name: 'M-LOCAL', price: 190, color: '#2ED573', tagline: 'Visibilité Google Maps', description: 'Optimisation complète de votre fiche Google Business.', target: 'Restaurants, coiffeurs, plombiers, médecins', features: ['Optimisation fiche Google Business', 'Photos & contenus SEO', 'Stratégie mots-clés locaux', 'Résultats en 30 jours'], pitchArgs: ['80% des recherches locales aboutissent à une visite', 'Le pack le moins cher, souvent le plus impactant', '"Trouvez un plombier près de moi" — soyez le 1er'] },
  { name: 'M-CALLING', price: 490, color: '#F54EA2', tagline: 'Standardiste IA 24h/24', description: 'Un agent vocal IA répond à tous les appels 24h/24, 7j/7.', target: 'Cabinets médicaux, restaurants, hôtels, agences', features: ['Réponse instantanée 24h/24', 'Prise de rendez-vous auto', 'Disponible en plusieurs langues', 'Zéro coût de recrutement'], pitchArgs: ['Plus jamais d\'appel manqué', 'Remplace un standardiste pour 30€/mois', 'Vos concurrents paient encore un humain'] },
  { name: 'M-CAMPAIGN', price: 280, color: '#00C9A7', tagline: 'Gestionnaire Google Ads IA', description: 'Un agent IA gère vos campagnes Google Ads en continu.', target: 'E-commerce, agences, cliniques, formations', features: ['Création & optimisation campagnes', 'Suivi temps réel', 'Rapports mensuels clairs', 'Consultation de démarrage'], pitchArgs: ['Dépensez moins en pub, gagnez plus', 'Votre budget travaille 24h/24', 'Résultats mesurables dès le 1er mois'] },
  { name: 'M-NEURAL', price: 180, color: '#9B5BF5', tagline: 'ChatBot IA sur vos données', description: 'Un chatbot intelligent formé sur vos propres données.', target: 'E-commerce, SaaS, formateurs en ligne', features: ['IA formée sur votre contenu', 'Intégration site en 48h', 'Répond 24h/24', 'Réduit tickets support de 70%'], pitchArgs: ['Finies les réponses aux mêmes questions', 'Plus abordable qu\'un CDI support', 'Vos clients adorent les réponses en 3 secondes'] },
  { name: 'M-CORP', price: 820, color: '#F1C40F', tagline: 'Équipe de 5 Agents IA autonomes', description: '5 agents IA spécialisés automatisent vos processus métiers.', target: 'PME à partir de 5 employés, entreprises en croissance', features: ['5 agents IA personnalisés', 'Automatisation tâches répétitives', 'Intégrations CRM, Slack, Drive', 'Formation équipe + support'], pitchArgs: ['Votre propre équipe IA pour le prix d\'un freelance', 'ROI moyen : 40h économisées/mois', 'Le pack "transformer sa boîte"'] },
]

const PIE_COLORS = ['#5B6EF5', '#2ED573', '#F1C40F', '#F54EA2', '#00C9A7', '#9B5BF5', '#F5A623']

/* ── QR Code SVG (simple, sans lib) ───────────────────── */
function generateQRDataUrl(text: string): string {
  // Simple display for the link - just returns a placeholder SVG
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#0D0D1A"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#5B6EF5" font-size="10" font-family="monospace">QR: ${text.slice(0, 12)}...</text></svg>`
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
  const [activeTab, setActiveTab] = useState<'accueil'|'ventes'|'analytics'|'objectifs'|'catalogue'|'ressources'|'classement'>('accueil')
  const [leaderboard, setLeaderboard] = useState<{rank:number;name:string;tier:string;sales_count:number;total_commission:number;is_me:boolean}[]>([])
  const [myRank, setMyRank] = useState<{rank:number;total_commission:number;sales_count:number}|null>(null)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])
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

        // Fetch next payment estimate from admin endpoint (best effort)
        const now = new Date()
        const nextM = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        setNextPayment(nextM.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }))

        // Check SW / push status
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          navigator.serviceWorker.register('/sw.js').catch(() => {})
          navigator.serviceWorker.ready.then(async (reg) => {
            const sub = await reg.pushManager.getSubscription()
            setPushEnabled(!!sub)
          }).catch(() => {})
        }
      } catch {
        localStorage.removeItem('refer_token'); router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [router])

  const handleLogout = () => { localStorage.removeItem('refer_token'); router.push('/login') }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

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
  const annTypeColor: Record<string, string> = { info: '#5B6EF5', success: '#2ED573', warning: '#F5A623', promo: '#9B5BF5' }
  const TAB_STYLE = (active: boolean): React.CSSProperties => ({ padding: '9px 18px', background: active ? '#5B6EF5' : 'rgba(255,255,255,0.04)', border: active ? 'none' : '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: active ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' as const, transition: 'all 0.2s' })
  const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (<div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, ...style }}>{children}</div>)
  const StatCard = ({ value, label, color, sub }: { value: string | number; label: string; color?: string; sub?: string }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', minWidth: 120 }}>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: color || '#fff' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  if (loading) return (<main style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Chargement...</div></main>)
  if (!user) return null

  return (
    <main style={{ minHeight: '100vh', background: '#080810', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .pack-card:hover { transform: translateY(-2px); }
        .recharts-tooltip-wrapper .recharts-default-tooltip { background: #1A1A2E !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; }
      `}</style>

      {/* ── Header ── */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>mar<span style={{ color: '#5B6EF5' }}>peap</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", fontWeight: 400, marginLeft: 8 }}>Apporteurs</span></span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {badges.earned.length > 0 && <span title={`${badges.earned.length} badge(s)`} style={{ fontSize: 16 }}>{badges.earned[0].icon}</span>}
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{user.full_name}</span>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Déconnexion</button>
        </div>
      </header>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 20px' }}>

        {/* ── Announcements banner ── */}
        {visibleAnnouncements.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {visibleAnnouncements.map(ann => (
              <div key={ann.id} style={{ background: `${annTypeColor[ann.type] || '#5B6EF5'}12`, border: `1px solid ${annTypeColor[ann.type] || '#5B6EF5'}30`, borderRadius: 10, padding: '10px 16px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{ann.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{ann.content}</div>
                </div>
                <button onClick={() => setDismissedAnnouncements(p => [...p, ann.id])} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18, flexShrink: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* ── Contract pending banner ── */}
        {contract?.status === 'sent' && !signSuccess && (
          <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 12, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 14, color: '#F5A623', fontWeight: 500 }}>📄 Vous avez un contrat en attente de signature</span>
            <button onClick={() => setActiveTab('ventes')} style={{ padding: '6px 14px', background: '#F5A623', border: 'none', borderRadius: 6, color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Signer maintenant</button>
          </div>
        )}

        {/* ── Welcome card ── */}
        <div style={{ background: 'linear-gradient(135deg, rgba(91,110,245,0.12), rgba(155,91,245,0.08))', border: '1px solid rgba(91,110,245,0.2)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Bonjour, {user.full_name.split(' ')[0]} 👋</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>Espace apporteur d'affaires Marpeap</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <StatCard value={user.code} label="Mon code" color="#5B6EF5" />
              <StatCard value={sales.length} label="Ventes totales" color="#2ED573" />
              <StatCard value={`${totalCommission.toLocaleString('fr-FR')}€`} label="Commissions" color="#F1C40F" />
              {pendingCommission > 0 && <StatCard value={`${pendingCommission.toLocaleString('fr-FR')}€`} label="En attente" color="#F5A623" />}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>MON LIEN DE PARRAINAGE</div>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '7px 10px', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>refer.marpeap.digital/r/{user.code}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => copy(user.code, 'code')} style={{ flex: 1, padding: '7px', background: copied === 'code' ? 'rgba(46,213,115,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: copied === 'code' ? '#2ED573' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{copied === 'code' ? '✓ Copié' : 'Copier code'}</button>
              <button onClick={() => copy(`https://refer.marpeap.digital/r/${user.code}`, 'link')} style={{ flex: 1, padding: '7px', background: copied === 'link' ? 'rgba(46,213,115,0.15)' : '#5B6EF5', border: 'none', borderRadius: 6, color: copied === 'link' ? '#2ED573' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{copied === 'link' ? '✓ Copié' : 'Copier lien'}</button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', paddingBottom: 2 }}>
          {([['accueil', '🏠 Accueil'], ['ventes', '💰 Ventes'], ['analytics', '📈 Analytics'], ['objectifs', '🎯 Objectifs'], ['catalogue', '📦 Catalogue'], ['ressources', '📁 Ressources'], ['classement', '🏆 Classement']] as [string, string][]).map(([tab, label]) => (
            <button key={tab} style={TAB_STYLE(activeTab === tab)} onClick={() => { setActiveTab(tab as any); if (tab === 'classement') loadLeaderboard() }}>{label}</button>
          ))}
        </div>

        {/* ══════════════ TAB: ACCUEIL ══════════════ */}
        {activeTab === 'accueil' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Stats résumé */}
            <Card style={{ padding: 20, gridColumn: 'span 2' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Ce mois-ci</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <StatCard value={salesThisMonth.length} label="Ventes ce mois" color="#2ED573" />
                <StatCard value={`${salesThisMonth.reduce((a, s) => a + Number(s.commission_amount), 0).toFixed(0)}€`} label="Commissions mois" color="#5B6EF5" />
                {stats && <StatCard value={stats.clicks.this_month} label="Visites lien" color="#9B5BF5" />}
                {stats && <StatCard value={`${(stats.clicks.conversion_rate * 100).toFixed(0)}%`} label="Taux conversion" color="#F5A623" />}
              </div>
            </Card>

            {/* Prochain versement */}
            {nextPayment && (
              <Card style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>💳 Prochain versement estimé</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#2ED573', marginBottom: 4 }}>{pendingCommission.toFixed(2)} €</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Estimé le {nextPayment}</div>
              </Card>
            )}

            {/* Badges récents */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🏆 Mes badges</div>
              {badges.earned.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Pas encore de badge. Faites votre première vente !</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {badges.earned.slice(0, 4).map(b => (
                    <div key={b.id} title={b.description} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 24 }}>{b.icon}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{b.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Challenge du mois */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🎯 Challenge du mois</div>
              {challenges.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Aucun challenge actif ce mois-ci.</div>
              ) : (
                challenges.slice(0, 2).map(c => (
                  <div key={c.id} style={{ background: c.completed ? 'rgba(46,213,115,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${c.completed ? 'rgba(46,213,115,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: c.completed ? '#2ED573' : '#F1C40F', marginTop: 4, fontWeight: 700 }}>{c.completed ? '✅ Complété !' : `Bonus : +${c.bonus_amount}€`}</div>
                  </div>
                ))
              )}
            </Card>

            {/* Notifications PWA */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🔔 Notifications push</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
                {pushEnabled ? 'Vous recevez les notifications pour vos badges et ventes.' : 'Activez les notifications pour ne rien manquer.'}
              </div>
              <button onClick={pushEnabled ? disablePush : enablePush} disabled={pushLoading} style={{ padding: '9px 18px', background: pushEnabled ? 'rgba(255,255,255,0.06)' : '#5B6EF5', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                {pushLoading ? '...' : pushEnabled ? '🔕 Désactiver' : '🔔 Activer'}
              </button>
            </Card>
          </div>
        )}

        {/* ══════════════ TAB: VENTES ══════════════ */}
        {activeTab === 'ventes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* PDF + Clics */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {stats && (
                <div style={{ background: 'rgba(155,91,245,0.06)', border: '1px solid rgba(155,91,245,0.2)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>👁️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#9B5BF5' }}>{stats.clicks.this_month}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>visites lien ce mois</div>
                  </div>
                </div>
              )}
              {sales.filter(s => s.created_at.startsWith(thisMonthKey)).length > 0 && (
                <a href={`/api/statement/${thisMonthKey}`} style={{ background: 'rgba(91,110,245,0.08)', border: '1px solid rgba(91,110,245,0.2)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff', cursor: 'pointer' }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Relevé PDF</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Télécharger ce mois</div>
                  </div>
                </a>
              )}
            </div>

            {/* Contrat */}
            {contract && (
              <Card style={{ padding: '24px 28px' }}>
                {contract.status === 'sent' && !signSuccess ? (
                  <>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 18 }}>📄 Contrat à signer</div>
                    <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '9px 18px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 8, marginBottom: 20, fontWeight: 600, fontSize: 13 }}>Voir le contrat PDF →</a>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Signature manuscrite</div>
                      <canvas ref={canvasRef} width={400} height={140} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ background: '#fff', borderRadius: 8, cursor: 'crosshair', display: 'block' }} />
                      <button onClick={clearSignature} style={{ marginTop: 6, padding: '5px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}>Effacer</button>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Code OTP (6 chiffres)</div>
                      <input type="number" value={otpCode} onChange={e => setOtpCode(e.target.value.slice(0, 6))} placeholder="123456" style={{ width: 170, padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 18, letterSpacing: 6, textAlign: 'center', fontFamily: 'monospace' }} />
                    </div>
                    <button onClick={signContract} disabled={signLoading} style={{ padding: '11px 24px', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', cursor: signLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, opacity: signLoading ? 0.7 : 1 }}>{signLoading ? 'Signature...' : 'Signer le contrat'}</button>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>✅</span>
                    <div><div style={{ fontWeight: 700, color: '#10b981' }}>Contrat signé</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Signé le {formatDate(contract.signed_at || new Date().toISOString())}</div></div>
                    <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', padding: '7px 14px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>Télécharger</a>
                  </div>
                )}
              </Card>
            )}

            {/* Sales table */}
            <Card style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>Historique des ventes</div>
              </div>
              {sales.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                  <div>Aucune vente enregistrée pour le moment.</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Partagez votre lien pour commencer !</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        {['Client', 'Service', 'Montant', 'Commission', 'Statut', 'Date'].map(h => (
                          <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map(sale => (
                        <tr key={sale.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '13px 18px', fontSize: 14 }}>{sale.client_name}</td>
                          <td style={{ padding: '13px 18px' }}><span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: 'rgba(91,110,245,0.15)', color: '#5B6EF5' }}>{sale.service}</span></td>
                          <td style={{ padding: '13px 18px', fontSize: 14, fontWeight: 600 }}>{Number(sale.amount).toLocaleString('fr-FR')} €</td>
                          <td style={{ padding: '13px 18px', fontSize: 14, fontWeight: 700, color: '#2ED573' }}>{Number(sale.commission_amount) > 0 ? `+${sale.commission_amount}€` : '—'}</td>
                          <td style={{ padding: '13px 18px' }}>{sale.commission_paid ? <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: 'rgba(46,213,115,0.15)', color: '#2ED573' }}>Versée ✓</span> : <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: 'rgba(255,165,0,0.15)', color: '#FFA500' }}>En attente</span>}</td>
                          <td style={{ padding: '13px 18px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{formatDate(sale.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ══════════════ TAB: ANALYTICS ══════════════ */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!stats ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>Chargement des analytics...</div>
            ) : (
              <>
                {/* KPI cards */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <StatCard value={`${stats.projection.monthly_estimate}€`} label="Projection mensuelle" color="#5B6EF5" sub={stats.projection.trend === 'up' ? '↑ En hausse' : stats.projection.trend === 'down' ? '↓ En baisse' : '→ Stable'} />
                  <StatCard value={stats.clicks.total} label="Visites totales" color="#9B5BF5" />
                  <StatCard value={`${(stats.clicks.conversion_rate * 100).toFixed(1)}%`} label="Taux conversion" color="#F1C40F" />
                  <StatCard value={`${stats.cascade.total_cascade_earned.toFixed(0)}€`} label="Gains cascade" color="#2ED573" />
                  <StatCard value={stats.cascade.filleuls_count} label="Filleuls actifs" color="#F54EA2" />
                </div>

                {/* Area chart commissions */}
                <Card style={{ padding: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>📈 Commissions par semaine</div>
                  {stats.series_weekly.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Pas encore de données</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={stats.series_weekly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5B6EF5" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#5B6EF5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                        <Area type="monotone" dataKey="commission" stroke="#5B6EF5" strokeWidth={2} fill="url(#commGrad)" name="Commission €" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                {/* Bar chart by service */}
                {stats.by_service.length > 0 && (
                  <Card style={{ padding: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>📊 Répartition par service</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.by_service} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="service" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                        <Bar dataKey="commission" name="Commission €" radius={[4, 4, 0, 0]}>
                          {stats.by_service.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* Cascade */}
                {stats.cascade.filleuls_count > 0 && (
                  <Card style={{ padding: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🤝 Cascade (niveau 1)</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <StatCard value={stats.cascade.filleuls_count} label="Filleuls recrutés" color="#2ED573" />
                      <StatCard value={`${stats.cascade.total_cascade_earned.toFixed(2)}€`} label="Cascade gagnée" color="#F1C40F" />
                      <StatCard value={`${stats.cascade.pending_cascade.toFixed(2)}€`} label="Cascade en attente" color="#F5A623" />
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════ TAB: OBJECTIFS ══════════════ */}
        {activeTab === 'objectifs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Badges earned */}
            <Card style={{ padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🏆 Badges obtenus ({badges.earned.length})</div>
              {badges.earned.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Aucun badge encore. Faites votre première vente pour débloquer "Premier client" !</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {badges.earned.map(b => (
                    <div key={b.id} style={{ background: 'rgba(91,110,245,0.08)', border: '1px solid rgba(91,110,245,0.2)', borderRadius: 12, padding: '14px 18px', textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontSize: 32, marginBottom: 6 }}>{b.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{formatDate(b.earned_at!)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Badges available */}
            <Card style={{ padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🎯 Badges à débloquer ({badges.available.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {badges.available.map(b => {
                  const pct = b.progress ? Math.round((b.progress.current / b.progress.target) * 100) : 0
                  return (
                    <div key={b.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontSize: 28, filter: 'grayscale(1)', opacity: 0.4 }}>{b.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{b.description}</div>
                        {b.progress && (
                          <>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: '#5B6EF5', width: `${pct}%`, transition: 'width 0.4s' }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{b.progress.current} / {b.progress.target}</div>
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>{pct}%</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Challenges */}
            <Card style={{ padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>⚡ Challenges du mois</div>
              {challenges.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Aucun challenge actif ce mois-ci.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {challenges.map(c => (
                    <div key={c.id} style={{ background: c.completed ? 'rgba(46,213,115,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${c.completed ? 'rgba(46,213,115,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.title}</div>
                          {c.description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{c.description}</div>}
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                            Condition : {c.condition_type === 'sales_count' ? `${c.condition_value.count} ventes ce mois` : c.condition_type === 'service_sold' ? `Vendre ${c.condition_value.service}` : `${c.condition_value.amount}€ de commissions`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#F1C40F' }}>+{c.bonus_amount}€</div>
                          {c.completed ? (
                            <div style={{ fontSize: 12, color: '#2ED573', marginTop: 4 }}>✅ Complété{c.bonus_paid ? ' · Payé' : ''}</div>
                          ) : (
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>En cours...</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ══════════════ TAB: CATALOGUE ══════════════ */}
        {activeTab === 'catalogue' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Catalogue des produits</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', maxWidth: 600 }}>7 solutions que vous pouvez proposer. Pour chaque vente, vous touchez une commission.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16, marginBottom: 28 }}>
              {PACKS.map(pack => {
                const comm = commissions[pack.name] ?? 0
                return (
                  <div key={pack.name} className="pack-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', transition: 'transform 0.15s' }}>
                    <div style={{ height: 3, background: pack.color }} />
                    <div style={{ padding: '18px 20px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: pack.color }}>{pack.name}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{pack.tagline}</div></div>
                        <div style={{ textAlign: 'right' }}><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>{pack.price}€</div></div>
                      </div>
                      {comm > 0 && <div style={{ background: 'rgba(46,213,115,0.1)', border: '1px solid rgba(46,213,115,0.2)', borderRadius: 7, padding: '7px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><span>💰</span><span style={{ fontSize: 16, fontWeight: 800, color: '#2ED573' }}>+{comm}€</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>commission</span></div>}
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>{pack.description}</p>
                      <div style={{ marginBottom: 12 }}>
                        {pack.features.map(f => <div key={f} style={{ display: 'flex', gap: 6, marginBottom: 4 }}><span style={{ color: pack.color, flexShrink: 0 }}>✓</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{f}</span></div>)}
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Arguments</div>
                        {pack.pitchArgs.map(a => <div key={a} style={{ background: `${pack.color}10`, border: `1px solid ${pack.color}20`, borderRadius: 5, padding: '5px 9px', marginBottom: 4, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>{a}</div>)}
                      </div>
                      <button onClick={() => copy(`https://refer.marpeap.digital/r/${user?.code}`, 'pack-' + pack.name)} style={{ width: '100%', padding: '9px', background: `${pack.color}18`, border: `1px solid ${pack.color}35`, borderRadius: 7, color: pack.color, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Partager mon lien →</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Kit de partage ── */}
            <Card style={{ padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📤 Kit de partage</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Messages prêts à l'emploi avec votre lien intégré. Cliquez pour copier.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { channel: '💬 WhatsApp', text: `Salut ! Je travaille avec Marpeap, une agence IA top. Si tu veux un site, de la pub ou des agents IA pour ton business, c'est là : https://refer.marpeap.digital/r/${user?.code} — code promo : ${user?.code}` },
                  { channel: '💼 LinkedIn', text: `🚀 Je collabore avec Marpeap, une agence digitale spécialisée en IA. Solutions : site web, SEO, agents IA, standardiste IA... Si vous cherchez à digitaliser votre activité, voici leur lien : https://refer.marpeap.digital/r/${user?.code}` },
                  { channel: '📧 Email', text: `Bonjour,\n\nJe me permets de vous contacter car je travaille en partenariat avec Marpeap, une agence digitale innovante.\n\nIls proposent des solutions IA pour PME : sites web, agents IA, gestion de campagnes...\n\nDécouvrez leurs offres : https://refer.marpeap.digital/r/${user?.code}\n\nCordialement` },
                ].map(({ channel, text }) => (
                  <div key={channel} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{channel}</div>
                      <button onClick={() => copy(text, 'msg-' + channel)} style={{ padding: '5px 12px', background: copied === 'msg-' + channel ? 'rgba(46,213,115,0.15)' : 'rgba(91,110,245,0.15)', border: `1px solid ${copied === 'msg-' + channel ? 'rgba(46,213,115,0.3)' : 'rgba(91,110,245,0.3)'}`, borderRadius: 6, color: copied === 'msg-' + channel ? '#2ED573' : '#5B6EF5', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                        {copied === 'msg-' + channel ? '✓ Copié' : '📋 Copier'}
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{text.slice(0, 120)}...</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Mon lien de parrainage</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#5B6EF5', background: 'rgba(91,110,245,0.08)', border: '1px solid rgba(91,110,245,0.2)', borderRadius: 8, padding: '8px 14px' }}>https://refer.marpeap.digital/r/{user?.code}</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════ TAB: RESSOURCES ══════════════ */}
        {activeTab === 'ressources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Ressources & présentations</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Tous les outils pour comprendre Marpeap et convaincre vos prospects.</div></div>
            <Card style={{ overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>🎬 Marpeap — Le Moteur 24/7</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Vidéo de présentation de l'entreprise</div></div>
              <div style={{ padding: '20px 24px' }}>
                <video controls style={{ width: '100%', maxWidth: 720, borderRadius: 10, background: '#000', display: 'block' }} preload="metadata">
                  <source src="https://api.marpeap.digital/static/presentations/Marpeap___Moteur_24_7.mp4" type="video/mp4" />
                </video>
              </div>
            </Card>
            <Card style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, background: 'rgba(91,110,245,0.12)', border: '1px solid rgba(91,110,245,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📘</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Marpeap Growth Machine</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Présentation complète : vision, offre, positionnement.</div>
                </div>
                <a href="https://storage.marpeap.digital/contracts/1b79abe8-53d2-4d8e-9f02-a95b4a34c695.pdf" target="_blank" rel="noopener noreferrer" style={{ padding: '9px 18px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Ouvrir PDF →</a>
              </div>
            </Card>
            <Card style={{ overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}><span style={{ color: '#F54EA2' }}>M-CALLING</span> — Fiche produit</div></div>
              <div style={{ padding: '20px 24px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.marpeap.digital/static/presentations/Fiche_MCALLING.png" alt="Fiche M-CALLING" style={{ width: '100%', maxWidth: 640, borderRadius: 10, display: 'block' }} />
                <a href="https://api.marpeap.digital/static/presentations/Fiche_MCALLING.png" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, padding: '7px 14px', background: 'rgba(245,78,162,0.12)', border: '1px solid rgba(245,78,162,0.2)', color: '#F54EA2', textDecoration: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Plein écran →</a>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════ TAB: CLASSEMENT ══════════════ */}
        {activeTab === 'classement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Classement des apporteurs</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Top 10 par commissions générées.</div></div>
            {leaderboardLoading ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Chargement...</div>
            ) : (
              <>
                <Card style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        {['#', 'Apporteur', 'Niveau', 'Ventes', 'Commissions'].map(h => (
                          <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map(entry => {
                        const tierColors: Record<string, string> = { bronze: '#cd7f32', silver: '#a8a9ad', gold: '#f1c40f' }
                        const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}`
                        const tierColor = tierColors[entry.tier] || '#cd7f32'
                        return (
                          <tr key={entry.rank} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: entry.is_me ? 'rgba(91,110,245,0.08)' : 'transparent' }}>
                            <td style={{ padding: '13px 18px', fontSize: 16, fontWeight: 800 }}>{medal}</td>
                            <td style={{ padding: '13px 18px', fontSize: 14, fontWeight: entry.is_me ? 700 : 400 }}>{entry.name}{entry.is_me && <span style={{ marginLeft: 8, fontSize: 11, color: '#5B6EF5', background: 'rgba(91,110,245,0.12)', padding: '2px 6px', borderRadius: 100 }}>Vous</span>}</td>
                            <td style={{ padding: '13px 18px' }}><span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}44` }}>{entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)}</span></td>
                            <td style={{ padding: '13px 18px', fontSize: 14 }}>{entry.sales_count}</td>
                            <td style={{ padding: '13px 18px', fontSize: 14, fontWeight: 700, color: '#2ED573' }}>{entry.total_commission.toLocaleString('fr-FR')} €</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </Card>
                {myRank && !leaderboard.some(e => e.is_me) && (
                  <div style={{ background: 'rgba(91,110,245,0.06)', border: '1px solid rgba(91,110,245,0.2)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div><span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 8 }}>Votre position :</span><span style={{ fontWeight: 800, color: '#5B6EF5' }}>#{myRank.rank}</span></div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{myRank.sales_count} vente{myRank.sales_count > 1 ? 's' : ''} · {myRank.total_commission.toLocaleString('fr-FR')} €</div>
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
