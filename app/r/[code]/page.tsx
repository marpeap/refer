import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function IconGlobe() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconTrending() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22V12h6v10" /><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01" />
    </svg>
  );
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
    gold: 'Apporteur Gold',
    silver: 'Apporteur Silver',
    bronze: 'Apporteur Bronze',
  };

  const tierColor: Record<string, string> = {
    gold: 'text-accent-gold bg-accent-gold/10 border-accent-gold/20',
    silver: 'text-text-secondary bg-white/5 border-white/10',
    bronze: 'text-[#CD7F32] bg-[#CD7F32]/10 border-[#CD7F32]/20',
  };

  const packs = [
    { name: 'M-ONE', desc: 'Site vitrine professionnel', price: 'à partir de 490€', icon: <IconGlobe /> },
    { name: 'M-PLUS', desc: 'Site + SEO + réseaux sociaux', price: 'à partir de 990€', icon: <IconTrending /> },
    { name: 'M-CORP', desc: 'Solution entreprise complète', price: 'sur devis', icon: <IconBuilding /> },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-body">
      {/* Background halos */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-1/4 left-1/4 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(54,216,176,0.08) 0%, transparent 65%)' }} />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(240,180,41,0.05) 0%, transparent 65%)' }} />
      </div>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 text-center">
        <div className="relative max-w-[640px] mx-auto">
          <Link href="/" className="font-display text-[28px] font-bold tracking-tight text-text-primary inline-block mb-6">
            marpeap
          </Link>

          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[13px] font-medium mb-10 ${tierColor[tier] || 'text-accent-mint bg-accent-mint/10 border-accent-mint/20'}`}>
            {tierLabel[tier] || 'Apporteur agréé'}
          </div>

          <h1 className="font-display font-semibold text-text-primary mb-5" style={{ fontSize: 'clamp(1.75rem, 5vw, 3.25rem)', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
            {firstName} vous recommande Marpeap
          </h1>

          <p className="text-text-secondary text-lg leading-relaxed mb-9 max-w-md mx-auto">
            L'agence digitale qui transforme votre présence en ligne. Sites web, SEO, réseaux sociaux — des solutions concrètes.
          </p>

          <a href={`/api/r/${code}`} className="btn-primary py-3.5 px-10 text-base font-semibold">
            Découvrir l'offre
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9h10M10 5l4 4-4 4" />
            </svg>
          </a>
        </div>
      </section>

      {/* Arguments */}
      <section className="relative max-w-[800px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>, title: 'Livraison rapide', desc: 'Site en ligne en 2 semaines. Pas de délais interminables.' },
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>, title: 'Résultats mesurables', desc: 'SEO, analytics, leads — on mesure chaque euro investi.' },
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>, title: 'Accompagnement humain', desc: 'Un interlocuteur dédié, pas un ticket de support.' },
          ].map((arg) => (
            <div key={arg.title} className="card p-7">
              <div className="text-accent-mint mb-4">{arg.icon}</div>
              <div className="font-display font-semibold text-[15px] text-text-primary mb-2">{arg.title}</div>
              <div className="text-text-muted text-sm leading-relaxed">{arg.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Packs */}
      <section className="relative max-w-[800px] mx-auto px-6 pt-5 pb-16">
        <h2 className="font-display text-xl font-semibold text-text-primary text-center mb-7" style={{ letterSpacing: '-0.015em' }}>
          Nos offres
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-9">
          {packs.map((pack) => (
            <div key={pack.name} className="card p-6 text-center hover:border-accent-mint/20 transition-colors">
              <div className="text-accent-mint mb-3 flex justify-center">{pack.icon}</div>
              <div className="font-display font-bold text-lg text-text-primary mb-1.5">{pack.name}</div>
              <div className="text-text-muted text-[13px] mb-3">{pack.desc}</div>
              <div className="text-accent-mint font-mono font-semibold text-sm">{pack.price}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href={`/api/r/${code}`} className="btn-primary py-3 px-8 text-sm font-semibold">
            Accéder aux offres complètes
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9h10M10 5l4 4-4 4" />
            </svg>
          </a>
          <div className="mt-3 text-text-muted text-[13px]">
            Recommandé par {full_name} · Code partenaire : <span className="font-mono text-accent-mint">{code}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
