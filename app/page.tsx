'use client'

import Link from 'next/link'

const STEPS = [
  { n: '01', title: 'Inscrivez-vous', desc: 'Créez votre compte en 2 minutes. Vous recevez un code unique personnalisé.' },
  { n: '02', title: 'Nous vous contactons', desc: 'Notre équipe valide votre profil et vous envoie un contrat d\'apporteur.' },
  { n: '03', title: 'Recommandez & gagnez', desc: 'Partagez votre lien. Chaque client signé vous rapporte une commission directe.' },
]

const PACKS_TEASER = [
  { name: 'M-ONE', price: '290€', color: '#4F8AFF', desc: 'Site One-Page' },
  { name: 'M-SHOP LITE', price: '490€', color: '#F5A623', desc: 'E-Commerce Pro' },
  { name: 'M-CALLING', price: '490€', color: '#F54EA2', desc: 'Standardiste IA' },
  { name: 'M-NEURAL', price: '180€', color: '#9B5BF5', desc: 'ChatBot IA' },
  { name: 'M-CORP', price: '820€', color: '#F1C40F', desc: '5 Agents IA' },
]

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: '#080810', color: '#fff', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { transition: opacity 0.2s, transform 0.15s; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-outline:hover { background: rgba(91,110,245,0.08) !important; }
      `}</style>

      {/* Background circles */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '60%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(91,110,245,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(155,91,245,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 40px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)' }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>
          mar<span style={{ color: '#5B6EF5' }}>peap</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Sans', sans-serif", fontWeight: 400, marginLeft: 8, background: 'rgba(91,110,245,0.12)', padding: '2px 7px', borderRadius: 100, border: '1px solid rgba(91,110,245,0.2)' }}>Apporteurs</span>
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ padding: '7px 16px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Connexion
          </Link>
          <Link href="/register" className="btn-primary" style={{ padding: '8px 18px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700 }}>
            Devenir apporteur
          </Link>
          <Link href="/admin" style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', borderRadius: 6, fontSize: 12 }}>
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '80px 24px 64px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(91,110,245,0.1)', border: '1px solid rgba(91,110,245,0.2)', borderRadius: 100, padding: '5px 16px', fontSize: 12, color: '#8b9cf8', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 24 }}>
          PROGRAMME APPORTEURS D'AFFAIRES
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
          Recommandez Marpeap.<br />
          <span style={{ color: '#5B6EF5' }}>Touchez une commission.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Devenez apporteur d'affaires et gagnez des commissions sur chaque vente que vous apportez à Marpeap. Aucune expertise technique requise.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn-primary" style={{ padding: '14px 32px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16 }}>
            Commencer maintenant →
          </Link>
          <Link href="/login" className="btn-outline" style={{ padding: '14px 32px', background: 'transparent', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', borderRadius: 10, fontWeight: 600, fontSize: 16, border: '1px solid rgba(255,255,255,0.15)', transition: 'background 0.2s' }}>
            J'ai déjà un compte
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Comment ça marche ?</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15 }}>Trois étapes simples pour commencer à gagner des commissions.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {STEPS.map((step, i) => (
            <div key={step.n} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '28px 24px',
              position: 'relative',
            }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, color: 'rgba(91,110,245,0.15)', lineHeight: 1, marginBottom: 16 }}>{step.n}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{step.desc}</div>
              {i < STEPS.length - 1 && (
                <div style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', color: '#5B6EF5', fontSize: 20, display: 'none' }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Products teaser */}
      <section style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '64px 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>7 solutions à vendre</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15 }}>Des produits IA concrets, du site web à l'agent vocal 24/7.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
            {PACKS_TEASER.map(pack => (
              <div key={pack.name} style={{
                background: `${pack.color}08`,
                border: `1px solid ${pack.color}20`,
                borderRadius: 12,
                padding: '14px 20px',
                textAlign: 'center',
                minWidth: 130,
              }}>
                <div style={{ height: 2, background: pack.color, borderRadius: 1, marginBottom: 12 }} />
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: pack.color, marginBottom: 4 }}>{pack.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{pack.desc}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>{pack.price}</div>
              </div>
            ))}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 20px', textAlign: 'center', minWidth: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              +2 autres
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
              Chaque vente génère une commission. Les meilleurs apporteurs bénéficient de <strong style={{ color: 'rgba(255,255,255,0.6)' }}>taux majorés</strong>.
            </div>
            <Link href="/register" className="btn-primary" style={{ display: 'inline-block', padding: '13px 28px', background: '#5B6EF5', color: '#fff', textDecoration: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
              Voir tout le catalogue après inscription →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>mar<span style={{ color: '#5B6EF5' }}>peap</span></span>
        <span>© {new Date().getFullYear()} Marpeap Digital — Programme apporteurs d'affaires</span>
      </footer>
    </main>
  )
}
