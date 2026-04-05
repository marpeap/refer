import Link from 'next/link'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata = {
  title: 'Marpeap — Programme apporteurs d\'affaires',
  description: 'Recommandez les services Marpeap et touchez une commission sur chaque vente. Inscription gratuite, aucune expertise technique requise.',
  alternates: { canonical: 'https://refer.marpeap.com/' },
}

const STEPS = [
  {
    icon: <IconUser />,
    title: 'Créez votre compte',
    desc: 'Inscription gratuite en 2 minutes. Vous recevez un lien de parrainage unique.',
  },
  {
    icon: <IconHandshake />,
    title: 'Validation rapide',
    desc: 'Notre équipe vérifie votre profil et vous envoie un contrat d\'apporteur.',
  },
  {
    icon: <IconTrending />,
    title: 'Recommandez, gagnez',
    desc: 'Partagez votre lien. Chaque client signé vous rapporte une commission directe.',
  },
]

const PACKS = [
  { name: 'M-ONE', price: '290€', color: '#4F8AFF', desc: 'Site One-Page' },
  { name: 'M-SHOP LITE', price: '490€', color: '#F5A623', desc: 'E-Commerce Pro' },
  { name: 'M-CALLING', price: '490€', color: '#F54EA2', desc: 'Standardiste IA' },
  { name: 'M-NEURAL', price: '180€', color: '#9B5BF5', desc: 'Chatbot IA' },
  { name: 'M-CORP', price: '820€', color: '#F1C40F', desc: '5 Agents IA' },
]

