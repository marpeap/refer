'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function IconCheck() {
  return (
    <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="text-accent-mint">
      <path d="M4 9l3.5 3.5L14 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-red">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function VenteSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<string>('pending')
  const [isReferrer, setIsReferrer] = useState(false)

  const isEnabled = process.env.NEXT_PUBLIC_VENTE_ENABLED === 'true'

  useEffect(() => {
    if (!isEnabled || !sessionId) return

    const token = localStorage.getItem('refer_token')
    if (!token) {
      setStatus('prospect')
      return
    }
    setIsReferrer(true)

    let attempts = 0
    const maxAttempts = 15

    const poll = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/sales/status?session_id=${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'confirmed') {
            setStatus('confirmed')
            clearInterval(poll)
          } else if (data.status === 'expired' || data.status === 'failed' || data.status === 'cancelled') {
            setStatus(data.status)
            clearInterval(poll)
          }
        }
      } catch {
        // retry silently
      }

      if (attempts >= maxAttempts) {
        setStatus('timeout')
        clearInterval(poll)
      }
    }, 2000)

    return () => clearInterval(poll)
  }, [sessionId, isEnabled])

  if (!isEnabled) {
    return (
      <main className="min-h-screen bg-bg-base font-body flex items-center justify-center px-4">
        <p className="text-text-muted text-sm">Cette fonctionnalité n'est pas encore disponible.</p>
      </main>
    )
  }

  const iconWrap = (children: React.ReactNode, color: string) => (
    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${color}`}>
      {children}
    </div>
  )

  return (
    <main className="min-h-screen bg-bg-base font-body flex items-center justify-center px-4 py-8">
      {/* Background halo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-1/4 right-0 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(54,216,176,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-[480px]">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/" className="font-display text-xl font-bold text-text-primary tracking-tight">
            marpeap
          </Link>
        </div>

        <div className="card p-8 md:p-10 text-center">
          {status === 'prospect' && (
            <>
              {iconWrap(<IconCheck />, 'bg-accent-mint/10 border border-accent-mint/20')}
              <h1 className="font-display text-lg text-text-primary font-semibold mb-2" style={{ letterSpacing: '-0.01em' }}>
                Merci pour votre paiement !
              </h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                Votre paiement a bien été pris en compte. Vous recevrez un email de confirmation sous peu.
              </p>
              <p className="text-text-muted text-xs">Vous pouvez fermer cette page.</p>
            </>
          )}

          {status === 'pending' && (
            <>
              {iconWrap(<IconClock />, 'bg-accent-gold/10 border border-accent-gold/20')}
              <h1 className="font-display text-lg text-text-primary font-semibold mb-2" style={{ letterSpacing: '-0.01em' }}>
                Paiement en cours de confirmation...
              </h1>
              <p className="text-text-secondary text-sm leading-relaxed">
                Nous attendons la confirmation de Stripe. Cela prend généralement quelques secondes.
              </p>
              {/* Simple spinner */}
              <div className="mt-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-accent-mint/30 border-t-accent-mint rounded-full animate-spin" />
              </div>
            </>
          )}

          {status === 'confirmed' && (
            <>
              {iconWrap(<IconCheck />, 'bg-accent-mint/10 border border-accent-mint/20')}
              <h1 className="font-display text-lg text-accent-mint font-semibold mb-2" style={{ letterSpacing: '-0.01em' }}>
                Vente confirmée !
              </h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                Le paiement a été reçu. Votre commission a été enregistrée.
              </p>
              <Link href="/dashboard" className="btn-primary py-2.5 px-6 text-sm">
                Retour au tableau de bord
              </Link>
            </>
          )}

          {status === 'timeout' && (
            <>
              {iconWrap(<IconClock />, 'bg-accent-gold/10 border border-accent-gold/20')}
              <h1 className="font-display text-lg text-text-primary font-semibold mb-2" style={{ letterSpacing: '-0.01em' }}>
                Confirmation en attente
              </h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                La confirmation prend plus de temps que prévu. Si le client a bien payé, votre vente apparaîtra automatiquement dans votre tableau de bord.
              </p>
              <Link href="/dashboard" className="btn-primary py-2.5 px-6 text-sm">
                Retour au tableau de bord
              </Link>
            </>
          )}

          {(status === 'expired' || status === 'failed' || status === 'cancelled') && (
            <>
              {iconWrap(<IconX />, 'bg-accent-red/10 border border-accent-red/20')}
              <h1 className="font-display text-lg text-accent-red font-semibold mb-2" style={{ letterSpacing: '-0.01em' }}>
                Paiement non abouti
              </h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                Le paiement a expiré ou a été annulé. Vous pouvez relancer une nouvelle vente depuis votre tableau de bord.
              </p>
              <Link href="/dashboard" className="btn-primary py-2.5 px-6 text-sm">
                Retour au tableau de bord
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function VenteSuccessPage() {
  return (
    <Suspense>
      <VenteSuccessContent />
    </Suspense>
  )
}
