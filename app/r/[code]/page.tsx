import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import type { Metadata } from 'next';

interface Props {
  params: { code: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = params.code.toUpperCase();
  const referrers = await query(
    "SELECT full_name FROM referrers WHERE code = $1 AND status = 'active'",
    [code]
  );
  if (referrers.length === 0) return { title: 'Marpeap' };
  const firstName = referrers[0].full_name.split(' ')[0];
  return {
    title: `Découvrez Marpeap — recommandé par ${firstName}`,
    description: `${firstName} vous recommande Marpeap, l'agence digitale qui transforme votre présence en ligne. Découvrez nos offres.`,
    openGraph: {
      title: `Découvrez Marpeap — recommandé par ${firstName}`,
      description: `${firstName} vous recommande Marpeap. Boostez votre business avec nos solutions digitales sur mesure.`,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  };
}

export default async function ReferralLandingPage({ params }: Props) {
  const code = params.code.toUpperCase();
  const referrers = await query(
    "SELECT full_name, tier FROM referrers WHERE code = $1 AND status = 'active'",
    [code]
  );

  if (referrers.length === 0) notFound();

  const { full_name, tier } = referrers[0];
  const firstName = full_name.split(' ')[0];

  const tierLabel: Record<string, string> = {
    gold: '🥇 Apporteur Gold',
    silver: '🥈 Apporteur Silver',
    bronze: '🥉 Apporteur Bronze',
  };

  const packs = [
    { name: 'M-ONE', desc: 'Site vitrine professionnel', price: 'à partir de 490€', icon: '🌐' },
    { name: 'M-PLUS', desc: 'Site + SEO + réseaux sociaux', price: 'à partir de 990€', icon: '📈' },
    { name: 'M-CORP', desc: 'Solution entreprise complète', price: 'sur devis', icon: '🏢' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0F1C', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
            mar<span style={{ color: '#3B82F6' }}>peap</span>
          </div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 100,
            padding: '6px 16px',
            fontSize: 13,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 32,
          }}>
            {tierLabel[tier] || '🤝 Apporteur agréé'}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px' }}>
            {firstName} vous recommande <br />
            <span style={{ color: '#3B82F6' }}>Marpeap</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, margin: '0 0 36px', lineHeight: 1.6 }}>
            L'agence digitale qui transforme votre présence en ligne.<br />
            Sites web, SEO, réseaux sociaux — des solutions concrètes.
          </p>
          <a
            href={`/api/r/${code}`}
            style={{
              display: 'inline-block',
              padding: '16px 40px',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              boxShadow: '0 8px 32px rgba(59,130,246,0.35)',
            }}
          >
            Découvrir l'offre →
          </a>
        </div>
      </div>

      {/* 3 arguments */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {[
            { icon: '⚡', title: 'Livraison rapide', desc: 'Site en ligne en 2 semaines. Pas de délais interminables.' },
            { icon: '🎯', title: 'Résultats mesurables', desc: 'SEO, analytics, leads — on mesure chaque euro investi.' },
            { icon: '🤝', title: 'Accompagnement humain', desc: 'Un interlocuteur dédié, pas un ticket de support.' },
          ].map((arg) => (
            <div
              key={arg.title}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 28,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>{arg.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{arg.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>{arg.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Packs */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 24px 60px' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: 24, marginBottom: 24 }}>Nos offres</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {packs.map((pack) => (
            <div
              key={pack.name}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '24px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{pack.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{pack.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 12 }}>{pack.desc}</div>
              <div style={{ color: '#3B82F6', fontWeight: 700, fontSize: 14 }}>{pack.price}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <a
            href={`/api/r/${code}`}
            style={{
              display: 'inline-block',
              padding: '14px 36px',
              background: '#3B82F6',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Accéder aux offres complètes →
          </a>
          <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            Recommandé par {full_name} · Code partenaire : {code}
          </div>
        </div>
      </div>
    </div>
  );
}