const ADVANTAGES = [
  {
    title: 'Commissions directes',
    desc: 'Touchez une commission sur chaque vente confirmée. Paiement mensuel, transparent.',
    icon: <IconWallet />,
  },
  {
    title: 'Tiers évolutifs',
    desc: 'Bronze, Silver, Gold — plus vous vendez, plus vos taux de commission augmentent.',
    icon: <IconMedal />,
  },
  {
    title: 'Cascade MLM',
    desc: 'Recrutez d\'autres apporteurs et touchez un pourcentage sur leurs ventes.',
    icon: <IconNetwork />,
  },
  {
    title: 'Suivi en temps réel',
    desc: 'Dashboard complet : ventes, analytics, badges, classement live.',
    icon: <IconChart />,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen landing-bg">

      {/* ═══ NAV ═══ */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-bg-border bg-bg-base/80">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-display text-lg font-bold text-text-primary tracking-tight">
              marpeap
            </span>
            <span className="text-[11px] font-body text-text-muted bg-bg-elevated border border-bg-border px-2 py-0.5 rounded-full">
              Apporteurs
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="font-body text-sm text-text-secondary hover:text-text-primary transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="btn-primary py-2 px-5 text-sm">
              Devenir apporteur
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative z-10 text-center pt-20 md:pt-28 pb-16 md:pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <h1
              className="font-display text-text-primary mb-6"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.025em',
                fontWeight: 700,
              }}
            >
              Recommandez Marpeap.
              <br />
              Touchez une commission.
            </h1>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={120}>
            <p className="font-body text-text-secondary text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
              Devenez apporteur d'affaires et gagnez des commissions sur chaque vente. Aucune expertise technique requise.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={240}>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/register" className="btn-primary py-3 px-8 text-sm">
                Commencer maintenant
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
              </Link>
              <Link href="/login" className="btn-ghost py-3 px-8 text-sm">
                J'ai déjà un compte
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ COMMENT ÇA MARCHE ═══ */}
      <section className="relative z-10 px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <h2 className="font-display text-2xl md:text-3xl text-text-primary mb-3" style={{ lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 600 }}>
              Comment ça marche
            </h2>
            <p className="font-body text-text-secondary text-sm mb-10 max-w-md">
              Trois étapes pour commencer à gagner des commissions.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.title} direction="up" delay={i * 120}>
                <div className="card p-6 md:p-7 h-full">
                  <div className="w-10 h-10 bg-accent-mint/10 border border-accent-mint/20 rounded-xl flex items-center justify-center mb-5">
                    {step.icon}
                  </div>
                  <h3 className="font-display text-base text-text-primary mb-2 font-semibold" style={{ letterSpacing: '-0.01em' }}>
                    {step.title}
                  </h3>
                  <p className="font-body text-text-secondary text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CATALOGUE ═══ */}
      <section className="relative z-10 px-6 py-12 md:py-20 border-t border-bg-border/50">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <h2 className="font-display text-2xl md:text-3xl text-text-primary mb-3" style={{ lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 600 }}>
              7 solutions à vendre
            </h2>
            <p className="font-body text-text-secondary text-sm mb-10 max-w-md">
              Des produits concrets, du site web à l'agent vocal 24/7.
            </p>
          </ScrollReveal>

          <div className="flex gap-3 flex-wrap mb-8">
            {PACKS.map((pack, i) => (
              <ScrollReveal key={pack.name} direction="up" delay={i * 80}>
                <div
                  className="rounded-xl p-4 min-w-[130px] text-center border transition-colors hover:border-opacity-40"
                  style={{
                    background: `${pack.color}08`,
                    borderColor: `${pack.color}25`,
                  }}
                >
                  <div className="font-display text-sm font-bold mb-1" style={{ color: pack.color }}>
                    {pack.name}
                  </div>
                  <div className="font-body text-text-muted text-xs mb-2">{pack.desc}</div>
                  <div className="font-mono text-text-primary text-lg font-semibold tracking-tight">{pack.price}</div>
                </div>
              </ScrollReveal>
            ))}
            <ScrollReveal direction="up" delay={PACKS.length * 80}>
              <div className="card flex items-center justify-center px-5 min-w-[130px] min-h-[90px]">
                <span className="font-body text-text-muted text-xs">+2 autres</span>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal direction="up" delay={200}>
            <p className="font-body text-text-muted text-xs mb-6 max-w-md">
              Chaque vente génère une commission. Les meilleurs apporteurs bénéficient de <strong className="text-text-secondary">taux majorés</strong>.
            </p>
            <Link href="/register" className="btn-primary py-2.5 px-6 text-sm">
              Voir le catalogue complet
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ AVANTAGES ═══ */}
      <section className="relative z-10 px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <h2 className="font-display text-2xl md:text-3xl text-text-primary mb-10" style={{ lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 600 }}>
              Pourquoi devenir apporteur
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ADVANTAGES.map((adv, i) => (
              <ScrollReveal key={adv.title} direction={i % 2 === 0 ? 'left' : 'right'} delay={i * 100}>
                <div className="flex gap-4 items-start p-5 rounded-xl border border-bg-border/50 hover:border-accent-mint/20 transition-colors" style={{
                  background: 'radial-gradient(ellipse 100% 80% at 0% 0%, rgba(54,216,176,0.03) 0%, transparent 50%), var(--bg-surface)',
                }}>
                  <div className="w-10 h-10 bg-accent-mint/10 border border-accent-mint/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    {adv.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-sm text-text-primary font-semibold mb-1" style={{ letterSpacing: '-0.01em' }}>
                      {adv.title}
                    </h3>
                    <p className="font-body text-text-secondary text-sm leading-relaxed">{adv.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="relative z-10 px-6 py-20 md:py-28 text-center" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(54,216,176,0.06) 0%, transparent 60%)',
      }}>
        <div className="max-w-2xl mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <h2 className="font-display text-2xl md:text-3xl text-text-primary mb-4" style={{ lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 600 }}>
              Prêt à gagner des commissions ?
            </h2>
            <p className="font-body text-text-secondary text-sm mb-3 max-w-md mx-auto">
              Inscription gratuite en 2 minutes. Commencez à recommander dès aujourd'hui.
            </p>
            <p className="font-body text-text-muted text-xs mb-8">
              Aucun engagement · Annulation en 1 clic
            </p>
            <Link href="/register" className="btn-primary py-3 px-10 text-sm">
              Commencer maintenant
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-bg-border px-6 py-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm font-bold text-text-primary tracking-tight">
            marpeap
          </span>
          <span className="font-body text-xs text-text-muted">
            © 2026 Marpeap Digitals — Programme apporteurs d'affaires
          </span>
        </div>
      </footer>
    </div>
  )
}

/* ─── Icons ───────────────────────────────────────────────────────────────── */

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-mint">
      <path d="M9 9a3 3 0 100-6 3 3 0 000 6zM3 15.75a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconHandshake() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-mint">
      <path d="M2.25 9.75l3-3 2.25 2.25 4.5-4.5 3.75 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 5.25h3.75v3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTrending() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-mint">
      <path d="M3 14l4-4 3 2 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 6h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-mint">
      <rect x="2" y="4.5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7.5h14M12 11h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconMedal() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-mint">
      <circle cx="9" cy="7.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 11.5L5 16.5l4-2 4 2-1.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconNetwork() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-mint">
      <circle cx="9" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 6v2M7.5 9.5L5.5 11M10.5 9.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-mint">
      <path d="M3 15V8M7.5 15V5M12 15V9M16.5 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
