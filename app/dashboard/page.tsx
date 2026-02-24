'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
}

interface Contract {
  id: string
  pdf_filename: string
  status: 'sent' | 'signed'
  otp_sent_at: string
  signed_at: string | null
  pdf_url: string
}

interface User {
  full_name: string
  email: string
  phone: string
  code: string
}

interface CommissionRate {
  pack_name: string
  commission_amount: number
}

const PACKS = [
  {
    name: 'M-ONE',
    price: 290,
    color: '#4F8AFF',
    tagline: 'Site One-Page Ultra-Rapide',
    description: 'Un site professionnel, beau et optimisé, livré en 48h. La solution idéale pour les TPE/PME qui veulent une présence web moderne sans se ruiner.',
    target: 'Artisans, commerçants, auto-entrepreneurs, professions libérales, créateurs d\'entreprise',
    features: [
      'Design sur mesure responsive mobile',
      'Optimisation SEO intégrée',
      'Formulaire de contact & maps',
      'Mise en ligne en 48h chrono',
    ],
    pitchArgs: [
      'Vos concurrents sont en ligne — et vous ?',
      'Un site pro à partir de 290€, sans engagement',
      'Livré en 48h, pas en 3 mois comme une agence classique',
    ],
  },
  {
    name: 'M-SHOP LITE',
    price: 490,
    color: '#F5A623',
    tagline: 'Boutique E-Commerce Pro',
    description: 'Une boutique en ligne complète avec gestion des paiements et des commandes. Parfaite pour lancer ou moderniser une activité e-commerce.',
    target: 'Créateurs, artisans vendant en ligne, commerces physiques voulant vendre sur internet',
    features: [
      'Boutique avec panier & paiement Stripe',
      'Gestion des produits, stocks, livraisons',
      'Design adapté à votre marque',
      'Compatible mobile & SEO optimisé',
    ],
    pitchArgs: [
      'Vendez 24h/24 sans effort supplémentaire',
      'Boutique pro livrée en moins d\'une semaine',
      'Concurrencez Amazon et Etsy sur votre niche',
    ],
  },
  {
    name: 'M-LOCAL',
    price: 190,
    color: '#2ED573',
    tagline: 'Visibilité Google Maps',
    description: 'Optimisation complète de votre fiche Google Business et référencement local. Apparaissez en premier quand vos clients cherchent "près de moi".',
    target: 'Restaurants, coiffeurs, plombiers, médecins, tous commerces de proximité',
    features: [
      'Optimisation fiche Google Business',
      'Photos & contenus SEO optimisés',
      'Stratégie mots-clés locaux',
      'Résultats visibles dès 30 jours',
    ],
    pitchArgs: [
      '80% des recherches locales aboutissent à une visite physique',
      'Le pack le moins cher, souvent le plus impactant',
      '"Trouvez un plombier près de moi" — soyez le premier',
    ],
  },
  {
    name: 'M-CALLING',
    price: 490,
    color: '#F54EA2',
    tagline: 'Standardiste IA 24h/24',
    description: 'Un agent vocal IA répond à tous les appels 24h/24, 7j/7 : prise de rendez-vous, informations, gestion des demandes — sans jamais décrocher.',
    target: 'Cabinets médicaux, restaurants, hôtels, agences immobilières, tout business recevant des appels',
    features: [
      'Réponse instantanée 24h/24, 7j/7',
      'Prise de rendez-vous automatique',
      'Disponible en plusieurs langues',
      'Zéro coût de recrutement',
    ],
    pitchArgs: [
      'Plus jamais d\'appel manqué = plus jamais de client perdu',
      'Remplace un standardiste pour 30€/mois au lieu de 2 500€',
      'Vos concurrents paient encore un humain pour ça',
    ],
  },
  {
    name: 'M-CAMPAIGN',
    price: 280,
    color: '#00C9A7',
    tagline: 'Gestionnaire Google Ads IA',
    description: 'Un agent IA gère vos campagnes Google Ads en continu : optimisation des enchères, mots-clés et annonces pour maximiser votre retour sur investissement.',
    target: 'E-commerce, agences immobilières, cliniques, formations en ligne, tout business avec budget pub',
    features: [
      'Création & optimisation de campagnes',
      'Suivi et ajustements en temps réel',
      'Rapports mensuels clairs',
      'Consultation de démarrage incluse',
    ],
    pitchArgs: [
      'Dépensez moins en pub, gagnez plus de clients',
      'Votre budget travaille 24h/24 avec l\'IA',
      'Résultats mesurables dès le 1er mois',
    ],
  },
  {
    name: 'M-NEURAL',
    price: 180,
    color: '#9B5BF5',
    tagline: 'ChatBot IA sur vos données',
    description: 'Un chatbot intelligent formé sur vos propres données (PDF, FAQ, catalogue). Il répond instantanément à vos clients sur votre site, sans vous.',
    target: 'E-commerce, SaaS, entreprises avec support client récurrent, formateurs en ligne',
    features: [
      'IA formée sur votre contenu personnalisé',
      'Intégration site web en 48h',
      'Répond aux questions 24h/24',
      'Réduit les tickets support de 70%',
    ],
    pitchArgs: [
      'Finies les réponses aux mêmes questions 10x par jour',
      'Plus abordable qu\'un CDI au support client',
      'Vos clients adorent les réponses en 3 secondes',
    ],
  },
  {
    name: 'M-CORP',
    price: 820,
    color: '#F1C40F',
    tagline: 'Équipe de 5 Agents IA autonomes',
    description: 'Cinq agents IA spécialisés travaillent en équipe pour automatiser vos processus métiers les plus complexes — votre département IA clé en main.',
    target: 'PME à partir de 5 employés, entreprises en croissance, secteurs conseil/tech/industrie',
    features: [
      '5 agents IA personnalisés sur vos process',
      'Automatisation des tâches répétitives',
      'Intégrations CRM, Slack, Drive...',
      'Formation équipe + support dédié',
    ],
    pitchArgs: [
      'Votre propre équipe IA pour le prix d\'un freelance',
      'ROI moyen : 40h de travail économisées par mois',
      'Le pack "transformer sa boîte"',
    ],
  },
]

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [contract, setContract] = useState<Contract | null>(null)
  const [commissions, setCommissions] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ventes' | 'catalogue' | 'ressources' | 'classement'>('ventes')
  const [leaderboard, setLeaderboard] = useState<{ rank: number; name: string; tier: string; sales_count: number; total_commission: number; is_me: boolean }[]>([])
  const [myRank, setMyRank] = useState<{ rank: number; total_commission: number; sales_count: number } | null>(null)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [signatureImage, setSignatureImage] = useState('')
  const [signLoading, setSignLoading] = useState(false)
  const [signSuccess, setSignSuccess] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('refer_token')
    if (!token) { router.push('/login'); return }

    const fetchData = async () => {
      try {
        const [userRes, salesRes, contractRes, ratesRes] = await Promise.all([
          fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/sales', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/contracts/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/commission-rates'),
        ])

        if (!userRes.ok || !salesRes.ok) {
          localStorage.removeItem('refer_token')
          router.push('/login')
          return
        }

        const userData = await userRes.json()
        const salesData = await salesRes.json()
        setUser(userData)
        setSales(salesData)

        if (contractRes.ok) {
          const contractData = await contractRes.json()
          setContract(contractData.contract)
        }

        if (ratesRes.ok) {
          const ratesData: CommissionRate[] = await ratesRes.json()
          const map: Record<string, number> = {}
          ratesData.forEach(r => { map[r.pack_name] = Number(r.commission_amount) })
          setCommissions(map)
        }
      } catch {
        localStorage.removeItem('refer_token')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('refer_token')
    router.push('/login')
  }

  const copyCode = () => {
    if (user?.code) {
      navigator.clipboard.writeText(user.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyLink = () => {
    if (user?.code) {
      navigator.clipboard.writeText(`https://app.marpeap.digital?ref=${user.code}`)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const totalCommission = sales.reduce((acc, sale) => acc + Number(sale.commission_amount || 0), 0)
  const pendingCommission = sales.filter(s => !s.commission_paid).reduce((acc, s) => acc + Number(s.commission_amount || 0), 0)

  // Canvas drawing
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoords(e)
    ctx.beginPath(); ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoords(e)
    ctx.lineTo(x, y); ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (canvasRef.current) setSignatureImage(canvasRef.current.toDataURL())
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setSignatureImage('')
  }

  const signContract = async () => {
    if (!otpCode || otpCode.length !== 6) { alert('Veuillez entrer le code OTP à 6 chiffres'); return }
    if (!signatureImage) { alert('Veuillez signer le contrat'); return }
    const token = localStorage.getItem('refer_token')
    if (!token) return
    setSignLoading(true)
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp_code: otpCode, signature_image: signatureImage }),
      })
      if (res.ok) {
        setSignSuccess(true)
        const contractRes = await fetch('/api/contracts/me', { headers: { Authorization: `Bearer ${token}` } })
        if (contractRes.ok) { const d = await contractRes.json(); setContract(d.contract) }
      } else {
        const d = await res.json(); alert(d.error || 'Erreur lors de la signature')
      }
    } catch { alert('Erreur lors de la signature') }
    finally { setSignLoading(false) }
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Chargement...</div>
    </main>
  )

  if (!user) return null

  const loadLeaderboard = async () => {
    if (leaderboard.length > 0) return // déjà chargé
    setLeaderboardLoading(true)
    try {
      const token = localStorage.getItem('refer_token')
      const res = await fetch('/api/leaderboard', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.board)
        setMyRank(data.my_rank)
      }
    } catch {}
    finally { setLeaderboardLoading(false) }
  }

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    background: active ? '#5B6EF5' : 'rgba(255,255,255,0.04)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: active ? '#ffffff' : 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  })

  return (
    <main style={{ minHeight: '100vh', background: '#080810', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        select option { background: #1A1A2E; color: #fff; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .pack-card { transition: border-color 0.2s, transform 0.15s; }
        .pack-card:hover { transform: translateY(-2px); }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 32px',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'rgba(8,8,16,0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>
            mar<span style={{ color: '#5B6EF5' }}>peap</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", fontWeight: 400, marginLeft: 8 }}>Apporteurs</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{user.full_name}</span>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Déconnexion
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>

        {/* Banner contrat à signer */}
        {contract && contract.status === 'sent' && !signSuccess && (
          <div style={{
            background: 'rgba(245,166,35,0.08)',
            border: '1px solid rgba(245,166,35,0.25)',
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <span style={{ fontSize: 14, color: '#F5A623', fontWeight: 500 }}>Vous avez un contrat en attente de signature</span>
            </div>
            <button
              onClick={() => setActiveTab('ventes')}
              style={{ padding: '7px 16px', background: '#F5A623', border: 'none', borderRadius: 6, color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
            >
              Signer maintenant
            </button>
          </div>
        )}

        {/* Welcome card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(91,110,245,0.12) 0%, rgba(155,91,245,0.08) 100%)',
          border: '1px solid rgba(91,110,245,0.2)',
          borderRadius: 16,
          padding: '28px 32px',
          marginBottom: 28,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 24,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              Bonjour, {user.full_name.split(' ')[0]} 👋
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>
              Bienvenue dans votre espace apporteur d'affaires Marpeap.
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: '#5B6EF5' }}>{user.code}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Mon code</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: '#2ED573' }}>{sales.length}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Ventes</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: '#F1C40F' }}>{totalCommission.toLocaleString('fr-FR')}€</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Commissions totales</div>
              </div>
              {pendingCommission > 0 && (
                <div style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: '#F5A623' }}>{pendingCommission.toLocaleString('fr-FR')}€</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>En attente</div>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>MON LIEN DE PARRAINAGE</div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: 8,
              }}>
                app.marpeap.digital?ref={user.code}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyCode} style={{ flex: 1, padding: '8px', background: copied ? 'rgba(46,213,115,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: copied ? '#2ED573' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                {copied ? '✓ Code copié' : 'Copier le code'}
              </button>
              <button onClick={copyLink} style={{ flex: 1, padding: '8px', background: copiedLink ? 'rgba(46,213,115,0.15)' : '#5B6EF5', border: 'none', borderRadius: 7, color: copiedLink ? '#2ED573' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                {copiedLink ? '✓ Lien copié' : 'Copier le lien'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          <button style={TAB_STYLE(activeTab === 'ventes')} onClick={() => setActiveTab('ventes')}>Mes ventes</button>
          <button style={TAB_STYLE(activeTab === 'catalogue')} onClick={() => setActiveTab('catalogue')}>Catalogue produits</button>
          <button style={TAB_STYLE(activeTab === 'ressources')} onClick={() => setActiveTab('ressources')}>Ressources</button>
          <button style={TAB_STYLE(activeTab === 'classement')} onClick={() => { setActiveTab('classement'); loadLeaderboard() }}>🏆 Classement</button>
        </div>

        {/* ── TAB: VENTES ─────────────────────────────────── */}
        {activeTab === 'ventes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Contract signing */}
            {contract && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '28px 32px' }}>
                {contract.status === 'sent' && !signSuccess ? (
                  <>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                      📄 Contrat à signer
                    </div>
                    <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 20px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 8, marginBottom: 24, fontWeight: 600, fontSize: 14 }}>
                      Voir le contrat PDF →
                    </a>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Signature manuscrite</div>
                      <canvas ref={canvasRef} width={400} height={140}
                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                        style={{ background: '#fff', borderRadius: 8, cursor: 'crosshair', display: 'block' }}
                      />
                      <button onClick={clearSignature} style={{ marginTop: 8, padding: '6px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}>Effacer</button>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Code OTP reçu par email (6 chiffres)</div>
                      <input type="number" value={otpCode} onChange={e => setOtpCode(e.target.value.slice(0, 6))} placeholder="123456"
                        style={{ width: 180, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 18, letterSpacing: 6, textAlign: 'center', fontFamily: 'monospace' }}
                      />
                    </div>
                    <button onClick={signContract} disabled={signLoading} style={{ padding: '12px 28px', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', cursor: signLoading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, opacity: signLoading ? 0.7 : 1 }}>
                      {signLoading ? 'Signature en cours...' : 'Signer le contrat'}
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>✅</span>
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#10b981' }}>Contrat signé</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Signé le {formatDate(contract.signed_at || new Date().toISOString())}</div>
                    </div>
                    <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', padding: '8px 16px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>Télécharger</a>
                  </div>
                )}
              </div>
            )}

            {/* Sales table */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>Historique des ventes</div>
              </div>
              {sales.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                  <div style={{ fontSize: 14 }}>Aucune vente enregistrée pour le moment.</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Partagez votre lien pour commencer !</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        {['Client', 'Service', 'Montant', 'Commission', 'Statut', 'Date'].map(h => (
                          <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map(sale => {
                        const comm = sale.commission_amount ?? 0
                        return (
                          <tr key={sale.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '14px 20px', fontSize: 14 }}>{sale.client_name}</td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: 'rgba(91,110,245,0.15)', color: '#5B6EF5' }}>{sale.service}</span>
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600 }}>{sale.amount.toLocaleString('fr-FR')} €</td>
                            <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#2ED573' }}>{comm > 0 ? `+${comm}€` : '—'}</td>
                            <td style={{ padding: '14px 20px' }}>
                              {sale.commission_paid
                                ? <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: 'rgba(46,213,115,0.15)', color: '#2ED573' }}>Versée ✓</span>
                                : <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: 'rgba(255,165,0,0.15)', color: '#FFA500' }}>En attente</span>
                              }
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{formatDate(sale.created_at)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: CATALOGUE ─────────────────────────────── */}
        {activeTab === 'catalogue' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Catalogue des produits</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', maxWidth: 600 }}>
                Voici les 7 solutions que vous pouvez proposer. Pour chaque vente conclue, vous touchez une commission. Les meilleures performances sont récompensées par des taux majorés.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {PACKS.map(pack => {
                const comm = commissions[pack.name] ?? 0
                return (
                  <div key={pack.name} className="pack-card" style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid rgba(255,255,255,0.07)`,
                    borderRadius: 16,
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {/* Color bar */}
                    <div style={{ height: 3, background: pack.color }} />

                    <div style={{ padding: '20px 22px 22px' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: pack.color }}>{pack.name}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{pack.tagline}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800 }}>{pack.price}€</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>paiement unique</div>
                        </div>
                      </div>

                      {/* Commission highlight */}
                      {comm > 0 && (
                        <div style={{
                          background: 'rgba(46,213,115,0.1)',
                          border: '1px solid rgba(46,213,115,0.2)',
                          borderRadius: 8,
                          padding: '8px 14px',
                          marginBottom: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                          <span style={{ fontSize: 16 }}>💰</span>
                          <div>
                            <span style={{ fontSize: 18, fontWeight: 800, color: '#2ED573', fontFamily: "'Syne', sans-serif" }}>+{comm}€</span>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>de commission pour vous</span>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 14 }}>
                        {pack.description}
                      </p>

                      {/* Features */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Ce que vous vendez</div>
                        {pack.features.map(f => (
                          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                            <span style={{ color: pack.color, marginTop: 2, flexShrink: 0 }}>✓</span>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Target */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>À qui le proposer</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{pack.target}</div>
                      </div>

                      {/* Pitch args */}
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Arguments de vente</div>
                        {pack.pitchArgs.map(arg => (
                          <div key={arg} style={{ background: `${pack.color}10`, border: `1px solid ${pack.color}20`, borderRadius: 6, padding: '6px 10px', marginBottom: 5, fontSize: 12, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic' }}>
                            {arg}
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <button onClick={copyLink} style={{
                        width: '100%',
                        padding: '10px',
                        background: `${pack.color}18`,
                        border: `1px solid ${pack.color}35`,
                        borderRadius: 8,
                        color: pack.color,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        Partager mon lien →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Motivation section */}
            <div style={{
              marginTop: 28,
              background: 'linear-gradient(135deg, rgba(91,110,245,0.08), rgba(155,91,245,0.06))',
              border: '1px solid rgba(91,110,245,0.15)',
              borderRadius: 16,
              padding: '24px 28px',
              display: 'flex',
              gap: 32,
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Comment progresser ?</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 500 }}>
                  Les apporteurs les plus actifs bénéficient de <strong style={{ color: 'rgba(255,255,255,0.7)' }}>taux de commission majorés</strong>. Plus vous apportez de clients, plus vos gains par vente augmentent. Contactez notre équipe pour en savoir plus.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { label: 'Pack moyen', value: `${Math.round(Object.values(commissions).reduce((a, b) => a + b, 0) / Math.max(Object.values(commissions).filter(v => v > 0).length, 1))}€`, sub: 'commission moy.' },
                  { label: '3 ventes/mois', value: `${(Object.values(commissions).reduce((a, b) => a + b, 0) / Math.max(Object.values(commissions).filter(v => v > 0).length, 1) * 3).toFixed(0)}€`, sub: 'potentiel mensuel' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#5B6EF5' }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: RESSOURCES ────────────────────────────── */}
        {activeTab === 'ressources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Ressources & présentations</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Tous les outils pour comprendre Marpeap et convaincre vos prospects.
              </div>
            </div>

            {/* Video */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>🎬 Marpeap — Le Moteur 24/7</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Vidéo de présentation de l'entreprise et de ses solutions IA</div>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <video
                  controls
                  style={{ width: '100%', maxWidth: 720, borderRadius: 10, background: '#000', display: 'block' }}
                  preload="metadata"
                >
                  <source src="https://api.marpeap.digital/static/presentations/Marpeap___Moteur_24_7.mp4" type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              </div>
            </div>

            {/* PDF */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, background: 'rgba(91,110,245,0.12)', border: '1px solid rgba(91,110,245,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  📘
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Marpeap Growth Machine</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                    Présentation complète de l'entreprise Marpeap : vision, offre, positionnement. Idéal pour comprendre l'écosystème avant de vendre.
                  </div>
                </div>
                <a
                  href="https://storage.marpeap.digital/contracts/1b79abe8-53d2-4d8e-9f02-a95b4a34c695.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '10px 20px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  Ouvrir le PDF →
                </a>
              </div>
            </div>

            {/* M-CALLING product sheet */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#F54EA2' }}>M-CALLING</span> — Fiche produit
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                  Infographie détaillée sur la solution de standardiste IA 24h/24
                </div>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://api.marpeap.digital/static/presentations/Fiche_MCALLING.png"
                  alt="Fiche produit M-CALLING"
                  style={{ width: '100%', maxWidth: 640, borderRadius: 10, display: 'block' }}
                />
                <a
                  href="https://api.marpeap.digital/static/presentations/Fiche_MCALLING.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 12, padding: '8px 16px', background: 'rgba(245,78,162,0.12)', border: '1px solid rgba(245,78,162,0.2)', color: '#F54EA2', textDecoration: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600 }}
                >
                  Ouvrir en plein écran →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: CLASSEMENT ────────────────────────────── */}
        {activeTab === 'classement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Classement des apporteurs</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Top 10 par commissions générées. Les noms sont partiellement masqués.</div>
            </div>

            {leaderboardLoading ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Chargement...</div>
            ) : (
              <>
                {/* Tableau */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        {['#', 'Apporteur', 'Niveau', 'Ventes', 'Commissions'].map(h => (
                          <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map(entry => {
                        const tierColors: Record<string, string> = { bronze: '#cd7f32', silver: '#a8a9ad', gold: '#f1c40f' }
                        const medalEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}`
                        const rowBg = entry.is_me ? 'rgba(91,110,245,0.08)' : 'transparent'
                        const tierColor = tierColors[entry.tier] || '#cd7f32'
                        return (
                          <tr key={entry.rank} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: rowBg }}>
                            <td style={{ padding: '14px 20px', fontSize: 16, fontWeight: 800 }}>{medalEmoji}</td>
                            <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: entry.is_me ? 700 : 400 }}>
                              {entry.name}
                              {entry.is_me && <span style={{ marginLeft: 8, fontSize: 11, color: '#5B6EF5', background: 'rgba(91,110,245,0.12)', padding: '2px 6px', borderRadius: 100 }}>Vous</span>}
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}44` }}>
                                {entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: 14 }}>{entry.sales_count}</td>
                            <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#2ED573' }}>{entry.total_commission.toLocaleString('fr-FR')} €</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Ma position si hors top 10 */}
                {myRank && !leaderboard.some(e => e.is_me) && (
                  <div style={{ background: 'rgba(91,110,245,0.06)', border: '1px solid rgba(91,110,245,0.2)', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ fontSize: 14 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 8 }}>Votre position :</span>
                      <span style={{ fontWeight: 800, color: '#5B6EF5' }}>#{myRank.rank}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{myRank.sales_count} vente{myRank.sales_count > 1 ? 's' : ''} · {myRank.total_commission.toLocaleString('fr-FR')} € de commissions</div>
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
