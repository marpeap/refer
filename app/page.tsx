import Link from 'next/link'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata = {
  title: 'Marpeap — Programme apporteurs d\'affaires',
  description: 'Recommandez les services Marpeap et touchez une commission sur chaque vente. Inscription gratuite, aucune expertise technique requise.',
  alternates: { canonical: 'https://refer.marpeap.com/' },
}

const PACKS = [
  {
    name: 'M-ONE',
    price: '290€',
    desc: 'Site One-Page professionnel',
    gradient: 'radial-gradient(ellipse 120% 70% at 15% 55%, rgba(79,138,255,0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(37,99,235,0.16) 0%, transparent 45%), linear-gradient(160deg, #142850 0%, #0E1E3E 40%, #081428 100%)',
    border: 'rgba(79,138,255,0.18)',
    accent: '#4F8AFF',
  },
  {
    name: 'M-SHOP LITE',
    price: '490€',
    desc: 'E-Commerce clé en main',
    gradient: 'radial-gradient(ellipse 120% 70% at 15% 55%, rgba(245,166,35,0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(180,120,20,0.16) 0%, transparent 45%), linear-gradient(160deg, #2A200E 0%, #1A1508 40%, #100E06 100%)',
    border: 'rgba(245,166,35,0.18)',
    accent: '#F5A623',
  },
  {
    name: 'M-CALLING',
    price: '490€',
    desc: 'Standardiste IA 24/7',
    gradient: 'radial-gradient(ellipse 120% 70% at 15% 55%, rgba(245,78,162,0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(180,40,110,0.16) 0%, transparent 45%), linear-gradient(160deg, #2A1028 0%, #1C0A1C 40%, #100610 100%)',
    border: 'rgba(245,78,162,0.18)',
    accent: '#F54EA2',
  },
  {
    name: 'M-NEURAL',
    price: '180€',
    desc: 'Chatbot intelligent',
    gradient: 'radial-gradient(ellipse 120% 70% at 15% 55%, rgba(155,91,245,0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(100,50,180,0.16) 0%, transparent 45%), linear-gradient(160deg, #1E1040 0%, #140A2E 40%, #0A0618 100%)',
    border: 'rgba(155,91,245,0.18)',
    accent: '#9B5BF5',
  },
  {
    name: 'M-CORP',
    price: '820€',
    desc: '5 agents IA marketing',
    gradient: 'radial-gradient(ellipse 120% 70% at 15% 55%, rgba(241,196,15,0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(155,91,245,0.16) 0%, transparent 45%), linear-gradient(160deg, #28200E 0%, #1A1508 40%, #100E06 100%)',
    border: 'rgba(241,196,15,0.18)',
    accent: '#F1C40F',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen landing-bg">

      {/* ═══ NAV ═══ */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-bg-border bg-bg-base/80">
        <div className="max-w-[1100px] mx-auto px-6 h-[56px] flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold text-text-primary tracking-tight">
            marpeap
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="font-body text-sm text-text-secondary hover:text-text-primary transition-colors hidden sm:block">
              Connexion
            </Link>
            <Link href="/register" className="btn-primary py-2 px-5 text-sm">
              Devenir apporteur
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative z-10 pt-24 md:pt-36 pb-10 md:pb-14 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-2xl">
            <ScrollReveal direction="up" delay={0}>
              <h1
                className="font-display text-text-primary mb-5"
                style={{
                  fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)',
                  lineHeight: 1.06,
                  letterSpacing: '-0.03em',
                  fontWeight: 700,
                }}
              >
                180 à 820€ par client recommandé.
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <p className="font-body text-text-secondary text-lg md:text-xl leading-relaxed mb-8 max-w-md">
                Recommandez les solutions digitales Marpeap. Commission versée chaque mois, sans plafond.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <div className="flex gap-3 flex-wrap">
                <Link href="/register" className="btn-primary py-3 px-8 text-[15px]">
                  Créer mon compte gratuit
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
                <Link href="/login" className="btn-ghost py-3 px-6 text-[15px] sm:hidden">
                  Connexion
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF STRIP ═══ */}
      <section className="relative z-10 px-6 pb-20 md:pb-28">
        <div className="max-w-[1100px] mx-auto">
          <ScrollReveal direction="up" delay={300}>
            <div className="flex gap-8 md:gap-14 items-center flex-wrap">
              {[
                { value: '7', label: 'solutions à vendre' },
                { value: '290–820€', label: 'par vente' },
                { value: '2 min', label: 'pour s\'inscrire' },
              ].map(stat => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="font-mono text-lg md:text-xl font-bold text-text-primary tracking-tight">{stat.value}</span>
                  <span className="font-body text-xs text-text-muted">{stat.label}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ COMMENT ÇA MARCHE — timeline layout ═══ */}
      <section className="relative z-10 px-6 py-20 md:py-32" style={{
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-base) 100%)',
      }}>
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-12 lg:gap-20">
          {/* Left — heading */}
          <div>
            <ScrollReveal direction="left" delay={0}>
              <h2 className="font-display text-text-primary mb-4" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', lineHeight: 1.12, letterSpacing: '-0.025em', fontWeight: 700 }}>
                Trois étapes,
                <br />zéro complexité.
              </h2>
              <p className="font-body text-text-secondary text-[15px] leading-relaxed">
                Pas besoin de connaître le web. On vous donne un lien, vous le partagez.
              </p>
            </ScrollReveal>
          </div>

          {/* Right — steps */}
          <div className="flex flex-col gap-0">
            {[
              { title: 'Inscrivez-vous gratuitement', desc: 'Créez votre compte en 2 minutes. On valide votre profil et vous recevez un lien de parrainage unique.', accent: 'text-accent-mint', dot: 'bg-accent-mint' },
              { title: 'Partagez à votre réseau', desc: 'Envoyez votre lien à des entreprises, commerçants, indépendants qui ont besoin d\'un site ou d\'outils digitaux.', accent: 'text-accent-gold', dot: 'bg-accent-gold' },
              { title: 'Touchez votre commission', desc: 'Dès que le client signe, votre commission est enregistrée. Versement mensuel par virement.', accent: 'text-accent-mint', dot: 'bg-accent-mint' },
            ].map((step, i) => (
              <ScrollReveal key={step.title} direction="right" delay={i * 120}>
                <div className="flex gap-5 items-start group">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center pt-1.5">
                    <div className={`w-3 h-3 rounded-full ${step.dot} shrink-0`} />
                    {i < 2 && <div className="w-px h-full min-h-[60px] bg-bg-border mt-2" />}
                  </div>
                  <div className="pb-10">
                    <h3 className={`font-display text-[15px] font-semibold mb-1.5 ${step.accent}`} style={{ letterSpacing: '-0.01em' }}>
                      {step.title}
                    </h3>
                    <p className="font-body text-text-secondary text-sm leading-relaxed max-w-md">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CATALOGUE — distinct gradient cards ═══ */}
      <section className="relative z-10 px-6 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-[1100px] mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <div className="max-w-lg mb-12">
              <h2 className="font-display text-text-primary mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', lineHeight: 1.12, letterSpacing: '-0.025em', fontWeight: 700 }}>
                Ce que vous vendez
              </h2>
              <p className="font-body text-text-secondary text-[15px] leading-relaxed">
                Des produits digitaux concrets — du site vitrine aux agents IA. Chaque vente vous rapporte une commission fixe.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PACKS.map((pack, i) => (
              <ScrollReveal key={pack.name} direction="up" delay={i * 80}>
                <div
                  className="rounded-2xl p-6 border transition-all duration-200 hover:scale-[1.02] hover:brightness-110 h-full flex flex-col"
                  style={{
                    background: pack.gradient,
                    borderColor: pack.border,
                  }}
                >
                  <div className="font-display text-base font-bold mb-1" style={{ color: pack.accent }}>
                    {pack.name}
                  </div>
                  <div className="font-body text-text-secondary text-sm mb-4 flex-1">{pack.desc}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold text-text-primary tracking-tight">{pack.price}</span>
                    <span className="font-body text-text-muted text-xs">/commission</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
            <ScrollReveal direction="up" delay={PACKS.length * 80}>
              <div className="rounded-2xl border border-bg-border bg-bg-surface/50 p-6 flex flex-col items-center justify-center h-full min-h-[140px]">
                <span className="font-body text-text-muted text-sm mb-2">+2 autres solutions</span>
                <Link href="/register" className="font-body text-accent-mint text-sm font-medium hover:text-accent-mint-dim transition-colors">
                  Voir tout le catalogue
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ AVANTAGES — zigzag split ═══ */}
      <section className="relative z-10 px-6 py-24 md:py-36" style={{
        background: 'radial-gradient(ellipse 80% 40% at 80% 20%, rgba(240,180,41,0.04) 0%, transparent 50%), var(--bg-surface)',
      }}>
        <div className="max-w-[1100px] mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <h2 className="font-display text-text-primary mb-16 md:mb-20 max-w-sm" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', lineHeight: 1.12, letterSpacing: '-0.025em', fontWeight: 700 }}>
              Ce que vous y gagnez
            </h2>
          </ScrollReveal>

          <div className="flex flex-col gap-16 md:gap-24">
            {[
              {
                title: 'Commissions versées chaque mois',
                desc: 'Chaque vente confirmée déclenche une commission. Pas de plafond, pas de conditions cachées. Vous vendez, on paye.',
                metric: '290–820€',
                metricLabel: 'par vente confirmée',
                align: 'left' as const,
              },
              {
                title: 'Vos taux augmentent avec vos résultats',
                desc: 'Bronze, Silver, Gold — trois niveaux de commissionnement. Plus vous vendez, plus chaque vente rapporte.',
                metric: '3 tiers',
                metricLabel: 'de commission',
                align: 'right' as const,
              },
              {
                title: 'Recrutez, gagnez en cascade',
                desc: 'Invitez d\'autres apporteurs. Quand ils vendent, vous touchez un pourcentage de leur commission. Réseau récompensé.',
                metric: '2 niveaux',
                metricLabel: 'de parrainage',
                align: 'left' as const,
              },
            ].map((item, i) => (
              <ScrollReveal key={item.title} direction={item.align === 'left' ? 'left' : 'right'} delay={0}>
                <div className={`flex flex-col md:flex-row gap-8 md:gap-16 items-start ${item.align === 'right' ? 'md:flex-row-reverse' : ''}`}>
                  {/* Text */}
                  <div className="flex-1">
                    <h3 className="font-display text-xl md:text-2xl text-text-primary font-semibold mb-3" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                      {item.title}
                    </h3>
                    <p className="font-body text-text-secondary text-[15px] leading-relaxed max-w-md">
                      {item.desc}
                    </p>
                  </div>
                  {/* Metric block */}
                  <div className={`shrink-0 rounded-2xl border border-bg-border p-8 md:p-10 ${i === 0 ? 'bg-accent-mint/[0.04]' : i === 1 ? 'bg-accent-gold/[0.04]' : 'bg-[#9B5BF5]/[0.04]'}`}>
                    <div className={`font-mono text-3xl md:text-4xl font-bold tracking-tight mb-1 ${i === 0 ? 'text-accent-mint' : i === 1 ? 'text-accent-gold' : 'text-[#9B5BF5]'}`}>
                      {item.metric}
                    </div>
                    <div className="font-body text-text-muted text-xs">{item.metricLabel}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST — simple strip ═══ */}
      <section className="relative z-10 px-6 py-14 md:py-16 border-t border-b border-bg-border">
        <div className="max-w-[900px] mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 text-center">
              {[
                { value: 'Gratuit', label: 'Inscription' },
                { value: '0€', label: 'Frais cachés' },
                { value: 'Mensuel', label: 'Versement' },
                { value: '1 clic', label: 'Annulation' },
              ].map(item => (
                <div key={item.label}>
                  <div className="font-display text-lg md:text-xl font-bold text-text-primary mb-0.5" style={{ letterSpacing: '-0.01em' }}>
                    {item.value}
                  </div>
                  <div className="font-body text-xs text-text-muted">{item.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="relative z-10 px-6 pt-24 pb-20 md:pt-36 md:pb-28">
        <div className="max-w-[600px] mx-auto text-center">
          <ScrollReveal direction="up" delay={0}>
            <h2 className="font-display text-text-primary mb-5" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 700 }}>
              Prêt à recommander ?
            </h2>
            <p className="font-body text-text-secondary text-[15px] mb-10 max-w-sm mx-auto leading-relaxed">
              Inscription en 2 minutes. Votre premier lien de parrainage dans la foulée.
            </p>
            <Link href="/register" className="btn-primary py-3.5 px-10 text-[15px] font-semibold">
              Créer mon compte gratuit
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-bg-border px-6 py-10">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="font-display text-base font-bold text-text-primary tracking-tight block mb-1">
              marpeap
            </span>
            <span className="font-body text-xs text-text-muted">
              Par Marpeap · marpeap.com
            </span>
          </div>
          <div className="flex gap-6">
            <Link href="/register" className="font-body text-sm text-text-secondary hover:text-accent-mint transition-colors">
              Devenir apporteur
            </Link>
            <Link href="/login" className="font-body text-sm text-text-secondary hover:text-accent-mint transition-colors">
              Connexion
            </Link>
            <a href="https://marpeap.com" target="_blank" rel="noopener noreferrer" className="font-body text-sm text-text-secondary hover:text-accent-mint transition-colors">
              marpeap.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
